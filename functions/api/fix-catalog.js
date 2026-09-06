// fix-catalog.js — bulk-recover broken categories + missing images.
//
// Correction strategy (per user direction):
//   • Shopify info  → GraphQL bulkOperationRunQuery (the bulk API — single async op).
//   • CJ info       → the same lookup the CJ webhook handler uses
//                     (product/query by variantSku) → categoryName + productImageSet.
//
// Because a Cloudflare Pages Function can't wait out a long bulk op or poll+download
// 5,700 rows within its execution budget, this endpoint is MULTI-STEP and idempotent.
// Progress (op id + candidate queue + done/failed sets) persists in a Shopify metafield
// (zstate.fixcat-state), so each short call advances state and can be re-driven safely.
//
// Auth: X-Admin-Pin (or ?pin= or Bearer), matching ADMIN_PIN.
//   GET /api/fix-catalog?action=start-bulk      → launch bulk op, store opId, return
//   GET /api/fix-catalog?action=poll-bulk       → if COMPLETED, download+parse queue
//   GET /api/fix-catalog?action=scan            → short: start-bulk THEN poll (status only)
//   GET /api/fix-catalog?action=fix&limit=N     → recover+write up to N queued products
//   GET /api/fix-catalog?action=status          → persisted progress
//   GET /api/fix-catalog?action=reset           → clear progress

import { corsHeaders, isAdmin, adminDenied, shopifyFetch, cjFetchMulti, mapCategory } from '../_sync-lib.js';

const MAX_PER_RUN = 20;         // fresh CJ account removed the points bottleneck; QPS 1/sec still applies
const BULK_POLL_MS = 1500;      // per-poll sleep inside a single Function call
const BULK_MAX_POLLS = 12;      // ~18s of polling per call (safe within CPU budget)

function isBrokenType(pt) {
  const s = String(pt == null ? '' : pt).trim();
  if (!s) return true;
  if (/^\d+$/.test(s)) return true;
  if (s.toLowerCase() === 'other') return true;
  return false;
}

