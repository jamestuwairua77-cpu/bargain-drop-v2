// CJ Dropshipping webhook → catalog import logic.
//
// Consumes the verified payloads (already HMAC-verified by cj-webhook.js) and
// ensures every store product carries its complete CJ variant set.
//
// ── ARCHITECTURE (important) ─────────────────────────────────────────────
// The storefront serves products from `all-products.json`, which is REBUILT
// from Shopify on every Shopify product webhook (see product-sync-webhook.js).
// Therefore `all-products.json` is NOT a durable place to write CJ-only fields
// (vid / variantWeight / variantKey / variantNameEn) — a Shopify rebuild wipes them.
//
// The single durable source of truth for variants is SHOPIFY. So this handler:
//   1. On a PRODUCT/VARIANT push, if the full variant set isn't already present,
//      it RETRIEVES the complete variant list from CJ (product/query by sku).
//   2. Reconciles CJ variants → Shopify (create missing variants, update
//      price / weight / options / image / sku), using the existing multi-key
//      CJ client (handles cross-account 1600014) and existing shopifyFetch.
//   3. Shopify then emits products/update → product-sync-webhook rebuilds the
//      catalog with the now-complete variants.
// This satisfies "all products have all their variants" without depending on
// CJ pushes firing for every unchanged variant, and without quota-heavy pulls.
//
// Message types handled:
//   PRODUCT      → retrieve full variant list from CJ + reconcile to Shopify
//   VARIANT      → incremental variant field update (reconcile to Shopify)
//   STOCK        → per-variant stock → variant availability (Shopify inventory)
//   ORDER        → order status (defer to fulfillment flow)
//   LOGISTIC     → tracking (log-only for now)
//
// Constraints:
//   - Idempotent on messageId (CJ keeps messageId stable across retries).
//   - Runs inside event.waitUntil (AFTER the ack) → never blocks the 200.
//   - Uses CJK variant normalization matching sync-full.js (do not regress).
//   - Never logs openId / raw sign header — only masked messageId + type.

import { ghRead, ghWrite, shopifyFetch, cjFetchMulti } from './_sync-lib.js';

const REPO = 'jamestuwairua77-cpu/bargain-drop-v2';
// Dedupe ring of recently-processed messageIds.
const PROCESSED_PATH = 'data/cj-webhook-processed.json';
const PROCESSED_MAX = 2000;

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

// ── processed ids (dedupe ring) via GitHub (small file, /contents/ OK) ───
async function readProcessed(env) {
  const r = await ghRead(env, PROCESSED_PATH);
  if (!r || !r.content) return { ids: [], sha: null };
  try { return { ids: JSON.parse(atob(r.content.replace(/\n/g,''))), sha: r.sha }; }
  catch { return { ids: [], sha: (r && r.sha) || null }; }
}
async function writeProcessed(env, ids, existingSha) {
  const trimmed = ids.slice(-PROCESSED_MAX);
  await ghWrite(env, PROCESSED_PATH, JSON.stringify(trimmed), 'cj-webhook: processed', existingSha || undefined);
  return trimmed;
}

// ── CJ product/query: full variant list for a product ─────────────────────
// Uses pid (preferred — PRODUCT pushes carry it) via product/variant/query,
// falling back to variantSku via product/query. Returns { pid, variants } or null.
async function cjVariantsByPid(env, pid, variantSku) {
  if (pid) {
    const body = await cjFetchMulti(env, '/product/variant/query?pid=' + encodeURIComponent(pid));
    if (body && body.code === 200 && Array.isArray(body.data)) {
      return { pid, variants: body.data };
    }
  }
  if (variantSku) {
    const body = await cjFetchMulti(env, '/product/query?variantSku=' + encodeURIComponent(variantSku));
    if (body && body.code === 200 && body.data && Array.isArray(body.data.variants)) {
      return { pid: body.data.pid, variants: body.data.variants };
    }
  }
  return null;
}

