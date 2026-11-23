// Cloudflare Pages Function: /api/auto-catalog-sync
// POST or GET (?batch=40&cursor=0&cron=1) — Admin PIN or CRON_SECRET protected.
// Automatically updates product prices/stock/availability from CJ Dropshipping across
// sharded catalog files (all-products-0..N.json + products-slim-0..N.json) AND
// automatically hides deleted or out-of-stock products (visible: false, deleted: true).
// Works completely independently of Shopify (never breaks on Shopify HTTP 402).

import {
  corsHeaders,
  isAdmin,
  adminDenied,
  cjFetchMulti,
  readShardedCatalog,
  writeCatalogFromGithub,
  splitShards,
  ghRead,
  ghWrite,
  b64DecodeUtf8,
  appendSyncLog,
} from '../_sync-lib.js';

const CURSOR_PATH = 'data/catalog-sync-cursor.json';
const SLIM_SHARD_SIZE = 1200;

function computeRetailPrice(baseCostUsd, audRate = 1.54) {
  const c = parseFloat(baseCostUsd);
  if (!Number.isFinite(c) || c <= 0) return null;
  let mult;
  if (c < 5) mult = 3.2;
  else if (c < 8) mult = 3.0;
  else if (c < 15) mult = 2.6;
  else if (c < 30) mult = 2.5;
  else if (c < 60) mult = 2.1;
  else if (c < 120) mult = 1.9;
  else mult = 1.7;
  const rawAud = c * audRate * mult;
  let price = Math.ceil(rawAud) - 0.05;
  if (price <= 0) price = rawAud;
  return +price.toFixed(2);
}

function isAuthorized(request, env) {
  if (isAdmin(request, env)) return true;
  const url = new URL(request.url);
  const cronSecret = env.CRON_SECRET || env.ADMIN_PIN || '';
  const supplied =
    request.headers.get('X-Cron-Secret') ||
    url.searchParams.get('secret') ||
    '';
  return Boolean(cronSecret && supplied && supplied === cronSecret);
}

