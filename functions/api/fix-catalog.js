// fix-catalog.js — bulk-recover broken categories + missing images.
//
// Correction strategy (per user direction):
//   • Shopify info  → GraphQL bulkOperationRunQuery (single operation, no REST pagination)
//   • CJ info       → the same lookup the CJ webhook handler uses (product/query by variantSku),
//                     which returns the authoritative `categoryName` + `productImageSet`.
//
// Fixes two catalog problems:
//   1. Products whose `product_type` is a numeric ID (CJ leaked a numeric type id) or 'other'
//      or empty → recover real category via CJ `categoryName` → mapCategory() → write back.
//   2. Products with zero images → recover gallery images via CJ `productImageSet` → write back.
//
// Auth: X-Admin-Pin (or ?pin= or Bearer), matching ADMIN_PIN.
//   GET /api/fix-catalog?action=scan        → run bulk query, report candidate counts
//   GET /api/fix-catalog?action=fix&limit=N → recover+write up to N products (default 50)
//   GET /api/fix-catalog?action=status      → persisted progress
//   GET /api/fix-catalog?action=reset       → clear progress
//
// Progress persists in a Shopify metafield (namespace `fixcat` / key `state`) so it
// survives Cloudflare isolate recycling and multiple auto-retries.

import { corsHeaders, isAdmin, adminDenied, shopifyFetch, cjFetchMulti, mapCategory, shopMetaGet, shopMetaSet } from '../_sync-lib.js';

const MAX_PER_RUN = 50; // bound writes per invocation (Cloudflare Function time budget)

// Numeric-only product types are CJ type IDs, not categories.
function isBrokenType(pt) {
  const s = String(pt == null ? '' : pt).trim();
  if (!s) return true;
  if (/^\d+$/.test(s)) return true;
  if (s.toLowerCase() === 'other') return true;
  return false;
}

// ── Shopify GraphQL bulk query: enumerate every product once ──
async function runBulkProducts(env) {
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

async function pollBulkResult(env, opId) {
  // Poll status until COMPLETED, then fetch the JSONL result URL.
  const statusQ = `query { node(id: "${opId}") { ... on BulkOperation { status url errorCode partialData } } }`;
  let url = null, guard = 0;
  while (guard++ < 240) {
    const { body } = await shopifyFetch(env, '/graphql.json', { method: 'POST', body: JSON.stringify({ query: statusQ }) });
    const b = body?.data?.node;
    if (!b) break;
    if (b.status === 'COMPLETED') { url = b.url; break; }
    if (b.status === 'FAILED' || b.status === 'CANCELED') throw new Error('bulk op ' + b.status + ': ' + (b.errorCode || ''));
    await new Promise((res) => setTimeout(res, 2000));
  }
  if (!url) throw new Error('bulk op timed out');
  // Fetch the JSONL result (each line = the {node} object).
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

// Parse bulk rows into { shopifyId, type, hasImage, firstSku }
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
    // Also harvest per-variant images as fallback.
    const variants = Array.isArray(d.variant) ? d.variant : (Array.isArray(d.variants) ? d.variants : []);
    const seen = new Set(imgs.filter(Boolean));
    for (const v of variants) { const u = v?.variantImage; if (u && !seen.has(u)) { seen.add(u); imgs.push(u); } }
    return { categoryName: d.categoryName || null, images: imgs.filter(Boolean) };
  } catch {
    return null;
  }
}

const STATE_KEY = 'fixcat-state'; // full metafield key becomes zstate.fixcat-state
async function loadState(env) {
  try {
    const existing = await shopMetaGet(env, STATE_KEY);
    if (existing && existing.value) return JSON.parse(existing.value);
  } catch {}
  return { fixed: [], failed: [], totalFixed: 0, totalFailed: 0 };
}
async function saveState(env, st) {
  try { await shopMetaSet(env, STATE_KEY, JSON.stringify(st)); } catch {}
}

export async function onRequest(context) {
  const { request, env } = context;
  const H = { 'Content-Type': 'application/json', ...corsHeaders() };
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();

  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'scan';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, MAX_PER_RUN);

  try {
    if (action === 'reset') {
      await saveState(env, { fixed: [], failed: [], totalFixed: 0, totalFailed: 0 });
      return new Response(JSON.stringify({ ok: true, reset: true }), { headers: H });
    }
    if (action === 'status') {
      const st = await loadState(env);
      return new Response(JSON.stringify({ ok: true, ...st }), { headers: H });
    }

    // scan / fix: run bulk query
    const opId = await runBulkProducts(env);
    const rows = await pollBulkResult(env, opId);
    const parsed = parseRows(rows);

    const needCat = parsed.filter((p) => isBrokenType(p.type));
    const needImg = parsed.filter((p) => !p.hasImage);

    if (action === 'scan') {
      return new Response(JSON.stringify({
        ok: true,
        totalProducts: parsed.length,
        needCategory: needCat.length,
        needImage: needImg.length,
      }), { headers: H });
    }

    // action === 'fix'
    const st = await loadState(env);
    const doneSet = new Set((st.fixed || []).map(String));
    const failedSet = new Set((st.failed || []).map(String));

    // Candidates: category-broken OR image-missing, not yet processed.
    const targets = {};
    for (const p of needCat) targets[p.shopifyId] = p;
    for (const p of needImg) targets[p.shopifyId] = p;

    const queue = Object.values(targets).filter((p) => !doneSet.has(String(p.shopifyId)) && !failedSet.has(String(p.shopifyId)));
    const batch = queue.slice(0, limit);

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
          await shopifyFetch(env, `/products/${p.shopifyId}.json`, {
            method: 'PUT',
            body: JSON.stringify({ product: { id: Number(p.shopifyId), ...patch } }),
          });
        }
        if (categoryFixed || imageFixed) { st.fixed.push(String(p.shopifyId)); st.totalFixed++; fixedNow++; }
        else { st.failed.push(String(p.shopifyId)); st.totalFailed++; failedNow++; }
        results.push({ id: p.shopifyId, category: categoryFixed, image: imageFixed, sku: p.firstSku, cjCategory: cj?.categoryName || null });
      } catch (e) {
        st.failed.push(String(p.shopifyId)); st.totalFailed++; failedNow++;
        results.push({ id: p.shopifyId, error: String(e?.message || e) });
      }
    }

    await saveState(env, st);

    return new Response(JSON.stringify({
      ok: true,
      totalProducts: parsed.length,
      needCategory: needCat.length,
      needImage: needImg.length,
      processed: batch.length,
      fixedNow,
      failedNow,
      totalFixed: st.totalFixed,
      totalFailed: st.totalFailed,
      remaining: { category: needCat.length - st.totalFixed, image: needImg.length - st.totalFixed },
      results: results.slice(0, 20),
    }), { headers: H });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), { status: 500, headers: H });
  }
}