// ── Shopify reconcile: ensure Shopify product has all CJ variants ────────
// Fetches the Shopify product (variants, options), computes missing variants,
// then creates/updates them. Returns a summary.
async function reconcileVariantsToShopify(env, shopifyId, cjData) {
  const cjVariants = Array.isArray(cjData.variants) ? cjData.variants : [];
  if (!cjVariants.length) return { created: 0, updated: 0, reason: 'no CJ variants' };

  // 1. Fetch current Shopify product (variants + options).
  const shopResult = await shopifyFetch(env, `/products/${shopifyId}.json?fields=id,title,variants,options`);
  if (!shopResult.ok) return { created: 0, updated: 0, reason: 'shopify get ' + shopResult.status };
  const shopProduct = shopResult.body.product;
  const shopVariants = Array.isArray(shopProduct.variants) ? shopProduct.variants : [];
  const shopOptions = Array.isArray(shopProduct.options) ? shopProduct.options : [];

  // Determine option positions (1/2/3) from Shopify option names.
  // Shopify returns options in order; we map option name -> index 1..3 via position.
  // CJ gives variantKey "A-B" (option values joined by '-') and variantValue1/2/3.
  const optionCount = Math.max(1, shopOptions.length);
  // Build a set of existing variants keyed by sku (and by option combination).
  const existingBySku = new Map();
  const existingByOpt = new Map();
  for (const sv of shopVariants) {
    if (sv.sku) existingBySku.set(String(sv.sku), sv);
    const key = [sv.option1, sv.option2, sv.option3].filter(Boolean).map(String).join('||');
    existingByOpt.set(key, sv);
  }

  const toCreate = [];
  const toUpdate = [];
  for (const cv of cjVariants) {
    const sku = cv.variantSku != null ? String(cv.variantSku) : null;
    // Resolve option values from CJ variantValue1/2/3, else from variantKey split.
    let o1 = cv.variantValue1, o2 = cv.variantValue2, o3 = cv.variantValue3;
    if (o1 == null && o2 == null && o3 == null && cv.variantKey) {
      const parts = String(cv.variantKey).split('-');
      o1 = parts[0]; o2 = parts[1]; o3 = parts[2];
    }
    const normO1 = normalizeVariantOption(o1, String(shopifyId), shopProduct.title || '');
    const normO2 = normalizeVariantOption(o2, String(shopifyId), shopProduct.title || '');
    const normO3 = o3;

    let existing = null;
    if (sku && existingBySku.has(sku)) existing = existingBySku.get(sku);
    if (!existing) {
      const optKey = [normO1, normO2, normO3].filter(Boolean).map(String).join('||');
      existing = existingByOpt.get(optKey) || null;
    }

    const price = cv.variantSellPrice != null ? Number(cv.variantSellPrice) : null;
    const weightGrams = cv.variantWeight != null ? Number(cv.variantWeight) : null;
    const image = cv.variantImage || null;

    if (existing) {
      // Update only if something meaningful changed.
      const patch = {};
      if (price != null && Math.abs(Number(existing.price || 0) - price) > 0.001) patch.price = String(price);
      if (weightGrams != null && Number(existing.grams || 0) !== weightGrams) patch.grams = weightGrams;
      if (image && existing.metafields) { /* image handled below */ }
      if (Object.keys(patch).length) {
        patch.id = existing.id;
        toUpdate.push(patch);
      }
      // Also push metafields for CJ vid/variantKey/variantNameEn/weight if we have a durable approach.
    } else {
      const newVariant = {
        option1: normO1 || '',
        option2: normO2 || '',
        option3: normO3 || null,
      };
      if (price != null) newVariant.price = String(price);
      if (sku) newVariant.sku = sku;
      if (weightGrams != null) newVariant.grams = weightGrams;
      toCreate.push(newVariant);
    }
  }

  // 2. Apply creates (need options to exist). If Shopify product has no options
  //    but CJ has variants, we must first set options. Simplest: PUT product with
  //    options + variants array merged.
  let created = 0, updated = 0;
  if (toCreate.length || toUpdate.length) {
    // Build options definition from CJ variantKeys if Shopify lacks options.
    let optionsDef = shopOptions;
    if (optionCount === 0 && cjVariants.length) {
      // derive option names: default "Size"/"Color" style is unknown; use generic.
      optionsDef = [
        { name: 'Title', position: 1, values: [] },
      ];
    }
    // Merge: existing shopVariants + created. Update existing in place.
    const merged = shopVariants.map(sv => {
      const upd = toUpdate.find(u => u.id === sv.id);
      if (upd) { updated++; return { ...sv, ...upd }; }
      return sv;
    });
    for (const nc of toCreate) { merged.push(nc); created++; }

    const putBody = {
      product: {
        id: Number(shopifyId),
        variants: merged,
        options: optionsDef,
      },
    };
    const put = await shopifyFetch(env, `/products/${shopifyId}.json`, {
      method: 'PUT',
      body: JSON.stringify(putBody),
    });
    if (!put.ok) return { created: 0, updated: 0, reason: 'shopify put ' + put.status };
  }

  return { created, updated, cjVariantCount: cjVariants.length, shopifyVariantBefore: shopVariants.length };
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
  try {
    if (type === 'PRODUCT') result = await importProduct(env, payload);
    else if (type === 'VARIANT') result = await importVariant(env, payload);
    else if (type === 'STOCK') result = await importStock(env, payload);
    else if (type === 'ORDER') result = await importOrder(env, payload);
    else if (type === 'LOGISTIC') result = await importLogistic(env, payload);
    else result = { imported: false, type, messageType, note: 'unsupported (log-only)' };
  } catch (e) {
    result = { imported: false, error: String(e && e.message) };
  }

  if (messageId && result && result.imported) {
    proc.ids.push(messageId);
    await writeProcessed(env, proc.ids, proc.sha).catch(() => {});
  }

  return { ...result, type, messageType };
}

