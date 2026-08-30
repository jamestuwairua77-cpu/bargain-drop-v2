// Cloudflare Pages Function: /api/reimport-worker (PER-KEY PARALLEL REIMPORT)
//
// Parallel, concurrency-first reimport of the LIVE Shopify catalog.
// Designed for multi-agent operation: ONE agent per CJ key via ?key=N (0-based).
//
// Query params:
//   ?key=N            -> pin this worker to cjKeys()[N] (default 0). Dedicated CJ fetches.
//   ?run=1&limit=M    -> full variant recovery via CJ (rebuild variant matrix + tier pricing)
//   ?priceOnly=1      -> tiered re-price only (NO CJ, no variant rebuild, very fast)
//   ?stats=1          -> report configured key prefixes + openIds (no work)
//   ?reset=1          -> clear progress
//   ?dryRun=1         -> count products needing a fix (no changes)
//
// Concurrency model (the whole point vs reimport-products.js):
//   Phase 1: fan out ALL CJ lookups for the batch in a single Promise.all (one key).
//   Phase 2: fan out ALL Shopify PUTs in a single Promise.all (per-product 409/429 retry).
// This fits as many products as possible into ONE request/call instead of serializing.
//
// Resumable via data/reimport-progress.json (keyed by live product id; cursor = since_id).
// Progress shape is the SAME as reimport-products.js so the two endpoints can share state.

import { corsHeaders, shopifyFetch, ghRead, ghWriteLarge, isAdmin, adminDenied, cjKeys } from '../_sync-lib.js';

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
function parentSku(sku) { if(!sku) return sku; let s=String(sku).trim(); s=s.replace(/-(\d+)$/,''); s=s.replace(/(\d{2})([A-Z]{2})$/,''); return s; }
function hasSkuSuffix(sku) { if(!sku) return false; const s=String(sku).trim(); return /-\d+$/.test(s)||/\d{2}[A-Z]{2}$/.test(s); }
function needsFix(p){
  const v = p.variants || [];
  if (!v.length) return false;
  const hasCJK = v.some(x=>/[\u4e00-\u9fff]/.test(String(x.option1||'')));
  if (hasCJK) return true;
  const hasSize = v.some(x=>x.option2);
  if (v.length > 1 && !hasSize) return true;
  if (v.length === 1 && hasSkuSuffix(v.sku)) return true;
  return true;
}

// Single-key CJ fetch: exchange the token ONCE for the pinned key, cache it for the
// whole request, and reuse it for every lookup. No round-robin across 6 keys.
let _tokCache = new Map(); // apiKey -> { tok, exp }
async function keyToken(apiKey) {
  const c = _tokCache.get(apiKey);
  if (c && Date.now() < c.exp) return c.tok;
  const r = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey }),
  });
  const j = await r.json();
  const tok = j?.data?.accessToken || null;
  if (tok) _tokCache.set(apiKey, { tok, exp: Date.now() + 12 * 3600 * 1000 });
  return tok;
}
async function cjFetchKey(env, apiKey, path) {
  const tok = await keyToken(apiKey);
  if (!tok) return null;
  const r = await fetch(`https://developers.cjdropshipping.com/api2.0/v1${path}`, {
    headers: { 'CJ-Access-Token': tok, 'Content-Type': 'application/json' },
  });
  return r.json();
}

// Resolve full CJ variant matrix for a product using ONLY the pinned key.
async function resolveCjKey(env, apiKey, p) {
  const firstRaw = (p.variants||[]).map(v=>v.sku).filter(Boolean)[0];
  const candidates = [];
  if (firstRaw) {
    const ps = parentSku(firstRaw);
    if (ps && !candidates.includes(ps)) candidates.push(ps);
    if (firstRaw !== ps && !candidates.includes(firstRaw)) candidates.push(firstRaw);
  }
  if (!candidates.length) return null;
  for (const sku of candidates) {
    const list = await cjFetchKey(env, apiKey, `/product/list?productSku=${encodeURIComponent(sku)}&pageNum=1&pageSize=10`);
    const pid = list?.data?.list?.[0]?.pid;
    if (pid) {
      const detail = await cjFetchKey(env, apiKey, `/product/query?pid=${encodeURIComponent(pid)}`);
      if (detail && detail.code === 200 && detail.data) return detail.data;
    }
    const q = await cjFetchKey(env, apiKey, `/product/query?productSku=${encodeURIComponent(sku)}`);
    if (q && q.code === 200 && q.data && q.data.variants && q.data.variants.length) return q.data;
  }
  return null;
}

