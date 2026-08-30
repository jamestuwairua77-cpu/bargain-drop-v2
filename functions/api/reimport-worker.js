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
//   ?reset=1          -> clear progress (for THIS key's shard)
//   ?dryRun=1         -> count products needing a fix (no changes)
//   ?shards=S         -> number of catalog shards (default 4). Each key owns shard == key % shards.
//
// PARALLEL SLICES (option B): every key scans a DISJOINT, CONTIGUOUS id-range of the
// catalog. Shopify product ids are monotonically increasing, so we partition
// [MIN_ID, MAX_ID] into `shards` contiguous chunks and each key owns chunk keyIdx.
// Progress lives in Shopify shop metafields (namespace=reimport, key=progress_{keyIdx}).

import { corsHeaders, shopifyFetch, isAdmin, adminDenied, cjKeys, nextPageCursor } from '../_sync-lib.js';

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
function hasSkuSuffix(sku) { if(!sku) return false; const s=String(sku).trim(); return /-\d+$/.test(s) || /\d{2}[A-Z]{2}$/.test(s); }
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

let _tokCache = new Map();
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
async function cjFetchKey(apiKey, path) {
  const tok = await keyToken(apiKey);
  if (!tok) return null;
  const r = await fetch(`https://developers.cjdropshipping.com/api2.0/v1${path}`, {
    headers: { 'CJ-Access-Token': tok, 'Content-Type': 'application/json' },
  });
  return r.json();
}

