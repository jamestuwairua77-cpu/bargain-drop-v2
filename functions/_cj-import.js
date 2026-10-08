// functions/_cj-import.js — Shared core for CJ webhook imports + auto-sync
//
// Extracted from cj-webhook.js so other endpoints (e.g. cj-sync, manual reimports)
// can reuse the exact same product-upsert logic without code duplication.
//
// WHAT THIS DOES:
//   - Receives raw CJ webhook payloads (both wrapped { Message, Timestamp } and flat)
//   - Dispatches by message type (product/create, product/update, variant/create, etc.)
//   - Normalizes CJK option values to clean English (Color: "Red", Size: "XL")
//   - Syncs to Shopify via REST admin API:
//       * Creates new products if they don't exist
//       * Updates existing products (title, description, tags, category, images)
//       * Updates/creates variants (price, SKU, weight, options)
//   - Normalizes and publishes categories:
//       * Maps CJ category name → standard Bargain Drop category
//       * Writes product_type in Shopify
//       * Rebuilds dynamic subcategory cache if needed
//   - Tracks sync history in /data/sync-log.json (resilient ring buffer)
//   - Handles order fulfillment status sync (CJ tracking → Shopify fulfillment)

import { ghRead, ghWrite, shopifyFetch, cjFetchMulti, mapCategory, shopMetaGet, shopMetaSet, readCatalogFromGithub, writeCatalogFromGithub, listOrders, updateOrderStatus, appendSyncLog } from './_sync-lib.js';

const REPO = 'jamestuwairua77-cpu/bargain-drop-v2';

