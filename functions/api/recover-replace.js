// recover-replace.js — recover the 2,603 broken-category products from CJ,
// re-import each as a FRESH Shopify product (full variants/images/description/
// details/category) with a flat 40% markup on CJ wholesale cost (USD->AUD @1.5),
// then DELETE the original junk-category product ONLY when the replacement
// succeeded. Unrecoverable (delisted/not-found) products are flagged, never
// silently dropped.
//
//   GET ?action=build-queue   -> run Shopify bulk op to enumerate broken products
//   GET ?action=poll-bulk     -> download+parse bulk op -> persistent queue
//   GET ?action=run&limit=N   -> recover+reimport+delete up to N (idempotent)
//   GET ?action=status        -> counters
//   GET ?action=reset         -> clear state
//   GET ?action=debug-sku&ids= -> peek queue rows
//
// Auth: X-Admin-Pin (or ?pin=/Bearer), matching ADMIN_PIN.

import { corsHeaders, isAdmin, adminDenied, shopifyFetch, cjFetchMulti, mapCategory } from '../_sync-lib.js';

const MAX_PER_RUN = 8;              // bounded (each product = 1 CJ query + up to 3 Shopify writes)

function isBrokenType(pt) {
  const s = String(pt == null ? '' : pt).trim();
  if (!s) return true;
  if (/^\d+$/.test(s)) return true;
  if (s.toLowerCase() === 'other') return true;
  return false;
}

// Flat 40% markup USD->AUD (1.5). Matches _cj-import.js repriceAUD.
function repriceAUD(usdCost) {
  const c = parseFloat(usdCost);
  if (!isFinite(c) || c <= 0) return null;
  return Math.round(c * 1.4 * 1.5);
}

// CJ lookup by variantSku -> full product record (category/desc/title/images/variants).
// Returns { ok:true, data } | { retry:true } | { ok:false }.
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
    const variants = Array.isArray(d.variants) ? d.variants : (Array.isArray(d.variant) ? d.variant : []);
    const seen = new Set(imgs.filter(Boolean));
    if (d.bigImage) seen.add(d.bigImage);
    for (const v of variants) { const u = v?.variantImage; if (u && !seen.has(u)) { seen.add(u); imgs.push(u); } }
    return {
      ok: true,
      data: {
        categoryName: d.categoryName || null,
        description: d.description || null,
        title: d.productNameEn || d.productName || null,
        sellPrice: d.sellPrice != null ? Number(d.sellPrice) : null,
        images: imgs.filter(Boolean).slice(0, 20),
        variants,
      },
    };
  } catch { return { retry: true, reason: 'network-error' }; }
}

// Derive option values from a CJ variant.
function optVal(v, i) {
  const n = ['variantValue1', 'variantValue2', 'variantValue3'][i];
  if (v[n] != null) return v[n];
  if (v.variantKey != null) return String(v.variantKey).split('-')[i];
  if (i === 0) return v.variantNameEn || v.variantName || null;
  return null;
}

// Build a full fresh-product body from a recovered CJ record (40% markup applied).
function buildProductBody(cjData) {
  const variants = Array.isArray(cjData.variants) ? cjData.variants : [];
  // Derive option names from distinct option value presence.
  const o1 = variants.map((v) => optVal(v, 0)).filter(Boolean);
  const o2 = variants.map((v) => optVal(v, 1)).filter(Boolean);
  const o3 = variants.map((v) => optVal(v, 2)).filter(Boolean);
  const optionNames = [];
  if (new Set(o1).size > 1 || o1.length) optionNames.push('Color');
  if (new Set(o2).size > 1 || o2.length) optionNames.push('Size');
  if (new Set(o3).size > 1 || o3.length) optionNames.push('Material');
  if (!optionNames.length) optionNames.push('Title');

  const shopVariants = variants.map((v) => {
    const price = v.variantSellPrice != null ? repriceAUD(v.variantSellPrice) : null;
    const obj = {
      option1: optVal(v, 0) || 'Default Title',
      option2: optVal(v, 1) || null,
      option3: optVal(v, 2) || null,
    };
    if (price != null) obj.price = String(price);
    if (v.variantSku != null) obj.sku = String(v.variantSku);
    if (v.variantWeight != null) obj.grams = Number(v.variantWeight);
    return obj;
  });

  const options = optionNames.map((name, i) => ({
    name,
    position: i + 1,
    values: [...new Set(shopVariants.map((sv) => sv['option' + (i + 1)]).filter(Boolean))],
  }));

  const mappedType = mapCategory(cjData.categoryName || '');
  const product = {
    title: cjData.title || 'Recovered Product',
    body_html: cjData.description || '',
    product_type: mappedType && mappedType !== 'other' ? mappedType : 'other',
    status: 'active',
    variants: shopVariants,
    options: options.length ? options : undefined,
    images: (cjData.images || []).map((src) => ({ src })),
  };
  return product;
}

