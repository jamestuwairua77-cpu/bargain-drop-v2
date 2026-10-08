// functions/_cj-import.js â€” Shared core for CJ webhook imports + auto-sync
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
//       * Maps CJ category name â†’ standard Bargain Drop category
//       * Writes product_type in Shopify
//       * Rebuilds dynamic subcategory cache if needed
//   - Tracks sync history in /data/sync-log.json (resilient ring buffer)
//   - Handles order fulfillment status sync (CJ tracking â†’ Shopify fulfillment)

import { ghRead, ghWrite, shopifyFetch, cjFetchMulti, mapCategory, shopMetaGet, shopMetaSet, readCatalogFromGithub, writeCatalogFromGithub, listOrders, updateOrderStatus, appendSyncLog } from './_sync-lib.js';

const REPO = 'jamestuwairua77-cpu/bargain-drop-v2';

// â”€â”€ Reprice policy: tiered markup on wholesale cost (clean .95 retail) â”€â”€â”€â”€â”€
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

// â”€â”€ CJK variant normalization (must match sync-full.js EXACTLY) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CN_COLOR_MAP = [
  ['é»‘è‰²','Black'],['ç™½è‰²','White'],['çº¢è‰²','Red'],['è“è‰²','Blue'],
  ['é»„è‰²','Yellow'],['ç»¿è‰²','Green'],['ç°è‰²','Gray'],['ç²‰çº¢è‰²','Pink'],
  ['ç²‰è‰²','Pink'],['ç´«è‰²','Purple'],['æ©™è‰²','Orange'],['æ£•è‰²','Brown'],
  ['å’–å•¡è‰²','Coffee'],['ç±³è‰²','Beige'],['å¡å…¶è‰²','Khaki'],['é“¶è‰²','Silver'],
  ['é‡‘è‰²','Gold'],['é€æ˜','Clear'],['èŠ±è‰²','Multicolor'],['æ··è‰²','Mixed'],
  ['æ·±è“','Dark Blue'],['æµ…è“','Light Blue'],['è—é’','Navy Blue'],
  ['å†›ç»¿','Army Green'],['é…’çº¢','Wine Red'],['ç«çº¢','Rose Red'],
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
  s = s.replace(/^[-â€“â€”/_,\s]+|[-â€“â€”/_,\s]+$/g, '').trim();
  if (!s) return fallbackName || 'Default';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// â”€â”€ Image extraction helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ CJ detail lookup (by pid OR SKU) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Dedupe ring: avoid re-processing same CJ message â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Find Shopify product by CJ PID tag or variant SKU â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Upsert full CJ product into Shopify â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    // Product not yet in Shopify â†’ CREATE it (full import w/ all variants if we have them).
    if (!cjData) {
      // Fallback: minimal create from push payload alone
      return await createMinimalProduct(env, pid, p, patches, mappedType);
    }
    return await createProductInShopify(env, pid, cjData, p);
  }

  // Product ALREADY in Shopify â†’ UPDATE it
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

// â”€â”€ Minimal fallback create (when /product/query fails) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Create a brand-new Shopify product from CJ data (all variants) â”€â”€â”€â”€â”€â”€â”€
async function createProductInShopify(env, pid, cjData, p) {
  const variants = cjData.variants || [];

  // Derive option names from variantKey (e.g. "Color-Size" â†’ Color, Size).
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

  const body = {
    product: {
      title: cjData.productNameEn || cjData.productName || p.productNameEn || p.productName || 'Imported CJ Product',
      body_html: cjData.productDescription || p.productDescription || '',
      product_type: mapCategory(cjData.categoryName || p.categoryName, cjData.productNameEn || p.productNameEn),
      vendor: 'CJ Dropshipping',
      tags: 'cj-import',
      variants: shopVariants.length ? shopVariants : undefined,
      images: extractImagesFromCj(cjData, p),
    },
  };

  const r = await shopifyFetch(env, '/products.json', { method: 'POST', body: JSON.stringify(body) });
  if (!r.ok) return { imported: false, reason: 'create ' + r.status, pid };
  const newId = r.body && r.body.product && r.body.product.id;
  return { imported: true, pid, created: true, shopifyId: newId, variantsCount: shopVariants.length, categoryApplied: body.product.product_type };
}

