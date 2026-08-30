// Cloudflare Pages Function: /api/reimport-products (UPDATE IN PLACE, LIVE-STORE)
//
// Iterates the LIVE Shopify catalog (cursor-paginated) and, for products that need
// tiered re-pricing or variant recovery, re-fetches the full variant matrix from CJ
// and PUTs it back to the SAME live product id with tiered computePrice().
//
// GET ?dryRun=1        -> count only (how many live products need a fix)
// GET ?run=1&limit=N   -> update up to N live products in place (variant recovery via CJ)
// GET ?priceOnly=1&limit=N -> re-price ONLY (no CJ, single Shopify PUT per product, fast).
//                               Default limit = 200 when not specified.
// GET ?reset=1         -> clear progress + restart from cursor 0
// Resumable via data/reimport-progress.json (cursor = since_id, keyed by live id).

import { corsHeaders, shopifyFetch, ghRead, ghWriteLarge, isAdmin, adminDenied, cjFetchMulti } from '../_sync-lib.js';

// ── Product-aware pricing (tiered by base cost) ──────────────────────────
function computePrice(baseCost) {
  const c = parseFloat(baseCost) || 0;
  if (c <= 0) return 0;
  let mult;
  if (c < 5)        mult = 3.2;
  else if (c < 8)   mult = 3.0;
  else if (c < 15)  mult = 2.6;
  else if (c < 30)  mult = 2.5;
  else if (c < 60)  mult = 2.1;
  else if (c < 120) mult = 1.9;
  else              mult = 1.7;
  const raw = c * mult;
  let price = Math.ceil(raw) - 0.05;
  if (price <= 0) price = raw;
  return +price.toFixed(2);
}

const LETTER = new Set('XS S M L XL XXL XXXL 2XL 3XL 4XL 5XL 6XL 7XL 8XL 1X 2X 3X 4X 5X SM MED MEDIUM LARGE XLARGE FREE SIZE ONE SIZE'.split(' '));
function isSize(s){ if(!s) return false; const u=String(s).trim().toUpperCase(); if(LETTER.has(u)||u==='FREE SIZE'||u==='ONE SIZE') return true; if(/^\d{1,2}(\.\d+)?$/.test(String(s).trim())){const n=parseFloat(s);return n>=20&&n<=60;} return false; }
function parseVariantKey(key, nameEn=''){
  const k=(key||'').trim(); const parts=k?k.split(/[-/]/).map(s=>s.trim()).filter(Boolean):[];
  let color='', size='';
  if(parts.length===1) color=parts[0];
  else if(parts.length>=2){ if(isSize(parts[parts.length-1])){size=parts[parts.length-1];color=parts.slice(0,-1).join(' ');} else color=parts.join(' '); }
  if(!size&&nameEn){ const t=String(nameEn).split(/\s+/).filter(Boolean); if(t.length&&isSize(t[t.length-1])) size=t[t.length-1]; }
  return [color.trim(), size.trim()];
}

function parentSku(sku) {
  if (!sku) return sku;
  let s = String(sku).trim();
  s = s.replace(/-(\d+)$/, '');
  s = s.replace(/(\d{2})([A-Z]{2})$/, '');
  return s;
}

function hasSkuSuffix(sku) {
  if (!sku) return false;
  const s = String(sku).trim();
  return /-\d+$/.test(s) || /\d{2}[A-Z]{2}$/.test(s);
}

function needsFix(p){
  const v = p.variants || [];
  if (!v.length) return false;
  const hasCJK = v.some(x=>/[\u4e00-\u9fff]/.test(String(x.option1||'')));
  if (hasCJK) return true;
  const hasSize = v.some(x=>x.option2);
  if (v.length > 1 && !hasSize) return true;
  if (v.length === 1 && hasSkuSuffix(v.sku)) return true;
  return true; // everything else still needs tiered re-pricing
}