// ── Extract image URLs delivered in a CJ push (zero quota) ──────────────
// CJ pushes productImage / productImageSet as JSON-array strings (or arrays),
// plus a bigImage primary URL. Returns a deduped array of { src } for Shopify.
function extractPushImages(p) {
  const out = [];
  const seen = new Set();
  const push = (u) => { if (u && typeof u === 'string' && !seen.has(u)) { seen.add(u); out.push({ src: u }); } };
  // productImageSet first (richest), then productImage, then bigImage.
  for (const key of ['productImageSet', 'productImage']) {
    const v = p[key];
    const arr = Array.isArray(v) ? v : (typeof v === 'string' ? (() => { try { return JSON.parse(v); } catch { return []; } })() : []);
    for (const u of arr) push(u);
  }
  if (p.bigImage) push(p.bigImage);
  return out;
}

// ── PRODUCT: retrieve full variant list from CJ + reconcile/create in Shopify ──
async function importProduct(env, payload) {
  const p = payload.params || {};
  const pid = p.pid;
  const productSku = p.productSku;
  if (!productSku && !pid) return { imported: false, reason: 'no pid/productSku' };

  // Retrieve the FULL variant list from CJ via pid (CJ pushes only changed fields).
  const cjData = await cjVariantsByPid(env, pid, productSku || p.variantSku);
  if (!cjData) {
    return { imported: false, reason: 'CJ variant query failed', pid };
  }

  // Resolve store (Shopify) product id.
  const { shopifyId } = await resolveShopifyProduct(env, p);

  if (!shopifyId) {
    // Product not yet in Shopify → CREATE it from CJ data (full import w/ all variants).
    const created = await createProductInShopify(env, pid, cjData, p);
    return created;
  }

  // Reconcile: ensure Shopify has every CJ variant.
  const rec = await reconcileVariantsToShopify(env, shopifyId, cjData);

  // Update product-level fields (title/desc/price) so rebuild reflects them.
  const patches = {};
  if (p.productNameEn != null) patches.title = p.productNameEn;
  if (p.productDescription != null) patches.body_html = p.productDescription;
  if (p.productSellPrice != null) patches.price = Number(p.productSellPrice);
  if (Object.keys(patches).length) {
    await shopifyFetch(env, `/products/${shopifyId}.json`, {
      method: 'PUT',
      body: JSON.stringify({ product: { id: Number(shopifyId), ...patches } }),
    }).catch(() => {});
  }

  // Hydrate description + gallery images DIRECTLY from the push (zero quota):
  // CJ delivers productDescription + productImage/productImageSet/bigImage, so we
  // can enrich Shopify without re-pulling. Only add images if Shopify is missing them.
  const pushImgs = extractPushImages(p);
  const pushedDesc = p.productDescription != null ? String(p.productDescription) : '';
  if (pushImgs.length || pushedDesc) {
    try {
      const cur = await shopifyFetch(env, `/products/${shopifyId}.json?fields=id,images,body_html`);
      const curImgs = (cur.body && cur.body.product && cur.body.product.images) || [];
      const curDesc = (cur.body && cur.body.product && cur.body.product.body_html) || '';
      const needImgs = pushImgs.length > curImgs.length;
      const needDesc = pushedDesc && pushedDesc.length > String(curDesc).length;
      if (needImgs || needDesc) {
        const putBody = { product: { id: Number(shopifyId) } };
        if (needImgs) putBody.product.images = pushImgs;
        if (needDesc) putBody.product.body_html = pushedDesc;
        await shopifyFetch(env, `/products/${shopifyId}.json`, {
          method: 'PUT',
          body: JSON.stringify(putBody),
        }).catch(() => {});
      }
    } catch {}
  }

  return {
    imported: rec.created > 0 || rec.updated > 0,
    pid,
    shopifyId,
    ...rec,
  };
}

