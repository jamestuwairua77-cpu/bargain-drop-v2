// Cloudflare Pages Function: /api/cj-import
// Streaming SSE import endpoint. Body: { pids: string[], markup?: number, defaultStock?: number }

import { corsHeaders, cjFetch, shopifyFetch, appendSyncLog } from '../_sync-lib.js';

function stripHtml(html = '') {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
// Split CJ variantKey ("Dark Blue-S") or variantNameEn ("...Bikini Dark Blue S")
// into [color, size, ...]. Size is the trailing token when it is a known size.
const SIZE_TOKENS = new Set(['XS','S','M','L','XL','XXL','XXXL','2XL','3XL','4XL','5XL','6XL','7XL','8XL','1X','2X','3X','4X','5X','SM','MED','MEDIUM','LARGE','XLARGE','FREE','FREESIZE','ONESIZE','OS','FITS','ALL','SIZE']);
function isSizeToken(s) {
  if (!s) return false;
  const u = String(s).trim().toUpperCase();
  if (SIZE_TOKENS.has(u)) return true;
  if (/^\d{1,2}(\.\d+)?$/.test(String(s).trim())) { const n = parseFloat(s); return n >= 20 && n <= 60; }
  return false;
}
function parseVariantKey(key, nameEn) {
  // Prefer explicit key ("Dark Blue-S"); fall back to nameEn trailing size token.
  let parts = [];
  if (key) {
    // Split on the LAST dash/slash so "Dark Blue-S" -> ["Dark Blue","S"]
    const s = String(key).trim();
    const m = s.match(/^(.*?)[-\/]([^-\/]+)$/);
    if (m) parts = [m[1].trim(), m[2].trim()];
    else parts = [s];
  }
  // If we got a trailing size token, keep color+size; else try nameEn
  if (parts.length >= 2 && isSizeToken(parts[parts.length - 1])) {
    // good
  } else if (nameEn) {
    const toks = String(nameEn).split(/\s+/).filter(Boolean);
    if (toks.length && isSizeToken(toks[toks.length - 1])) {
      const size = toks.pop();
      parts = [toks.join(' '), size];
    }
  }
  return parts.slice(0, 3).map(s => s.trim()).filter(Boolean);
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST required' }), {
      status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const body = await request.json().catch(() => ({}));
  const pids = Array.isArray(body.pids) ? body.pids : [];
  const markup = Math.max(1.0, parseFloat(body.markup || '2.5'));
  const defaultStock = Math.max(0, parseInt(body.defaultStock || '100', 10));
  const LOCATION_ID = parseInt(env.SHOPIFY_LOCATION_ID || '91452932227', 10);

  if (!pids.length) {
    return new Response(JSON.stringify({ error: 'pids array required' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (type, payload) => {
        controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`));
      };
      const log = (line, level = 'info') =>
        emit('log', { line, level, at: new Date().toISOString() });

      log(`⚡ Import started · ${pids.length} product(s) · markup ×${markup} · default stock ${defaultStock}`, 'header');

      const results = {
        started: new Date().toISOString(),
        total: pids.length,
        success: [], failed: [], skipped: [],
      };

      for (let i = 0; i < pids.length; i++) {
        const pid = pids[i];
        const step = i + 1;
        emit('progress', { current: step, total: pids.length, task: `Processing product ${step}/${pids.length}` });
        log(`── [${step}/${pids.length}] pid=${pid} ────────────────────────────`, 'section');

        try {
          log(`  › Fetching CJ product details for ID: ${pid}...`);
          const detailRes = await cjFetch(env, `/product/query?pid=${encodeURIComponent(pid)}`);
          if (detailRes.code !== 200 || !detailRes.data) {
            throw new Error(`CJ detail fetch failed: ${detailRes.message || detailRes.code}`);
          }
          const p = detailRes.data;
          log(`  ✓ Got: "${p.productNameEn}" (base SKU ${p.productSku})`);

          log(`  › Reading variant list from CJ product detail...`);
          // CJ exposes full variants on /product/query (data.variants); the
          // separate /product/variant/query endpoint is unreliable/empty.
          let variants = Array.isArray(p.variants) ? p.variants : [];
          log(`  ✓ ${variants.length} variant(s) discovered`);

          if (!variants.length) {
            variants = [{
              vid: p.pid, variantSku: p.productSku, variantNameEn: p.productNameEn,
              variantSellPrice: parseFloat(p.sellPrice) || 0, variantWeight: 0,
              variantImage: p.bigImage, variantKey: 'Default',
            }];
            log(`  ⚠ No variants — synthesized 1 default variant`, 'warn');
          }

          const optionSlots = [new Set(), new Set(), new Set()];
          const colorImageMap = new Map(); // color -> variantImage url
          for (const v of variants) {
            const parts = parseVariantKey(v.variantKey, v.variantNameEn || v.variantName);
            parts.forEach((val, idx) => { if (idx < 3) optionSlots[idx].add(val); });
            if (parts[0] && v.variantImage && !colorImageMap.has(parts[0])) colorImageMap.set(parts[0], v.variantImage);
          }
          // Name axes semantically: option1 is virtually always Color, option2 Size.
          const optionNames = ['Color', 'Size', 'Option 3'];
          const optionsPayload = [];
          optionSlots.forEach((set, idx) => {
            if (set.size > 0) optionsPayload.push({ name: optionNames[idx], values: [...set] });
          });
          log(`  › Detected ${optionsPayload.length} option axis/axes: ${optionsPayload.map(o => `${o.name}(${o.values.length})`).join(', ')}`);

          log(`  › Mapping payload for Shopify format...`);
          const shopifyVariants = variants.map((v, idx) => {
            const parts = parseVariantKey(v.variantKey, v.variantNameEn || v.variantName);
            const price = ((parseFloat(v.variantSellPrice) || parseFloat(p.sellPrice) || 0) * markup).toFixed(2);
            const grams = Math.round(parseFloat(v.variantWeight) || 0);
            log(`    · variant ${idx + 1}/${variants.length} — SKU ${v.variantSku} · key "${v.variantKey}" · $${price} · ${grams}g`);
            return {
              sku: v.variantSku, price,
              option1: parts[0] || 'Default', option2: parts[1] || null, option3: parts[2] || null,
              grams, weight: grams / 1000, weight_unit: 'kg',
              inventory_management: 'shopify', inventory_policy: 'deny',
              fulfillment_service: 'manual', requires_shipping: true, taxable: true,
              _cjColor: parts[0] || null, _cjImage: v.variantImage || null,
            };
          });

          const finalOptions = optionsPayload.slice(0, Math.max(1, shopifyVariants[0].option3 ? 3 : shopifyVariants[0].option2 ? 2 : 1));

          // Assemble distinct per-color images first (so variant image_id can link),
          // then the remaining gallery images.
          const images = [];
          const seenImg = new Set();
          for (const c of optionSlots[0]) {
            const u = colorImageMap.get(c);
            if (u && !seenImg.has(u)) { seenImg.add(u); images.push({ src: u }); }
          }
          const pushUrl = (url) => { if (url && !seenImg.has(url)) { seenImg.add(url); images.push({ src: url }); } };
          try {
            const set = Array.isArray(p.productImageSet) ? p.productImageSet
              : (typeof p.productImageSet === 'string' ? JSON.parse(p.productImageSet) : []);
            for (const url of set) pushUrl(url);
          } catch {}
          if (!images.length) {
            try {
              const arr = typeof p.productImage === 'string' ? JSON.parse(p.productImage) : [];
              for (const url of arr) pushUrl(url);
            } catch {}
          }
          if (p.bigImage) pushUrl(p.bigImage);

          const productPayload = {
            product: {
              title: p.productNameEn || `CJ Product ${pid}`,
              body_html: p.description || '',
              vendor: 'CJ Dropshipping',
              product_type: p.categoryName || 'Dropshipping',
              tags: `cj-import,cj-pid-${pid}`,
              status: 'active',
              options: finalOptions,
              variants: variants.map((v, idx) => ({
                ...shopifyVariants[idx],
                _cjColor: undefined, _cjImage: undefined,
              })),
              images,
            },
          };

          log(`  › Sending product payload to Shopify Admin API... (${images.length} images, ${shopifyVariants.length} variants)`);
          const createRes = await shopifyFetch(env, '/products.json', {
            method: 'POST', body: JSON.stringify(productPayload),
          });

          if (!createRes.ok) {
            const errMsg = createRes.body?.errors ? JSON.stringify(createRes.body.errors) : `HTTP ${createRes.status}`;
            throw new Error(`Shopify API Error ${createRes.status}: ${errMsg}`);
          }

          const created = createRes.body?.product;
          log(`  ✓ Successfully created product "${created.title}" on Shopify (id=${created.id})`, 'success');

          // Assign per-color images to variants (Shopify requires image.variant_ids /
          // image.alt wiring done AFTER create). This is what makes each color swatch
          // show its correct product photo on the storefront.
          try {
            const vidByColor = new Map();
            for (const v of created.variants) {
              const key = v.option1; // color
              if (key && !vidByColor.has(key)) vidByColor.set(key, v);
            }
            const imgUpdates = [];
            for (const [color, url] of colorImageMap) {
              const shopImg = created.images.find(im => im.src === url);
              if (!shopImg) continue;
              const vv = vidByColor.get(color);
              const variantIds = vv ? [vv.id] : [];
              if (variantIds.length) {
                imgUpdates.push({ id: shopImg.id, variant_ids: variantIds, position: shopImg.position });
              }
            }
            if (imgUpdates.length) {
              await shopifyFetch(env, `/products/${created.id}.json`, {
                method: 'PUT',
                body: JSON.stringify({ product: { id: created.id, images: imgUpdates } }),
              });
              log(`  ✓ Assigned ${imgUpdates.length} color image(s) to variants`);
            }
          } catch (imgErr) {
            log(`    ⚠ variant image assignment skipped: ${imgErr.message}`, 'warn');
          }

          log(`  › Setting inventory levels for ${created.variants.length} variant(s)...`);
          for (const v of created.variants) {
            try {
              await shopifyFetch(env, '/inventory_levels/set.json', {
                method: 'POST',
                body: JSON.stringify({ location_id: LOCATION_ID, inventory_item_id: v.inventory_item_id, available: defaultStock }),
              });
            } catch (e) {
              log(`    ⚠ inventory set failed for ${v.sku}: ${e.message}`, 'warn');
            }
          }
          log(`  ✓ Inventory set to ${defaultStock} for each variant`);

          results.success.push({ pid, shopifyId: created.id, title: created.title, variants: created.variants.length });
          await appendSyncLog(env, { action: 'import', pid, shopifyId: created.id, title: created.title, ok: true });
          emit('product', { pid, title: created.title, shopifyId: created.id, variants: created.variants.length, images: images.length, status: 'success' });

        } catch (e) {
          log(`  ✗ ${e.message}`, 'error');
          results.failed.push({ pid, error: e.message });
          await appendSyncLog(env, { action: 'import', pid, ok: false, error: e.message });
          emit('product', { pid, status: 'error', error: e.message });
        }

        await new Promise(r => setTimeout(r, 350));
      }

      results.finished = new Date().toISOString();
      emit('done', results);
      log(`✓ Import finished — ${results.success.length} succeeded, ${results.failed.length} failed`, 'success');
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      ...corsHeaders(),
    },
  });
}