// â”€â”€ Extract images from C‰ data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” ™[˜İ[Ûˆ^˜Xİ[XYÙ\Ñœ›ÛPÚŠÚ‘]K
HÂˆÛÛœİ\›ÈH×NÂˆÛÛœİYH
JHOˆÂˆYˆ
]JH™]\›ÂˆÛÛœİÛX[ˆHİš[™ÊJKš[J
NÂˆYˆ
XÛX[ˆ\›Ëš[˜ÛY\ÊÛX[ŠHK×šÏÎ‹ÚK\İ
ÛX[ŠJH™]\›Âˆ\›Ëœ\Ú
ÛX[ŠNÂˆNÂˆY
Ú‘]Kœ›ÙXİ[XYÙJNÂˆYˆ
\œ˜^Kš\Ğ\œ˜^JÚ‘]Kœ›ÙXİ[XYÙTÙ]
JHÚ‘]Kœ›ÙXİ[XYÙTÙ]™›Ü‘XXÚ
Y
NÂˆËÈ[ÛÈY˜\šX[[XYÙ\ÂˆYˆ
\œ˜^Kš\Ğ\œ˜^JÚ‘]K˜\šX[ÊJHÂˆ›Üˆ
ÛÛœİˆÙˆÚ‘]K˜\šX[ÊHY
‹˜\šX[[XYÙJNÂˆBˆËÈ˜[˜XÚÈÈ\Ú[XYÙ\ÂˆYˆ
]\›Ë›[™İ
H™]\›ˆ^˜Xİ\Ú[XYÙ\Ê
NÂˆ™]\›ˆ\›ËœÛXÙJMJK›X\
Ü˜ÈOˆ
ÈÜ˜ÈJJNÂŸB‚‹ËÈ8¥ 8¥ \Ù\Ú[™ÛH˜\šX[[ÈÚÜYH
˜\šX[ØÜ™X]K˜\šX[İ\]JH8¥ 8¥ 8¥ ™^Ü\Ş[˜È[˜İ[ÛˆŞ[˜Õ˜\šX[Ú]ÚÜYJ[‹
HÂˆÛÛœİYHœYœ›ÙXİY[ÂˆÛÛœİÚİHH˜\šX[ÚİHœÚİH[ÂˆÛÛœİšYHšY[Â‚ˆÛÛœİÚÜYT›ÙXİH]ØZ]š[™ÚÜYT›ÙXİ
[‹YÚİJNÂˆYˆ
\ÚÜYT›ÙXİ
HÂˆËÈ›ÙXİ›İY][ˆÚÜYH8¡¥šYÙÙ\ˆ[›ÙXİŞ[˜ÈYˆÙH]™HYˆYˆ
Y
H™]\›ˆ]ØZ]Ş[˜Ô›ÙXİÚ]ÚÜYJ[‹Y
NÂˆ™]\›ˆÈ[\ÜYˆ˜[ÙK™X\ÛÛˆ	Ü\™[›ÙXİ›İ›İ[™	ËÚİKYNÂˆB‚ˆÛÛœİÚÜYRYHÚÜYT›ÙXİšYÂˆÛÛœİÚÜ˜\šX[ÈHÚÜYT›ÙXİ˜\šX[È×NÂ‚ˆËÈX]Ú^\İ[™È˜\šX[HÒÕHÜˆQˆ]\™Ù]H[ÂˆYˆ
ÚİJH\™Ù]HÚÜ˜\šX[Ë™š[™
ˆOˆİš[™Ê‹œÚİJHOOHİš[™ÊÚİJJNÂˆYˆ
]\™Ù]	‰ˆšY
H\™Ù]HÚÜ˜\šX[Ë™š[™
ˆOˆİš[™Ê‹œÚİJHOOHİš[™ÊšY
JNÂ‚ˆYˆ
]\™Ù]
HÂˆËÈT’PS•\Ú\ÈØ\œHÚÛ\Ø[HÛÜİšXÙHšXHY\™YX\šİ\ˆÛÛœİİœĞÛÜİH˜\šX[Ù[šXÙHOH[È\œÙQ›Ø]
˜\šX[Ù[šXÙJHˆ˜SÂˆYˆ
[X™\‹š\Ñš[š]JİœĞÛÜİ
H	‰ˆİœĞÛÜİˆ
HÂˆÛÛœİœHÛÛ\]TšXÙJİœĞÛÜİ
NÂˆÛÛœİˆHÈšXÙNˆœOH[Èİš[™Êœ
Hˆ[™Yš[™YÚİNˆ˜\šX[ÚİHÚİHšYNÂˆYˆ
˜\šX[ÙZYÚOH[
H‹™Ü˜[\ÈH[X™\Š˜\šX[ÙZYÚ
NÂˆÛÛœİÜİH]ØZ]ÚÜYQ™]Ú
[‹Ü›ÙXİËÉÜÚÜYRYKİ˜\šX[ËšœÛÛ˜ÂˆY]Ùˆ	ÔÔÕ	Ëˆ›ÙNˆ”ÓÓ‹œİš[™ÚYJÈ˜\šX[ˆˆJKˆJK˜Ø]Ú


HOˆ
ÈÚÎˆ˜[ÙKİ]\ÎˆJJNÂˆ™]\›ˆÈ[\ÜYˆÜİ›ÚË™X\ÛÛˆÜİ›ÚÈÈ	İ˜\šX[Ü™X]Yœ›ÛH\Ú	Èˆ	İ˜\šX[Ü™X]H	È
ÈÜİœİ]\ËÚİHNÂˆBˆ™]\›ˆÈ[\ÜYˆ˜[ÙK™X\ÛÛˆ	İ˜\šX[›İ›İ[™
›È\ÚšXÙJIËÚİHNÂˆB‚ˆÛÛœİ]ÚHÈYˆ\™Ù]šYNÂˆÛÛœİİÛÜİˆH˜\šX[Ù[šXÙHOH[È\œÙQ›Ø]
˜\šX[Ù[šXÙJHˆ˜SÂˆYˆ
[X™\‹š\Ñš[š]JİÛÜİŠH	‰ˆİÛÜİˆˆ
HÈÛÛœİœHÛÛ\]TšXÙJİÛÜİŠNÈYˆ
œOH[
HÈ]ÚœšXÙHHİš[™Êœ
NÈ]Ú˜ÛÛ\\™WØ]ÜšXÙHH[ÈHBˆYˆ
˜\šX[ÙZYÚOH[
H]Ú™Ü˜[\ÈH[X™\Š˜\šX[ÙZYÚ
NÂˆYˆ
˜\šX[ÚİHOH[
H]ÚœÚİHH˜\šX[ÚİNÂˆYˆ
˜\šX[İ]\ÈOH[
HÂˆËÈ]˜Z[Xš[]NˆHHÛˆØ[Bˆ]Úš[™[ÜWÛX[˜YÙ[Y[H	ÜÚÜYIÎÂˆ]Úš[™[ÜWÜÛXŞHH˜\šX[İ]\ÈOHH˜\šX[İ]\ÈOH	ÌIÈÈ	ØÛÛ[YIÈˆ	Ù[IÎÂˆB‚ˆÛÛœİˆH]ØZ]ÚÜYQ™]Ú
[‹Ü›ÙXİËÉÜÚÜYRYKİ˜\šX[ËŞÉ\™Ù]šYKšœÛÛ˜ÂˆY]Ùˆ	ÔU	Ëˆ›ÙNˆ”ÓÓ‹œİš[™ÚYJÈ˜\šX[ˆ]ÚJKˆJNÂ‚ˆ™]\›ˆÈ[\ÜYˆ‹›ÚËÚİKÚÜYRY˜\šX[Yˆ\™Ù]šY\]Yˆ‹›ÚÈNÂŸB‚‹ËÈ8¥ 8¥ XZ[ˆ\Ü]Ú\ˆ
Ø[Yœ›ÛHÚ‹]ÙXšÛÚËšœÊH8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ ™^Ü\Ş[˜È[˜İ[Ûˆ[™PÚ•ÙXšÛÚÊ[‹^[ØYXY\œÈHßJHÂˆÛÛœİY\ÜØYÙRYH^[ØYË“Y\ÜØYÙRY^[ØYË›Y\ÜØYÙRYXY\œÖÉŞXÚ‹[Y\ÜØYÙKZY	×H[ÂˆYˆ
Y\ÜØYÙRY	‰ˆ]ØZ]\Ñ\XØ]SY\ÜØYÙJ[‹Y\ÜØYÙRY
JHÂˆ™]\›ˆÈÚÎˆYKÚÚ\YˆYK™X\ÛÛˆ	Ù\XØ]HY\ÜØYÙRY	ËY\ÜØYÙRYNÂˆB‚ˆËÈ[Ü˜\Ó”Ë\İ[HÈ\KY\ÜØYÙHH[™[ÜHYˆ™\Ù[ˆ]›ÙHH^[ØYÂˆYˆ
\[Ùˆ^[ØYË“Y\ÜØYÙHOOH	Üİš[™ÉÊHÂˆHÈ›ÙHH”ÓÓ‹œ\œÙJ^[ØY“Y\ÜØYÙJNÈHØ]ÚßBˆB‚ˆÛÛœİÜXÈH›ÙOËÜXÈ›ÙOË\H^[ØYËÜXÈ^[ØYË\H	İ[šÛ›İÛ‰ÎÂˆÛÛœİ]HH›ÙOË™]H›ÙOËœ\˜[\È›ÙNÂˆÛÛœİYH]OËœY]OËœ›ÙXİY]OËšY[Â‚ˆ]™\İ[HÈÚÎˆ˜[ÙKÜXËYNÂ‚ˆİÚ]Ú
ÜXÊHÂˆØ\ÙH	Ü›ÙXİØÜ™X]IÎ‚ˆØ\ÙH	Ü›ÙXİİ\]IÎ‚ˆØ\ÙH	Ü›ÙXİ˜Ü™X]IÎ‚ˆØ\ÙH	Ü›ÙXİ\]IÎ‚ˆYˆ
Y
HÂˆ™\İ[H]ØZ]Ş[˜Ô›ÙXİÚ]ÚÜYJ[‹Y]JNÂˆH[ÙHÂˆ™\İ[HÈÚÎˆ˜[ÙK™X\ÛÛˆ	Û›ÈY[ˆ^[ØY	ËÜXÈNÂˆBˆœ™XZÎÂ‚ˆØ\ÙH	İ˜\šX[ØÜ™X]IÎ‚ˆØ\ÙH	İ˜\šX[İ\]IÎ‚ˆØ\ÙH	İ˜\šX[˜Ü™X]IÎ‚ˆØ\ÙH	İ˜\šX[\]IÎ‚ˆ™\İ[H]ØZ]Ş[˜Õ˜\šX[Ú]ÚÜYJ[‹]JNÂˆœ™XZÎÂ‚ˆØ\ÙH	ÛÜ™\‹Üİ]\ÉÎ‚ˆØ\ÙH	ÛÜ™\‹œİ]\ÉÎ‚ˆØ\ÙH	ÛÜ™\‹İ˜XÚÚ[™ÉÎ‚ˆËÈÒˆÜ™\ˆ˜XÚÚ[™È\ÚYOˆ\]HÚÜYH[š[Y[ˆ™\İ[H]ØZ][™SÜ™\”İ]\Ô\Ú
[‹]JNÂˆœ™XZÎÂ‚ˆY˜][‚ˆËÈ™\İY™›ÜˆYˆ]H\ÈHYHŞ[˜Ú[™È\È›ÙXİˆYˆ
Y
HÂˆ™\İ[H]ØZ]Ş[˜Ô›ÙXİÚ]ÚÜYJ[‹Y]JNÂˆH[ÙHÂˆ™\İ[HÈÚÎˆYKYÛ›Ü™YˆYK™X\ÛÛˆ	İ[š[™YÜXÈ	È
ÈÜXÈNÂˆBˆB‚ˆYˆ
Y\ÜØYÙRY	‰ˆ™\İ[š[\ÜY
HÂˆ]ØZ]X\šÓY\ÜØYÙT›ØÙ\ÜÙY
[‹Y\ÜØYÙRY
NÂˆB‚ˆHÂˆ]ØZ]\[™Ş[˜ÓÙÊ[‹È\Nˆ	ØÚ‹]ÙXšÛÚÉËÜXËY‹‹œ™\İ[]ˆ™]È]J
KÒTÓÔİš[™Ê
HJNÂˆHØ]ÚßB‚ˆ™]\›ˆÈÚÎˆ™\İ[š[\ÜYOOH˜[ÙK‹‹œ™\İ[NÂŸB‚˜\Ş[˜È[˜İ[Ûˆ[™SÜ™\”İ]\Ô\Ú
[‹]JHÂˆÛÛœİÚ“Ü™\’YH]OË›Ü™\’Y]OË˜Ú“Ü™\’YÂˆÛÛœİ˜XÚÚ[™Ó[X™\ˆH]OË˜XÚÚ[™Ó[X™\ˆ]OË˜XÚÓ[X™\ÂˆÛÛœİÙÚ\İXÜÓ˜[YHH]OË›ÙÚ\İXÓ˜[YH]OË›ÙÚ\İXÜĞÛÛ\[H	Ôİ[™\™Ú\[™ÉÎÂˆYˆ
XÚ“Ü™\’Y]˜XÚÚ[™Ó[X™\ŠH™]\›ˆÈ[\ÜYˆ˜[ÙK™X\ÛÛˆ	ÛZ\ÜÚ[™ÈÜ™\’YÜˆ˜XÚÚ[™ÉÈNÂ‚ˆËÈÛÚÈ\ÚÜYHÜ™\ˆHÒˆÜ™\ˆQ[ˆ›İWØ]šX]\ÂˆÛÛœİÜ™\œÈH]ØZ]\İÜ™\œÊ[‹È[Z]ˆLJNÂˆÛÛœİX]ÚH
Ü™\œÈ×JK™š[™
ÈOˆÂˆÛÛœİ›İHH”ÓÓ‹œİš[™ÚYJË››İWØ]šX]\È×JNÂˆ™]\›ˆ›İKš[˜ÛY\Êİš[™ÊÚ“Ü™\’Y
JNÂˆJNÂˆYˆ
[X]Ú
H™]\›ˆÈ[\ÜYˆ˜[ÙK™X\ÛÛˆ	ÜÚÜYHÜ™\ˆ›İ›İ[™›ÜˆÒˆÜ™\ˆ	È
ÈÚ“Ü™\’YNÂ‚ˆÛÛœİ\]HH]ØZ]\]SÜ™\”İ]\Ê[‹X]ÚšYÂˆİ]\Îˆ	Ù[š[Y	Ëˆ˜XÚÚ[™×Û[X™\ˆ˜XÚÚ[™Ó[X™\‹ˆ˜XÚÚ[™×ØÛÛ\[NˆÙÚ\İXÜÓ˜[YKˆJNÂˆ™]\›ˆÈ[\ÜYˆ\]K›ÚËÚÜYSÜ™\’YˆX]ÚšYÚ“Ü™\’Y˜XÚÚ[™Ó[X™\ˆNÂŸB