// ── Create a brand-new Shopify product from CJ data (all variants) ───────
async function createProductInShopify(env, pid, cjData, p) {
  const variants = cjData.variants || [];

  // Derive option names from variantKey (e.g. "Color-Size" → Color, Size).
  // We can't know CJ's real option names from the push alone, so use generic
  // based on how many segments variantKey has. CJ commonly uses Color / Size.
  const keyParts = variants.map(v => String(v.variantKey || '').split('-').length);
  const maxParts = Math.max(...keyParts, 1);
  const optionNames = maxParts === 1 ? ['Title'] : (maxParts === 2 ? ['Color', 'Size'] : ['Option 1', 'Option 2', 'Option 3'].slice(0, maxParts));

  const shopVariants = variants.map(v => {
    const parts = String(v.variantKey || '').split('-');
    const ov = {};
    optionNames.forEach((_, i) => { ov['option' + (i + 1)] = parts[i] != null ? String(parts[i]) : (i === 0 ? 'Default Title' : ''); });
    const price = v.variantSellPrice != null ? Number(v.variantSellPrice) : 0;
    return {
      ...ov,
      price: String(price),
      sku: v.variantSku != null ? String(v.variantSku) : undefined,
      grams: v.variantWeight != null ? Number(v.variantWeight) : undefined,
    };
  });

  const title = p.productNameEn || p.productName || (p.cjProductTitle) || 'Imported Product';
  const options = optionNames.map((name, i) => ({
    name,
    position: i + 1,
    values: [...new Set(shopVariants.map(sv => sv['option' + (i + 1)]))],
  }));

  const productBody = {
    product: {
      title,
      body_html: p.productDescription || '',
      product_type: p.productType != null ? String(p.productType) : undefined,
      variants: shopVariants,
      options: options.length ? options : undefined,
      images: extractPushImages(p),
      status: 'active',
    },
  };

  const r = await shopifyFetch(env, '/products.json', {
    method: 'POST',
    body: JSON.stringify(productBody),
  });
  if (!r.ok) return { imported: false, reason: 'shopify create ' + r.status, pid };
  const newId = r.body && r.body.product && r.body.product.id;
  return { imported: true, pid, created: true, shopifyId: newId, variantCount: shopVariants.length };
}

