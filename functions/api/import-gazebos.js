// Cloudflare Pages Function: /api/import-gazebos
// Search CJ for a keyword (default "gazebo"), enumerate ALL matching PIDs via
// /product/listV2, then import each into Shopify with full variants, images,
// description, and tiered ~2.5x pricing. Resumable via GitHub progress file.
//
// Modes (query params):
//   GET/POST ?scan=1          -> enumerate all matching PIDs (writes data/gazebo-pids.json), no import
//   POST        ?run=1&limit=N -> import up to N not-yet-imported PIDs (default limit 8)
//   POST        ?keyword=xxx   -> override keyword (default "gazebo")
//   GET         ?status=1      -> report progress without importing

import { corsHeaders, cjFetchMulti, shopifyFetch, ghRead, ghWriteLarge, isAdmin, adminDenied, appendSyncLog } from '../_sync-lib.js';

const PIDS_PATH = 'data/gazebo-pids.json';
const PROG_PATH = 'data/gazebo-import-progress.json';

// ── Tiered pricing (matches cj-import.js / reimport-products.js) ─────────
function computePrice(baseCost) {
  const c = parseFloat(baseCost) || 0;
  if (c <= 0) return { price: 0, markup: 2.5 };
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
  return { price: +price.toFixed(2), markup: mult };
}

const SIZE_TOKENS = new Set(['XS','S','M','L','XL','XXL','XXXL','2XL','3XL','4XL','5XL','6XL','7XL','8XL','1X','2X','3X','4X','5X','SM','MED','MEDIUM','LARGE','XLARGE','FREE','FREESIZE','ONESIZE','OS','FITS','ALL','SIZE']);
function isSizeToken(s) {
  if (!s) return false;
  const u = String(s).trim().toUpperCase();
  if (SIZE_TOKENS.has(u)) return true;
  if (/^\d{1,2}(\.\d+)?$/.test(String(s).trim())) { const n = parseFloat(s); return n >= 20 && n <= 60; }
  return false;
}
function parseVariantKey(key, nameEn) {
  let parts = [];
  if (key) {
    const s = String(key).trim();
    const m = s.match(/^(.*?)[-\/]([^-\/]+)$/);
    if (m) parts = [m[1].trim(), m[2].trim()];
    else parts = [s];
  }
  if (parts.length >= 2 && isSizeToken(parts[parts.length - 1])) {
    // ok
  } else if (nameEn) {
    const toks = String(nameEn).split(/\s+/).filter(Boolean);
    if (toks.length && isSizeToken(toks[toks.length - 1])) {
      const size = toks.pop();
      parts = [toks.join(' '), size];
    }
  }
  return parts.slice(0, 3).map(s => s.trim()).filter(Boolean);
}