async function resolveCj(env, p) {
  const firstRaw = (p.variants||[]).map(v=>v.sku).filter(Boolean)[0];
  const candidates = [];
  if (firstRaw) {
    const ps = parentSku(firstRaw);
    if (ps && !candidates.includes(ps)) candidates.push(ps);
    if (firstRaw !== ps && !candidates.includes(firstRaw)) candidates.push(firstRaw);
  }
  if (!candidates.length) return null;

  for (const sku of candidates) {
    const list = await cjFetchMulti(env, `/product/list?productSku=${encodeURIComponent(sku)}&pageNum=1&pageSize=10`);
    const pid = list?.data?.list?.[0]?.pid;
    if (pid) {
      const detail = await cjFetchMulti(env, `/product/query?pid=${encodeURIComponent(pid)}`);
      if (detail && detail.code === 200 && detail.data) return detail.data;
    }
    const q = await cjFetchMulti(env, `/product/query?productSku=${encodeURIComponent(sku)}`);
    if (q && q.code === 200 && q.data && q.data.variants && q.data.variants.length) return q.data;
    await new Promise(r=>setTimeout(r,400));
  }
  return null;
}

// Re-price existing variants in place (no CJ): base = price / 2.5, then tiered.
async function repriceOnly(env, p){
  const vs = (p.variants||[]).filter(v=>v && v.id);
  if (!vs.length) return { ok:false, skip:'no-variants-no-cj' };
  const variants = vs.map(v=>{
    const current = parseFloat(v.price)||0;
    const base = current>0 ? current/2.5 : 0;
    const price = base>0 ? computePrice(base) : current;
    return {
      id: v.id, price: price.toFixed(2),
      option1: v.option1, option2: v.option2, option3: v.option3,
      sku: v.sku, grams: v.grams, weight: v.weight, weight_unit: v.weight_unit,
      inventory_management: v.inventory_management||'shopify', inventory_policy: v.inventory_policy||'deny',
      fulfillment_service: v.fulfillment_service||'manual', requires_shipping: v.requires_shipping!==false, taxable: v.taxable!==false,
    };
  });
  let options = (p.options && p.options.length) ? p.options : null;
  if (!options) {
    const colors=[]; const sizes=[]; const seenC=new Set(); const seenS=new Set();
    for (const v of vs) {
      if (v.option1 && !seenC.has(v.option1)) { seenC.add(v.option1); colors.push(v.option1); }
      if (v.option2 && !seenS.has(v.option2)) { seenS.add(v.option2); sizes.push(v.option2); }
    }
    options = [];
    if (colors.length) options.push({name:'Color', values:colors});
    if (sizes.length) options.push({name:'Size', values:sizes});
    if (!options.length) options.push({name:'Title', values:['Default Title']});
  }
  const payload = { product: { id: p.id, options, variants } };
  let res = await shopifyFetch(env, `/products/${p.id}.json`, { method:'PUT', body:JSON.stringify(payload) });
  for (let t=0; t<6 && res && (res.status===409 || res.status===429); t++) {
    await new Promise(r=>setTimeout(r, 1200 + t*700));
    res = await shopifyFetch(env, `/products/${p.id}.json`, { method:'PUT', body:JSON.stringify(payload) });
  }
  if(!res.ok) return { ok:false, error:'reprice put '+res.status+' '+(res.body&&res.body.errors?JSON.stringify(res.body.errors).slice(0,150):'') };
  return { ok:true, id:p.id, variants:variants.length, colors:0, sizes:0, mode:'reprice' };
}

