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
  const optionNames = maxParts === 1 ? ['Title'] : (maxParts === 2 ? ['Color', 'Size'] : ['Option 1', 'Option 2', 'Option 3'].slice(0, maxParts));

  const shopVariants = variants.map(v => {
    const parts = String(v.variantKey || '').split('-');
    const ov = {};
    optionNames.forEach((_, i) => { ov['option' + (i + 1)] = parts[i] != null ? String(parts[i]) : (i === 0 ? 'Default Title' : ''); });
    const _vCost = v.variantSellPrice != null ? parseFloat(v.variantSellPrice) : NaN;
    const price = Number.isFinite(_vCost) && _vCost > 0 ? (computePrice(_vCost) ?? 0) : 0;
    return {
      ...ov,
      price: String(price),
      sku: v.variantSku != null ? String(v.variantSku) : undefined,
      grams: v.variantWeight != null ? Math.round(Number(v.variantWeight) * 1000) : 0,
      inventory_management: 'shopify',
      inventory_policy: 'deny',
      fulfillment_service: 'manual',
      requires_shipping: true,
      taxable: true,
    };
  });

  const title = (cjData.productNameEn || cjData.productName || p.productNameEn || p.productName || 'Imported CJ Product').slice(0, 255);
  const rawImages = extractImagesFromCj(cjData, p);
  const mappedType = mapCategory(cjData.categoryName || p.categoryName || p.productType, title);

  const body = {
    product: {
      title,
      body_html: cjData.description || p.productDescription || '',
      vendor: 'Bargain Drop',
      product_type: mappedType && mappedType !== 'other' ? mappedType : (cjData.categoryName || 'General'),
      tags: `cj-import, cj-pid-${pid}`,
      status: 'active',
      options: optionNames.map(name => ({ name })),
      variants: shopVariants.length ? shopVariants : undefined,
      images: rawImages.length ? rawImages : undefined,
    },
  };

  const r = await shopifyFetch(env, '/products.json', { method: 'POST', body: JSON.stringify(body) });
  if (!r.ok) {
    return { imported: false, reason: 'shopify create ' + r.status, pid };
  }
  const newId = r.body && r.body.product && r.body.product.id;
  return { imported: true, pid, created: true, shopifyId: newId, variantsCount: shopVariants.length, categoryApplied: body.product.product_type };
}