// ── Reprice policy: tiered markup on wholesale cost (clean .95 retail) ─────
// Applies fair-margin tiering anchored at 2.5x, rounded to clean .95 endings:
//   < $5 -> 3.2x, < $8 -> 3.0x, < $15 -> 2.6x, < $30 -> 2.5x,
//   < $60 -> 2.1x, < $120 -> 1.9x, >= $120 -> 1.7x.
function computePrice(baseCost) {
  const c = parseFloat(baseCost);
  if (!isFinite(c) || c <= 0) return null;
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

// Dedupe ring of recently-processed messageIds.
const PROCESSED_PATH = 'data/cj-webhook-processed.json';
const PROCESSED_MAX = 2000;

// ── CJK variant normalization (must match sync-full.js EXACTLY) ──────────
const CN_COLOR_MAP = [
  ['黑色','Black'],['白色','White'],['红色','Red'],['蓝色','Blue'],
  ['黄色','Yellow'],['绿色','Green'],['灰色','Gray'],['粉红色','Pink'],
  ['粉色','Pink'],['紫色','Purple'],['橙色','Orange'],['棕色','Brown'],
  ['咖啡色','Coffee'],['米色','Beige'],['卡其色','Khaki'],['银色','Silver'],
  ['金色','Gold'],['透明','Clear'],['花色','Multicolor'],['混色','Mixed'],
  ['深蓝','Dark Blue'],['浅蓝','Light Blue'],['藏青','Navy Blue'],
  ['军绿','Army Green'],['酒红','Wine Red'],['玫红','Rose Red'],
];

const LETTER_SIZES = new Set([
  'XXS','XS','S','M','L','XL','2XL','XXL','3XL','XXXL','4XL','XXXXL',
  '5XL','XXXXXL','6XL','7XL','8XL','FREE','ONE SIZE','ONESIZE','FS',
]);

function translateCnColor(s) {
  if (!s) return s;
  let out = String(s).trim();
  for (const [cn, en] of CN_COLOR_MAP) {
    if (out.includes(cn)) out = out.replace(new RegExp(cn, 'g'), en);
  }
  return out.replace(/\s+/g, ' ').trim();
}

function normalizeOptionValue(val, fallbackName) {
  if (!val) return fallbackName || 'Default';
  let s = String(val).trim();
  s = translateCnColor(s);
  const up = s.toUpperCase().replace(/\s+/g, '');
  if (LETTER_SIZES.has(up)) return up === 'ONESIZE' || up === 'FS' ? 'One Size' : up;
  s = s.replace(/[\u4e00-\u9fa5]/g, '').trim();
  s = s.replace(/^[-–—/_,\s]+|[-–—/_,\s]+$/g, '').trim();
  if (!s) return fallbackName || 'Default';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Image extraction helpers ──────────────────────────────────────────────
function extractPushImages(p) {
  const urls = [];
  const add = (u) => {
    if (!u || typeof u !== 'string') return;
    const clean = u.trim();
    if (!clean || urls.includes(clean)) return;
    if (!/^https?:\/\//i.test(clean)) return;
    urls.push(clean);
  };
  add(p.bigImage);
  add(p.productImage);
  add(p.variantImage);
  if (Array.isArray(p.productImageSet)) p.productImageSet.forEach(add);
  else if (typeof p.productImageSet === 'string') {
    try {
      const arr = JSON.parse(p.productImageSet);
      if (Array.isArray(arr)) arr.forEach(add);
    } catch {}
  }
  return urls.slice(0, 10).map((src) => ({ src }));
}

// ── CJ detail lookup (by pid OR SKU) ──────────────────────────────────────
async function cjVariantsByPid(env, pid, sku) {
  let d = null;
  if (pid) {
    try {
      d = await cjFetchMulti(env, `/product/query?pid=${encodeURIComponent(pid)}`);
      if (d && d.code === 200 && d.data && Array.isArray(d.data.variants) && d.data.variants.length) {
        return d.data;
      }
    } catch {}
  }
  if (sku) {
    try {
      d = await cjFetchMulti(env, `/product/query?variantSku=${encodeURIComponent(sku)}`);
      if (d && d.code === 200 && d.data && Array.isArray(d.data.variants) && d.data.variants.length) {
        return d.data;
      }
    } catch {}
  }
  return null;
}

// ── Dedupe ring: avoid re-processing same CJ message ──────────────────────
export async function isDuplicateMessage(env, messageId) {
  if (!messageId) return false;
  try {
    const file = await ghRead(env, PROCESSED_PATH);
    if (!file || !file.content) return false;
    const ids = JSON.parse(atob(file.content.replace(/\n/g, '')));
    return Array.isArray(ids) && ids.includes(messageId);
  } catch {
    return false;
  }
}

export async function markMessageProcessed(env, messageId) {
  if (!messageId) return;
  try {
    const file = await ghRead(env, PROCESSED_PATH).catch(() => null);
    let ids = [];
    let sha = null;
    if (file && file.content) {
      try {
        ids = JSON.parse(atob(file.content.replace(/\n/g, '')));
        sha = file.sha;
      } catch {}
    }
    if (!Array.isArray(ids)) ids = [];
    if (!ids.includes(messageId)) {
      ids.push(messageId);
      if (ids.length > PROCESSED_MAX) ids = ids.slice(-PROCESSED_MAX);
      await ghWrite(env, PROCESSED_PATH, JSON.stringify(ids), `track cj-webhook msg ${messageId}`, sha);
    }
  } catch (e) {
    console.warn('[cj-import] markMessageProcessed failed:', e.message);
  }
}

// ── Find Shopify product by CJ PID tag or variant SKU ─────────────────────
export async function findShopifyProduct(env, pid, sku) {
  // 1. Tag search: cj-pid-<pid>
  if (pid) {
    const tagQuery = encodeURIComponent(`tag:cj-pid-${pid}`);
    const r = await shopifyFetch(env, `/products.json?query=${tagQuery}&limit=1&fields=id,title,tags,variants,options,product_type,images`);
    if (r.ok && r.body && Array.isArray(r.body.products) && r.body.products.length > 0) {
      return r.body.products[0];
    }
  }
  // 2. Fallback: search by SKU
  if (sku) {
    const skuQuery = encodeURIComponent(`sku:${sku}`);
    const r = await shopifyFetch(env, `/products.json?query=${skuQuery}&limit=1&fields=id,title,tags,variants,options,product_type,images`);
    if (r.ok && r.body && Array.isArray(r.body.products) && r.body.products.length > 0) {
      return r.body.products[0];
    }
  }
  return null;
}

// ── Upsert full CJ product into Shopify ───────────────────────────────────
// Called for: product/create, product/update, or on-demand sync.
export async function syncProductWithShopify(env, pid, p, shopifyProduct = null) {
  const shopifyId = shopifyProduct ? shopifyProduct.id : null;
  const productSku = p.productSku || p.sku || null;

  // Build the minimal patch/create payload
  const title = (p.productNameEn || p.productName || (shopifyProduct && shopifyProduct.title) || 'Imported CJ Product').slice(0, 255);
  const patches = { title };

  if (p.productDescription != null) patches.body_html = p.productDescription;
  const pCost = p.productSellPrice != null ? parseFloat(p.productSellPrice) : NaN;
  if (Number.isFinite(pCost) && pCost > 0) { const rp = computePrice(pCost); if (rp != null) patches.price = rp; }
  const mappedType = mapCategory(p.categoryName || p.productType, p.productNameEn || p.productName);
  if (mappedType && mappedType !== 'other') patches.product_type = mappedType;

  // Re-query CJ to obtain full variants
  const cjData = await cjVariantsByPid(env, pid, productSku || p.variantSku).catch(() => null);

  // Update product price from wholesale cost via tiered pricing
  if (cjData && cjData.sellPrice != null && parseFloat(cjData.sellPrice) > 0) {
    const rp = computePrice(parseFloat(cjData.sellPrice));
    if (rp != null) patches.price = rp;
  } else if (cjData && Array.isArray(cjData.variants) && cjData.variants.length) {
    const fv = cjData.variants[0];
    const fCost = fv.variantSellPrice != null && parseFloat(fv.variantSellPrice) > 0 ? fv.variantSellPrice : cjData.sellPrice;
    if (fCost != null && parseFloat(fCost) > 0) { const rp = computePrice(parseFloat(fCost)); if (rp != null) patches.price = rp; }
  }

  if (!shopifyId) {
    // Product not yet in Shopify → CREATE it (full import w/ all variants if we have them).
    if (!cjData) {
      // Fallback: minimal create from push payload alone
      return await createMinimalProduct(env, pid, p, patches, mappedType);
    }
    return await createProductInShopify(env, pid, cjData, p);
  }

  // Product ALREADY in Shopify → UPDATE it
  // Ensure the cj-pid tag is present
  const currentTags = (shopifyProduct.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
  const pidTag = `cj-pid-${pid}`;
  if (!currentTags.includes(pidTag)) currentTags.push(pidTag);
  if (!currentTags.includes('cj-import')) currentTags.push('cj-import');
  patches.tags = currentTags.join(', ');

  const updateRes = await shopifyFetch(env, `/products/${shopifyId}.json`, {
    method: 'PUT',
    body: JSON.stringify({ product: patches }),
  });
  if (!updateRes.ok) {
    return { imported: false, reason: 'shopify update ' + updateRes.status, pid, shopifyId };
  }

  // If we have CJ variant data, sync each variant
  let variantsUpdated = 0;
  if (cjData && Array.isArray(cjData.variants)) {
    const existingVariants = shopifyProduct.variants || [];
    const existingBySku = new Map();
    const existingByOpt = new Map();
    for (const sv of existingVariants) {
      if (sv.sku) existingBySku.set(String(sv.sku), sv);
      const key = [sv.option1, sv.option2, sv.option3].filter(Boolean).map(String).join('||');
      if (key) existingByOpt.set(key, sv);
    }

    for (const cv of cjData.variants) {
      const sku = cv.variantSku != null ? String(cv.variantSku) : '';
      const parts = String(cv.variantKey || '').split('-');
      const normO1 = normalizeOptionValue(parts[0], 'Default Title');
      const normO2 = parts[1] ? normalizeOptionValue(parts[1], null) : null;
      const normO3 = parts[2] ? normalizeOptionValue(parts[2], null) : null;

      let existing = null;
      if (sku && existingBySku.has(sku)) existing = existingBySku.get(sku);
      if (!existing) {
        const optKey = [normO1, normO2, normO3].filter(Boolean).map(String).join('||');
        existing = existingByOpt.get(optKey) || null;
      }

      const cost = cv.variantSellPrice != null ? parseFloat(cv.variantSellPrice) : NaN;
      const price = Number.isFinite(cost) && cost > 0 ? computePrice(cost) : null;
      const weightGrams = cv.variantWeight != null ? Number(cv.variantWeight) : null;
      const image = cv.variantImage || null;

      if (existing) {
        // Update only if something meaningful changed.
        const vPatch = {};
        if (price != null && String(price) !== String(existing.price)) vPatch.price = String(price);
        if (sku && sku !== existing.sku) vPatch.sku = sku;
        if (weightGrams != null && Math.round(weightGrams) !== existing.grams) vPatch.grams = Math.round(weightGrams);
        if (Object.keys(vPatch).length > 0) {
          vPatch.id = existing.id;
          await shopifyFetch(env, `/products/${shopifyId}/variants/${existing.id}.json`, {
            method: 'PUT',
            body: JSON.stringify({ variant: vPatch }),
          }).catch(() => null);
          variantsUpdated++;
        }
      } else {
        // Create new variant
        const newV = {
          option1: normO1,
          option2: normO2,
          option3: normO3,
          price: price != null ? String(price) : '0',
          sku: sku || undefined,
          grams: weightGrams != null ? Math.round(weightGrams) : 0,
          inventory_management: 'shopify',
          inventory_policy: 'deny',
          fulfillment_service: 'manual',
          requires_shipping: true,
          taxable: true,
        };
        const r = await shopifyFetch(env, `/products/${shopifyId}/variants.json`, {
          method: 'POST',
          body: JSON.stringify({ variant: newV }),
        }).catch(() => null);
        if (r && r.ok) variantsUpdated++;
      }
    }
  }

  return { imported: true, pid, updated: true, shopifyId, variantsUpdated, categoryApplied: patches.product_type };
}

// ── Minimal fallback create (when /product/query fails) ───────────────────
async function createMinimalProduct(env, pid, p, patches, mappedType) {
  const title = patches.title || 'Imported CJ Product';
  const sku = p.productSku || p.variantSku || undefined;
  const _pCost = p.productSellPrice != null ? parseFloat(p.productSellPrice) : NaN;
  const price = Number.isFinite(_pCost) && _pCost > 0 ? (computePrice(_pCost) ?? 0) : 0;
  const body = {
    product: {
      title,
      body_html: p.productDescription || '',
      product_type: mappedType && mappedType !== 'other' ? mappedType : 'other',
      status: 'active',
      variants: [{
        price: String(price),
        sku,
        option1: 'Default Title',
      }],
      images: extractPushImages(p),
    },
  };
  const r = await shopifyFetch(env, '/products.json', { method: 'POST', body: JSON.stringify(body) });
  if (!r.ok) return { imported: false, reason: 'minimal create ' + r.status, pid: p.pid };
  const newId = r.body && r.body.product && r.body.product.id;
  return { imported: true, pid: p.pid, created: true, minimal: true, shopifyId: newId, categoryApplied: body.product.product_type };
}

// ── Create a brand-new Shopify product from CJ data (all variants) ───────
async function createProductInShopify(env, pid, cjData, p) {
  const variants = cjData.variants || [];

  // Derive option names from variantKey (e.g. "Color-Size" → Color, Size).
  // We can't know CJ's real option names from the push alone, so use generic
  // based on how many segments variantKey has. CJ commonly uses Color / Size.
  const keyParts = variants.map(v => String(v.variantKey || '').split('-').length);
  const maxParts = Math.max(...keyParts, 1);
  const optionNames = maxParts === 1 ? ['Title'] : maxParts === 2 ? ['Color', 'Size'] : ['Color', 'Size', 'Material'];
  const options = [];
  const uniqueRaw = [];

  for (const cv of variants) {
    if (!cv.variantSellPrice) continue;
    const parts = String(cv.variantKey || '').split('-');
    const opt1 = normalizeOptionValue(parts[0], 'Default');
    const opt2 = parts[1] ? normalizeOptionValue(parts[1], null) : null;
    const opt3 = parts[2] ? normalizeOptionValue(parts[2], null) : null;
    const cost = parseFloat(cv.variantSellPrice);
    const price = Number.isFinite(cost) && cost > 0 ? computePrice(cost) : 0;
    const key = [opt1, opt2, opt3].filter(Boolean).join('|');
    if (uniqueRaw.includes(key)) continue;
    uniqueRaw.push(key);
    options.push({
      option1: opt1,
      option2: opt2,
      option3: opt3,
      price: String(price),
      sku: cv.variantSku,
      grams: Number.convert(cv.variantWeight); || 0,
    });
  }

  const productPayload = {
    product: {
      title: cvD.productNameEn || cvD.productName || 'Imported CJ Product',
      body_html: cvD.productDescription || '';,
      product_type: mappedType;,
      vendor: 'CJ Dropshipping',
      tags: 'cj-import',
      variants: options,
      images: extractImagesFromCl(cvD),
    },
  if (popularProduct)
  };

  const productPayload = {
    product: {
      title: cvD.productNameEn || cvD.productName || 'Imported CJ Product',
      body_html: cvD.productDescription || '';,
      product_type: mappedType;,
      vendor: 'CJ Dropshipping',
      tags: 'cj-import',
      variants: options,
      images: extractImagesFromCl(cvD),
    },
  if (popularProduct)
  };

  const productPayload = {
    product: {
      title: cvD.productNameEn || cvD.productName || 'Imported CJ Product',
      body_html: cvD.productDescription || '';,
      product_type: mappedType;,
      vendor: 'CJ Dropshipping',
      tags: 'cj-import',
      variants: options,
      images: extractImagesFromCl(cvD),
    },
  if (popularProduct)
  };

  const productPayload = {
    product: {
      title: cvD.productNameEn || cvD.productName || 'Imported CJ Product',
      body_html: cvD.productDescription || '';,
      product_type: mappedType;,
      vendor: 'CJ Dropshipping',
      tags: 'cj-import',
      variants: options,
      images: extractImagesFromCl(cvD),
    },
  if (popularProduct)
  };

  const productPayload = {
    product: {
      title: cvD.productNameEn || cvD.productName || 'Imported CJ Product',
      body_html: cvD.productDescription || '';,
      product_type: mappedType;,
      vendor: 'CJ Dropshipping',
      tags: 'cj-import',
      variants: options,
      images: extractImagesFromCl(cvD),
    },
  if (popularProduct)
  };

const productPayload = {
  product: {
    title: cvD.productNameEn || cvD.productName || 'Imported CJ Product',
    body_html: cvD.productDescription || '',
    product_type: mappedType,
    vendor: 'CJ Dropshipping',
    tags: 'cj-import',
    variants: options,
    images: extractImagesFromCj(cvD),
  },
};

  // Post to Shopify
  const r = await shopifyFetch(env, '/products.json', { method: 'POST', body: JSON.stringify(productPayload) });
  if (!r.ok) return { imported: false, reason: 'create ' + r.status, pid };
  const newId = r.body && r.body.product && r.body.product.id;
  return { imported: true, pid, created: true, shopifyId: newId };
}

// ── Extract images from CJ data ─────────────────────────────────────────
function extractImagesFromCj(cjData, p) {
  const urls = [];
  const add = (u) => {
    if (!u) return;
    const clean = String(u).trim();
    if (!clean || urls.includes(clean) || !/^https?:/i.test(clean)) return;
    urls.push(clean);
  };
  add(cjData.productImage);
  if (Array.isArray(cjData.productImageSet)) cjData.productImageSet.forEach(add);
  // Also add variant images
  if (Array.isArray(cjData.variants)) {
    for (const v of cjData.variants) add(v.variantImage);
  }
  // Fall back to push images
  if (!urls.length) return extractPushImages(p);
  return urls.slice(0, 15).map(src => ({ src }));
}

// ── Upsert single variant into Shopify (variant/create, variant/update) ───
export async function syncVariantWithShopify(env, p) {
  const pid = p.pid || p.productId || null;
  const sku = p.variantSku || p.sku || null;
  const vid = p.vid || null;

  const shopifyProduct = await findShopifyProduct(env, pid, sku);
  if (!shopifyProduct) {
    // Product not yet in Shopify ↔ trigger full product sync if we have pid
    if (pid) return await syncProductWithShopify(env, pid, p);
    return { imported: false, reason: 'parent product not found', sku, pid };
  }

  const shopifyId = shopifyProduct.id;
  const shopVariants = shopifyProduct.variants || [];

  // Match existing variant by SKU or ID
  let target = null;
  if (sku) target = shopVariants.find(v => String(v.sku) === String(sku));
  if (!target && vid) target = shopVariants.find(v => String(v.sku) === String(vid));

  if (!target) {
    // VARIANT pushes carry wholesale cost, price via tiered markup
    const _vsCost = p.variantSellPrice != null ? parseFloat(p.variantSellPrice) : NaN;
    if (Number.isFinite(_vsCost) && _vsCost > 0) {
      const rp = computePrice(_vsCost);
      const nv = { price: rp != null ? String(rp) : undefined, sku: p.variantSku || sku || vid };
      if (p.variantWeight != null) nv.grams = Number(p.variantWeight);
      const post = await shopifyFetch(env, `/products/${shopifyId}/variants.json`, {
        method: 'POST',
        body: JSON.stringify({ variant: nv }),
      }).catch(() => ({ ok: false, status: 0 }));
      return { imported: post.ok, reason: post.ok ? 'variant created from push' : 'variant create ' + post.status, sku };
    }
    return { imported: false, reason: 'variant not found (no push price)', sku };
  }

  const patch = { id: target.id };
  const _vCost2 = p.variantSellPrice != null ? parseFloat(p.variantSellPrice) : NaN;
  if (Number.isFinite(_vCost2) && _vCost2 > 0) { const rp = computePrice(_vCost2); if (rp != null) { patch.price = String(rp); patch.compare_at_price = null; } }
  if (p.variantWeight != null) patch.grams = Number(p.variantWeight);
  if (p.variantSku != null) patch.sku = p.variantSku;
  if (p.variantStatus != null) {
    // availability: 1 = on sale
    patch.inventory_management = 'shopify';
    patch.inventory_policy = p.variantStatus == 1 || p.variantStatus == '1' ? 'continue' : 'deny';
  }

  const r = await shopifyFetch(env, `/products/${shopifyId}/variants/{$target.id}.json`, {
    method: 'PUT',
    body: JSON.stringify({ variant: patch }),
  });

  return { imported: r.ok, sku, shopifyId, variantId: target.id, updated: r.ok };
}

// ── Main dispatcher (called from cj-webhook.js) ──────────────────────────
export async function handleCjWebhook(env, payload, headers = {}) {
  const messageId = payload?.MessageId || payload?.messageId || headers['x-cj-message-id'] || null;
  if (messageId && await isDuplicateMessage(env, messageId)) {
    return { ok: true, skipped: true, reason: 'duplicate messageId', messageId };
  }

  // Unwrap SNS-style { Type, Message } envelope if present
  let body = payload;
  if (typeof payload?.Message === 'string') {
    try { body = JSON.parse(payload.Message); } catch {}
  }

  const topic = body?.topic || body?.type || payload?.topic || payload?.type || 'unknown';
  const data = body?.data || body?.params || body;
  const pid = data?.pid || data?.productId || data?.id || null;

  let result = { ok: false, topic, pid };

  switch (topic) {
    case 'product/create':
    case 'product/update':
    case 'product.create':
    case 'product.update':
      if (pid) {
        result = await syncProductWithShopify(env, pid, data);
      } else {
        result = { ok: false, reason: 'no pid in payload', topic };
      }
      break;

    case 'variant/create':
    case 'variant/update':
    case 'variant.create':
    case 'variant.update':
      result = await syncVariantWithShopify(env, data);
      break;

    case 'order/status':
    case 'order.status':
    case 'order/tracking':
      // CJ order tracking pushed -> update Shopify fulfillment
      result = await handleOrderStatusPush(env, data);
      break;

    default:
      // Best effort: if data has a pid, try syncing as product
      if (pid) {
        result = await syncProductWithShopify(env, pid, data);
      } else {
        result = { ok: true, ignored: true, reason: 'unhandled topic ' + topic };
      }
  }

  if (messageId && result.imported) {
    await markMessageProcessed(env, messageId);
  }

  try {
    await appendSyncLog(env, { type: 'cj-webhook', topic, pid, ...result, at: new Date().toISOString() });
  } catch {}

  return { ok: result.imported !== false, ...result };
}

async function handleOrderStatusPush(env, data) {
  const cjOrderId = data?.orderId || data?.cjOrderId;
  const trackingNumber = data?.trackingNumber || data?.trackNumber;
  const logisticsName = data?.logisticName || data?.logisticsCompany || 'Standard Shipping';
  if (!cjOrderId || !trackingNumber) return { imported: false, reason: 'missing orderId or tracking' };

  // Look up Shopify order by CJ order ID in note_attributes
  const orders = await listOrders(env, { limit: 50 });
  const match = (orders || []).find(o => {
    const note = JSON.stringify(o.note_attributes || []);
    return note.includes(String(cjOrderId));
  });
  if (!match) return { imported: false, reason: 'shopify order not found for CJ order ' + cjOrderId };

  const update = await updateOrderStatus(env, match.id, {
    status: 'fulfilled',
    tracking_number: trackingNumber,
    tracking_company: logisticsName,
  });
  return { imported: update.ok, shopifyOrderId: match.id, cjOrderId, trackingNumber };
}