function buildRepricePayload(p){
  const vs = (p.variants||[]).filter(v=>v && v.id);
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
  return { product: { id: p.id, options, variants } };
}

function buildCjPayload(p, cj){
  const cjv = (cj.variants || []);
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
  return { product: { id: p.id, options, variants, images } };
}

async function putProduct(env, p, payload){
  let res = await shopifyFetch(env, `/products/${p.id}.json`, { method:'PUT', body:JSON.stringify(payload) });
  for (let t=0; t<6 && res && (res.status===409 || res.status===429); t++) {
    await new Promise(r=>setTimeout(r, 1200 + t*700));
    res = await shopifyFetch(env, `/products/${p.id}.json`, { method:'PUT', body:JSON.stringify(payload) });
  }
  return res;
}


// Run `fn(item)` over `items` with at most `concurrency` in flight at once.
// Stays well under Cloudflare's 100-subrequest-per-invocation limit while still
// fanning out aggressively (batches of ~20), so large limits don't 502.
async function mapWithConcurrency(items, concurrency, fn) {
  const results = new Array(items.length);
  let i = 0;
  const workers = new Array(Math.min(concurrency, items.length)).fill(0).map(async () => {
    while (i < items.length) {
      const idx = i++;
      try { results[idx] = await fn(items[idx], idx); }
      catch (e) { results[idx] = { err: String(e && e.message || e) }; }
    }
  });
  await Promise.all(workers);
  return results;
}