function extractImagesFromCj(cjData, p) {
  const urls = [];
  const add = (u) => {
    if (!u || typeof u !== 'string') return;
    const clean = u.trim();
    if (!clean || urls.includes(clean)) return;
    if (!/^https?:\/\//i.test(clean)) return;
    urls.push(clean);
  };
  add(cjData.bigImage);
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

// ── Upsert single variant into Shopify (variant/create, variant/update) ──
export async function syncVariantWithShopify(env, p) {
  const pid = p.pid || p.productId || null;
  const sku = p.variantSku || p.sku || null;
  const vid = p.vid || null;

  const shopifyProduct = await findShopifyProduct(env, pid, sku);
  if (!shopifyProduct) {
    // Product not yet in Shopify — trigger full product sync if we have pid
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
      const post = await shopifyFetch(env, `/products/${shopifyId}/variants.json`, {\n        method: 'POST',\n        body: JSON.stringify({ variant: nv }),\n      }).catch(() => ({ ok: false, status: 0 }));\n      return { imported: post.ok, reason: post.ok ? 'variant created from push' : 'variant create ' + post.status, sku };\n    }\n    return { imported: false, reason: 'variant not found (no push price)', sku };\n  }\n\n  const patch = { id: target.id };\n  const _vCost2 = p.variantSellPrice != null ? parseFloat(p.variantSellPrice) : NaN;\n  if (Number.isFinite(_vCost2) && _vCost2 > 0) { const rp = computePrice(_vCost2); if (rp != null) { patch.price = String(rp); patch.compare_at_price = null; } }\n  if (p.variantWeight != null) patch.grams = Number(p.variantWeight);\n  if (p.variantSku != null) patch.sku = p.variantSku;\n  if (p.variantStatus != null) {\n    // availability: 1 = on sale\n    patch.inventory_management = 'shopify';\n    patch.inventory_policy = p.variantStatus === 1 || p.variantStatus === '1' ? 'continue' : 'deny';\n  }\n\n  const r = await shopifyFetch(env, `/products/${shopifyId}/variants/${target.id}.json`, {\n    method: 'PUT',\n    body: JSON.stringify({ variant: patch }),\n  });\n\n  return { imported: r.ok, sku, shopifyId, variantId: target.id, updated: r.ok };\n}\n\n// ── Main dispatcher (called from cj-webhook.js) ──────────────────────────\nexport async function handleCjWebhook(env, payload, headers = {}) {\n  const messageId = payload?.MessageId || payload?.messageId || headers['x-cj-message-id'] || null;\n  if (messageId && await isDuplicateMessage(env, messageId)) {\n    return { ok: true, skipped: true, reason: 'duplicate messageId', messageId };\n  }\n\n  // Unwrap SNS-style { Type, Message } envelope if present\n  let body = payload;\n  if (typeof payload?.Message === 'string') {\n    try { body = JSON.parse(payload.Message); } catch {}\n  }\n\n  const topic = body?.topic || body?.type || payload?.topic || payload?.type || 'unknown';\n  const data = body?.data || body?.params || body;\n  const pid = data?.pid || data?.productId || data?.id || null;\n\n  let result = { ok: false, topic, pid };\n\n  switch (topic) {\n    case 'product/create':\n    case 'product/update':\n    case 'product.create':\n    case 'product.update':\n      if (pid) {\n        result = await syncProductWithShopify(env, pid, data);\n      } else {\n        result = { ok: false, reason: 'no pid in payload', topic };\n      }\n      break;\n\n    case 'variant/create':\n    case 'variant/update':\n    case 'variant.create':\n    case 'variant.update':\n      result = await syncVariantWithShopify(env, data);\n      break;\n\n    case 'order/status':\n    case 'order.status':\n    case 'order/tracking':\n      // CJ order tracking pushed -> update Shopify fulfillment\n      result = await handleOrderStatusPush(env, data);\n      break;\n\n    default:\n      // Best effort: if data has a pid, try syncing as product\n      if (pid) {\n        result = await syncProductWithShopify(env, pid, data);\n      } else {\n        result = { ok: true, ignored: true, reason: 'unhandled topic ' + topic };\n      }\n  }\n\n  if (messageId && result.imported) {\n    await markMessageProcessed(env, messageId);\n  }\n\n  try {\n    await appendSyncLog(env, { type: 'cj-webhook', topic, pid, ...result, at: new Date().toISOString() });\n  } catch {}\n\n  return { ok: result.imported !== false, ...result };\n}\n\nasync function handleOrderStatusPush(env, data) {\n  const cjOrderId = data?.orderId || data?.cjOrderId;\n  const trackingNumber = data?.trackingNumber || data?.trackNumber;\n  const logisticsName = data?.logisticName || data?.logisticsCompany || 'Standard Shipping';\n  if (!cjOrderId || !trackingNumber) return { imported: false, reason: 'missing orderId or tracking' };\n\n  // Look up Shopify order by CJ order ID in note_attributes\n  const orders = await listOrders(env, { limit: 50 });\n  const match = (orders || []).find(o => {\n    const note = JSON.stringify(o.note_attributes || []);\n    return note.includes(String(cjOrderId));\n  });\n  if (!match) return { imported: false, reason: 'shopify order not found for CJ order ' + cjOrderId };\n\n  const update = await updateOrderStatus(env, match.id, {\n    status: 'fulfilled',\n    tracking_number: trackingNumber,\n    tracking_company: logisticsName,\n  });\n  return { imported: update.ok, shopifyOrderId: match.id, cjOrderId, trackingNumber };\n}\n