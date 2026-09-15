// /api/reprice-suggest.js — Cloudflare Pages Function
// Reprice ALL Shopify products to CJ per-variant `variantSugSellPrice` → AUD at live FX.
//
// v11 (2026-09-15): SHARDED PARALLEL WORKERS.
//  - The catalog is partitioned into SHARDS mutually-exclusive slices (product i → shard
//    i % SHARDS). Each shard keeps an INDEPENDENT cursor in its own metafield, so many
//    workers can run in parallel with zero cursor contention.
//  - This removes the CSV-download + Shopify-write overhead from the CJ-lookup critical
//    path. CJ lookups remain ~4/sec per-IP (the hard floor), but writes/overhead are now
//    fully parallel across shards instead of competing for one 50s request window.
//  - Same pricing: per-variant `variantSugSellPrice` → live USD→AUD → whole-dollar ceil,
//    compareAtPrice cleared (null). Idempotent re-queue preserves cursor correctness.

import { corsHeaders, isAdmin, adminDenied, shopifyFetch, cjFetchMulti, shopMetaGet, shopMetaSet } from '../_sync-lib.js';

const SHARDS = 16;                 // number of parallel workers
const META_KEY = 'reprice-meta';   // shared: bulk csv url + totals + fx (written by poll-bulk)
const FX_KEY = 'reprice-fx';       // cached live AUD rate (shared)
const MAX_PER_RUN = 160;           // per-shard products to resolve per run
const RUN_BUDGET_MS = 40000;       // CJ lookup budget per run (generous; CJ is the floor)
const MAX_RETRY = 20000;
const FX_FALLBACK = 1.40;
const FX_TTL_MS = 6 * 3600 * 1000;
const CJ_CONCURRENCY = 3;          // in-flight CJ lookups (under MCP ~4/sec per-IP)
const WRITE_CONCURRENCY = 4;       // in-flight Shopify writes
const WRITE_SLEEP_MS = 60;
const HARD_DEADLINE_MS = 46000;    // stop before Cloudflare ~50s kill

const shardKey = (s) => `reprice-s${s}`;

// ─── Live FX (shared, cached) ────────────────────────────────────────────
async function liveAudRate(env) {
  const cached = await shopMetaGet(env, FX_KEY);
  if (cached && cached.value) {
    try {
      const c = JSON.parse(cached.value);
      if (c && typeof c.rate === 'number' && c.rate > 0 && (Date.now() - (c.at || 0)) < FX_TTL_MS) return c.rate;
    } catch {}
  }
  let rate = FX_FALLBACK;
  for (const url of ['https://open.er-api.com/v6/latest/USD', 'https://api.frankfurter.app/latest?from=USD&to=AUD']) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) continue;
      const j = await r.json();
      const v = parseFloat((j?.rates && j.rates.AUD) || j?.rates?.AUD);
      if (Number.isFinite(v) && v > 0) { rate = v; break; }
    } catch {}
  }
  await shopMetaSet(env, FX_KEY, { rate, at: Date.now() });
  return rate;
}

function usdToAudWhole(usd, rate) {
  const n = parseFloat(usd);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.ceil(n * rate);
}

// ─── Shared meta (bulk csv url + totals) ─────────────────────────────────
const LEGACY_KEY = 'reprice-suggest';
async function loadMeta(env) {
  const e = await shopMetaGet(env, META_KEY);
  let raw = {};
  if (e && e.value) { try { raw = JSON.parse(e.value); } catch {} }
  raw = raw && typeof raw === 'object' ? raw : {};
  if (raw.url || raw.total || raw.opId) {
    return { url: raw.url || null, opId: raw.opId || null, total: Number(raw.total) || 0, totalVariants: Number(raw.totalVariants) || 0 };
  }
  // MIGRATION: read the legacy single-cursor metafield once and seed the new meta.
  const le = await shopMetaGet(env, LEGACY_KEY);
  if (le && le.value) {
    try {
      const lr = JSON.parse(le.value);
      if (lr && (lr.url || lr.opId || lr.total)) {
        const migrated = { url: lr.url || null, opId: lr.opId || null, total: Number(lr.total) || 0, totalVariants: Number(lr.totalVariants) || 0 };
        await shopMetaSet(env, META_KEY, migrated);
        return migrated;
      }
    } catch {}
  }
  return { url: null, opId: null, total: 0, totalVariants: 0 };
}