// Bulk op: enumerate products (id, productType, first sku).
async function startBulk(env) {
  const mutation = `
mutation {
  bulkOperationRunQuery(query: """{
    products {
      edges { node { id productType variants(first: 1) { edges { node { sku } } } } }
    }
  }""") {
    bulkOperation { id status }
    userErrors { field message }
  }
}`;
  const r = await shopifyFetch(env, '/graphql.json', { method: 'POST', body: JSON.stringify({ query: mutation }) });
  const op = r.body?.data?.bulkOperationRunQuery?.bulkOperation;
  if (!op || !op.id) throw new Error('bulk op failed');
  return String(op.id);
}
async function bulkStatus(env, opId) {
  const q = `query($id: ID!) { node(id: $id) { ... on BulkOperation { id status objectCount errorCode url } } }`;
  const { body } = await shopifyFetch(env, '/graphql.json', { method: 'POST', body: JSON.stringify({ query: q, variables: { id: opId } }) });
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
  const products = new Map();
  const skus = new Map();
  for (const r of rows) {
    if (r.__parentId) {
      const m = /(\d+)$/.exec(String(r.__parentId || ''));
      if (m && r.sku != null && r.sku !== '' && !skus.has(m[1])) skus.set(m[1], String(r.sku));
      continue;
    }
    const m = /(\d+)$/.exec(String(r.id || ''));
    if (!m) continue;
    products.set(m[1], {
      shopifyId: m[1],
      type: r.productType == null ? '' : String(r.productType),
    });
  }
  const out = [];
  for (const [id, prod] of products) {
    if (!isBrokenType(prod.type)) continue;
    out.push({ shopifyId: id, type: prod.type, firstSku: skus.get(id) || null });
  }
  return out;
}

const SHOP_GID = 'gid://shopify/Shop/73594044547';
const STATE_NS = 'recrepl';
const STATE_KEY = 'state';

