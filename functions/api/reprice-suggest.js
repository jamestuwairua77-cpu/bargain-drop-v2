// /api/reprice-suggest.js — Cloudflare Pages Function
// Reprice ALL Shopify products to CJ per-variant `variantSugSellPrice` → AUD at live FX.
//
// v10 (2026-09-15): v9 semantics + CONCURRENCY (speed boost).
//  - CJ lookups resolved in parallel (bounded pool of CJ_CONCURRENCY=3, under the MCP
//    ~4 req/sec per-IP ceiling) instead of sequential + 250ms sleep, and Shopify product
//    variant writes run with WRITE_CONCURRENCY=3 and 80ms pacing instead of 200ms.
//  - Same per-variant `variantSugSellPrice` → live USD→AUD → whole-dollar ceil,
//    compareAtPrice cleared (null). State cursor logic preserved (idempotent re-queue).

import { corsHeaders, isAdmin, adminDenied, shopifyFetch, cjFetchMulti, shopMetaGet, shopMetaSet } from '../_sync-lib.js';

const STATE_KEY = 'reprice-suggest';
const FX_KEY = 'reprice-fx';         // cached live AUD rate in shop metafield
const MAX_PER_RUN = 200;
const RUN_BUDGET_MS = 28000;
const MAX_RETRY = 20000;
const FX_FALLBACK = 1.40;            // live fallback if FX API down
const FX_TTL_MS = 6 * 3600 * 1000;
const CJ_CONCURRENCY = 3;   // parallel CJ lookups (stay under MCP ~4 req/sec per-IP)
const WRITE_CONCURRENCY = 3; // parallel Shopify product-variant writes
const WRITE_SLEEP_MS = 80;   // pacing between Shopify product writes

// Fetch the live USD→AUD rate, cached in a shop metafield (survives isolate recycling).
async function liveAudRate(env) {
  const cached = await shopMetaGet(env, FX_KEY);
  if (cached && cached.value) {
    try {
      const c = JSON.parse(cached.value);
      if (c && typeof c.rate === 'number' && c.rate > 0 && (Date.now() - (c.at || 0)) < FX_TTL_MS) {
        return c.rate;
      }
    } catch {}
  }
  let rate = FX_FALLBACK;
  // Multiple FX sources, first success wins.
  const sources = [
    'https://open.er-api.com/v6/latest/USD',
    'https://api.frankfurter.app/latest?from=USD&to=AUD',
  ];
  for (const url of sources) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) continue;
      const j = await r.json();
      let v = j?.rates?.AUD;
      if (!v && Array.isArray(j?.rates)) { /* frankfurter legacy shape */ }
      v = v || (j?.rates && j.rates.AUD);
      v = parseFloat(v);
      if (Number.isFinite(v) && v > 0) { rate = v; break; }
    } catch {}
  }
  await shopMetaSet(env, FX_KEY, { rate, at: Date.now() });
  return rate;
}

// USD → AUD whole dollars: ceil(usd * liveRate). Cents dropped (whole dollars).
function usdToAudWhole(usd, rate) {
  const n = parseFloat(usd);
  if (!Number.isFinite(n) || n <= 0) return null;
  const aud = n * rate;
  return Math.ceil(aud);
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

// Per-variant pricing: each variant is priced from its OWN CJ variantSugSellPrice.
// Falls back to product-level suggestSellPrice ONLY if the sibling map lacks this SKU.
function processProduct(env, item, cjData, rate) {
  const d = cjData?.data;
  const sugs = {};
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
    const aud = usdToAudWhole(usdSug, rate);
    if (aud == null || aud <= 0) { aud0++; continue; }
    const audStr = String(aud);
    // Always emit: even if price matches, we still want compare-at cleared.
    changes.push({ price: audStr, shopProductId: item.shopProductId, variantId: v.variantId, priceChanged: audStr !== String(v.oldPrice) });
  }
  return { changes, skipNoSku, skipNoSug, aud0, same };
}