async function reimport(env, p){
  const cj = await resolveCj(env, p);
  if (!cj) return repriceOnly(env, p);
  const cjv = (cj.variants || []);
  if (!cjv.length) return repriceOnly(env, p);

  const existingByOpt1 = {};
  for(const v of (p.variants||[])){ const c=String(v.option1||''); if(c && !(c in existingByOpt1)) existingByOpt1[c]=v; }

  const colors=[], sizes=[], seenC=new Set(), seenS=new Set();
  const colorImg=new Map();
  for(const v of cjv){
    const [color,size]=parseVariantKey(v.variantKey, v.variantNameEn||v.variantName);
    const c=color||(v.variantNameEn||'Default'); const sz=size||'';
    if(c&&!seenC.has(c)){seenC.add(c);colors.push(c);}
    if(sz&&!seenS.has(sz)){seenS.add(sz);sizes.push(sz);}
    if(v.variantImage&&!colorImg.has(c)) colorImg.set(c,v.variantImage);
  }
  const hasSizes = sizes.length > 0;
  const sizeValues = hasSizes ? sizes : ['One Size'];

  const variants = cjv.map(v=>{
    const [color,size]=parseVariantKey(v.variantKey, v.variantNameEn||v.variantName);
    const c=color||(v.variantNameEn||'Default');
    const baseCost = parseFloat(v.variantSellPrice)||parseFloat(cj.sellPrice)||0;
    const price = computePrice(baseCost);
    const grams=Math.round(parseFloat(v.variantWeight)||0);
    const existing = existingByOpt1[c];
    const opt2 = hasSizes ? (size && sizeValues.includes(size) ? size : 'One Size') : null;
    const obj = {
      sku: v.variantSku, price: price.toFixed(2),
      option1: c, option2: opt2, option3: null,
      grams, weight: grams/1000, weight_unit:'kg',
      inventory_management:'shopify', inventory_policy:'deny',
      fulfillment_service:'manual', requires_shipping:true, taxable:true,
    };
    if(existing && existing.id) obj.id = existing.id;
    return obj;
  });

  const options=[];
  if(colors.length) options.push({name:'Color', values:colors});
  if (hasSizes) {
    const used = new Set(variants.map(x=>x.option2).filter(s=>s && s!=='One Size'));
    const vals = [...new Set([...sizeValues, ...used])];
    options.push({name:'Size', values: vals});
  }
  if(!options.length) options.push({name:'Title', values:['Default Title']});

  const images=[]; const seenImg=new Set();
  const pusher=(u)=>{ if(u&&!seenImg.has(u)){seenImg.add(u);images.push({src:u});} };
  for(const c of colors){ const u=colorImg.get(c); if(u) pusher(u); }
  try{ const set=Array.isArray(cj.productImageSet)?cj.productImageSet:(typeof cj.productImageSet==='string'?JSON.parse(cj.productImageSet):[]); for(const u of set) pusher(u); }catch{}
  for(const u of (p.images||[])) if(typeof u==='string') pusher(u);

  const payload = { product: { id: p.id, options, variants, images } };
  let res = await shopifyFetch(env, `/products/${p.id}.json`, { method:'PUT', body:JSON.stringify(payload) });
  for (let t=0; t<6 && res && (res.status===409 || res.status===429); t++) {
    await new Promise(r=>setTimeout(r, 1200 + t*700));
    res = await shopifyFetch(env, `/products/${p.id}.json`, { method:'PUT', body:JSON.stringify(payload) });
  }
  if(!res.ok) return { ok:false, error:'put '+res.status+' '+(res.body&&res.body.errors?JSON.stringify(res.body.errors).slice(0,150):'') };

  return { ok:true, id:p.id, variants:variants.length, colors:colors.length, sizes:hasSizes?sizes.length:0 };
}

