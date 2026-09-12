// /api/reprice-suggest.js — Cloudflare Pages Function
// Reprice ALL Shopify products to CJ `suggestSellPrice` × 1.5 → ceil whole dollar (AUD).
// Website-only effect via Shopify as source-of-truth (website catalog is generated from Shopify).
//
// Auth: X-Admin-Pin (or ?pin= / Bearer), matching env ADMIN_PIN.
// Endpoints:
//   GET /api/reprice-suggest?action=start-bulk    -> launch Shopify GraphQL bulk query
//   GET /api/reprice-suggest?action=poll-bulk     -> poll; on COMPLETED download+parse queue
//   GET /api/reprice-suggest?action=scan          -> start-bulk THEN poll-bulk (status only)
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
  return { queue: [], total: 0, done: 0, aud0: 0, skipNoSku: 0, skipNoSug: 0, failed: 0, updated: 0, opId: null, errors: [] };
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
    opId: raw.opId || null,
    errors: Array.isArray(raw.errors) ? raw.errors.slice(0, 20) : [],
  };
}

function json(o, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}

// ── Shopify GraphQL bulk query (single async op, avoids REST 2/sec limits) ──
async function startBulk(env) {
  const mutation = `
mutation {
  bulkOperationRunQuery(query: """{
    products {
      edges {
        node {
          id
          title
          variants(first: 250) { edges { node { id sku price } } }
        }
      }
    }
  }""") {
    bulkOperation { id status }
    userErrors { field message }
  }
}`;
  const r = await shopifyFetch(env, '/graphql.json', { method: 'POST', body: JSON.stringify({ query: mutation }) });
  const j = r.body;
  const op = j?.data?.bulkOperationRunQuery?.bulkOperation;
  const errs = j?.data?.bulkOperationRunQuery?.userErrors || [];
  if (!op || !op.id) throw new Error('bulk op failed: ' + (errs.map(e => e.message).join('; ') || JSON.stringify(j)));
  return String(op.id);
}

async function bulkStatus(env, opId) {
  const q = `query($id: ID!) { node(id: $id) { ... on BulkOperation { id status objectCount errorCode url } } }`;
  const { body } = await shopifyFetch(env, '/graphql.json', {
    method: 'POST',
    body: JSON.stringify({ query: q, variables: { id: opId } }),
  });
  return body?.data?.node || null;
}

function parseRows(txt) {
  const products = new Map();
  const rows = [];
  for (const line of txt.split('\n')) {
    const s = line.trim();
    if (!s) continue;
    try { rows.push(JSON.parse(s)); } catch {}
  }
  for (const r of rows) {
    if (r.__parentId) continue;
    const m = /(\d+)$/.exec(String(r.id || ''));
    if (!m) continue;
    products.set(m[1], { shopProductId: m[1], title: r.title || '', variants: [] });
  }
  for (const r of rows) {
    if (!r.__parentId) continue;
    const m = /(\d+)$/.exec(String(r.__parentId || ''));
    if (!m) continue;
    const p = products.get(m[1]);
    if (!p) continue;
    p.variants.push({ variantId: String(r.id || ''), sku: r.sku != null ? String(r.sku) : '', oldPrice: r.price != null ? String(r.price) : '' });
  }
  const queue = [];
  for (const [sid, p] of products) {
    for (const v of p.variants) {
      queue.push({ shopProductId: sid, variantId: v.variantId, sku: v.sku, oldPrice: v.oldPrice, title: (p.title || '').slice(0, 60) });
    }
  }
  return queue;
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
      const remaining = Math.max(0, st.total - st.done - st.failed);
      return json({ ok: true, ...st, remaining, errors: st.errors.slice(0, 10) });
    }

    if (action === 'start-bulk') {
      const opId = await startBulk(env);
      st.opId = opId;
      await shopMetaSet(env, STATE_KEY, st);
      return json({ ok: true, opId, phase: 'started' });
    }

    if (action === 'poll-bulk') {
      if (!st.opId) return json({ ok: false, error: 'no opId; run start-bulk first' }, 400);
      const op = await bulkStatus(env, st.opId);
      if (!op) return json({ ok: false, error: 'bulk op not found (maybe expired)' }, 400);
      if (op.status !== 'COMPLETED') {
        return json({ ok: true, phase: op.status, opId: st.opId, objectCount: op.objectCount, errorCode: op.errorCode });
      }
      if (op.errorCode) return json({ ok: false, error: 'bulk error ' + op.errorCode }, 500);
      const r = await fetch(op.url);
      if (!r.ok) return json({ ok: false, error: 'bulk download ' + r.status }, 500);
      const txt = await r.text();
      st.queue = parseRows(txt);
      st.total = st.queue.length;
      st.done = 0; st.failed = 0; st.updated = 0; st.skipNoSku = 0; st.skipNoSug = 0; st.aud0 = 0; st.errors = [];
      await shopMetaSet(env, STATE_KEY, st);
      return json({ ok: true, phase: 'COMPLETED', total: st.total, withSku: st.queue.filter(i => i.sku).length });
    }

    if (action === 'scan') {
      if (!st.opId) {
        const opId = await startBulk(env);
        st.opId = opId;
        await shopMetaSet(env, STATE_KEY, st);
        return json({ ok: true, opId, phase: 'started', hint: 'call poll-bulk to collect' });
      }
      const op = await bulkStatus(env, st.opId);
      return json({ ok: true, phase: op?.status || 'unknown', opId: st.opId });
    }

    if (action === 'run') {
      if (!st.queue || !st.queue.length) return json({ ok: false, error: 'no queue; run start-bulk then poll-bulk' }, 400);
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
            processed++; continue;
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
