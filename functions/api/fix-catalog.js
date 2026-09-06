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

import { corsHeaders, isAdmin, adminDenied, shopifyFetch, cjFetchMulti, mapCategory, shopMetaGet, shopMetaSet } from '../_sync-lib.js';

const MAX_PER_RUN = 40;         // bound CJ+write work per invocation
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
  const q = `query { node(id: "${opId}") { ... on BulkOperation { status url errorCode partialData } } }`;
  const { body } = await shopifyFetch(env, '/graphql.json', { method: 'POST', body: JSON.stringify({ query: q }) });
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

function parseRows(rows) {
  const out = [];
  for (const r of rows) {
    const node = r.node || r;
    const gid = node.id || '';
    const m = /(\d+)$/.exec(String(gid));
    const shopifyId = m ? m[1] : null;
    if (!shopifyId) continue;
    const type = node.productType == null ? '' : String(node.productType);
    const imgs = node.images?.edges || [];
    const hasImage = imgs.length > 0 && !!(imgs[0]?.node?.src);
    const variants = node.variants?.edges || [];
    let firstSku = null;
    for (const v of variants) { const sku = v?.node?.sku; if (sku) { firstSku = String(sku); break; } }
    out.push({ shopifyId, type, hasImage, firstSku, title: node.title || '' });
  }
  return out;
}

// CJ lookup by variantSku → { categoryName, images[] }
async function cjRecover(env, sku) {
  if (!sku) return null;
  try {
    const body = await cjFetchMulti(env, '/product/query?variantSku=' + encodeURIComponent(sku));
    const d = body?.data;
    if (body?.code !== 200 || !d) return null;
    let imgs = d.productImageSet;
    if (typeof imgs === 'string') { try { imgs = JSON.parse(imgs); } catch { imgs = []; } }
    if (!Array.isArray(imgs)) imgs = [];
    const variants = Array.isArray(d.variant) ? d.variant : (Array.isArray(d.variants) ? d.variants : []);
    const seen = new Set(imgs.filter(Boolean));
    for (const v of variants) { const u = v?.variantImage; if (u && !seen.has(u)) { seen.add(u); imgs.push(u); } }
    return { categoryName: d.categoryName || null, images: imgs.filter(Boolean) };
  } catch {
    return null;
  }
}

const STATE_KEY = 'fixcat-state';
async function loadState(env) {
  try {
    const existing = await shopMetaGet(env, STATE_KEY);
    if (existing && existing.value) return JSON.parse(existing.value);
  } catch {}
  return { opId: null, queue: [], total: 0, needCategory: 0, needImage: 0, fixed: [], failed: [], totalFixed: 0, totalFailed: 0 };
}
async function saveState(env, st) {
  try { await shopMetaSet(env, STATE_KEY, JSON.stringify(st)); } catch {}
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
        const cj = await cjRecover(env, p.firstSku);
        let categoryFixed = false, imageFixed = false;
        try {
          const patch = {};
          if (isBrokenType(p.type) && cj && cj.categoryName) {
            const mt = mapCategory(cj.categoryName);
            if (mt && mt !== 'other') { patch.product_type = mt; categoryFixed = true; }
          }
          if (!p.hasImage && cj && cj.images.length) {
            patch.images = cj.images.slice(0, 20).map((src) => ({ src }));
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
            results.push({ id: p.shopifyId, category: categoryFixed, image: imageFixed, cjCategory: cj ? cj.categoryName : null });
          } else {
            st.failed.push(String(p.shopifyId)); st.totalFailed++; failedNow++;
            results.push({ id: p.shopifyId, reason: cj ? 'no-fix-applied' : 'no-cj-data' });
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

    return json({ ok: false, error: 'unknown action: ' + action }, 400);
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}
