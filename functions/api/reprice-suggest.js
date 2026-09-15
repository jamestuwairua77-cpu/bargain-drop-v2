// /api/reprice-suggest.js — Cloudflare Pages Function
// Reprice ALL Shopify products to CJ `suggestSellPrice` × 1.5 → ceil whole dollar (AUD).
//
// v3 (2026-09-15): BULK WRITE via productVariantsBulkUpdate (grouped by product). CJ lookups
// are the only per-item cost (1 req/sec QPS); Shopify writes are batched per-product, so a
// product with N variants is one GraphQL call instead of N REST PUTs. CJ decoupled from writes.

import { corsHeaders, isAdmin, adminDenied, shopifyFetch, cjFetchMulti, shopMetaGet, shopMetaSet } from '../_sync-lib.js';

const STATE_KEY = 'reprice-suggest';
const CJ_PAUSE_MS = 1000;      // CJ free tier = 1 req/sec per IP
const MAX_PER_RUN = 120;       // lookups per run (QPS-bound)
const RUN_BUDGET_MS = 55000;   // keep margin under CF ~50s hard limit
const MAX_RETRY = 20000;

function usdToAudWhole(usd) {
  const n = parseFloat(usd);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.ceil(n * 1.5);
}

function emptyState() {
  return { total: 0, done: 0, aud0: 0, skipNoSku: 0, skipNoSug: 0, failed: 0, updated: 0, opId: null, url: null, errors: [], retry: [] };
}

async function loadState(env) {
  const e = await shopMetaGet(env, STATE_KEY);
  let raw = {};
  if (e && e.value) { try { raw = JSON.parse(e.value); } catch {} }
  raw = raw && typeof raw === 'object' ? raw : {};
  return {
    total: Number(raw.total) || 0,
    done: Number(raw.done) || 0,
    aud0: Number(raw.aud0) || 0,
    skipNoSku: Number(raw.skipNoSku) || 0,
    skipNoSug: Number(raw.skipNoSug) || 0,
    failed: Number(raw.failed) || 0,
    updated: Number(raw.updated) || 0,
    opId: raw.opId || null,
    url: raw.url || null,
    errors: Array.isArray(raw.errors) ? raw.errors.slice(0, 30) : [],
    retry: Array.isArray(raw.retry) ? raw.retry.slice(0, MAX_RETRY) : [],
  };
}

function json(o, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}

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
  let op = null, errs = [], lastThrottled = false;
  for (let attempt = 0; attempt < 12; attempt++) {
    const r = await shopifyFetch(env, '/graphql.json', { method: 'POST', body: JSON.stringify({ query: mutation }) });
    const j = r.body;
    const errArr = j?.errors || [];
    if (errArr.length && errArr.some(e => (e?.extensions?.code) === 'THROTTLED')) {
      lastThrottled = true;
      await new Promise(r2 => setTimeout(r2, 1500 * (attempt + 1)));
      continue;
    }
    lastThrottled = false;
    op = j?.data?.bulkOperationRunQuery?.bulkOperation;
    errs = j?.data?.bulkOperationRunQuery?.userErrors || [];
    if (op && op.id) break;
    await new Promise(r2 => setTimeout(r2, 1000 * (attempt + 1)));
  }
  if (!op || !op.id) throw new Error('bulk op failed' + (lastThrottled ? ' (THROTTLED)' : '') + ': ' + (errs.map(e => e.message).join('; ') || 'no id'));
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
    products.set(m[1], { title: r.title || '', variants: [] });
  }
  for (const r of rows) {
    if (!r.__parentId) continue;
    const m = /(\d+)$/.exec(String(r.__parentId || ''));
    if (!m) continue;
    const p = products.get(m[1]);
    if (!p) continue;
    const vm = /(\d+)$/.exec(String(r.id || ''));
    p.variants.push({ variantId: vm ? vm[1] : String(r.id || ''), sku: r.sku != null ? String(r.sku) : '', oldPrice: r.price != null ? String(r.price) : '' });
  }
  const queue = [];
  for (const [sid, p] of products) {
    for (const v of p.variants) {
      queue.push({ shopProductId: sid, variantId: v.variantId, sku: v.sku, oldPrice: v.oldPrice, title: (p.title || '').slice(0, 60) });
    }
  }
  return queue;
}