async function resolveShopifyProduct(env, p) {
  // Try to find the Shopify product id from the push.
  // 1) p.pid may be CJ pid (not Shopify id) — we need a sku to map to Shopify.
  // Get a sku from the push: productSku, or a variantSku we know.
  const sku = p.productSku || p.variantSku || null;
  if (!sku) return { shopifyId: null, cjSku: null };

  // Query the catalog via product-lookup style: search all-products.json by sku.
  // (Catalog is Shopify-shaped and has sku on variants.)
  try {
    const token = env.GITHUB_TOKEN || '';
    const headers = token ? { Authorization: 'Bearer ' + token, 'User-Agent': 'bargain-drop-cloudflare' } : { 'User-Agent': 'bargain-drop-cloudflare' };
    const r = await fetch('https://raw.githubusercontent.com/' + REPO + '/main/all-products.json', { headers });
    if (r.ok) {
      const products = await r.json();
      const prod = products.find(x => Array.isArray(x.variants) && x.variants.some(v => String(v.sku) === String(sku)));
      if (prod) return { shopifyId: prod.id, cjSku: sku };
    }
  } catch {}
  return { shopifyId: null, cjSku: sku };
}

// ── VARIANT: incremental field update → reconcile single variant to Shopify ──
async function importVariant(env, payload) {
  const p = payload.params || {};
  const sku = p.variantSku != null ? String(p.variantSku) : null;
  const vid = p.vid != null ? String(p.vid) : null;
  if (!sku && !vid) return { imported: false, reason: 'no variantSku/vid' };

  // Resolve shopify product via sku.
  const { shopifyId } = await resolveShopifyProduct(env, { variantSku: sku, productSku: sku });
  if (!shopifyId) return { imported: false, reason: 'product not found in Shopify', sku };

  // Fetch the Shopify product variants and update the matching one.
  const shopResult = await shopifyFetch(env, `/products/${shopifyId}.json?fields=id,variants`);
  if (!shopResult.ok) return { imported: false, reason: 'shopify get ' + shopResult.status };
  const shopVariants = shopResult.body.product.variants || [];

  let target = shopVariants.find(v => sku && String(v.sku) === sku);
  if (!target && vid) target = shopVariants.find(v => String(v.sku) === String(vid));

  if (!target) {
    // Variant not in Shopify yet → do a full reconcile via CJ variant list.
    const cjData = await cjVariantsByPid(env, p.pid, sku || vid);
    if (cjData) {
      const rec = await reconcileVariantsToShopify(env, shopifyId, cjData);
      return { imported: rec.created > 0 || rec.updated > 0, sku, ...rec };
    }
    return { imported: false, reason: 'variant not found', sku };
  }

  const patch = { id: target.id };
  if (p.variantSellPrice != null) patch.price = String(Number(p.variantSellPrice));
  if (p.variantWeight != null) patch.grams = Number(p.variantWeight);
  if (p.variantSku != null) patch.sku = p.variantSku;
  if (p.variantStatus != null) {
    // availability: 1 = on sale
    patch.inventory_management = 'shopify';
  }
  // option updates are risky to reconcile by name; skip if not needed.
  if (Object.keys(patch).length > 1) {
    const put = await shopifyFetch(env, `/products/${shopifyId}/variants/${target.id}.json`, {
      method: 'PUT',
      body: JSON.stringify({ variant: patch }),
    });
    if (!put.ok) return { imported: false, reason: 'variant put ' + put.status, sku };
  }

  return { imported: true, sku, shopifyId, variantId: target.id };
}