function emptyState() {
  return { opId: null, queue: [], done: [], flagged: [], totalDone: 0, totalFlagged: 0 };
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
  return {
    opId: raw.opId || null,
    queue: Array.isArray(raw.queue) ? raw.queue : [],
    done: Array.isArray(raw.done) ? raw.done : [],
    flagged: Array.isArray(raw.flagged) ? raw.flagged : [],
    totalDone: Number(raw.totalDone) || 0,
    totalFlagged: Number(raw.totalFlagged) || 0,
  };
}
async function saveState(env, st) {
  try {
    const mq = `mutation set($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { metafields { id } userErrors { field message } } }`;
    await shopifyFetch(env, '/graphql.json', { method: 'POST', body: JSON.stringify({ query: mq, variables: { m: [{ ownerId: SHOP_GID, namespace: STATE_NS, key: STATE_KEY, type: 'json', value: JSON.stringify(st) }] } }) });
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
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '4', 10) || 4, MAX_PER_RUN);

  try {
    const st = await loadState(env);

    if (action === 'reset') { await saveState(env, emptyState()); return json({ ok: true, reset: true }); }

    if (action === 'status') {
      const doneSet = new Set(st.done.map(String));
      const flaggedSet = new Set(st.flagged.map(String));
      const remaining = st.queue.filter((p) => !doneSet.has(String(p.shopifyId)) && !flaggedSet.has(String(p.shopifyId)));
      return json({ ok: true, queued: st.queue.length, done: st.totalDone, flagged: st.totalFlagged, remaining: remaining.length });
    }

    if (action === 'build-queue') {
      const opId = await startBulk(env);
      st.opId = opId;
      st.queue = []; st.done = []; st.flagged = []; st.totalDone = 0; st.totalFlagged = 0;
      await saveState(env, st);
      return json({ ok: true, opId, status: 'CREATED' });
    }

    if (action === 'poll-bulk') {
      if (!st.opId) return json({ ok: false, error: 'no bulk op; call build-queue first' }, 400);
      let node = null;
      for (let i = 0; i < 12; i++) {
        node = await bulkStatus(env, st.opId);
        if (node && node.status === 'COMPLETED') break;
        if (node && (node.status === 'FAILED' || node.status === 'CANCELED')) throw new Error('bulk ' + node.status + ': ' + (node.errorCode || ''));
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!node || node.status !== 'COMPLETED') return json({ ok: true, opId: st.opId, status: node ? node.status : 'UNKNOWN', ready: false });
      const rows = await downloadBulk(node.url);
      const parsed = parseRows(rows);
      st.queue = parsed;
      await saveState(env, st);
      return json({ ok: true, opId: st.opId, status: 'COMPLETED', ready: true, queued: st.queue.length });
    }

    if (action === 'debug-sku') {
      const ids = String(url.searchParams.get('ids') || '').split(',').filter(Boolean);
      const q = st.queue || [];
      const out = ids.map((id) => {
        const p = q.find((x) => String(x.shopifyId) === id || String(x.id) === id);
        return p ? { id: p.shopifyId, sku: p.firstSku, type: p.type } : { id, missing: true };
      });
      return json({ ok: true, rows: out });
    }

    if (action === 'run') {
      if (!st.queue || !st.queue.length) return json({ ok: false, error: 'no queue; run build-queue + poll-bulk first' }, 400);
      const doneSet = new Set(st.done.map(String));
      const flaggedSet = new Set(st.flagged.map(String));
      const candidates = st.queue.filter((p) => !doneSet.has(String(p.shopifyId)) && !flaggedSet.has(String(p.shopifyId)));
      const batch = candidates.slice(0, limit);
      const results = [];

      for (const p of batch) {
        await new Promise((r) => setTimeout(r, 1300)); // CJ QPS 1/sec
        const cj = await cjRecover(env, p.firstSku);
        if (cj && cj.retry) { results.push({ id: p.shopifyId, retry: cj.reason }); continue; }
        const cjData = cj && cj.ok ? cj.data : null;

        if (!cjData || !cjData.categoryName) {
          // Unrecoverable (delisted/not-found) -> flag (never delete without replacement).
          st.flagged.push(String(p.shopifyId)); st.totalFlagged++;
          results.push({ id: p.shopifyId, flagged: true, reason: cjData ? 'no-category' : (cj ? cj.reason : 'not-found') });
          continue;
        }

        try {
          // 1. Re-import a FRESH product from the full CJ record (40% markup applied).
          const productBody = buildProductBody(cjData);
          const create = await shopifyFetch(env, '/products.json', { method: 'POST', body: JSON.stringify({ product: productBody }) });
          if (!create.ok) { throw new Error('create ' + create.status); }
          const newId = create.body?.product?.id;
          if (!newId) { throw new Error('create no-id'); }

          // 2. Delete the ORIGINAL junk product (only after successful create).
          const del = await shopifyFetch(env, `/products/${p.shopifyId}.json`, { method: 'DELETE' });
          const deleted = del.ok || del.status === 404;

          st.done.push(String(p.shopifyId)); st.totalDone++;
          results.push({ id: p.shopifyId, replaced: true, newId, category: productBody.product_type, deleted });
          await new Promise((r) => setTimeout(r, 350));
        } catch (e) {
          // Create or delete failed -> leave for next run (do NOT flag as done).
          results.push({ id: p.shopifyId, error: String(e?.message || e) });
        }
      }

      await saveState(env, st);
      const remaining = st.queue.filter((p) => !new Set(st.done.map(String)).has(String(p.shopifyId)) && !new Set(st.flagged.map(String)).has(String(p.shopifyId))).length;
      return json({ ok: true, processed: batch.length, done: st.totalDone, flagged: st.totalFlagged, remaining, results: results.slice(0, 30) });
    }

    if (action === 'verify') {
      const ids = String(url.searchParams.get('ids') || '').split(',').filter(Boolean);
      const out = [];
      for (const id of ids) {
        const r = await shopifyFetch(env, `/products/${id}.json?fields=id,title,product_type,variants`);
        if (!r.ok) { out.push({ id, error: 'get ' + r.status }); continue; }
        const prod = r.body?.product;
        out.push({
          id,
          title: prod?.title,
          product_type: prod?.product_type,
          variants: (prod?.variants || []).map((v) => ({ sku: v.sku, price: v.price })),
        });
      }
      return json({ ok: true, rows: out });
    }

    return json({ ok: false, error: 'unknown action: ' + action }, 400);
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}