// ─── Per-shard cursor state ──────────────────────────────────────────────
function emptyShard() {
  return { done: 0, updated: 0, failed: 0, skipNoSku: 0, skipNoSug: 0, aud0: 0, errors: [], retry: [] };
}
async function loadShard(env, s) {
  const e = await shopMetaGet(env, shardKey(s));
  let raw = {};
  if (e && e.value) { try { raw = JSON.parse(e.value); } catch {} }
  raw = raw && typeof raw === 'object' ? raw : {};
  return {
    done: Number(raw.done) || 0,
    updated: Number(raw.updated) || 0,
    failed: Number(raw.failed) || 0,
    skipNoSku: Number(raw.skipNoSku) || 0,
    skipNoSug: Number(raw.skipNoSug) || 0,
    aud0: Number(raw.aud0) || 0,
    errors: Array.isArray(raw.errors) ? raw.errors.slice(0, 20) : [],
    retry: Array.isArray(raw.retry) ? raw.retry.slice(0, MAX_RETRY) : [],
  };
}
async function saveShard(env, s, st) {
  await shopMetaSet(env, shardKey(s), st);
}

function json(o, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}

// ─── Shopify bulk op helpers ─────────────────────────────────────────────
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
    if (errArr.length && errArr.some(e => e?.extensions?.code === 'THROTTLED')) {
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
  const { body } = await shopifyFetch(env, '/graphql.json', { method: 'POST', body: JSON.stringify({ query: q, variables: { id: opId } }) });
  return body?.data?.node || null;
}

// ─── CSV parse → product queue ───────────────────────────────────────────
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
  for (const [sid, p] of products) queue.push({ shopProductId: sid, title: (p.title || '').slice(0, 60), variants: p.variants });
  return queue;
}

// ─── Per-variant pricing ─────────────────────────────────────────────────
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
  let skipNoSku = 0, skipNoSug = 0, aud0 = 0;
  for (const v of item.variants) {
    if (!v.sku) { skipNoSku++; continue; }
    let usdSug = sugs[v.sku];
    if (usdSug == null && Number.isFinite(productSug) && productSug > 0) usdSug = productSug;
    if (usdSug == null) { skipNoSug++; continue; }
    const aud = usdToAudWhole(usdSug, rate);
    if (aud == null || aud <= 0) { aud0++; continue; }
    changes.push({ price: String(aud), shopProductId: item.shopProductId, variantId: v.variantId });
  }
  return { changes, skipNoSku, skipNoSug, aud0 };
}