// ── STOCK: update variant availability/inventory in Shopify ──────────────
async function importStock(env, payload) {
  const p = payload.params || {};
  const entries = Object.entries(p);
  if (!entries.length) return { imported: false, reason: 'no stock entries' };

  let changed = 0;
  for (const [key, arr] of entries) {
    let storage = null;
    let sku = null;
    if (Array.isArray(arr)) {
      storage = arr.reduce((sum, r) => sum + (Number(r && r.storageNum) || 0), 0);
      const first = arr[0];
      if (first && first.variantSku) sku = first.variantSku; // may be empty on vid-keyed
    } else if (typeof arr === 'number') {
      storage = arr;
    }
    if (sku == null) sku = key; // key may be vid, but we try sku first anyway
    if (storage == null) { storage = 0; }

    const { shopifyId } = await resolveShopifyProduct(env, { variantSku: sku });
    if (!shopifyId) continue;

    const shopResult = await shopifyFetch(env, `/products/${shopifyId}.json?fields=id,variants`);
    if (!shopResult.ok) continue;
    const shopVariants = shopResult.body.product.variants || [];
    const target = shopVariants.find(v => String(v.sku) === sku);
    if (!target) continue;

    const inStock = storage > 0;
    // Set Shopify variant availability: track quantity via variant inventory_management
    // and flip status when out of stock. Also write a durable `visible` flag into the
    // catalog (all-products.json) so the storefront can hide OOS products.
    const patch = {
      id: target.id,
      inventory_management: 'shopify',
      inventory_quantity: storage,
    };
    await shopifyFetch(env, `/products/${shopifyId}/variants/${target.id}.json`, {
      method: 'PUT',
      body: JSON.stringify({ variant: patch }),
    }).catch(() => {});

    // Record the stock state so the product-level visible flag can be derived.
    await setProductVisibleFromStock(env, shopifyId).catch(() => {});
    changed++;
  }

  return { imported: changed > 0, changed };
}

// ── visible-flag helpers (catalog + Shopify status) ────────────────────
// The storefront serves all-products.json. We add/update a `visible` boolean on
// each product. A product is hidden when ALL its variants are out of stock, or when
// it was removed from CJ. `visible: false` also sets Shopify status to draft (hidden
// from the storefront), `true` → active.
async function setProductVisibleFromStock(env, shopifyId) {
  const r = await shopifyFetch(env, `/products/${shopifyId}.json?fields=id,variants,status`);
  if (!r.ok) return null;
  const prod = r.body.product;
  const variants = (prod.variants || []).filter(v => v.sku);
  // in-stock if ANY variant has inventory_quantity > 0; unknown inventory treated as in-stock.
  const inStock = variants.some(v => !v.inventory_management || (Number(v.inventory_quantity ?? 1) > 0));
  return setProductVisible(env, shopifyId, inStock);
}

export async function setProductVisible(env, shopifyId, visible) {
  if (!shopifyId) return null;
  // 1. Flip Shopify status (draft hides from storefront; active shows it).
  const wantStatus = visible ? 'active' : 'draft';
  const r = await shopifyFetch(env, `/products/${shopifyId}.json`, {
    method: 'PUT',
    body: JSON.stringify({ product: { id: Number(shopifyId), status: wantStatus } }),
  }).catch(() => null);
  // 2. Update the `visible` flag in all-products.json (catalog authority).
  try {
    await patchCatalogVisible(env, String(shopifyId), visible);
  } catch {}
  return { shopifyId, visible, status: r && r.ok ? wantStatus : 'unknown' };
}

async function patchCatalogVisible(env, shopifyId, visible) {
  const token = env.GITHUB_TOKEN || '';
  const headers = token ? { Authorization: 'Bearer ' + token, 'User-Agent': 'bargain-drop-cloudflare' } : { 'User-Agent': 'bargain-drop-cloudflare' };
  const raw = await fetch('https://raw.githubusercontent.com/jamestuwairua77-cpu/bargain-drop-v2/main/all-products.json', { headers });
  if (!raw.ok) return;
  const products = await raw.json();
  if (!Array.isArray(products)) return;
  let changed = false;
  for (const p of products) {
    if (String(p.id) === String(shopifyId) && p.visible !== visible) {
      p.visible = visible;
      changed = true;
      break;
    }
  }
  if (!changed) return;
  // Persist via GitHub contents API using the statically-imported ghWrite helper.
  await ghWrite(env, 'all-products.json', JSON.stringify(products, null, 2),
    'cj-sync: set visible=' + visible + ' for ' + shopifyId);
}

// ── ORDER / LOGISTIC (defer to existing flows) ───────────────────────────
async function importOrder(env, payload) {
  const p = payload.params || {};
  return { imported: false, note: 'order recorded (fulfillment flow owns orders)', cjOrderId: p.cjOrderId };
}
async function importLogistic(env, payload) {
  const p = payload.params || {};
  return { imported: false, note: 'logistic (tracking) received', orderId: p.orderId, trackingNumber: p.trackingNumber };
}
