// Streaming import endpoint (Server-Sent Events).
// Body: { pids: string[] }  — POST from the dashboard.
// Streams line-by-line log events to the client for the live console.
import { cors, cjFetch, shopifyFetch, appendSyncLog } from './_sync-lib.js';

export const config = {
  maxDuration: 300, // 5 minutes for a batch of ~50 products
};

// Location for Shopify inventory adjustments (env override, else auto-detect)
const LOCATION_ID = process.env.SHOPIFY_LOCATION_ID || '91452932227';

function stripHtml(html = '') {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Parse variantKey like "Blue-S" or "Red-XL-Cotton" into up to 3 options.
function parseVariantKey(key) {
  if (!key) return [];
  return String(key).split(/[-\/]/).map(s => s.trim()).filter(Boolean).slice(0, 3);
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST required' });
  }

  const body = req.body || {};
  const pids = Array.isArray(body.pids) ? body.pids : [];
  const markup = Math.max(1.0, parseFloat(body.markup || '2.5')); // default 2.5x markup
  const defaultStock = Math.max(0, parseInt(body.defaultStock || '100', 10));

  if (!pids.length) return res.status(400).json({ error: 'pids array required' });

  // ── SSE setup ─────────────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const emit = (type, payload) => {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    res.flush?.();
  };
  const log = (line, level = 'info') =>
    emit('log', { line, level, at: new Date().toISOString() });

  log(`⚡ Import started · ${pids.length} product(s) · markup ×${markup} · default stock ${defaultStock}`, 'header');

  const results = {
    started: new Date().toISOString(),
    total: pids.length,
    success: [],
    failed: [],
    skipped: [],
  };

  for (let i = 0; i < pids.length; i++) {
    const pid = pids[i];
    const step = i + 1;
    emit('progress', {
      current: step,
      total: pids.length,
      task: `Processing product ${step}/${pids.length}`,
    });
    log(`── [${step}/${pids.length}] pid=${pid} ────────────────────────────`, 'section');

    try {
      // ── 1. Fetch product details from CJ ─────────────────────────────
      log(`  › Fetching CJ product details for ID: ${pid}...`);
      const detailRes = await cjFetch(`/product/query?pid=${encodeURIComponent(pid)}`);
      if (detailRes.code !== 200 || !detailRes.data) {
        throw new Error(`CJ detail fetch failed: ${detailRes.message || detailRes.code}`);
      }
      const p = detailRes.data;
      log(`  ✓ Got: "${p.productNameEn}" (base SKU ${p.productSku})`);

      // ── 2. Fetch variants from CJ ─────────────────────────────────────
      log(`  › Fetching variant list for pid=${pid}...`);
      const varRes = await cjFetch(`/product/variant/query?pid=${encodeURIComponent(pid)}`);
      let variants = Array.isArray(varRes.data) ? varRes.data : [];
      // Fallback: some products have variants inline on the detail object
      if (!variants.length && Array.isArray(p.variants)) variants = p.variants;
      log(`  ✓ ${variants.length} variant(s) discovered`);

      if (!variants.length) {
        // Synthesize a single variant from the base product
        variants = [{
          vid: p.pid,
          variantSku: p.productSku,
          variantNameEn: p.productNameEn,
          variantSellPrice: parseFloat(p.sellPrice) || 0,
          variantWeight: 0,
          variantImage: p.bigImage,
          variantKey: 'Default',
        }];
        log(`  ⚠ No variants — synthesized 1 default variant`, 'warn');
      }

      // ── 3. Build option axes from variantKey ──────────────────────────
      const optionSlots = [new Set(), new Set(), new Set()];
      for (const v of variants) {
        const parts = parseVariantKey(v.variantKey || v.variantNameEn);
        parts.forEach((val, idx) => { if (idx < 3) optionSlots[idx].add(val); });
      }
      const optionNames = ['Option 1', 'Option 2', 'Option 3'];
      // Heuristic — try to guess axis names from variantProperty if present
      const optionsPayload = [];
      optionSlots.forEach((set, idx) => {
        if (set.size > 0) {
          optionsPayload.push({
            name: optionNames[idx],
            values: [...set],
          });
        }
      });
      log(`  › Detected ${optionsPayload.length} option axis/axes: ${optionsPayload.map(o => `${o.name}(${o.values.length})`).join(', ')}`);

      // ── 4. Build Shopify variants payload ─────────────────────────────
      log(`  › Mapping payload for Shopify format...`);
      const shopifyVariants = variants.map((v, idx) => {
        const parts = parseVariantKey(v.variantKey || v.variantNameEn);
        const price = ((parseFloat(v.variantSellPrice) || parseFloat(p.sellPrice) || 0) * markup).toFixed(2);
        const grams = Math.round(parseFloat(v.variantWeight) || 0);
        log(`    · variant ${idx + 1}/${variants.length} — SKU ${v.variantSku} · key "${v.variantKey}" · $${price} · ${grams}g`);
        return {
          sku: v.variantSku,
          price,
          option1: parts[0] || 'Default',
          option2: parts[1] || null,
          option3: parts[2] || null,
          grams,
          weight: grams / 1000,
          weight_unit: 'kg',
          inventory_management: 'shopify',
          inventory_policy: 'deny',
          fulfillment_service: 'manual',
          requires_shipping: true,
          taxable: true,
        };
      });

      // Trim option payload to only the axes we actually populated
      const finalOptions = optionsPayload.slice(0, Math.max(1, shopifyVariants[0].option3 ? 3 : shopifyVariants[0].option2 ? 2 : 1));

      // ── 5. Build product payload ──────────────────────────────────────
      const images = [];
      try {
        const set = Array.isArray(p.productImageSet)
          ? p.productImageSet
          : (typeof p.productImageSet === 'string' ? JSON.parse(p.productImageSet) : []);
        for (const url of set) images.push({ src: url });
      } catch {}
      // Also include productImage fallback
      if (!images.length) {
        try {
          const arr = typeof p.productImage === 'string' ? JSON.parse(p.productImage) : [];
          for (const url of arr) images.push({ src: url });
        } catch {}
      }
      if (!images.length && p.bigImage) images.push({ src: p.bigImage });

      const productPayload = {
        product: {
          title: p.productNameEn || `CJ Product ${pid}`,
          body_html: p.description || '',
          vendor: 'CJ Dropshipping',
          product_type: p.categoryName || 'Dropshipping',
          tags: `cj-import,cj-pid-${pid}`,
          status: 'active',
          options: finalOptions,
          variants: shopifyVariants,
          images,
        },
      };

      log(`  › Sending product payload to Shopify Admin API... (${images.length} images, ${shopifyVariants.length} variants)`);
      const createRes = await shopifyFetch('/products.json', {
        method: 'POST',
        body: JSON.stringify(productPayload),
      });

      if (!createRes.ok) {
        const errMsg = createRes.body?.errors
          ? JSON.stringify(createRes.body.errors)
          : `HTTP ${createRes.status}`;
        throw new Error(`Shopify API Error ${createRes.status}: ${errMsg}`);
      }

      const created = createRes.body?.product;
      log(`  ✓ Successfully created product "${created.title}" on Shopify (id=${created.id})`, 'success');

      // ── 6. Set inventory levels ───────────────────────────────────────
      log(`  › Setting inventory levels for ${created.variants.length} variant(s)...`);
      for (const v of created.variants) {
        try {
          await shopifyFetch('/inventory_levels/set.json', {
            method: 'POST',
            body: JSON.stringify({
              location_id: parseInt(LOCATION_ID, 10),
              inventory_item_id: v.inventory_item_id,
              available: defaultStock,
            }),
          });
        } catch (e) {
          log(`    ⚠ inventory set failed for ${v.sku}: ${e.message}`, 'warn');
        }
      }
      log(`  ✓ Inventory set to ${defaultStock} for each variant`);

      results.success.push({ pid, shopifyId: created.id, title: created.title, variants: created.variants.length });
      appendSyncLog({ action: 'import', pid, shopifyId: created.id, title: created.title, ok: true });

      emit('product', {
        pid,
        title: created.title,
        shopifyId: created.id,
        variants: created.variants.length,
        images: images.length,
        status: 'success',
      });

    } catch (e) {
      log(`  ✗ ${e.message}`, 'error');
      results.failed.push({ pid, error: e.message });
      appendSyncLog({ action: 'import', pid, ok: false, error: e.message });
      emit('product', { pid, status: 'error', error: e.message });
    }

    // Rate-limit polite pause
    await new Promise(r => setTimeout(r, 350));
  }

  results.finished = new Date().toISOString();
  emit('done', results);
  log(`✓ Import finished — ${results.success.length} succeeded, ${results.failed.length} failed`, 'success');
  res.end();
}