export async function onRequest(context){
  try {
    const { request, env } = context;
    if(request.method==='OPTIONS') return new Response(null,{status:200,headers:corsHeaders()});
    if (!isAdmin(request, env)) return adminDenied();
    const url = new URL(request.url);
    const stats = url.searchParams.get('stats')==='1';
    const run = url.searchParams.get('run')==='1';
    const priceOnly = url.searchParams.get('priceOnly')==='1';
    const dryRun = url.searchParams.get('dryRun')==='1';
    const reset = url.searchParams.get('reset')==='1';

    const keys = cjKeys(env);
    const keyIdx = Math.max(0, Math.min(parseInt(url.searchParams.get('key')||'0',10)||0, keys.length-1));
    const apiKey = keys[keyIdx];

    if (stats) {
      const prefixes = keys.map(k => String(k).slice(0, 12) + '...');
      return new Response(JSON.stringify({ keys: keys.length, keyIndex: keyIdx, keyPrefixes: prefixes }), { headers:{'Content-Type':'application/json',...corsHeaders()} });
    }

    const limitRaw = parseInt(url.searchParams.get('limit')||'',10);
    const limit = priceOnly
      ? (isNaN(limitRaw) ? 120 : Math.min(limitRaw, 200))
      : Math.min(isNaN(limitRaw) ? 40 : limitRaw, 120);

    const progDoc = await ghRead(env, 'data/reimport-progress.json');
    let prog = (progDoc && progDoc.content) ? JSON.parse(atob(progDoc.content.replace(/\n/g,''))) : {};
    if (reset || typeof prog !== 'object' || !prog) prog = {};
    const attempts = prog.attempts || {};
    const cursor = prog.cursor || 0;

    const res = await shopifyFetch(env, `/products.json?limit=250&fields=id,title,options,variants,images&since_id=${cursor}`);
    const batch = res.body?.products || [];
    const newCursor = batch.length ? batch.reduce((m,p)=>Math.max(m,Number(p.id)), cursor) : cursor;
    const eof = batch.length < 250;
    const todoP = batch.filter(needsFix);

    if (dryRun) {
      return new Response(JSON.stringify({ cursor, newCursor, eof, scanned:batch.length, needFix:todoP.length, keyIndex:keyIdx, keys:keys.length }), { headers:{'Content-Type':'application/json',...corsHeaders()} });
    }
    if (!run) {
      return new Response(JSON.stringify({ cursor, eof, scanned:batch.length, needFix:todoP.length, keyIndex:keyIdx, keys:keys.length }), { headers:{'Content-Type':'application/json',...corsHeaders()} });
    }

    const doneIds = new Set(Object.keys(prog).filter(k => k!=='attempts' && k!=='cursor' && prog[k] && typeof prog[k]==='object' && ('n' in prog[k] || 'skip' in prog[k] || 'm' in prog[k])));
    const remaining = todoP
      .filter(p => !doneIds.has(String(p.id)))
      .filter(p => (attempts[String(p.id)]||0) < 3)
      .slice(0, limit);

    const startedAt = Date.now();

    // Phase 1: fan out CJ lookups CONCURRENTLY (only when not priceOnly).
    const lookups = new Map();
    if (!priceOnly && remaining.length) {
      const results = await mapWithConcurrency(remaining, 12, async (p) => {
        try { return { p, cj: await resolveCjKey(env, apiKey, p) }; }
        catch (e) { return { p, cj: null, err: String(e.message||e) }; }
      });
      for (const r of results) { if (r && r.p) lookups.set(String(r.p.id), r); }
    }

    // Phase 2: fan out Shopify PUTs CONCURRENTLY.
    const resultsArr = await mapWithConcurrency(remaining, 20, async (p) => {
      const id = String(p.id);
      try {
        let r;
        if (priceOnly) {
          r = await putProduct(env, p, buildRepricePayload(p));
          if (!r.ok) return { id, ok:false, err:'reprice put '+r.status+' '+(r.body&&r.body.errors?JSON.stringify(r.body.errors).slice(0,120):'') };
          const n = (buildRepricePayload(p).product.variants||[]).length;
          prog[id] = { n, colors:0, sizes:0, m:'reprice' };
          return { id, ok:true, variants:n, colors:0, sizes:0, mode:'reprice' };
        }
        const lk = lookups.get(id) || { cj: null };
        if (!lk.cj) {
          // Fallback: re-price only (no CJ matrix).
          r = await putProduct(env, p, buildRepricePayload(p));
          if (!r.ok) return { id, ok:false, err:'no-cj reprice put '+r.status };
          const n = (buildRepricePayload(p).product.variants||[]).length;
          prog[id] = { n, colors:0, sizes:0, m:'reprice' };
          return { id, ok:true, variants:n, colors:0, sizes:0, mode:'reprice' };
        }
        const payload = buildCjPayload(p, lk.cj);
        const nv = payload.product.variants.length;
        const ncolors = payload.product.options.find(o=>o.name==='Color')?.values.length || 0;
        const nsizes = payload.product.options.find(o=>o.name==='Size')?.values.length || 0;
        r = await putProduct(env, p, payload);
        if (!r.ok) return { id, ok:false, err:'put '+r.status+' '+(r.body&&r.body.errors?JSON.stringify(r.body.errors).slice(0,120):'') };
        prog[id] = { n:nv, colors:ncolors, sizes:nsizes, m:'cj' };
        return { id, ok:true, variants:nv, colors:ncolors, sizes:nsizes, mode:'cj' };
      } catch (e) {
        prog[id] = { skip:'ex:'+String(e.message||e).slice(0,50) };
        return { id, ok:false, err:String(e.message||e).slice(0,80) };
      }
    }));

    let ok=0, fail=0;
    for (const r of resultsArr) {
      if (r.ok) ok++; else { fail++; attempts[r.id]=(attempts[r.id]||0)+1; }
    }

    const allPageDone = todoP.every(p => doneIds.has(String(p.id)) || prog[String(p.id)]);
    if (allPageDone || eof) prog.cursor = newCursor;
    prog.attempts = attempts;

    try {
      const fresh = await ghRead(env, 'data/reimport-progress.json');
      let merged = prog;
      if (fresh && fresh.content) {
        try { const existing = JSON.parse(atob(fresh.content.replace(/\n/g,''))); merged = { ...existing, ...prog, attempts: { ...(existing.attempts||{}), ...attempts } }; } catch {}
      }
      await ghWriteLarge(env, 'data/reimport-progress.json', JSON.stringify(merged), 'auto: reimport progress');
    } catch (we) { void we; }

    const elapsed = Date.now() - startedAt;
    return new Response(JSON.stringify({ cursor:prog.cursor, newCursor, eof, scanned:batch.length, needFix:todoP.length, processed:ok+fail, ok, fail, priceOnly, keyIndex:keyIdx, keys:keys.length, elapsedMs: elapsed, results: resultsArr }), { headers:{'Content-Type':'application/json',...corsHeaders()} });
  } catch (err) {
    return new Response(JSON.stringify({ error:String(err&&err.message||err), stack:String(err&&err.stack||'').slice(0,400) }), { status:500, headers:{'Content-Type':'application/json',...corsHeaders()} });
  }
}
