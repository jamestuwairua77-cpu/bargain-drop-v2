// Cloudflare Pages Function: /api/enrich-variants
// Enriches all-products.json with CJ variant data (color + size + per-color image).
//
// GET  ?run=1[&limit=N][&mode=apparel|colors|all][&only=<pid,...>]
//      Processes a bounded batch and commits the enriched catalog back to GitHub.
//      Apparel-first ordering satisfies the "size+color for apparel, color photos
//      after" priority. Returns { processed, enriched, remaining, done }.
//
// Because CJ only exposes full variant data one product at a time (the bulk
// /product/list does NOT include variants), this is a resumable batch job: call it
// repeatedly until `done` is true. No sandbox timeout — runs on Cloudflare edge.

import { corsHeaders, cjFetch, ghRead, ghWrite } from '../_sync-lib.js';

const LETTER = new Set('XS S M L XL XXL XXXL 2XL 3XL 4XL 5XL 6XL 7XL 8XL 1X 2X 3X 4X 5X SM MED MEDIUM LARGE XLARGE FREE SIZE ONE SIZE'.split(' '));

function isSize(s) {
  if (!s) return false;
  const u = String(s).trim().toUpperCase();
  if (LETTER.has(u) || u === 'FREE SIZE' || u === 'ONE SIZE' || u === 'FITS ALL') return true;
  if (/^\d{1,2}(\.\d+)?$/.test(String(s).trim())) { const n = parseFloat(s); return n >= 20 && n <= 60; }
  return false;
}

// Split CJ variantKey ("Dark Blue-S") / nameEn into [color, size].
function parseVariantKey(key, nameEn = '') {
  const k = (key || '').trim();
  const parts = k ? k.split(/[-/]/).map(s => s.trim()).filter(Boolean) : [];
  let color = '', size = '';
  if (parts.length === 1) color = parts[0];
  else if (parts.length >= 2) {
    if (isSize(parts[parts.length - 1])) { size = parts[parts.length - 1]; color = parts.slice(0, -1).join(' '); }
    else color = parts.join(' ');
  }
  if (!size && nameEn) {
    const toks = String(nameEn).split(/\s+/).filter(Boolean);
    if (toks.length && isSize(toks[toks.length - 1])) size = toks[toks.length - 1];
  }
  return [color.trim(), size.trim()];
}

// Resolve a product's CJ `pid` from any of its variant SKUs.
async function resolvePid(env, skus) {
  for (const sku of skus.slice(0, 3)) {
    const r = await cjFetch(env, `/product/list?productSku=${encodeURIComponent(sku)}&pageNum=1&pageSize=10`);
    const list = (r && r.data && r.data.list) || [];
    if (list.length) return list[0].pid;
  }
  return null;
}

async function enrichProduct(env, p) {
  const skus = (p.variants || []).map(v => v.sku).filter(Boolean);
  if (!skus.length) return null;
  const pid = await resolvePid(env, skus);
  if (!pid) return null;
  const detail = await cjFetch(env, `/product/query?pid=${encodeURIComponent(pid)}`);
  const cjv = (detail && detail.data && detail.data.variants) || [];
  if (!cjv.length) return null;

  const existing = {};
  for (const v of (p.variants || [])) if (v.sku) existing[v.sku] = v;

  const colorImg = {}, colOrder = [], seenCol = {}, sizeOrder = [], seenSz = {};
  const nv = [];
  for (const cv of cjv) {
    const [color, size] = parseVariantKey(cv.variantKey, cv.variantNameEn || cv.variantName);
    const c = color || (cv.variantNameEn || 'Default');
    const img = cv.variantImage || '';
    const sku = cv.variantSku || '';
    let price = cv.variantSellPrice;
    if (price == null) price = existing[sku] ? existing[sku].price : 0;
    price = parseFloat(price) || 0;
    if (img && !colorImg[c]) colorImg[c] = img;
    if (c && !seenCol[c]) { seenCol[c] = 1; colOrder.push(c); }
    if (size && !seenSz[size]) { seenSz[size] = 1; sizeOrder.push(size); }
    nv.push({
      id: (existing[sku] && existing[sku].id) || cv.vid || '',
      title: cv.variantNameEn || '',
      option1: c, option2: size || '', option3: null,
      price, sku, available: true,
    });
  }
  if (!nv.length) return null;

  const images = [], idx = {};
  for (const c of colOrder) { const u = colorImg[c]; if (u && !(u in idx)) { idx[u] = images.length; images.push(u); } }
  for (const u of (p.images || [])) if (typeof u === 'string' && !(u in idx)) { idx[u] = images.length; images.push(u); }
  for (const v of nv) { const u = colorImg[v.option1]; v.image_id = u ? idx[u] : null; }

  const options = [];
  if (colOrder.length > 1) options.push({ name: 'Color', values: colOrder });
  if (sizeOrder.length >= 1) options.push({ name: 'Size', values: sizeOrder });

  return { variants: nv, images, options: options.length ? options : undefined };
}

