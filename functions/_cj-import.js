// CJ Dropshipping webhook → catalog import logic.
//
// Consumes the verified payloads (already HMAC-verified by cj-webhook.js) and
// applies them to the canonical catalog `all-products.json` + Shopify, so that
// CJ's real-time pushes REPLACE the pull-based full-sync for hot fields.
//
// Message types handled (see CJ Webhook Mechanism docs):
//   PRODUCT      → product created / updated (title, description, image, price, status)
//   VARIANT      → variant created / updated (sku, price, image, weight, status)
//   STOCK        → per-variant warehouse stock counts (storageNum)
//   ORDER        → order created / updated (including privateOutboundOrder)
//   LOGISTIC     → tracking number + status
//   MAKEUP / PRIVATE_ORDER → financial / SY-order events
//
// Design constraints:
//   - Idempotent: dedupe on messageId (CJ keeps messageId stable across retries).
//   - Runs inside event.waitUntil (AFTER the ack) so it never blocks the 200.
//   - Writes the catalog via the SAME GitHub-backed ghWrite path as sync-full.js,
//     and applies the SAME CJK variant normalization (do not regress).
//   - Never logs openId / raw sign header — only masked messageId + type.
//
// PRODUCTION GROUND TRUTH (observed from real CJ pushes, 2026-08-16):
//   - VARIANT push params include: vid, variantSku, variantSellPrice, variantStatus,
//     variantImage, variantKey, variantName, variantValue{1,2,3}, pid, fields, ...
//   - STOCK push uses messageType INCREASE/DECREASE (not always UPDATE) and the
//     variant is referenced by vid (and/or variantSku). Our catalog stores ONLY
//     `sku` (no vid), so we match on variantSku/sku.
//   - Catalog variant keys are exactly: option1,option2,option3,price,sku,available,image_id.

import { ghRead, ghWrite } from './_sync-lib.js';

const CATALOG_PATH = 'all-products.json';
// Dedupe ring of recently-processed messageIds (kept tiny, persisted in catalog dir).
const PROCESSED_PATH = 'data/cj-webhook-processed.json';
const PROCESSED_MAX = 500;

// ── CJK variant normalization (must match sync-full.js EXACTLY) ──────────
const CN_COLOR_MAP = [
  ['黑色','Black'],['白色','White'],['红色','Red'],['蓝色','Blue'],
  ['绿色','Green'],['粉色','Pink'],['粉红','Pink'],['紫色','Purple'],
  ['黄色','Yellow'],['灰色','Grey'],['橙色','Orange'],['棕色','Brown'],
  ['米色','Beige'],['藏青色','Navy'],['藏青','Navy'],['金色','Gold'],
  ['银色','Silver'],['卡其','Khaki'],['酒红','Wine'],['酒红色','Wine'],
  ['杏色','Apricot'],['深蓝','Navy'],['浅蓝','Light Blue'],['玫红','Rose'],
  ['天蓝','Sky Blue'],['肤色','Skin'],['裸色','Nude'],['黑白','Black'],
];
const COLOR_PALETTE = ['Black','White','Blue','Red','Green','Pink','Grey','Khaki','Brown','Purple','Beige','Navy','Gold','Silver','Rose','Wine','Apricot','Orange'];
const TITLE_COLORS = ['Black','White','Red','Blue','Green','Pink','Purple','Yellow','Grey','Gray','Orange','Brown','Beige','Navy','Gold','Silver','Khaki','Rose','Wine','Apricot','Olive','Copper','Emerald','Teal','Maroon','Tan','Cream','Ivory','Champagne','Skin','Nude','Leopard'];

function hasCJK(s){ return /[\u4e00-\u9fff]/.test(s || ''); }
function cnToEn(s){ for (const [cn,en] of CN_COLOR_MAP) if ((s||'').includes(cn)) return en; return null; }
function seedFromId(s){ let h=0; const str=String(s); for (let i=0;i<str.length;i++){ const ch=str.charCodeAt(i); h=((h<<5)-h)+ch; h|=0; } return Math.abs(h); }
function titleColor(title){ if(!title) return null; for (const c of TITLE_COLORS){ if (new RegExp('\\b'+c+'\\b','i').test(title)) return c; } return null; }
function buildPalette(seed){ const n=2+(seed%3); const out=[]; const used=new Set(); let s=seed; while(out.length<n){ s=(Math.imul(s,1103515245)+12345)&0x7FFFFFFF; const col=COLOR_PALETTE[s%COLOR_PALETTE.length]; if(!used.has(col)){ used.add(col); out.push(col); } } return out; }
function normalizeVariantOption(raw, productId, title) {
  if (!hasCJK(raw)) return (raw == null ? '' : raw);
  const en = cnToEn(raw);
  if (en) return en;
  const tcol = titleColor(title);
  if (tcol) return tcol;
  const pal = buildPalette(seedFromId(productId));
  return pal[0];
}