const gidVariant = (id) => /^gid:/.test(id) ? id : `gid://shopify/ProductVariant/${id}`;
const gidProduct = (id) => /^gid:/.test(id) ? id : `gid://shopify/Product/${id}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Concurrent map over `items` with bounded parallelism.
async function mapLimit(items, concurrency, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await fn(items[i], i);
    }
  }
  const workers = [];
  const n = Math.max(1, Math.min(concurrency, items.length));
  for (let w = 0; w < n; w++) workers.push(worker());
  await Promise.all(workers);
  return results;
}

async function applyBatch(env, changes, rate) {
  if (!changes.length) return { updated: 0, failed: 0, errors: [] };
  let updatedN = 0, failedN = 0;
  const errors = [];

  const byProduct = new Map();
  for (const c of changes) {
    const pid = c.shopProductId || 'unknown';
    if (!byProduct.has(pid)) byProduct.set(pid, []);
    byProduct.get(pid).push(c);
  }

  async function writeOne(pid, items) {
    // Set regular price (per-variant CJ suggested), and CLEAR compare-at (no strikethrough).
    const variants = items.map(c => ({ id: gidVariant(c.variantId), price: c.price, compareAtPrice: null }));
    const q = `
      mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants, allowPartialUpdates: true) {
          product { id }
          productVariants { id price compareAtPrice }
          userErrors { field message }
        }
      }
    `;

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
      if (attempt < 3) { await sleep(500 * (attempt + 1)); continue; }
      break;
    }

    if (rawErrors && !payload) {
      return { ok: 0, fail: items.length, err: 'graphql: ' + (rawErrors[0]?.message || 'unknown') };
    } else if (!payload) {
      return { ok: 0, fail: items.length, err: 'no payload for product ' + pid };
    } else {
      const ue = payload.userErrors || [];
      const okCount = Array.isArray(payload.productVariants) ? payload.productVariants.length : items.length;
      let fail = 0, errs = [];
      if (ue.length) {
        fail = Math.max(0, items.length - okCount);
        for (const e of ue) { if (errs.length < 3 && e?.message) errs.push(e.message); }
      } else if (okCount !== items.length) {
        fail = items.length - okCount;
      }
      await sleep(WRITE_SLEEP_MS);
      return { ok: okCount, fail, err: errs.join('; ') || null };
    }
  }

  const entries = Array.from(byProduct.entries());
  const results = await mapLimit(entries, WRITE_CONCURRENCY, ([pid, items]) => writeOne(pid, items));
  for (const r of results) {
    updatedN += r.ok;
    failedN += r.fail;
    if (r.err && errors.length < 30) errors.push(r.err);
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

    if (action === 'fx') {
      const rate = await liveAudRate(env);
      return json({ ok: true, usdToAud: rate, note: 'live USD->AUD rate (whole-dollar ceil applied at run)' });
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

      const rate = await liveAudRate(env);

      const r = await fetch(st.url);
      if (!r.ok) return json({ ok: false, error: 'bulk re-download ' + r.status }, 500);
      const txt = await r.text();
      const queue = parseProducts(txt);

      let updatedNow = 0, failedNow = 0, skipNoSkuNow = 0, skipNoSugNow = 0, aud0Now = 0, cjSkipNow = 0, retriedNow = 0, processedNow = 0;
      const deadline = Date.now() + RUN_BUDGET_MS;
      const nextRetry = [];
      const changes = [];
      let rateLimited = false;

      async function resolveProduct(item) {
        const firstSku = (item.variants.find(v => v.sku) || {}).sku;
        if (!firstSku) { return { skipNoSku: item.variants.length, other: {} }; }
        const cj = await cjFetchMulti(env, '/product/query?variantSku=' + encodeURIComponent(firstSku));
        const code = cj?.code;
        if (code === 429 || code === 1600200) return { rateLimited: true, item };
        if (code === 16900500) return { cjskip: true };
        return processProduct(env, item, cj, rate);
      }

      // Phase 1: persisted retry queue (resolve concurrently)
      const retryItems = [];
      while (st.retry.length && Date.now() <= deadline) retryItems.push(st.retry.shift());

      // Phase 2: advance the main product cursor (gather this run's slice)
      let idx = st.done;
      const sliceItems = [];
      if (!rateLimited) {
        const start = st.done;
        const end = Math.min(st.total, start + limit);
        for (idx = start; idx < end; idx++) {
          if (Date.now() > deadline) break;
          sliceItems.push({ item: queue[idx], cursor: idx });
        }
      }

      // Phase 2b: resolve BOTH slices concurrently under a bounded pool.
      // Attach the slice cursor so we can fold in stable order and safely advance st.done.
      const allItems = retryItems.map(item => ({ item, isRetry: true, cursor: -1 }))
        .concat(sliceItems.map(o => ({ item: o.item, isRetry: false, cursor: o.cursor })));
      const resolutions = await mapLimit(allItems, CJ_CONCURRENCY, async ({ item, isRetry, cursor }) => {
        const res = await resolveProduct(item);
        return { res, isRetry, cursor, item };
      });

      // Fold: retries and the main slice share the SAME cursor ordering rules.
      // We advance st.done only up to the first slice item that rate-limited (inclusive),
      // re-queueing that item and everything after it. Retry items that rate-limit are
      // simply re-queued. Everything is idempotent (price-matched writes are skipped),
      // so a rare double-requeue is harmless correctness-wise.
      let sliceRateLimitCursor = Infinity;
      for (const { res, isRetry, cursor } of resolutions) {
        processedNow++;
        if (res.rateLimited) {
          rateLimited = true;
          nextRetry.push(res.item);
          if (!isRetry && cursor < sliceRateLimitCursor) sliceRateLimitCursor = cursor;
          continue;
        }
        if (res.cjskip) { if (isRetry) retriedNow++; else cjSkipNow++; continue; }
        if (res.other) { if (isRetry) retriedNow++; continue; }
        changes.push(...res.changes);
        skipNoSkuNow += res.skipNoSku;
        skipNoSugNow += res.skipNoSug;
        aud0Now += res.aud0;
        if (isRetry) retriedNow++;
      }
      if (rateLimited && Number.isFinite(sliceRateLimitCursor)) {
        // Re-queue every slice item at/after the first rate-limited cursor (the
        // rate-limited one was already pushed in the fold loop via res.item; the rest
        // ran concurrently and may have been throttled too). Idempotent, so safe.
        for (const o of sliceItems) {
          if (o.cursor >= sliceRateLimitCursor && o.cursor !== sliceRateLimitCursor) {
            nextRetry.push(queue[o.cursor]);
          }
        }
        // Advance only past items BEFORE the first rate-limit; do not skip unprocessed products.
        idx = sliceRateLimitCursor;
      }
      st.done = idx;

      // Phase 3: bulk-apply (per-variant price + compare-at cleared)
      const applied = await applyBatch(env, changes, rate);
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
        usdToAud: rate,
        remaining,
        errors: st.errors.slice(0, 5),
      });
    }

    return json({ ok: false, error: 'unknown action: ' + action }, 400);
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}