function isApparel(p) {
  const t = String(p.product_type || p.category || '').toLowerCase();
  return /(clothing|dress|top|bottom|wom|men|apparel|swim|sleeve|coat|jacket|pants|shirt|skirt|hoodie|sweater|knit|legging|bikini|underwear|bra|trouser|jean|jumpsuit|romper|blouse|cardigan|vest|activewear|sportswear)/.test(t);
}

export async function onRequest(context) {
  try {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  const url = new URL(request.url);
  const run = url.searchParams.get('run') === '1';
  const limit = parseInt(url.searchParams.get('limit') || '12', 10);
  const mode = url.searchParams.get('mode') || 'apparel-first';

  const doc = await ghRead(env, 'all-products.json');
  if (!doc) return new Response(JSON.stringify({ error: 'cannot read catalog' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  const decode = function(s) { try { return JSON.parse(atob(String(s).replace(/\n/g, ''))); } catch (e) { return JSON.parse(atob(String(s))); } };
  const catalog = decode(doc.content);
  const progDoc = await ghRead(env, 'data/enrich-progress.json');
  const prog = progDoc ? decode(progDoc.content) : {};
  const saveProg = function() { return ghWrite(env, 'data/enrich-progress.json', JSON.stringify(prog), 'auto: enrich progress', progDoc ? progDoc.sha : undefined); };

  if (!run) {
    // Report queue sizes only.
    const pending = catalog.filter(p => { const v = p.variants || []; const st = prog[String(p.id)]; return !(st || st === 0) && !(v.some(x => x.option2) && v.some(x => x.image_id != null)); });
    const apparel = pending.filter(isApparel);
    return new Response(JSON.stringify({ total: catalog.length, pending: pending.length, apparelPending: apparel.length }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  // Order: apparel-first (mode apparel-first / apparel), else catalog order.
  const needs = (p) => { const v = p.variants || []; const st = prog[String(p.id)]; if (st || st === 0) return false; if (v.some(x => x.option2) && v.some(x => x.image_id != null)) return false; return true; };
  let queue = catalog.map((p, i) => ({ p, i })).filter(x => needs(x.p));
  if (mode === 'apparel' || mode === 'apparel-first') {
    queue.sort((a, b) => (isApparel(b.p) ? 1 : 0) - (isApparel(a.p) ? 1 : 0));
  }

  let processed = 0, enriched = 0;
  for (const { p } of queue) {
    if (processed >= limit) break;
    processed++;
    try {
      const res = await enrichProduct(env, p);
      if (res) {
        p.variants = res.variants;
        p.images = res.images;
        if (res.options) p.options = res.options; else delete p.options;
        prog[String(p.id)] = { n: res.variants.length };
        enriched++;
      } else {
        prog[String(p.id)] = 0; // attempted, no CJ data
      }
    } catch (e) {
      // leave for next run
    }
  }

  await ghWrite(env, 'all-products.json', JSON.stringify(catalog, null, 1), 'auto: enrich variants (' + enriched + ' product(s))', doc.sha);
  await saveProg();

  const remaining = catalog.filter(needs).length;
  return new Response(JSON.stringify({ processed, enriched, remaining, done: remaining === 0 }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message || err), stack: String(err && err.stack || '').slice(0,500) }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }
}