async function resolveCjKey(apiKey, p) {
  const firstRaw = (p.variants||[]).map(v=>v.sku).filter(Boolean)[0];
  const candidates = [];
  if (firstRaw) {
    const ps = parentSku(firstRaw);
    if (ps && !candidates.includes(ps)) candidates.push(ps);
    if (firstRaw !== ps && !candidates.includes(firstRaw)) candidates.push(firstRaw);
  }
  if (!candidates.length) return null;
  for (const sku of candidates) {
    const list = await cjFetchKey(apiKey, `/product/list?productSku=${encodeURIComponent(sku)}&pageNum=1&pageSize=10`);
    const pid = list?.data?.list?.[0]?.pid;
    if (pid) {
      const detail = await cjFetchKey(apiKey, `/product/query?pid=${encodeURIComponent(pid)}`);
      if (detail && detail.code === 200 && detail.data) return detail.data;
    }
    const q = await cjFetchKey(apiKey, `/product/query?productSku=${encodeURIComponent(sku)}`);
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
    options.push({name:'Size', values: [...new Set([...sizeValues, ...used])]});
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

async function readProgress(env, keyIdx) {
  // Per-shard progress lives in a Shopify shop metafield (source of truth), NOT GitHub.
  try {
    const res = await shopifyFetch(env, `/metafields.json?namespace=reimport&key=progress_${keyIdx}`);
    if (!res || !res.ok || !res.body) return { id: null, data: null };
    const mf = Array.isArray(res.body.metafields) ? res.body.metafields[0] : null;
    if (!mf) return { id: null, data: null };
    let data = null;
    try { data = JSON.parse(mf.value || 'null'); } catch (e) { data = null; }
    return { id: mf.id || null, data };
  } catch (e) {
    return { id: null, data: null };
  }
}

async function writeProgress(env, keyIdx, data, existingId) {
  const value = JSON.stringify(data);
  try {
    if (existingId) {
      const res = await shopifyFetch(env, `/metafields/${existingId}.json`, { method: 'PUT', body: JSON.stringify({ metafield: { id: existingId, value, type: 'json' } }) });
      return !!(res && res.ok);
    }
    const res = await shopifyFetch(env, `/metafields.json`, { method: 'POST', body: JSON.stringify({ metafield: { namespace: 'reimport', key: 'progress_' + keyIdx, value, type: 'json', owner_resource: 'shop' } }) });
    return !!(res && res.ok);
  } catch (e) {
    return false;
  }
}

function getBounds(env) {
  let arr;
  if (env.REIMPORT_BOUNDS) arr = String(env.REIMPORT_BOUNDS).split(',').map(s => parseInt(s.trim(), 10)).filter(n => n && !isNaN(n));
  if (arr && arr.length >= 2) return arr;
  return [9233116463235, 9233141989507, 9233177739395, 9233211129987, 9255590330500];
}

function shardRange(env, shards, keyIdx) {
  const b = getBounds(env);
  if (b.length < shards + 1) shards = b.length - 1;
  const lo = b[keyIdx];
  const hi = b[keyIdx + 1];
  return { lo, hi };
}

export async function onRequest(context) {
  const { request, env } = context;
  const cors = corsHeaders();
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });
  if (!isAdmin(request, env)) return adminDenied();

  const q = url.searchParams;
  const keyIdx = parseInt(q.get('key') || '0', 10) || 0;
  const stats = q.get('stats') === '1';
  const dryRun = q.get('dryRun') === '1';
  const run = q.get('run') === '1';
  const reset = q.get('reset') === '1';
  const priceOnly = q.get('priceOnly') === '1';
  const shards = Math.max(1, parseInt(q.get('shards') || '4', 10) || 4);
  const limit = Math.max(1, parseInt(q.get('limit') || '6', 10) || 6);

  const json = (obj, status) => new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json', ...cors } });

  const apiKey = cjKeys(env)[keyIdx];
  if (!apiKey) return json({ ok: false, error: 'no CJ key at index ' + keyIdx }, 400);

  if (stats) {
    const keys = cjKeys(env).map((k, i) => ({ i, prefix: String(k).slice(0, 8) }));
    return json({ ok: true, stats: true, keyIdx, totalKeys: keys.length, keys });
  }

  const prog = await readProgress(env, keyIdx);
  if (reset) {
    await writeProgress(env, keyIdx, { cursor: null, done: {}, attempts: {} }, prog.id);
    return json({ ok: true, reset: true, keyIdx });
  }

  const { lo, hi } = shardRange(env, shards, keyIdx);
  let cursor = prog.data && prog.data.cursor ? prog.data.cursor : lo;
  const done = (prog.data && prog.data.done) || {};
  const attempts = (prog.data && prog.data.attempts) || {};

  let processed = 0, okCount = 0, fail = 0, skipped = 0, subreqErr = 0;
  let newCursor = cursor;
  let eof = false;
  let page = 1;
  const cjErrors = [];

  while (processed < limit && !eof) {
    const listRes = await shopifyFetch(env, `/products.json?since_id=${cursor}&limit=200&fields=id,variants,options,images,title`);
    if (!listRes || !listRes.ok || !listRes.body) {
      fail++;
      break;
    }
    const products = (listRes.body.products || []).filter(p => p && p.id && p.id >= lo && p.id < hi);
    if (!products.length) {
      const rawIds = (listRes.body.products || []).map(p => p.id);
      const maxId = rawIds.length ? Math.max(...rawIds) : cursor;
      if (maxId > hi) { eof = true; newCursor = maxId; }
      else {
        const next = nextPageCursor(listRes.headers);
        if (!next) { eof = true; newCursor = maxId; }
        else { cursor = maxId; page++; }
      }
      continue;
    }

    const batch = products.slice(0, limit - processed);
    const results = await mapWithConcurrency(batch, 8, async (p) => {
      if (done[p.id]) return { skip: true, id: p.id };
      try {
        let payload;
        if (priceOnly) {
          payload = buildRepricePayload(p);
        } else {
          const cj = await resolveCjKey(apiKey, p);
          if (!cj) {
            attempts[p.id] = (attempts[p.id] || 0) + 1;
            return { fail: true, id: p.id, reason: 'no-cj-match', attempts: attempts[p.id] };
          }
          payload = buildCjPayload(p, cj);
        }
        const res = await putProduct(env, p, payload);
        if (!res || (!res.ok && res.status !== 409 && res.status !== 429)) {
          try { if (res && res.body && JSON.stringify(res.body).toLowerCase().includes('subrequest')) subreqErr++; } catch (e) {}
          attempts[p.id] = (attempts[p.id] || 0) + 1;
          return { fail: true, id: p.id, reason: 'put-fail-' + (res ? res.status : 'no-res'), attempts: attempts[p.id] };
        }
        return { ok: true, id: p.id };
      } catch (e) {
        const msg = String(e && e.message || e);
        if (/subrequest|too many/i.test(msg)) subreqErr++;
        else cjErrors.push(msg);
        attempts[p.id] = (attempts[p.id] || 0) + 1;
        return { fail: true, id: p.id, reason: 'err-' + msg.slice(0, 80), attempts: attempts[p.id] };
      }
    });

    for (const r of results) {
      processed++;
      if (r && r.skip) { skipped++; continue; }
      if (r && r.ok) { okCount++; done[r.id] = { ts: Date.now() }; }
      else { fail++; }
    }

    const maxId = Math.max(...batch.map(p => p.id));
    newCursor = maxId;
    const next = nextPageCursor(listRes.headers);
    if (!next) { eof = true; }
    else { cursor = maxId; page++; }
  }

  const finalProg = { cursor: newCursor, done, attempts };
  let writeOk = false, writeError = null;
  if (!dryRun && run) {
    writeOk = await writeProgress(env, keyIdx, finalProg, prog.id);
    if (!writeOk) writeError = 'writeProgress returned false';
  }

  return json({
    ok: true, keyIdx, lo, hi, dryRun, reset,
    processed, okCount, fail, skipped, subreqErr,
    cursor: newCursor, eof,
    writeOk, writeError,
    cjErrors: cjErrors.slice(0, 3),
    attemptsTotal: Object.keys(attempts).length,
    doneTotal: Object.keys(done).length,
  });
}