// CJ lookup only — returns { done, aud?, shopProductId?, variantId? }, no Shopify write.
async function lookUpCj(env, item) {
  if (!item.sku) return { done: 'skipNoSku' };
  const cj = await cjFetchMulti(env, '/product/query?variantSku=' + encodeURIComponent(item.sku));
  await new Promise(r2 => setTimeout(r2, CJ_PAUSE_MS));

  const d = cj?.data;
  const code = cj?.code;
  if (code === 429 || code === 1600200) return { done: 'cjRateLimited', err: code };
  if (code === 16900500) return { done: 'cjskip', err: code };

  const sugProduct = d?.suggestSellPrice != null ? parseFloat(d.suggestSellPrice) : NaN;
  const sugVariant = (Array.isArray(d?.variants) && d.variants[0]?.variantSugSellPrice != null)
    ? parseFloat(d.variants[0].variantSugSellPrice)
    : NaN;
  const usdSug = Number.isFinite(sugProduct) && sugProduct > 0 ? sugProduct
               : Number.isFinite(sugVariant) && sugVariant > 0 ? sugVariant
               : null;

  if (usdSug == null) return { done: 'skipNoSug' };
  const aud = usdToAudWhole(usdSug);
  if (aud == null || aud <= 0) return { done: 'aud0' };
  const audStr = String(aud);
  if (audStr === String(item.oldPrice)) return { done: 'same' };
  return { done: 'price', aud: audStr, shopProductId: item.shopProductId, variantId: item.variantId };
}

const gidVariant = (id) => /^gid:/.test(id) ? id : `gid://shopify/ProductVariant/${id}`;
const gidProduct = (id) => /^gid:/.test(id) ? id : `gid://shopify/Product/${id}`;