const gidVariant = (id) => /^gid:/.test(id) ? id : `gid://shopify/ProductVariant/${id}`;
const gidProduct = (id) => /^gid:/.test(id) ? id : `gid://shopify/Product/${id}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function applyBatch(env, changes) {
  if (!changes.length) return { updated: 0, failed: 0, errors: [] };
  let updatedN = 0, failedN = 0;
  const errors = [];
  const byProduct = new Map();
  for (const c of changes) {
    if (!byProduct.has(c.shopProductId)) byProduct.set(c.shopProductId, []);
    byProduct.get(c.shopProductId).push(c);
  }
  async function writeOne(pid, items) {
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
      const r = await shopifyFetch(env, '/graphql.json', { method: 'POST', body: JSON.stringify({ query: q, variables: { productId: gidProduct(pid), variants } }) });
      const b = r.body;
      if (b?.errors?.length) {
        const throttled = b.errors.some(e => e?.extensions?.code === 'THROTTLED' || /throttl/i.test(e?.message || ''));
        const busy = b.errors.some(e => /being modified|currently being modified|try again later/i.test(e?.message || ''));
        if ((throttled || busy) && attempt < 5) { await sleep(2000 * (attempt + 1)); continue; }
        rawErrors = b.errors; break;
      }
      payload = b?.data?.productVariantsBulkUpdate;
      if (payload) break;
      if (attempt < 3) { await sleep(500 * (attempt + 1)); continue; }
      break;
    }
    if (rawErrors && !payload) return { ok: 0, fail: items.length, err: 'graphql: ' + (rawErrors[0]?.message || 'unknown') };
    if (!payload) return { ok: 0, fail: items.length, err: 'no payload for product ' + pid };
    const ue = payload.userErrors || [];
    const okCount = Array.isArray(payload.productVariants) ? payload.productVariants.length : items.length;
    let fail = 0, errs = [];
    if (ue.length) { fail = Math.max(0, items.length - okCount); for (const e of ue) { if (errs.length < 3 && e?.message) errs.push(e.message); } }
    else if (okCount !== items.length) fail = items.length - okCount;
    await sleep(WRITE_SLEEP_MS);
    return { ok: okCount, fail, err: errs.join('; ') || null };
  }
  const entries = Array.from(byProduct.entries());
  const results = await mapLimit(entries, WRITE_CONCURRENCY, ([pid, items]) => writeOne(pid, items));
  for (const r of results) { updatedN += r.ok; failedN += r.fail; if (r.err && errors.length < 30) errors.push(r.err); }
  return { updated: updatedN, failed: failedN, errors };
}

// ─── Shard slice: products whose global index % SHARDS === shard ─────────
function shardSlice(queue, shard) {
  // Returns the shard's ordered product list (already filtered by i%SHARDS===shard),
  // and we advance an INDEX into THIS list, not the global index.
  const slice = [];
  for (let i = 0; i < queue.length; i++) {
    if (i % SHARDS === shard) slice.push(queue[i]);
  }
  return { slice, total: slice.length };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();

  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'status';
  const shardParam = url.searchParams.get('shard');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || String(MAX_PER_RUN), 10) || MAX_PER_RUN, MAX_PER_RUN);

  try {
    if (action === 'reset') {
      for (let s = 0; s < SHARDS; s++) await shopMetaSet(env, shardKey(s), emptyShard());
      await shopMetaSet(env, META_KEY, {});
      return json({ ok: true, reset: true, shards: SHARDS });
    }

    if (action === 'status') {
      const meta = await loadMeta(env);
      let done = 0, updated = 0, failed = 0, skipNoSku = 0, skipNoSug = 0, aud0 = 0, retry = 0;
      const perShard = {};
      for (let s = 0; s < SHARDS; s++) {
        const st = await loadShard(env, s);
        done += st.done; updated += st.updated; failed += st.failed;
        skipNoSku += st.skipNoSku; skipNoSug += st.skipNoSug; aud0 += st.aud0; retry += st.retry.length;
        perShard[s] = { done: st.done, updated: st.updated, failed: st.failed, retry: st.retry.length };
      }
      const remaining = Math.max(0, meta.total - done - retry);
      return json({ ok: true, shards: SHARDS, total: meta.total, totalVariants: meta.totalVariants, done, updated, failed, skipNoSku, skipNoSug, aud0, retry, remaining, perShard });
    }

    if (action === 'fx') {
      return json({ ok: true, usdToAud: await liveAudRate(env) });
    }

    if (action === 'start-bulk') {
      const opId = await startBulk(env);
      const meta = await loadMeta(env);
      meta.url = null;
      meta.opId = opId;
      await shopMetaSet(env, META_KEY, meta);
      return json({ ok: true, opId, phase: 'started' });
    }

    if (action === 'poll-bulk') {
      const meta = await loadMeta(env);
      if (!meta.opId) {
        if (meta.url && meta.total) return json({ ok: true, phase: 'COMPLETED', total: meta.total, note: 'already persisted' });
        return json({ ok: false, error: 'no opId; run start-bulk first' }, 400);
      }
      const op = await bulkStatus(env, meta.opId);
      if (!op) return json({ ok: false, error: 'bulk op not found (maybe expired)' }, 400);
      if (op.status !== 'COMPLETED') return json({ ok: true, phase: op.status, objectCount: op.objectCount, errorCode: op.errorCode });
      if (op.errorCode) return json({ ok: false, error: 'bulk error ' + op.errorCode }, 500);
      if (!op.url) return json({ ok: false, error: 'bulk COMPLETED but no url' }, 500);
      const r = await fetch(op.url);
      if (!r.ok) return json({ ok: false, error: 'bulk download ' + r.status }, 500);
      const queue = parseProducts(await r.text());
      meta.url = op.url;
      meta.total = queue.length;
      meta.totalVariants = queue.reduce((a, p) => a + p.variants.length, 0);
      await shopMetaSet(env, META_KEY, meta);
      // init all shard cursors
      for (let s = 0; s < SHARDS; s++) await shopMetaSet(env, shardKey(s), emptyShard());
      return json({ ok: true, phase: 'COMPLETED', total: meta.total, totalVariants: meta.totalVariants, shards: SHARDS });
    }

    if (action === 'scan') {
      const meta = await loadMeta(env);
      if (!meta.opId) {
        const opId = await startBulk(env);
        meta.opId = opId;
        await shopMetaSet(env, META_KEY, meta);
        return json({ ok: true, opId, phase: 'started' });
      }
      const op = await bulkStatus(env, meta.opId);
      return json({ ok: true, phase: op?.status || 'unknown', opId: meta.opId });
    }

    if (action === 'run') {
      const shard = shardParam != null ? parseInt(shardParam, 10) || 0 : 0;
      if (shard < 0 || shard >= SHARDS) return json({ ok: false, error: 'shard out of range 0..' + (SHARDS - 1) }, 400);

      const meta = await loadMeta(env);
      if (!meta.url) return json({ ok: false, error: 'no persisted bulk url; run poll-bulk first' }, 400);
      if (!meta.total) return json({ ok: false, error: 'no products (total=0); run poll-bulk' }, 400);

      const rate = await liveAudRate(env);

      const r = await fetch(meta.url);
      if (!r.ok) return json({ ok: false, error: 'bulk re-download ' + r.status }, 500);
      const queue = parseProducts(await r.text());
      const { slice, total: shardTotal } = shardSlice(queue, shard);

      let st = await loadShard(env, shard);
      const runStart = Date.now();
      const hardDeadline = runStart + HARD_DEADLINE_MS;
      const deadline = runStart + RUN_BUDGET_MS;
      const changes = [];
      const nextRetry = [];
      let rateLimited = false, processedNow = 0, cjSkipNow = 0, retriedNow = 0;

      async function resolveProduct(item) {
        const firstSku = (item.variants.find(v => v.sku) || {}).sku;
        if (!firstSku) return { skipNoSku: item.variants.length, skipNoSug: 0, aud0: 0, changes: [] };
        const cj = await cjFetchMulti(env, '/product/query?variantSku=' + encodeURIComponent(firstSku));
        const code = cj?.code;
        if (code === 429 || code === 1600200) return { rateLimited: true, item };
        if (code === 16900500) return { cjskip: true };
        return processProduct(env, item, cj, rate);
      }

      // gather: retry queue first, then this shard's slice from its cursor
      const retryItems = [];
      while (st.retry.length && Date.now() <= deadline) retryItems.push(st.retry.shift());

      const sliceItems = [];
      const end = Math.min(shardTotal, st.done + limit);
      for (let i = st.done; i < end; i++) {
        if (Date.now() > deadline) break;
        sliceItems.push({ item: slice[i], cursor: i });
      }
      let idx = sliceItems.length ? sliceItems[sliceItems.length - 1].cursor + 1 : st.done;

      // resolve concurrently (CJ ~4/sec floor, but intershard this is fine)
      const allItems = retryItems.map(item => ({ item, isRetry: true, cursor: -1 }))
        .concat(sliceItems.map(o => ({ item: o.item, isRetry: false, cursor: o.cursor })));
      const resolutions = await mapLimit(allItems, CJ_CONCURRENCY, async ({ item, isRetry, cursor }) => {
        const res = await resolveProduct(item);
        return { res, isRetry, cursor, item };
      });

      let sliceRateLimitCursor = Infinity;
      for (const { res, isRetry, cursor } of resolutions) {
        processedNow++;
        if (res.rateLimited) { rateLimited = true; nextRetry.push(res.item); if (!isRetry && cursor < sliceRateLimitCursor) sliceRateLimitCursor = cursor; continue; }
        if (res.cjskip) { if (isRetry) retriedNow++; else cjSkipNow++; continue; }
        changes.push(...res.changes);
        st.skipNoSku += res.skipNoSku;
        st.skipNoSug += res.skipNoSug;
        st.aud0 += res.aud0;
        if (isRetry) retriedNow++;
      }
      if (rateLimited && Number.isFinite(sliceRateLimitCursor)) {
        for (const o of sliceItems) if (o.cursor > sliceRateLimitCursor) nextRetry.push(slice[o.cursor]);
        idx = sliceRateLimitCursor;
      }

      // writes (parallel)
      let applied = { updated: 0, failed: 0, errors: [] };
      if (Date.now() <= hardDeadline && changes.length) {
        applied = await applyBatch(env, changes);
      }
      st.updated += applied.updated;
      st.failed += applied.failed;
      for (const e of applied.errors) { st.errors.unshift({ err: e }); }
      st.errors = st.errors.slice(0, 20);
      if (nextRetry.length) st.retry = nextRetry.slice(0, MAX_RETRY);
      st.done = idx;

      await saveShard(env, shard, st);
      const remaining = Math.max(0, shardTotal - st.done - st.retry.length);
      return json({
        ok: true, shard, shardTotal, processed: processedNow, retried: retriedNow,
        done: st.done, total: meta.total, shardUpdated: st.updated, updated: st.updated,
        failed: st.failed, skipNoSku: st.skipNoSku, skipNoSug: st.skipNoSug,
        retryQueued: st.retry.length, rateLimited, usdToAud: rate, remaining, errors: st.errors.slice(0, 5),
      });
    }

    return json({ ok: false, error: 'unknown action: ' + action }, 400);
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}