function toSlimProduct(p) {
  const firstVar = Array.isArray(p.variants) && p.variants[0] ? p.variants[0] : {};
  return {
    id: p.id,
    title: p.title,
    price: Number(p.price ?? firstVar.price ?? 0),
    compare_at_price: Number(p.compare_at_price ?? p.old_price ?? firstVar.compare_at_price ?? 0) || undefined,
    image: p.image || (Array.isArray(p.images) ? p.images[0] : '') || '',
    product_type: p.product_type || '',
    category: p.category || '',
    tags: p.tags || '',
    sku: firstVar.sku || p.sku || '',
    visible: p.visible !== false,
    deleted: p.deleted === true ? true : undefined,
    available: p.available !== false,
    updatedAt: p.updatedAt,
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }
  if (!isAuthorized(request, env)) return adminDenied();

  const url = new URL(request.url);
  const batchSize = Math.min(80, Math.max(1, parseInt(url.searchParams.get('batch') || env.CJ_SYNC_MAX || '40', 10) || 40));
  const dryRun = url.searchParams.get('dry') === '1';

  const summary = {
    startedAt: new Date().toISOString(),
    batchSize,
    dryRun,
    totalCatalog: 0,
    cursorStart: 0,
    cursorNext: 0,
    checked: 0,
    updated: 0,
    hiddenDeleted: 0,
    hiddenOutOfStock: 0,
    restoredVisible: 0,
    unchanged: 0,
    errors: [],
  };

  try {
    const all = await readShardedCatalog(env);
    if (!Array.isArray(all) || !all.length) {
      return new Response(JSON.stringify({ ok: false, error: 'Could not load sharded catalog', summary }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
    summary.totalCatalog = all.length;

    // Load rotating cursor so every product gets updated automatically over time
    let cursor = parseInt(url.searchParams.get('cursor') || '-1', 10);
    if (!Number.isFinite(cursor) || cursor < 0) {
      cursor = 0;
      try {
        const kv = env.ORDERS_KV || env.BD_KV || null;
        if (kv) {
          const raw = await kv.get('catalog_sync_cursor_v1');
          if (raw) cursor = Number(JSON.parse(raw).cursor || 0) || 0;
        } else {
          const curFile = await ghRead(env, CURSOR_PATH);
          if (curFile && curFile.content) {
            cursor = Number(JSON.parse(b64DecodeUtf8(curFile.content)).cursor || 0) || 0;
          }
        }
      } catch {}
    }
    if (cursor >= all.length) cursor = 0;
    summary.cursorStart = cursor;

    const sliceEnd = Math.min(all.length, cursor + batchSize);
    let dirty = false;

    for (let i = cursor; i < sliceEnd; i++) {
      const prod = all[i];
      if (!prod) continue;
      summary.checked++;

      const firstSku =
        (Array.isArray(prod.variants) && prod.variants.map((v) => v && v.sku).find(Boolean)) ||
        prod.sku ||
        '';
      const cjPid =
        prod.cj_pid ||
        (String(prod.tags || '').match(/cj-pid-([^,\s]+)/) || [])[1] ||
        '';

      if (!cjPid && !firstSku) {
        summary.unchanged++;
        continue;
      }

      try {
        let cjRes = null;
        if (cjPid) {
          cjRes = await cjFetchMulti(env, '/product/query?pid=' + encodeURIComponent(cjPid));
        }
        if ((!cjRes || cjRes.code !== 200 || !cjRes.data) && firstSku) {
          cjRes = await cjFetchMulti(env, '/product/query?variantSku=' + encodeURIComponent(firstSku));
        }

        const code = cjRes && cjRes.code;
        const isDeletedOnCj =
          code === 1600014 ||
          code === 1602001 ||
          code === 1602002 ||
          code === 1602003 ||
          code === 16900202 ||
          (code === 200 && cjRes.data == null);

        if (isDeletedOnCj) {
          if (prod.visible !== false || prod.deleted !== true) {
            prod.visible = false;
            prod.deleted = true;
            prod.available = false;
            prod.hiddenReason = 'deleted_on_cj';
            prod.hiddenAt = new Date().toISOString();
            prod.updatedAt = new Date().toISOString();
            dirty = true;
            summary.hiddenDeleted++;
          } else {
            summary.unchanged++;
          }
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }

        // Skip transient CJ rate limits / errors without hiding valid products
        if (!cjRes || code !== 200 || !cjRes.data) {
          summary.errors.push({ id: prod.id, code, message: cjRes?.message || 'transient' });
          await new Promise((r) => setTimeout(r, 250));
          continue;
        }

        const cjData = cjRes.data;
        const cjVariants = Array.isArray(cjData.variants) ? cjData.variants : [];
        let prodChanged = false;
        let anyInStock = false;

        if (cjData.pid && !prod.cj_pid) {
          prod.cj_pid = String(cjData.pid);
          prodChanged = true;
        }

        if (Array.isArray(prod.variants) && prod.variants.length && cjVariants.length) {
          for (const v of prod.variants) {
            const match =
              cjVariants.find((cv) => v.sku && cv.variantSku && String(cv.variantSku) === String(v.sku)) ||
              cjVariants.find((cv) => (v.cj_vid || v.vid) && String(cv.vid) === String(v.cj_vid || v.vid)) ||
              null;
            if (!match) continue;
            if (match.vid && v.cj_vid !== String(match.vid)) {
              v.cj_vid = String(match.vid);
              prodChanged = true;
            }
            const stockRaw = match.inventoryNum ?? match.availableStock ?? match.stock;
            const stockNum = stockRaw != null ? Number(stockRaw) : null;
            const varInStock = stockNum == null || !Number.isFinite(stockNum) || stockNum > 0;
            if (varInStock) anyInStock = true;
            if (v.available !== varInStock) {
              v.available = varInStock;
              prodChanged = true;
            }
            if (stockNum != null && Number.isFinite(stockNum) && v.inventory_quantity !== stockNum) {
              v.inventory_quantity = stockNum;
              prodChanged = true;
            }
            const sellPrice = match.variantSellPrice ?? cjData.sellPrice;
            const computed = computeRetailPrice(sellPrice);
            if (computed && Math.abs(Number(v.price || 0) - computed) >= 0.5) {
              v.price = computed;
              prodChanged = true;
            }
          }
          // Sync top-level min retail price
          const validPrices = prod.variants.map((v) => Number(v.price || 0)).filter((n) => n > 0);
          if (validPrices.length) {
            const minP = Math.min(...validPrices);
            if (Math.abs(Number(prod.price || 0) - minP) >= 0.5) {
              prod.price = minP;
              prodChanged = true;
            }
          }
        } else {
          // Product has no local variant array — check CJ variants/stock directly
          anyInStock =
            cjVariants.length === 0 ||
            cjVariants.some((cv) => {
              const n = Number(cv.inventoryNum ?? cv.availableStock ?? cv.stock ?? 10);
              return !Number.isFinite(n) || n > 0;
            });
          const computed = computeRetailPrice(cjData.sellPrice);
          if (computed && Math.abs(Number(prod.price || 0) - computed) >= 0.5) {
            prod.price = computed;
            prodChanged = true;
          }
        }

        if (!anyInStock) {
          if (prod.visible !== false) {
            prod.visible = false;
            prod.available = false;
            prod.hiddenReason = 'out_of_stock';
            prod.hiddenAt = new Date().toISOString();
            prodChanged = true;
            summary.hiddenOutOfStock++;
          }
        } else if (prod.visible === false && (prod.hiddenReason === 'out_of_stock' || prod.hiddenReason === 'deleted_on_cj')) {
          prod.visible = true;
          prod.deleted = false;
          prod.available = true;
          delete prod.hiddenReason;
          delete prod.hiddenAt;
          prodChanged = true;
          summary.restoredVisible++;
        }

        if (prodChanged) {
          prod.updatedAt = new Date().toISOString();
          dirty = true;
          summary.updated++;
        } else {
          summary.unchanged++;
        }

        await new Promise((r) => setTimeout(r, 200));
      } catch (pe) {
        summary.errors.push({ id: prod.id, error: pe.message });
      }
    }

    summary.cursorNext = sliceEnd >= all.length ? 0 : sliceEnd;

    if (!dryRun) {
      if (dirty) {
        await writeCatalogFromGithub(
          env,
          all,
          `auto-catalog-sync: updated ${summary.updated}, hidden ${summary.hiddenDeleted + summary.hiddenOutOfStock}`
        );
        // Also keep slim catalog shards in sync so products.html hides deleted/OOS items immediately
        const visibleSlim = all.filter((p) => p && p.visible !== false && p.deleted !== true).map(toSlimProduct);
        const slimShards = splitShards(visibleSlim, SLIM_SHARD_SIZE);
        for (let s = 0; s < slimShards.length; s++) {
          await ghWrite(
            env,
            `products-slim-${s}.json`,
            JSON.stringify(slimShards[s]),
            `auto-catalog-sync: update slim shard ${s}`
          );
        }
        await ghWrite(
          env,
          'products-slim.json',
          JSON.stringify({ shards: slimShards.length, count: visibleSlim.length }),
          'auto-catalog-sync: update slim manifest'
        );
      }

      // Persist cursor for next scheduled run
      const cursorState = JSON.stringify({
        cursor: summary.cursorNext,
        lastRunAt: new Date().toISOString(),
        totalCatalog: all.length,
        lastSummary: {
          updated: summary.updated,
          hiddenDeleted: summary.hiddenDeleted,
          hiddenOutOfStock: summary.hiddenOutOfStock,
          restoredVisible: summary.restoredVisible,
        },
      });
      const kv = env.ORDERS_KV || env.BD_KV || null;
      if (kv) {
        await kv.put('catalog_sync_cursor_v1', cursorState).catch(() => null);
      } else {
        await ghWrite(env, CURSOR_PATH, cursorState, 'auto-catalog-sync: advance cursor').catch(() => null);
      }
      await appendSyncLog(env, {
        action: 'auto-catalog-sync',
        checked: summary.checked,
        updated: summary.updated,
        hiddenDeleted: summary.hiddenDeleted,
        hiddenOutOfStock: summary.hiddenOutOfStock,
        cursorNext: summary.cursorNext,
      }).catch(() => null);
    }

    summary.finishedAt = new Date().toISOString();
    return new Response(JSON.stringify({ ok: true, summary }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message, summary }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