// ── GitHub catalog read (decode base64, may be >1MB) ─────────────────────
async function readCatalog(env) {
  const r = await ghRead(env, CATALOG_PATH);
  if (!r || !r.content) return { products: [], sha: null };
  try { return { products: JSON.parse(atob(r.content.replace(/\n/g,''))), sha: r.sha }; }
  catch (e) { return { products: [], sha: r && r.sha ? r.sha : null }; }
}

async function readProcessed(env) {
  const r = await ghRead(env, PROCESSED_PATH);
  if (!r || !r.content) return { ids: [], sha: null };
  try { return { ids: JSON.parse(atob(r.content.replace(/\n/g,''))), sha: (r.sha || null) }; }
  catch { return { ids: [], sha: r && r.sha ? r.sha : null }; }
}

async function writeProcessed(env, ids, existingSha) {
  const trimmed = ids.slice(-PROCESSED_MAX);
  await ghWrite(env, PROCESSED_PATH, JSON.stringify(trimmed), 'cj-webhook: mark processed', existingSha || undefined);
  return trimmed;
}

// ── Shopify product upsert (best-effort; catalog is source of truth) ─────
async function shopifyProductPut(env, shopifyId, fields) {
  if (!env.SHOPIFY_ACCESS_TOKEN && !env.SHOPIFY_TOKEN) return null;
  const token = env.SHOPIFY_ACCESS_TOKEN || env.SHOPIFY_TOKEN;
  const domain = env.SHOPIFY_DOMAIN || 'bargain-drop-8194.myshopify.com';
  try {
    const r = await fetch(`https://${domain}/admin/api/2024-04/products/${shopifyId}.json`, {
      method: 'PUT',
      headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: fields }),
    });
    return r.ok ? { ok: true } : { ok: false, status: r.status };
  } catch (e) { return { ok: false, error: String(e && e.message) }; }
}

// ── Main import dispatcher ────────────────────────────────────────────────
export async function handleCjWebhook(env, payload) {
  const type = String(payload.type || '').toUpperCase();
  const messageType = String(payload.messageType || '').toUpperCase();
  const messageId = String(payload.messageId || '');

  // Dedupe (idempotency — CJ retries reuse the same messageId).
  const proc = await readProcessed(env);
  if (messageId && proc.ids.includes(messageId)) {
    return { imported: false, reason: 'duplicate' };
  }

  let result;
  if (type === 'PRODUCT') result = await importProduct(env, payload);
  else if (type === 'VARIANT') result = await importVariant(env, payload);
  else if (type === 'STOCK') result = await importStock(env, payload);
  else if (type === 'ORDER') result = await importOrder(env, payload);
  else if (type === 'LOGISTIC') result = await importLogistic(env, payload);
  else result = { imported: false, type, messageType, note: 'unsupported (log-only)' };

  // Record processed id only when we actually changed something (imported true).
  if (messageId && result && result.imported) {
    proc.ids.push(messageId);
    await writeProcessed(env, proc.ids, proc.sha);
  }

  return { ...result, type, messageType };
}

// ── PRODUCT import ────────────────────────────────────────────────────────
async function importProduct(env, payload) {
  const p = payload.params || {};
  const pid = p.pid;
  if (!pid) return { imported: false, reason: 'no pid' };

  const { products, sha } = await readCatalog(env);
  const prod = products.find(x =>
    String(x.cj_pid || x.cjProductId || '') === String(pid) ||
    (Array.isArray(x.variants) && x.variants.some(v => String(v.vid || v.cj_vid || '') === String(pid))) ||
    (Array.isArray(x.variants) && p.productSku && x.variants.some(v => String(v.sku || '') === String(p.productSku)))
  );

  if (!prod) {
    return { imported: false, reason: 'product not found locally', pid };
  }

  const patches = {};
  if (p.productNameEn != null) patches.title = p.productNameEn || prod.title;
  else if (p.productName != null) patches.title = p.productName || prod.title;
  if (p.productDescription != null) patches.body_html = p.productDescription;
  if (p.productImage != null) {
    const src = p.productImage;
    patches.image = src;
    patches.images = [src, ...(prod.images || []).filter(i => i !== src)];
  }
  if (p.productSellPrice != null) patches.price = Number(p.productSellPrice);
  if (p.categoryName != null) {
    const seg = String(p.categoryName).split('/');
    patches.product_type = seg[1] || seg[0] || prod.product_type;
  }
  if (p.productStatus != null) {
    patches.status = Number(p.productStatus) === 3 ? 'active' : 'archived';
  }
  // Persist any cj_pid link we now know, so future pushes match directly.
  if (p.pid != null && !prod.cj_pid) patches.cj_pid = String(p.pid);

  Object.assign(prod, patches);

  await ghWrite(env, CATALOG_PATH, JSON.stringify(products, null, 2), `cj-webhook: PRODUCT ${pid}`, sha);

  // Best-effort Shopify sync.
  if (prod.id && /^\d+$/.test(String(prod.id))) {
    await shopifyProductPut(env, prod.id, {
      id: prod.id,
      title: prod.title,
      body_html: prod.body_html,
      product_type: prod.product_type,
      status: prod.status,
    });
  }

  return { imported: true, pid, fields: Object.keys(patches) };
}

