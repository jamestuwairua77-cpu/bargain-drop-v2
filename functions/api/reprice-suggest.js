// /api/reprice-suggest.js — Cloudflare Pages Function
// Reprice ALL Shopify products to CJ `suggestSellPrice` × 1.5 → ceil whole dollar (AUD).
//
// v8 (2026-09-15): MCP-token lookups at ~4 req/sec (Prime tier) — 4x faster than apiKey 1/sec.
// Instead of one CJ call per variant (?variantSku=SKU), we group variants by Shopify
// product and issue ONE CJ lookup per product (first variant's SKU). CJ's product/query
// response already contains the full sibling-variant list (variantSku + variantSugSellPrice),
// so a single call resolves the suggested price for every variant in that product.
// This collapses ~76,788 lookups to ~16,307 (the product count). Shopify writes are
// batched per-product via productVariantsBulkUpdate, with THROTTLED + "currently being
// modified" (concurrency-lock) retry + pacing.
//
// PRICING: CJ returns prices in USD (`suggestSellPrice` / `variantSugSellPrice`).
// We convert to AUD via `ceil(usd * 1.5)` (whole Australian dollars).

import { corsHeaders, isAdmin, adminDenied, shopifyFetch, cjFetchMulti, shopMetaGet, shopMetaSet } from '../_sync-lib.js';

const STATE_KEY = 'reprice-suggest';
const CJ_PAUSE_MS = 250;       // MCP tokens allow ~4 req/sec (Prime tier)
const MAX_PER_RUN = 40;        // PRODUCTS per run (fits ~50s CF limit incl. write pacing)
const RUN_BUDGET_MS = 28000;   // cap CJ phase; leaves ~20s for the write phase under CF ~50s
const MAX_RETRY = 20000;

// USD → AUD: whole Australian dollars via ceil(usd * 1.5).
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

// Parse bulk JSONL into a queue of PRODUCTS (one entry per Shopify product, with its variants).
function parseProducts(txt) {
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
    queue.push({ shopProductId: sid, title: (p.title || '').slice(0, 60), variants: p.variants });
  }
  return queue;
}

// ONE CJ lookup per PRODUCT. Uses the first variant's SKU; CJ returns the full
// sibling variant list (variantSku + variantSugSellPrice). We map back by SKU and
// emit a `price` change (AUD via usdToAudWhole) for every variant that differs.
function processProduct(env, item, cjData) {
  const d = cjData?.data;
  const sugs = {}; // sku -> suggested USD price
  const cjVariants = Array.isArray(d?.variants) ? d.variants : [];
  for (const v of cjVariants) {
    const sku = v?.variantSku != null ? String(v.variantSku) : '';
    const sug = v?.variantSugSellPrice != null ? parseFloat(v.variantSugSellPrice) : NaN;
    if (sku && Number.isFinite(sug) && sug > 0) sugs[sku] = sug;
  }
  const productSug = d?.suggestSellPrice != null ? parseFloat(d.suggestSellPrice) : NaN;

  const changes = [];
  let skipNoSku = 0, skipNoSug = 0, aud0 = 0, same = 0;
  for (const v of item.variants) {
    if (!v.sku) { skipNoSku++; continue; }
    let usdSug = sugs[v.sku];
    if (usdSug == null && Number.isFinite(productSug) && productSug > 0) usdSug = productSug;
    if (usdSug == null) { skipNoSug++; continue; }
    const aud = usdToAudWhole(usdSug);   // <-- USD → AUD conversion
    if (aud == null || aud <= 0) { aud0++; continue; }
    const audStr = String(aud);
    if (audStr === String(v.oldPrice)) { same++; continue; }
    changes.push({ done: 'price', aud: audStr, shopProductId: item.shopProductId, variantId: v.variantId });
  }
  return { changes, skipNoSku, skipNoSug, aud0, same };
}

