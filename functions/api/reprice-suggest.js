// /api/reprice-suggest.js — Cloudflare Pages Function
// Reprice ALL Shopify products to CJ `suggestSellPrice` × 1.5 → ceil whole dollar (AUD).
// Website-only effect via Shopify as source-of-truth (website catalog is generated from Shopify).
//
// Auth: X-Admin-Pin (or ?pin= / Bearer), matching env ADMIN_PIN.
// Endpoints:
//   GET /api/reprice-suggest?action=scan         -> pull Shopify product+SKU list, build queue
//   GET /api/reprice-suggest?action=run&limit=N   -> process N queued products (throttled)
//   GET /api/reprice-suggest?action=status        -> persisted progress
//   GET /api/reprice-suggest?action=reset         -> clear progress
//
// Pricing: usdSug = CJ suggestSellPrice (product-level) OR variants[0].variantSugSellPrice
//          aud    = ceil(usdSug * 1.5)
// Resumable via Shopify metafield namespace `zstate` key `reprice-suggest`.

import { corsHeaders, isAdmin, adminDenied, shopifyFetch, cjFetchMulti, shopMetaGet, shopMetaSet } from '../_sync-lib.js';

const STATE_KEY = 'reprice-suggest';
const SHOPIFY_PAUSE_MS = 1600;   // respect 2/sec Shopify limit
const CJ_PAUSE_MS = 1200;        // respect 1/sec CJ QPS
const MAX_PER_RUN = 40;          // safe within Cloudflare CPU budget

function usdToAudWhole(usd) {
  const n = parseFloat(usd);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.ceil(n * 1.5);
}

function emptyState() {
  return { queue: [], total: 0, done: 0, aud0: 0, skipNoSku: 0, skipNoSug: 0, failed: 0, updated: 0, errors: [] };
}

async function loadState(env) {
  const e = await shopMetaGet(env, STATE_KEY);
  let raw = {};
  if (e && e.value) { try { raw = JSON.parse(e.value); } catch {} }
  raw = raw && typeof raw === 'object' ? raw : {};
  return {
    queue: Array.isArray(raw.queue) ? raw.queue : [],
    total: Number(raw.total) || 0,
    done: Number(raw.done) || 0,
    aud0: Number(raw.aud0) || 0,
    skipNoSku: Number(raw.skipNoSku) || 0,
    skipNoSug: Number(raw.skipNoSug) || 0,
    failed: Number(raw.failed) || 0,
    updated: Number(raw.updated) || 0,
    errors: Array.isArray(raw.errors) ? raw.errors.slice(0, 20) : [],
  };
}

function json(o, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();

  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'status';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || String(MAX_PER_RUN), 10) || MAX_PER_RUN, MAX_PER_RUN);

  try {
    const st = await loadState(env);

    if (action === 'reset') {
      await shopMetaSet(env, STATE_KEY, emptyState());
      return json({ ok: true, reset: true });
    }

    if (action === 'status') {
      const remaining = st.total - st.done - st.failed;
      return json({ ok: true, ...st, remaining: Math.max(0, remaining), errors: st.errors });
    }

    if (action === 'scan') {
      // Pull all Shopify products (id + variants[].id + variants[].sku + variants[].price).
      const items = [];
      let sinceId = 0;
      for (let page = 0; page < 200; page++) {
        const { body } = await shopifyFetch(env, `/products.json?limit=250&since_id=${sinceId}&fields=id,title,variants`);
        const prods = body?.products || [];
        if (!prods.length) break;
        for (const p of prods) {
          const vs = Array.isArray(p.variants) ? p.variants : [];
          for (const v of vs) {
            items.push({
              shopProductId: p.id,
              variantId: v.id,
              sku: v.sku || '',
              oldPrice: v.price,
              title: (p.title || '').slice(0, 60),
            });
          }
        }
        sinceId = prods[prods.length - 1].id;
        if (prods.length < 250) break;
      }
      st.queue = items;
      st.total = items.length;
      st.done = 0; st.failed = 0; st.updated = 0; st.skipNoSku = 0; st.skipNoSug = 0; st.aud0 = 0; st.errors = [];
      await shopMetaSet(env, STATE_KEY, st);
      return json({ ok: true, total: items.length, withSku: items.filter(i => i.sku).length });
    }

    if (action === 'run') {
      if (!st.queue || !st.queue.length) return json({ ok: false, error: 'no queue; run action=scan first' }, 400);
      const batch = st.queue.slice(st.done, st.done + limit);
      let processed = 0;

      for (const item of batch) {
        try {
          if (!item.sku) {
            st.skipNoSku++; processed++; continue;
          }
          const cj = await cjFetchMulti(env, '/product/query?variantSku=' + encodeURIComponent(item.sku));
          await new Promise(r => setTimeout(r, CJ_PAUSE_MS));

          const d = cj?.data;
          const code = cj?.code;
          if (code === 16900500 || code === 429 || code === 1600200) {
            processed++;
            continue;
          }
          const sugProduct = d?.suggestSellPrice != null ? parseFloat(d.suggestSellPrice) : NaN;
          const sugVariant = (Array.isArray(d?.variants) && d.variants[0]?.variantSugSellPrice != null)
            ? parseFloat(d.variants[0].variantSugSellPrice)
            : NaN;
          const usdSug = Number.isFinite(sugProduct) && sugProduct > 0 ? sugProduct
                       : Number.isFinite(sugVariant) && sugVariant > 0 ? sugVariant
                       : null;

          if (usdSug == null) {
            st.skipNoSug++; processed++; continue;
          }
          const aud = usdToAudWhole(usdSug);
          if (aud == null || aud <= 0) {
            st.aud0++; processed++; continue;
          }
          const audStr = String(aud);
          if (audStr === String(item.oldPrice)) {
            processed++; continue;
          }

          const put = await shopifyFetch(env, `/variants/${item.variantId}.json`, {
            method: 'PUT',
            body: JSON.stringify({ variant: { id: item.variantId, price: audStr } }),
          });
          await new Promise(r => setTimeout(r, SHOPIFY_PAUSE_MS));
          if (put && put.ok) {
            st.updated++;
          } else {
            st.failed++;
            st.errors.unshift({ variantId: item.variantId, sku: item.sku, err: put ? put.status : 'no-response' });
            st.errors = st.errors.slice(0, 20);
          }
          processed++;
        } catch (e) {
          st.failed++;
          st.errors.unshift({ sku: item.sku, err: String(e?.message || e) });
          st.errors = st.errors.slice(0, 20);
        }
      }

      st.done += processed;
      await shopMetaSet(env, STATE_KEY, st);
      const remaining = Math.max(0, st.total - st.done - st.failed);
      return json({ ok: true, processed, done: st.done, total: st.total, updated: st.updated, failed: st.failed, skipNoSku: st.skipNoSku, skipNoSug: st.skipNoSug, remaining, errors: st.errors.slice(0, 5) });
    }

    return json({ ok: false, error: 'unknown action: ' + action }, 400);
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}