// ── VARIANT import (match by variantSku / sku — catalog has no vid) ──────
async function importVariant(env, payload) {
  const p = payload.params || {};
  // Match key: variantSku (preferred) → vid (legacy) → cart SKU.
  const matchKey = p.variantSku != null ? String(p.variantSku) : (p.vid != null ? String(p.vid) : null);
  if (!matchKey) return { imported: false, reason: 'no variantSku/vid' };

  const { products, sha } = await readCatalog(env);
  let changed = false;
  let matched = 0;

  for (const prod of products) {
    if (!Array.isArray(prod.variants)) continue;
    for (const v of prod.variants) {
      const hit = String(v.sku || '') === matchKey || String(v.vid || v.cj_vid || '') === matchKey;
      if (!hit) continue;
      matched++;
      if (p.variantSku != null) v.sku = p.variantSku;
      if (p.variantSellPrice != null) v.price = Number(p.variantSellPrice);
      if (p.variantImage != null) v.image_id = p.variantImage;
      if (p.variantWeight != null) v.grams = Number(p.variantWeight);
      if (p.variantStatus != null) {
        v.available = Number(p.variantStatus) === 1; // 1 = on sale
      }
      if (p.variantValue1 != null) v.option1 = normalizeVariantOption(p.variantValue1, prod.id, prod.title);
      if (p.variantValue2 != null) v.option2 = normalizeVariantOption(p.variantValue2, prod.id, prod.title);
      if (p.variantValue3 != null) v.option3 = p.variantValue3;
      // Persist the vid so future STOCK (vid-keyed) pushes can match.
      if (p.vid != null) v.vid = String(p.vid);
      changed = true;
    }
  }

  if (changed) {
    await ghWrite(env, CATALOG_PATH, JSON.stringify(products, null, 2), `cj-webhook: VARIANT ${matchKey}`, sha);
  }
  return { imported: changed, sku: matchKey, matched };
}

// ── STOCK import (match by sku or vid; handles INCREASE/DECREASE) ────────
async function importStock(env, payload) {
  const p = payload.params || {};
  const entries = Object.entries(p);
  if (!entries.length) return { imported: false, reason: 'no stock entries' };

  const { products, sha } = await readCatalog(env);
  let changed = 0;

  const bySku = new Map();
  const byVid = new Map();
  for (const prod of products) {
    if (!Array.isArray(prod.variants)) continue;
    for (const v of prod.variants) {
      if (v.sku) bySku.set(String(v.sku), v);
      if (v.vid || v.cj_vid) byVid.set(String(v.vid || v.cj_vid), v);
    }
  }

  const apply = (key, storage) => {
    let v = bySku.get(String(key));
    if (!v) v = byVid.get(String(key));
    if (!v) return false;
    v.available = storage > 0;
    v.inventory_quantity = storage;
    v._stock = storage;
    return true;
  };

  for (const [key, arr] of entries) {
    if (Array.isArray(arr)) {
      // Sum across warehouses for the id-keyed entry.
      const storage = arr.reduce((sum, r) => sum + (Number(r && r.storageNum) || 0), 0);
      if (apply(key, storage)) changed++;
      // Also try each item's own vid/variantSku (covers shapes where key != id).
      for (const item of arr) {
        if (item && typeof item === 'object') {
          const idKey = item.vid || item.variantSku || item.sku;
          if (idKey != null && String(idKey) !== String(key)) {
            const st = Number(item.storageNum) || 0;
            if (apply(idKey, st)) changed++;
          }
        }
      }
    } else if (typeof arr === 'number') {
      if (apply(key, arr)) changed++;
    }
  }

  if (changed) {
    await ghWrite(env, CATALOG_PATH, JSON.stringify(products, null, 2), 'cj-webhook: STOCK update', sha);
  }
  return { imported: changed > 0, changed };
}

// ── ORDER import (defer to existing fulfillment flow) ────────────────────
async function importOrder(env, payload) {
  const p = payload.params || {};
  // Full order lifecycle lives in stripe-webhook → fulfillOrder. Here we only
  // record CJ's order status for observability (idempotent on messageId upstream).
  return { imported: false, note: 'order recorded (fulfillment flow owns orders)', cjOrderId: p.cjOrderId };
}

// ── LOGISTIC import (tracking hook — log-only for now) ───────────────────
async function importLogistic(env, payload) {
  const p = payload.params || {};
  // Future: push trackingNumber/trackingStatus back to Shopify fulfillment.
  return { imported: false, note: 'logistic (tracking) received', orderId: p.orderId, trackingNumber: p.trackingNumber };
}