const gidVariant = (id) => /^gid:/.test(id) ? id : `gid://shopify/ProductVariant/${id}`;
const gidProduct = (id) => /^gid:/.test(id) ? id : `gid://shopify/Product/${id}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Batch-apply price changes grouped by product via productVariantsBulkUpdate.
async function applyBatch(env, changes) {
  if (!changes.length) return { updated: 0, failed: 0, errors: [] };
  let updatedN = 0, failedN = 0;
  const errors = [];

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

    // Retry on GraphQL THROTTLED (HTTP 200 with extensions.code=THROTTLED) — the
    // admin API cost bucket overflows when we hammer one bulk update per product —
    // AND on "currently being modified" (a concurrency lock when two workers write
    // the same product simultaneously).
    let payload = null, rawErrors = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const r = await shopifyFetch(env, '/graphql.json', {
        method: 'POST',
        body: JSON.stringify({ query: q, variables: { productId: gidProduct(pid), variants } }),
      });
      const b = r.body;
      if (b?.errors?.length) {
        const throttled = b.errors.some(e => (e?.extensions?.code) === 'THROTTLED' || /throttl/i.test(e?.message || ''));
        const busy = b.errors.some(e => /being modified|currently being modified|try again later/i.test(e?.message || ''));
        if ((throttled || busy) && attempt < 5) {
          await sleep(2000 * (attempt + 1));
          continue;
        }
        rawErrors = b.errors;
        break;
      }
      payload = b?.data?.productVariantsBulkUpdate;
      if (payload) break;
      // no payload and no errors — brief pause and retry
      if (attempt < 3) { await sleep(500 * (attempt + 1)); continue; }
      break;
    }

    if (rawErrors && !payload) {
      failedN += items.length;
      if (errors.length < 30) errors.push('graphql: ' + (rawErrors[0]?.message || 'unknown'));
    } else if (!payload) {
      failedN += items.length;
      if (errors.length < 30) errors.push('no payload for product ' + pid);
    } else {
      const ue = payload.userErrors || [];
      const okCount = Array.isArray(payload.productVariants) ? payload.productVariants.length : items.length;
      updatedN += okCount;
      if (ue.length) {
        failedN += Math.max(0, items.length - okCount);
        for (const e of ue) { if (errors.length < 30 && e?.message) errors.push(e.message); }
      } else if (okCount !== items.length) {
        failedN += (items.length - okCount);
      }
    }

    // Pace writes to stay under the GraphQL cost throttle.
    await sleep(200);
  }
  return { updated: updatedN, failed: failedN, errors };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
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
      const queue = parseProducts(txt);
      st.url = op.url;
      st.total = queue.length;
      st.done = 0; st.failed = 0; st.updated = 0; st.skipNoSku = 0; st.skipNoSug = 0; st.aud0 = 0; st.errors = [];
      st.retry = [];
      await shopMetaSet(env, STATE_KEY, st);
      const totalVariants = queue.reduce((a, p) => a + p.variants.length, 0);
      return json({ ok: true, phase: 'COMPLETED', total: st.total, totalVariants, withSku: queue.reduce((a, p) => a + p.variants.filter(v => v.sku).length, 0) });
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
      const queue = parseProducts(txt);

      let updatedNow = 0, failedNow = 0, skipNoSkuNow = 0, skipNoSugNow = 0, aud0Now = 0, cjSkipNow = 0, retriedNow = 0, processedNow = 0;
      const deadline = Date.now() + RUN_BUDGET_MS;
      const nextRetry = [];
      const changes = [];
      let rateLimited = false;

      // Helper: resolve a single product (one CJ lookup) into changes + counters.
      async function resolveProduct(item) {
        const firstSku = (item.variants.find(v => v.sku) || {}).sku;
        if (!firstSku) { return { skipNoSku: item.variants.length, other: {} }; }
        const cj = await cjFetchMulti(env, '/product/query?variantSku=' + encodeURIComponent(firstSku));
        await new Promise(r2 => setTimeout(r2, CJ_PAUSE_MS));
        const code = cj?.code;
        if (code === 429 || code === 1600200) return { rateLimited: true, item };
        if (code === 16900500) return { cjskip: true };
        return processProduct(env, item, cj);
      }

      // Phase 1: persisted retry queue (products) first
      while (st.retry.length && Date.now() <= deadline) {
        const item = st.retry.shift();
        const res = await resolveProduct(item);
        processedNow++;
        if (res.rateLimited) {
          rateLimited = true;
          nextRetry.push(res.item);
          if (st.retry.length) nextRetry.push(...st.retry);
          st.retry = [];
          break;
        }
        if (res.cjskip) { cjSkipNow++; retriedNow++; continue; }
        if (res.other) { retriedNow++; continue; }
        changes.push(...res.changes);
        skipNoSkuNow += res.skipNoSku;
        skipNoSugNow += res.skipNoSug;
        aud0Now += res.aud0;
        retriedNow++;
      }

      // Phase 2: advance the main product cursor
      let idx = st.done;
      if (!rateLimited) {
        const start = st.done;
        const end = Math.min(st.total, start + limit);
        for (idx = start; idx < end; idx++) {
          if (Date.now() > deadline) break;
          const item = queue[idx];
          const res = await resolveProduct(item);
          processedNow++;
          if (res.rateLimited) {
            rateLimited = true;
            nextRetry.push(res.item);
            for (let k = idx + 1; k < end; k++) nextRetry.push(queue[k]);
            break;
          }
          if (res.cjskip) { cjSkipNow++; continue; }
          if (res.other) { continue; }
          changes.push(...res.changes);
          skipNoSkuNow += res.skipNoSku;
          skipNoSugNow += res.skipNoSug;
          aud0Now += res.aud0;
        }
        st.done = idx;
      }

      // Phase 3: bulk-apply changes (grouped by product)
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