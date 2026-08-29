// Cloudflare Pages Function: /api/reimport-products (UPDATE IN PLACE)
// Fixes flattened products by updating their existing Shopify product with correct
// options (Color + Size) and variants (color/size/price/sku) fetched fresh from CJ.
// Keeps the SAME Shopify product id (update-in-place, no delete/create).
//
// GET ?dryRun=1        -> count only
// GET ?run=1&limit=N   -> update up to N products in place
// Resumable via data/reimport-progress.json.

import { corsHeaders, shopifyFetch, ghRead, ghWriteLarge, isAdmin, adminDenied, cjFetchMulti } from '../_sync-lib.js';

const RAW = 'https://raw.githubusercontent.com/jamestuwairua77-cpu/bargain-drop-v2/main/slim-products.json';

// ── Product-aware pricing (2.5x baseline, tiered by base cost) ─────────
// Standard dropshipping pricing: mark up cheap items more aggressively, expensive
// items less, so final retail prices stay sensible and profit per unit is healthy.
// Round to a clean psychological price (.95).
function computePrice(baseCost) {
  const c = parseFloat(baseCost) || 0;
  if (c <= 0) return { price: 0 };
  let mult;
  if (c < 5)        mult = 3.2;   // super-cheap: aggressive
  else if (c < 8)   mult = 3.0;
  else if (c < 15)  mult = 2.6;
  else if (c < 30)  mult = 2.5;   // baseline
  else if (c < 60)  mult = 2.1;
  else if (c < 120) mult = 1.9;
  else              mult = 1.7;   // expensive: gentle
  const raw = c * mult;
  let price = Math.ceil(raw) - 0.05;
  if (price <= 0) price = raw;
  return { price: +price.toFixed(2) };
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

// Normalize a variant SKU to its CJ parent SKU for product/list lookup.
// Patterns: 'CJYD299047601AZ' -> 'CJYD2990476' (strip NNXX suffix)
//           'CJYD2990476-2'   -> 'CJYD2990476' (strip -N suffix)
//           'CJYD2990954'     -> unchanged (base)
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

function needsReimport(p){
  const v=p.variants||[];
  if(!v.length) return false;
  const hasCJK = v.some(x=>/[\u4e00-\u9fff]/.test(String(x.option1||'')));
  if (hasCJK) return true;
  const hasSize = v.some(x=>x.option2);
  if (v.length > 1 && !hasSize) return true;
  // Single-variant products whose SKU carries a variant suffix are "flattened":
  // CJ has a full variant matrix we should recover.
  if (v.length === 1 && hasSkuSuffix(v[0].sku)) return true;
  return false;
}

// Resolve the CJ product detail by walking candidate SKUs (parent + raw) across
// all configured CJ keys. Returns { data } or null.
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
    // product/list?productSku={FULL sku} is the authoritative pid -> detail
    const list = await cjFetchMulti(env, `/product/list?productSku=${encodeURIComponent(sku)}&pageNum=1&pageSize=10`);
    const pid = list?.data?.list?.[0]?.pid;
    if (pid) {
      const detail = await cjFetchMulti(env, `/product/query?pid=${encodeURIComponent(pid)}`);
      if (detail && detail.code === 200 && detail.data) return detail.data;
    }
    // fallback: direct variant query (legacy)
    const q = await cjFetchMulti(env, `/product/query?productSku=${encodeURIComponent(sku)}`);
    if (q && q.code === 200 && q.data && q.data.variants && q.data.variants.length) return q.data;
    await new Promise(r=>setTimeout(r,400));
  }
  return null;
}