function stripHtml(html = '') {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Enumerate all PIDs for a keyword via /product/listV2 ────────────────
async function scanPids(env, keyword) {
  const all = new Map(); // pid -> {nameEn, sku, sellPrice, bigImage}
  let page = 1;
  let totalPages = 1;
  let totalRecords = 0;
  const MAX_PAGES = 60; // 60 * 100 = 6000 (CJ caps totalRecords at 6000)
  while (page <= totalPages && page <= MAX_PAGES) {
    const r = await cjFetchMulti(env, `/product/listV2?keyWord=${encodeURIComponent(keyword)}&page=${page}&size=100`);
    if (!r || r.code !== 200 || !r.data) {
      if (r && r.code === 1600014) break; // not found on this account
      throw new Error('listV2 failed: ' + (r && (r.message || r.code) || 'no data'));
    }
    const d = r.data;
    totalRecords = d.totalRecords || 0;
    totalPages = d.totalPages || 1;
    const content = d.content || [];
    for (const block of content) {
      const list = block.productList || [];
      for (const p of list) {
        if (p.id && !all.has(p.id)) {
          all.set(p.id, { pid: p.id, nameEn: p.nameEn || '', sku: p.sku || '', sellPrice: p.sellPrice || '', bigImage: p.bigImage || '' });
        }
      }
    }
    if (d.totalPages && page >= d.totalPages) break;
    if (!content.length || !(content[0].productList || []).length) break;
    page++;
  }
  return { totalRecords, pids: [...all.values()] };
}

// ── Import a single PID into Shopify (same logic as cj-import.js) ───────
async function importPid(env, pid, defaultStock) {
  const LOCATION_ID = parseInt(env.SHOPIFY_LOCATION_ID || '91452932227', 10);

  const detail = await cjFetchMulti(env, `/product/query?pid=${encodeURIComponent(pid)}`);
  if (!detail || detail.code !== 200 || !detail.data) {
    throw new Error(`CJ detail fetch failed: ${detail && (detail.message || detail.code)}`);
  }
  const p = detail.data;

  let variants = Array.isArray(p.variants) ? p.variants : [];
  if (!variants.length) {
    variants = [{ vid: p.pid, variantSku: p.productSku, variantNameEn: p.productNameEn, variantSellPrice: parseFloat(p.sellPrice) || 0, variantWeight: 0, variantImage: p.bigImage, variantKey: 'Default' }];
  }

  const optionSlots = [new Set(), new Set(), new Set()];
  const colorImageMap = new Map();
  for (const v of variants) {
    const parts = parseVariantKey(v.variantKey, v.variantNameEn || v.variantName);
    parts.forEach((val, idx) => { if (idx < 3) optionSlots[idx].add(val); });
    if (parts[0] && v.variantImage && !colorImageMap.has(parts[0])) colorImageMap.set(parts[0], v.variantImage);
  }
  const optionNames = ['Color', 'Size', 'Option 3'];
  const optionsPayload = [];
  optionSlots.forEach((set, idx) => { if (set.size > 0) optionsPayload.push({ name: optionNames[idx], values: [...set] }); });

  const shopifyVariants = variants.map((v) => {
    const parts = parseVariantKey(v.variantKey, v.variantNameEn || v.variantName);
    const baseCost = parseFloat(v.variantSellPrice) || parseFloat(p.sellPrice) || 0;
    const { price } = computePrice(baseCost);
    const grams = Math.round(parseFloat(v.variantWeight) || 0);
    return {
      sku: v.variantSku, price: price.toFixed(2),
      option1: parts[0] || 'Default', option2: parts[1] || null, option3: parts[2] || null,
      grams, weight: grams / 1000, weight_unit: 'kg',
      inventory_management: 'shopify', inventory_policy: 'deny',
      fulfillment_service: 'manual', requires_shipping: true, taxable: true,
    };
  });

  const finalOptions = optionsPayload.slice(0, Math.max(1, shopifyVariants[0].option3 ? 3 : shopifyVariants[0].option2 ? 2 : 1));

  // images
  const images = [];
  const seenImg = new Set();
  for (const c of optionSlots[0]) { const u = colorImageMap.get(c); if (u && !seenImg.has(u)) { seenImg.add(u); images.push({ src: u }); } }
  const pushUrl = (url) => { if (url && !seenImg.has(url)) { seenImg.add(url); images.push({ src: url }); } };
  try {
    const set = Array.isArray(p.productImageSet) ? p.productImageSet : (typeof p.productImageSet === 'string' ? JSON.parse(p.productImageSet) : []);
    for (const url of set) pushUrl(url);
  } catch {}
  if (!images.length) {
    try { const arr = typeof p.productImage === 'string' ? JSON.parse(p.productImage) : []; for (const url of arr) pushUrl(url); } catch {}
  }
  if (p.bigImage) pushUrl(p.bigImage);

  const productPayload = {
    product: {
      title: p.productNameEn || `CJ Product ${pid}`,
      body_html: p.description || '',
      vendor: 'CJ Dropshipping',
      product_type: p.categoryName || 'Garden & Patio',
      tags: `cj-import,cj-pid-${pid},gazebo`,
      status: 'active',
      options: finalOptions,
      variants: variants.map((v, idx) => ({ ...shopifyVariants[idx] })),
      images,
    },
  };

  const createRes = await shopifyFetch(env, '/products.json', { method: 'POST', body: JSON.stringify(productPayload) });
  if (!createRes.ok) {
    const errMsg = createRes.body?.errors ? JSON.stringify(createRes.body.errors).slice(0, 300) : `HTTP ${createRes.status}`;
    throw new Error(`Shopify API Error ${createRes.status}: ${errMsg}`);
  }
  const created = createRes.body?.product;

  // wire color images to variants
  try {
    const vidByColor = new Map();
    for (const v of created.variants) { const key = v.option1; if (key && !vidByColor.has(key)) vidByColor.set(key, v); }
    const imgUpdates = [];
    for (const [color, url] of colorImageMap) {
      const shopImg = created.images.find(im => im.src === url);
      if (!shopImg) continue;
      const vv = vidByColor.get(color);
      const variantIds = vv ? [vv.id] : [];
      if (variantIds.length) imgUpdates.push({ id: shopImg.id, variant_ids: variantIds, position: shopImg.position });
    }
    if (imgUpdates.length) {
      await shopifyFetch(env, `/products/${created.id}.json`, { method: 'PUT', body: JSON.stringify({ product: { id: created.id, images: imgUpdates } }) });
    }
  } catch {}

  // inventory
  for (const v of created.variants) {
    try {
      await shopifyFetch(env, '/inventory_levels/set.json', { method: 'POST', body: JSON.stringify({ location_id: LOCATION_ID, inventory_item_id: v.inventory_item_id, available: defaultStock }) });
    } catch {}
  }

  return { shopifyId: created.id, title: created.title, variants: created.variants.length, images: images.length };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();

  try {
    const url = new URL(request.url);
    const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
    const keyword = (url.searchParams.get('keyword') || body.keyword || 'gazebo').trim();
    const scan = url.searchParams.get('scan') === '1' || body.scan === true;
    const run = url.searchParams.get('run') === '1' || body.run === true;
    const statusOnly = url.searchParams.get('status') === '1';
    const limitRaw = parseInt(url.searchParams.get('limit') || body.limit || '8', 10);
    const limit = Math.max(1, Math.min(isNaN(limitRaw) ? 8 : limitRaw, 25));
    const defaultStock = Math.max(0, parseInt(body.defaultStock || '100', 10));

    // 1. Load / scan PIDs
    let pidDoc = await ghRead(env, PIDS_PATH);
    let pids = [];
    if (pidDoc && pidDoc.content) {
      try { pids = JSON.parse(atob(pidDoc.content.replace(/\n/g, ''))); } catch { pids = []; }
    }

    let scanResult = null;
    if (scan || (!pids.length && !statusOnly)) {
      scanResult = await scanPids(env, keyword);
      pids = scanResult.pids.map(p => ({ ...p }));
      const sha = pidDoc && pidDoc.sha;
      await ghWriteLarge(env, PIDS_PATH, JSON.stringify(pids, null, 2), `scan: ${keyword} — ${pids.length} pids`, sha);
    }

    if (statusOnly || scan) {
      return new Response(JSON.stringify({
        keyword, totalRecords: scanResult ? scanResult.totalRecords : null,
        pidCount: pids.length,
        samples: pids.slice(0, 5),
      }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    }

    if (!run) {
      return new Response(JSON.stringify({ keyword, pidCount: pids.length, hint: 'add ?run=1 to import' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    }

    // 2. Load progress
    let progDoc = await ghRead(env, PROG_PATH);
    let prog = (progDoc && progDoc.content) ? JSON.parse(atob(progDoc.content.replace(/\n/g, ''))) : {};
    if (typeof prog !== 'object' || !prog) prog = {};
    const done = prog.done || {};

    const todo = pids.filter(p => !done[p.pid]);
    const batch = todo.slice(0, limit);

    const results = { imported: [], failed: [], skipped: todo.length - batch.length, remaining: todo.length - batch.length };
    const startedAt = Date.now();
    const DEADLINE = startedAt + 8500; // keep ~1.5s headroom

    for (const p of batch) {
      if (Date.now() >= DEADLINE) { results.remaining += 1; break; }
      try {
        // resolve pid: prefer the pid (id) field, but our scan stored id in 'pid'? We stored sku as key. Re-fetch pid from list by sku if needed.
        const pidKey = p.pid;
        const r = await importPid(env, pidKey, defaultStock);
        done[p.pid] = { ok: true, shopifyId: r.shopifyId, title: r.title, variants: r.variants, images: r.images, at: new Date().toISOString() };
        results.imported.push({ pid: p.pid, sku: p.sku, ...done[p.pid] });
        await appendSyncLog(env, { action: 'import-gazebo', pid: pidKey, sku: p.sku, shopifyId: r.shopifyId, ok: true });
      } catch (e) {
        done[p.pid] = { ok: false, error: String(e.message || e).slice(0, 200), at: new Date().toISOString() };
        results.failed.push({ pid: p.pid, sku: p.sku, error: done[p.pid].error });
        await appendSyncLog(env, { action: 'import-gazebo', pid: pidKey, sku: p.sku, ok: false, error: done[p.pid].error });
      }
      await new Promise(r => setTimeout(r, 400));
    }

    prog.done = done;
    // persist progress (merge to avoid clobbering concurrent writes)
    try {
      const fresh = await ghRead(env, PROG_PATH);
      let merged = prog;
      if (fresh && fresh.content) {
        try { const ex = JSON.parse(atob(fresh.content.replace(/\n/g, ''))); merged = { done: { ...(ex.done || {}), ...done } }; } catch {}
      }
      await ghWriteLarge(env, PROG_PATH, JSON.stringify(merged, null, 2), 'auto: gazebo import progress', fresh && fresh.sha);
    } catch (we) { void we; }

    return new Response(JSON.stringify({ keyword, pidCount: pids.length, ...results, done: Object.keys(done).length }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message || err), stack: String(err && err.stack || '').slice(0, 600) }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }
}