export async function onRequest(context){
  try{
    const { request, env } = context;
    if(request.method==='OPTIONS') return new Response(null,{status:200,headers:corsHeaders()});
    if (!isAdmin(request, env)) return adminDenied();
    const url=new URL(request.url);
    const run=url.searchParams.get('run')==='1';
    const priceOnly=url.searchParams.get('priceOnly')==='1';
    const dryRun=url.searchParams.get('dryRun')==='1';
    const reset=url.searchParams.get('reset')==='1';
    const limitRaw=parseInt(url.searchParams.get('limit')||'',10);
    // priceOnly (no-CJ) is fast: default 200, cap 250. CJ path stays capped at 25.
    const limit = priceOnly
      ? (isNaN(limitRaw) ? 200 : Math.min(limitRaw, 250))
      : Math.min(isNaN(limitRaw) ? 10 : limitRaw, 25);

    const progDoc=await ghRead(env,'data/reimport-progress.json');
    let prog=(progDoc&&progDoc.content)?JSON.parse(atob(progDoc.content.replace(/\n/g,''))):{};
    if (reset || typeof prog !== 'object' || !prog) prog = {};
    const attempts = prog.attempts || {};
    const cursor = prog.cursor || 0;

    const res = await shopifyFetch(env, `/products.json?limit=250&fields=id,title,options,variants,images&since_id=${cursor}`);
    const batch = res.body?.products || [];
    const newCursor = batch.length ? batch.reduce((m,p)=>Math.max(m,Number(p.id)), cursor) : cursor;
    const eof = batch.length < 250;

    const todoP = batch.filter(needsFix);

    if (dryRun) {
      return new Response(JSON.stringify({ cursor, newCursor, eof, scanned:batch.length, needFix:todoP.length }),{headers:{'Content-Type':'application/json',...corsHeaders()}});
    }
    if (!run) {
      return new Response(JSON.stringify({ cursor, eof, scanned:batch.length, needFix:todoP.length }),{headers:{'Content-Type':'application/json',...corsHeaders()}});
    }

    const doneIds = new Set(Object.keys(prog).filter(k => k!=='attempts' && k!=='cursor' && prog[k] && typeof prog[k]==='object' && ('n' in prog[k] || 'skip' in prog[k] || 'm' in prog[k])));
    const remaining = todoP
      .filter(p => !doneIds.has(String(p.id)))
      .filter(p => (attempts[String(p.id)]||0) < 3)
      .slice(0, limit);

    let ok=0, fail=0; const results=[];
    const startedAt = Date.now();
    // priceOnly mode: skip CJ entirely, minimal sleep to fit as many as possible
    // within the Pages Function wall-clock budget (~10s).
    const sleepMs = priceOnly ? 30 : 600;
    // Hard stop: leave ~2s headroom to persist progress before the timeout.
    const DEADLINE = startedAt + (priceOnly ? 7000 : 9000);

    for(const p of remaining){
      if (Date.now() >= DEADLINE) { results.push({ id: String(p.id), ok:false, err:'deadline-stop' }); break; }
      const id=String(p.id);
      let r_ok=false;
      try{
        const r = priceOnly ? await repriceOnly(env,p) : await reimport(env,p);
        prog[id]=r.ok?{n:r.variants,colors:r.colors,sizes:r.sizes,m:r.mode||''}:{skip:r.skip||r.error||'fail'};
        r_ok=!!r.ok;
        if(r_ok) ok++; else fail++;
        results.push({id, ok:r_ok, variants:r.variants, colors:r.colors, sizes:r.sizes, mode:r.mode, err:r.error||r.skip});
      }catch(e){ prog[id]={skip:'ex:'+String(e.message||e).slice(0,50)}; fail++; results.push({id, ok:false, err:String(e.message||e).slice(0,80)}); }
      if(!r_ok) attempts[id]=(attempts[id]||0)+1;
      await new Promise(r=>setTimeout(r,sleepMs));
    }

    const allPageDone = todoP.every(p => doneIds.has(String(p.id)) || prog[String(p.id)]);
    if (allPageDone || eof) {
      prog.cursor = newCursor;
    }
    prog.attempts = attempts;
    try {
      const fresh = await ghRead(env, 'data/reimport-progress.json');
      let merged = prog;
      if (fresh && fresh.content) {
        try { const existing = JSON.parse(atob(fresh.content.replace(/\n/g,''))); merged = { ...existing, ...prog, attempts: { ...(existing.attempts||{}), ...attempts } }; } catch {}
      }
      await ghWriteLarge(env, 'data/reimport-progress.json', JSON.stringify(merged), 'auto: reimport progress');
    } catch (we) { void we; }

    return new Response(JSON.stringify({ cursor:prog.cursor, newCursor, eof, scanned:batch.length, needFix:todoP.length, processed:ok+fail, ok, fail, priceOnly, results }),{headers:{'Content-Type':'application/json',...corsHeaders()}});
  }catch(err){
    return new Response(JSON.stringify({error:String(err&&err.message||err),stack:String(err&&err.stack||'').slice(0,400)}),{status:500,headers:{'Content-Type':'application/json',...corsHeaders()}});
  }
}