async function reimport(env, p){
  const cj = await resolveCj(env, p);
  if (!cj) return { ok:false, skip:'no-pid' };
  const cjv = (cj.variants || []);
  if (!cjv.length) return { ok:false, skip:'no-variants' };

  const existingByOpt1 = {};
  for(const v of (p.variants||[])){ const c=String(v.option1||''); if(c && !(c in existingByOpt1)) existingByOpt1[c]=v; }

  // Build color + size axes straight from CJ variants.
  const colors=[], sizes=[], seenC=new Set(), seenS=new Set();
  const colorImg=new Map();
  for(const v of cjv){
    const [color,size]=parseVariantKey(v.variantKey, v.variantNameEn||v.variantName);
    const c=color||(v.variantNameEn||'Default'); const sz=size||'';
    if(c&&!seenC.has(c)){seenC.add(c);colors.push(c);}
    if(sz&&!seenS.has(sz)){seenS.add(sz);sizes.push(sz);}
    if(v.variantImage&&!colorImg.has(c)) colorImg.set(c,v.variantImage);
  }
  // A size axis only counts if we actually detected size tokens.
  const hasSizes = sizes.length > 0;
  // Stable continuation for products that had a Size option but no sizes on CJ:
  // coalesce every variant to a single "One Size" so Shopify never sees an empty slot.
  const sizeValues = hasSizes ? sizes : ['One Size'];

  // Map variants; option2 must ALWAYS be a member of sizeValues when Size exists.
  const variants = cjv.map(v=>{
    const [color,size]=parseVariantKey(v.variantKey, v.variantNameEn||v.variantName);
    const c=color||(v.variantNameEn||'Default');
    const baseCost = parseFloat(v.variantSellPrice)||parseFloat(cj.sellPrice)||0;
    const { price } = computePrice(baseCost);
    const grams=Math.round(parseFloat(v.variantWeight)||0);
    const existing = existingByOpt1[c];
    // option2: if size detected use it; else 'One Size' (which IS in sizeValues when no sizes)
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

  // If no size axis and at least one variant has no size -> single Color option only.
  const options=[];
  if(colors.length) options.push({name:'Color', values:colors});
  if (hasSizes) {
    // Ensure every size referenced actually exists in sizeValues (union w/ used).
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

  const payload = { product: { id: p.id, title: cj.productNameEn || p.title, options, variants, images } };
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
    const dryRun=url.searchParams.get('dryRun')==='1';
    const limit=parseInt(url.searchParams.get('limit')||'30',10);

    const rr=await fetch(RAW);
    if(!rr.ok) return new Response(JSON.stringify({error:'read '+rr.status}),{status:500,headers:{'Content-Type':'application/json',...corsHeaders()}});
    const catalog=await rr.json();
    const todo=catalog.filter(needsReimport);

    const progDoc=await ghRead(env,'data/reimport-progress.json');
    const prog=progDoc&&progDoc.content?JSON.parse(atob(progDoc.content.replace(/\n/g,''))):{};
    const attempts = prog.attempts || {};

    if(dryRun) return new Response(JSON.stringify({ total:catalog.length, toReimport:todo.length }),{headers:{'Content-Type':'application/json',...corsHeaders()}});
    if(!run) return new Response(JSON.stringify({ total:catalog.length, toReimport:todo.length }),{headers:{'Content-Type':'application/json',...corsHeaders()}});

    const MAX_ATTEMPTS = 3;
    const doneIds = new Set(Object.keys(prog).filter(k => k !== 'attempts' && prog[k] && typeof prog[k] === 'object' && ('n' in prog[k] || 'skip' in prog[k])));
    const remaining = todo
      .filter(p => !doneIds.has(String(p.id)))
      .filter(p => (attempts[String(p.id)]||0) < MAX_ATTEMPTS)
      .slice(0, limit);
    let ok=0, fail=0; const results=[];
    for(const p of remaining){
      const id=String(p.id);
      let r_ok = false;
      try{
        const r=await reimport(env,p);
        prog[id]=r.ok?{n:r.variants,colors:r.colors,sizes:r.sizes}:{skip:r.skip||r.error||'fail'};
        r_ok = !!r.ok;
        if(r_ok) ok++; else fail++;
        results.push({id, ok:r_ok, variants:r.variants, colors:r.colors, sizes:r.sizes, err:r.error||r.skip});
      }catch(e){ prog[id]={skip:'ex:'+String(e.message||e).slice(0,50)}; fail++; results.push({id, ok:false, err:String(e.message||e).slice(0,80)}); }
      if(!r_ok) attempts[id]=(attempts[id]||0)+1;
      // Pace: Shopify allows ~2 req/sec; CJ across keys also needs headroom.
      await new Promise(r=>setTimeout(r,900));
    }
    prog.attempts = attempts;
    try {
      const fresh = await ghRead(env, 'data/reimport-progress.json');
      let merged = prog;
      if (fresh && fresh.content) {
        try {
          const existing = JSON.parse(atob(fresh.content.replace(/\n/g,'')));
          merged = { ...existing, ...prog, attempts: { ...(existing.attempts||{}), ...attempts } };
        } catch {}
      }
      const payload = JSON.stringify(merged);
      await ghWriteLarge(env, 'data/reimport-progress.json', payload, 'auto: reimport progress');
    } catch (we) {
      void we;
    }
    return new Response(JSON.stringify({ processed:remaining.length, ok, fail, results }),{headers:{'Content-Type':'application/json',...corsHeaders()}});
  }catch(err){
    return new Response(JSON.stringify({error:String(err&&err.message||err),stack:String(err&&err.stack||'').slice(0,400)}),{status:500,headers:{'Content-Type':'application/json',...corsHeaders()}});
  }
}