// Batch-apply price changes grouped by product via productVariantsBulkUpdate.
async function applyBatch(env, changes) {
  if (!changes.length) return { updated: 0, failed: 0, errors: [] };
  let updatedN = 0, failedN = 0;
  const errors = [];

  // Group by product
  const byProduct = new Map();
  for (const c of changes) {
    const pid = c.shopProductId || 'unknown';
    if (!byProduct.has(pid)) byProduct.set(pid, []);
    byProduct.get(pid).push(c);
  }

  for (const [pid, items] of byProduct) {
    const variants = items.map(c => ({ id: gidVariant(c.variantId), price: c.aud }));
    const q = `
      mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants, allowPartialUpdates: true) {
          product { id }
          productVariants { id price }
          userErrors { field message }
        }
      }
    `;
    const r = await shopifyFetch(env, '/graphql.json', {
      method: 'POST',
      body: JSON.stringify({ query: q, variables: { productId: gidProduct(pid), variants } }),
    });
    const b = r.body;
    if (b?.errors?.length) {
      failedN += items.length;
      if (errors.length < 30) errors.push('graphql: ' + (b.errors[0]?.message || 'unknown'));
      continue;
    }
    const payload = b?.data?.productVariantsBulkUpdate;
    if (!payload) {
      failedN += items.length;
      if (errors.length < 30) errors.push('no payload for product ' + pid);
      continue;
    }
    const ue = payload.userErrors || [];
    if (ue.length) {
      const okCount = Array.isArray(payload.productVariants) ? payload.productVariants.length : 0;
      updatedN += okCount;
      failedN += Math.max(0, items.length - okCount);
      for (const e of ue) { if (errors.length < 30 && e?.message) errors.push(e.message); }
    } else {
      const okCount = Array.isArray(payload.productVariants) ? payload.productVariants.length : items.length;
      updatedN += okCount;
      if (okCount !== items.length) failedN += (items.length - okCount);
    }
  }
  return { updated: updatedN, failed: failedN, errors };
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
      const remaining = Math.max(0, st.total - st.done - st.retry.length);
      return json({ ok: true, ...st, remaining, errors: st.errors.slice(0, 10) });
    }

    if (action === 'start-bulk') {
      const opId = await startBulk(env);
      st.opId = opId;
      st.url = null;
      await shopMetaSet(env, STATE_KEY, st);
      return json({ ok: true, opId, phase: 'started' });
    }

    if (action === 'poll-bulk') {
      if (!st.opId) {
        if (st.url && st.total) return json({ ok: true, phase: 'COMPLETED', total: st.total, note: 'already persisted' });
        return json({ ok: false, error: 'no opId; run start-bulk first' }, 400);
      }
      const op = await bulkStatus(env, st.opId);
      if (!op) return json({ ok: false, error: 'bulk op not found (maybe expired)' }, 400);
      if (op.status !== 'COMPLETED') {
        return json({ ok: true, phase: op.status, opId: st.opId, objectCount: op.objectCount, errorCode: op.errorCode });
      }
      if (op.errorCode) return json({ ok: false, error: 'bulk error ' + op.errorCode }, 500);
      if (!op.url) return json({ ok: false, error: 'bulk op COMPLETED but no url' }, 500);
      const r = await fetch(op.url);
      if (!r.ok) return json({ ok: false, error: 'bulk download ' + r.status }, 500);
      const txt = await r.text();
      const queue = parseRows(txt);
      st.url = op.url;
      st.total = queue.length;
      st.done = 0; st.failed = 0; st.updated = 0; st.skipNoSku = 0; st.skipNoSug = 0; st.aud0 = 0; st.errors = [];
      st.retry = [];
      await shopMetaSet(env, STATE_KEY, st);
      return json({ ok: true, phase: 'COMPLETED', total: st.total, withSku: queue.filter(i => i.sku).length });
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
      if (!st.url) return json({ ok: false, error: 'no persisted bulk url; run poll-bulk first' }, 400);
      if (!st.total) return json({ ok: false, error: 'queue empty (total=0)' }, 400);

      const r = await fetch(st.url);
      if (!r.ok) return json({ ok: false, error: 'bulk re-download ' + r.status }, 500);
      const txt = await r.text();
      const queue = parseRows(txt);

      let updatedNow = 0, failedNow = 0, skipNoSkuNow = 0, skipNoSugNow = 0, aud0Now = 0, cjSkipNow = 0, retriedNow = 0, processedNow = 0;
      const deadline = Date.now() + RUN_BUDGET_MS;
      const nextRetry = [];
      const changes = [];
      let rateLimited = false;

      // Phase 1: CJ-look up the persisted retry queue first
      while (st.retry.length && Date.now() <= deadline) {
        const item = st.retry.shift();
        const res = await lookUpCj(env, item);
        processedNow++;
        if (res.done === 'price') { changes.push(res); retriedNow++; }
        else if (res.done === 'skipNoSku') { skipNoSkuNow++; retriedNow++; }
        else if (res.done === 'skipNoSug') { skipNoSugNow++; retriedNow++; }
        else if (res.done === 'aud0') { aud0Now++; retriedNow++; }
        else if (res.done === 'same') { retriedNow++; }
        else if (res.done === 'cjskip') { cjSkipNow++; retriedNow++; }
        else if (res.done === 'cjRateLimited') {
          rateLimited = true;
          nextRetry.push(item);
          if (st.retry.length) nextRetry.push(...st.retry);
          st.retry = [];
          break;
        }
      }

      // Phase 2: advance the main cursor (CJ lookups), skipped if rate-limited
      let idx = st.done;
      if (!rateLimited) {
        const start = st.done;
        const end = Math.min(st.total, start + limit);
        for (idx = start; idx < end; idx++) {
          if (Date.now() > deadline) break;
          const item = queue[idx];
          const res = await lookUpCj(env, item);
          processedNow++;
          if (res.done === 'price') { changes.push(res); }
          else if (res.done === 'skipNoSku') { skipNoSkuNow++; }
          else if (res.done === 'skipNoSug') { skipNoSugNow++; }
          else if (res.done === 'aud0') { aud0Now++; }
          else if (res.done === 'same') { /* no-op */ }
          else if (res.done === 'cjskip') { cjSkipNow++; }
          else if (res.done === 'cjRateLimited') {
            rateLimited = true;
            nextRetry.push(item);
            for (let k = idx + 1; k < end; k++) nextRetry.push(queue[k]);
            break;
          }
        }
        st.done = idx;
      }

      // Phase 3: bulk-apply all collected price changes to Shopify (grouped by product)
      const applied = await applyBatch(env, changes);
      updatedNow += applied.updated;
      failedNow += applied.failed;
      if (applied.errors.length) {
        for (const e of applied.errors) { st.errors.unshift({ err: e }); }
        st.errors = st.errors.slice(0, 30);
      }

      if (nextRetry.length) st.retry = nextRetry.slice(0, MAX_RETRY);

      st.updated += updatedNow;
      st.failed += failedNow;
      st.skipNoSku += skipNoSkuNow;
      st.skipNoSug += skipNoSugNow;
      st.aud0 += aud0Now;
      await shopMetaSet(env, STATE_KEY, st);
      const remaining = Math.max(0, st.total - st.done - st.retry.length);
      return json({
        ok: true,
        processed: processedNow,
        retried: retriedNow,
        done: st.done,
        total: st.total,
        updated: st.updated,
        failed: st.failed,
        skipNoSku: st.skipNoSku,
        skipNoSug: st.skipNoSug,
        retryQueued: st.retry.length,
        rateLimited,
        remaining,
        errors: st.errors.slice(0, 5),
      });
    }

    return json({ ok: false, error: 'unknown action: ' + action }, 400);
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}