// ── Shopify GraphQL bulk query ──
async function startBulk(env) {
  const mutation = `
mutation {
  bulkOperationRunQuery(query: """{
    products {
      edges {
        node {
          id
          title
          productType
          images(first: 1) { edges { node { src } } }
          variants(first: 250) { edges { node { sku } } }
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
  // Canonical poll — variable-based node(id:) (same as cj-bulk-import.js).
  const q = `query($id: ID!) { node(id: $id) { ... on BulkOperation { id status objectCount errorCode url } } }`;
  const { body } = await shopifyFetch(env, '/graphql.json', {
    method: 'POST',
    body: JSON.stringify({ query: q, variables: { id: opId } }),
  });
  return body?.data?.node || null;
}

async function downloadBulk(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('bulk download ' + r.status);
  const txt = await r.text();
  const rows = [];
  for (const line of txt.split('\n')) {
    const s = line.trim();
    if (!s) continue;
    try { rows.push(JSON.parse(s)); } catch {}
  }
  return rows;
}

// Bulk JSONL is FLATTENED: a product is a line WITHOUT __parentId; its images are
// child lines ({src, __parentId}) and variants are child lines ({sku, __parentId}).
// We group children back under their parent GID to reconstruct products.
function parseRows(rows) {
  const products = new Map();   // shopifyId -> { shopifyId, type, title }
  for (const r of rows) {
    if (r.__parentId) continue;
    const m = /(\d+)$/.exec(String(r.id || ''));
    if (!m) continue;
    products.set(m[1], {
      shopifyId: m[1],
      type: r.productType == null ? '' : String(r.productType),
      title: r.title || '',
    });
  }
  // Group children by parent product id.
  const images = new Map();     // shopifyId -> Set(src)
  const skus = new Map();       // shopifyId -> first sku
  const addImg = (id, src) => { if (!images.has(id)) images.set(id, []); images.get(id).push(src); };
  const addSku = (id, sku) => { if (!skus.has(id)) skus.set(id, sku); };
  for (const r of rows) {
    if (!r.__parentId) continue;
    const m = /(\d+)$/.exec(String(r.__parentId || ''));
    if (!m) continue;
    const id = m[1];
    if (r.src != null && r.src !== '') addImg(id, String(r.src));
    if (r.sku != null && r.sku !== '') addSku(id, String(r.sku));
  }
  const out = [];
  for (const [id, prod] of products) {
    out.push({
      shopifyId: id,
      type: prod.type,
      hasImage: (images.get(id) || []).length > 0,
      firstSku: skus.get(id) || null,
      title: prod.title,
    });
  }
  return out;
}

// CJ lookup by variantSku → { categoryName, images[] }
// Retryable statuses so intermittent CJ points/QPS failures do NOT permanently
// mark a product as failed. Returns { ok:true, data }, { retry:true }, or { ok:false }.
async function cjRecover(env, sku) {
  if (!sku) return { ok: false, reason: 'no-sku' };
  try {
    const body = await cjFetchMulti(env, '/product/query?variantSku=' + encodeURIComponent(sku));
    const d = body?.data;
    const code = body?.code;
    if (code === 16900500 || code === 429 || code === 1600200) return { retry: true, reason: 'points-or-qps', code };
    if (code !== 200 || !d) return { ok: false, reason: 'not-found', code };
    let imgs = d.productImageSet;
    if (typeof imgs === 'string') { try { imgs = JSON.parse(imgs); } catch { imgs = []; } }
    if (!Array.isArray(imgs)) imgs = [];
    // productImageSet is authoritative; also fold in any variant images.
    const variants = Array.isArray(d.variant) ? d.variant : (Array.isArray(d.variants) ? d.variants : []);
    const seen = new Set(imgs.filter(Boolean));
    for (const v of variants) { const u = v?.variantImage; if (u && !seen.has(u)) { seen.add(u); imgs.push(u); } }
    return { ok: true, data: { categoryName: d.categoryName || null, images: imgs.filter(Boolean) } };
  } catch {
    return { retry: true, reason: 'network-error' };
  }
}

const SHOP_GID = 'gid://shopify/Shop/73594044547';
const STATE_NS = 'fixcat';
const STATE_KEY = 'state';

function emptyState() {
  return { opId: null, queue: [], total: 0, needCategory: 0, needImage: 0, fixed: [], failed: [], totalFixed: 0, totalFailed: 0 };
}
async function loadState(env) {
  let raw = {};
  try {
    const q = `query { shop { metafields(first:1, keys: ["${STATE_NS}.${STATE_KEY}"]) { edges { node { value } } } } }`;
    const { body } = await shopifyFetch(env, '/graphql.json', { method: 'POST', body: JSON.stringify({ query: q }) });
    const edges = body?.data?.shop?.metafields?.edges || [];
    if (edges.length) raw = JSON.parse(edges[0].node.value || '{}');
  } catch {}
  raw = raw && typeof raw === 'object' ? raw : {};
  const base = emptyState();
  const fixed = Array.isArray(raw.fixed) ? raw.fixed : [];
  const failed = Array.isArray(raw.failed) ? raw.failed : [];
  const queue = Array.isArray(raw.queue) ? raw.queue : [];
  return {
    opId: raw.opId || null,
    queue,
    total: Number(raw.total) || 0,
    needCategory: Number(raw.needCategory) || 0,
    needImage: Number(raw.needImage) || 0,
    fixed,
    failed,
    totalFixed: Number(raw.totalFixed) || 0,
    totalFailed: Number(raw.totalFailed) || 0,
  };
}
async function saveState(env, st) {
  try {
    const mq = `mutation set($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { metafields { id } userErrors { field message } } }`;
    await shopifyFetch(env, '/graphql.json', {
      method: 'POST',
      body: JSON.stringify({ query: mq, variables: { m: [{ ownerId: SHOP_GID, namespace: STATE_NS, key: STATE_KEY, type: 'json', value: JSON.stringify(st) }] } }),
    });
  } catch {}
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
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '40', 10) || 40, MAX_PER_RUN);

  try {
    const st = await loadState(env);

    if (action === 'reset') {
      await saveState(env, { opId: null, queue: [], total: 0, needCategory: 0, needImage: 0, fixed: [], failed: [], totalFixed: 0, totalFailed: 0 });
      return json({ ok: true, reset: true });
    }

    // Clear only the failed set (preserve built queue + bulk op) so false-negatives
    // from the earlier points-exhausted runs get re-attempted.
    if (action === 'unfail') {
      st.failed = []; st.totalFailed = 0;
      await saveState(env, st);
      return json({ ok: true, unfailed: true, remaining: st.queue.length - (st.fixed || []).length });
    }

    if (action === 'status') {
      const done = new Set((st.fixed || []).map(String));
      const failed = new Set((st.failed || []).map(String));
      const remaining = (st.queue || []).filter((p) => !done.has(String(p.shopifyId)) && !failed.has(String(p.shopifyId)));
      return json({ ok: true, opId: st.opId || null, total: st.total || 0, needCategory: st.needCategory || 0, needImage: st.needImage || 0, fixed: st.totalFixed || 0, failed: st.totalFailed || 0, remaining: remaining.length });
    }

    if (action === 'start-bulk') {
      const opId = await startBulk(env);
      st.opId = opId;
      st.queue = []; st.fixed = []; st.failed = []; st.totalFixed = 0; st.totalFailed = 0;
      await saveState(env, st);
      return json({ ok: true, opId, status: 'CREATED' });
    }

    if (action === 'poll-bulk') {
      if (!st.opId) return json({ ok: false, error: 'no active bulk op; call start-bulk first' }, 400);
      let node = null;
      for (let i = 0; i < BULK_MAX_POLLS; i++) {
        node = await bulkStatus(env, st.opId);
        if (node && node.status === 'COMPLETED') break;
        if (node && (node.status === 'FAILED' || node.status === 'CANCELED')) throw new Error('bulk ' + node.status + ': ' + (node.errorCode || ''));
        await new Promise((res) => setTimeout(res, BULK_POLL_MS));
      }
      if (!node || node.status !== 'COMPLETED') {
        return json({ ok: true, opId: st.opId, status: node ? node.status : 'UNKNOWN', ready: false });
      }
      // Completed → download + parse + build queue
      const rows = await downloadBulk(node.url);
      const parsed = parseRows(rows);
      st.total = parsed.length;
      st.needCategory = parsed.filter((p) => isBrokenType(p.type)).length;
      st.needImage = parsed.filter((p) => !p.hasImage).length;
      // queue = union of category-broken and image-missing
      const byId = {};
      for (const p of parsed) {
        if (isBrokenType(p.type) || !p.hasImage) byId[p.shopifyId] = p;
      }
      st.queue = Object.values(byId);
      await saveState(env, st);
      return json({ ok: true, opId: st.opId, status: 'COMPLETED', ready: true, total: st.total, needCategory: st.needCategory, needImage: st.needImage, queued: st.queue.length });
    }

    if (action === 'scan') {
      // convenience: start bulk then poll once (may need a couple calls)
      const opId = await startBulk(env);
      st.opId = opId;
      await saveState(env, st);
      let node = null;
      for (let i = 0; i < BULK_MAX_POLLS; i++) {
        node = await bulkStatus(env, opId);
        if (node && node.status === 'COMPLETED') break;
        if (node && node.status !== 'CREATED' && node.status !== 'RUNNING') break;
        await new Promise((res) => setTimeout(res, BULK_POLL_MS));
      }
      if (node && node.status === 'COMPLETED') {
        const rows = await downloadBulk(node.url);
        const parsed = parseRows(rows);
        return json({ ok: true, status: 'COMPLETED', totalProducts: parsed.length, needCategory: parsed.filter((p) => isBrokenType(p.type)).length, needImage: parsed.filter((p) => !p.hasImage).length });
      }
      return json({ ok: true, opId, status: node ? node.status : 'RUNNING', hint: 'call action=poll-bulk to continue checking' });
    }

    if (action === 'fix') {
      if (!st.queue || !st.queue.length) return json({ ok: false, error: 'no queue; run start-bulk + poll-bulk first' }, 400);
      const doneSet = new Set((st.fixed || []).map(String));
      const failedSet = new Set((st.failed || []).map(String));
      const candidates = st.queue.filter((p) => !doneSet.has(String(p.shopifyId)) && !failedSet.has(String(p.shopifyId)));
      const batch = candidates.slice(0, limit);

      let fixedNow = 0, failedNow = 0;
      const results = [];
      for (const p of batch) {
        await new Promise((res) => setTimeout(res, 1300)); // CJ QPS limit = 1/sec
        const cj = await cjRecover(env, p.firstSku);
        if (cj && cj.retry) {
          // Transient points/QPS/network failure → leave for a future run, do NOT mark failed.
          results.push({ id: p.shopifyId, retry: cj.reason });
          continue;
        }
        const cjData = cj && cj.ok ? cj.data : null;
        let categoryFixed = false, imageFixed = false;
        try {
          const patch = {};
          if (isBrokenType(p.type) && cjData && cjData.categoryName) {
            const mt = mapCategory(cjData.categoryName);
            if (mt && mt !== 'other') { patch.product_type = mt; categoryFixed = true; }
          }
          if (!p.hasImage && cjData && cjData.images.length) {
            patch.images = cjData.images.slice(0, 20).map((src) => ({ src }));
            imageFixed = true;
          }
          if (Object.keys(patch).length) {
            const r = await shopifyFetch(env, `/products/${p.shopifyId}.json`, {
              method: 'PUT',
              body: JSON.stringify({ product: { id: Number(p.shopifyId), ...patch } }),
            });
            if (!r.ok) throw new Error('shopify put ' + r.status);
          }
          if (categoryFixed || imageFixed) {
            st.fixed.push(String(p.shopifyId)); st.totalFixed++; fixedNow++;
            results.push({ id: p.shopifyId, category: categoryFixed, image: imageFixed, cjCategory: cjData ? cjData.categoryName : null });
          } else {
            st.failed.push(String(p.shopifyId)); st.totalFailed++; failedNow++;
            results.push({ id: p.shopifyId, reason: cjData ? 'no-fix-applied' : 'not-found' });
          }
        } catch (e) {
          st.failed.push(String(p.shopifyId)); st.totalFailed++; failedNow++;
          results.push({ id: p.shopifyId, error: String(e?.message || e) });
        }
      }

      await saveState(env, st);
      const remaining = st.queue.filter((p) => !new Set((st.fixed || []).map(String)).has(String(p.shopifyId)) && !new Set((st.failed || []).map(String)).has(String(p.shopifyId))).length;

      return json({ ok: true, processed: batch.length, fixedNow, failedNow, totalFixed: st.totalFixed, totalFailed: st.totalFailed, remaining: { queue: remaining, needCategory: st.needCategory, needImage: st.needImage }, results: results.slice(0, 20) });
    }

    if (action === 'debug-queue') {
      const head = (st.queue || []).slice(0, 15);
      return json({ ok: true, queued: st.queue.length, sample: head.map((p) => ({ id: p.shopifyId, type: p.type, hasImage: p.hasImage, sku: p.firstSku, title: (p.title||'').slice(0,40) })) });
    }

    if (action === 'debug-row') {
      if (!st.opId) return json({ ok: false, error: 'no op' }, 400);
      const node = await bulkStatus(env, st.opId);
      if (!node || node.status !== 'COMPLETED' || !node.url) return json({ ok: false, error: 'bulk not completed', status: node ? node.status : null }, 400);
      const txt = await (await fetch(node.url)).text();
      const lines = txt.split('\n').filter((l) => l.trim());
      const first = lines[0] ? JSON.parse(lines[0]) : null;
      const sample = first && first.node ? first.node : first;
      // Also dump the raw __typename of first 6 lines to understand flattened structure
      const kinds = lines.slice(0, 8).map((l) => { try { const o = JSON.parse(l); return o.__typename; } catch { return 'ERR'; } });
      const second = lines[1] ? JSON.parse(lines[1]) : null;
      const third = lines[2] ? JSON.parse(lines[2]) : null;
      return json({ ok: true, totalLines: lines.length, sampleNode: sample, kindSeq: kinds, line1: first, line2: second, line3: third });
    }

    return json({ ok: false, error: 'unknown action: ' + action }, 400);
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}
