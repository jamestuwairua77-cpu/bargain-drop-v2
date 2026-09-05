// Cloudflare Pages Function: /api/reprice-flat
//
// Reprices ALL CJ-imported products (tag `cj-import` + `cj-pid-{pid}`) to a
// flat 40% markup on the CJ base cost, converted USD→AUD, rounded to whole
// dollars, with compare-at-price CLEARED (honest price, no strikethrough).
//
//   newPriceAUD = round( variantSellPrice(USD) × 1.4 × 1.5 )
//
// Writes via Shopify Bulk Operations API (bulkOperationRunMutation running
// `productSet`) — the ONLY single-arg bulk-runnable mutation for updating
// existing variant prices (proven working this task).
//
// Modes (all require X-Admin-Pin):
//   GET ?preview=1     → scan + fetch CJ costs + compute → CSV preview (no writes)
//   GET ?apply=1       → fire bulk productSet ops (batched, resumable via metafield)
//   GET ?status=1      → progress status (metafield `cjreprice`)
//   GET ?reset=1       → clear progress
//
// State = Shopify metafield namespace `cjreprice`, key `state`.

import { corsHeaders, shopifyFetch, isAdmin, adminDenied } from '../_sync-lib.js';

const USD_AUD = 1.5;
const MARKUP = 1.4;
const STATE_NAMESPACE = 'cjreprice';
const STATE_KEY = 'state';
const SHOP_GID = 'gid://shopify/Shop/73594044547';
const SHOPIFY_GQ = '/graphql.json';
const PAGE_SIZE = 50;

function computePriceAUD(usdCost) {
  const c = parseFloat(usdCost) || 0;
  if (c <= 0) return 0;
  return Math.round(c * MARKUP * USD_AUD);
}

async function gqlRaw(env, query, variables) {
  const body = { query };
  if (variables !== undefined) body.variables = variables;
  const r = await shopifyFetch(env, SHOPIFY_GQ, { method: 'POST', body: JSON.stringify(body) });
  return r.body;
}

// ─── State (metafield-backed) ─────────────────────────────────────────────
function normalizeState(st) {
  if (!st || typeof st !== 'object') return null;
  if (!st.donePids || typeof st.donePids !== 'object') st.donePids = {};
  if (st.cursor === undefined) st.cursor = null;
  if (!Array.isArray(st.errors)) st.errors = [];
  if (!st.progress || typeof st.progress !== 'object') st.progress = { processed: 0, ok: 0, fail: 0 };
  return st;
}
async function loadState(env) {
  const q = `query { shop { metafields(first: 5, namespace: "${STATE_NAMESPACE}") { edges { node { id namespace key value } } } } }`;
  const res = await gqlRaw(env, q);
  const edges = (res && res.data && res.data.shop && res.data.shop.metafields && res.data.shop.metafields.edges) || [];
  for (const e of edges) {
    const n = e.node;
    if (n && n.key === STATE_KEY) {
      try { const p = normalizeState(JSON.parse(n.value)); if (p) return p; } catch {}
    }
  }
  return { donePids: {}, cursor: null, errors: [], progress: { processed: 0, ok: 0, fail: 0 } };
}
async function saveState(env, state) {
  const mq = `mutation set($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { metafields { id } userErrors { field message } } }`;
  const res = await gqlRaw(env, mq, {
    m: [{ ownerId: SHOP_GID, namespace: STATE_NAMESPACE, key: STATE_KEY, type: 'json', value: JSON.stringify(state) }],
  });
  const ue = (res && res.data && res.data.metafieldsSet && res.data.metafieldsSet.userErrors) || [];
  if (ue.length) throw new Error('metafield save: ' + ue.map(x => x.message).join('; '));
  if (res && res.errors && res.errors.length) throw new Error('metafield save: ' + res.errors.map(x => x.message).join('; '));
}

// ─── Scan products (GraphQL cursor pagination, tag cj-import) ─────────────
async function fetchProductsPage(env, cursor) {
  const q = `query($c: String, $n: Int) {
    products(first: $n, after: $c) {
      edges { cursor node { id title tags variants(first: 100) { edges { node { id sku price selectedOptions { name value } } } } options { name values } } }
      pageInfo { hasNextPage }
    }
  }`;
  const res = await gqlRaw(env, q, { c: cursor, n: PAGE_SIZE });
  const conn = (res && res.data && res.data.products) || {};
  const edges = conn.edges || [];
  const hasNext = !!(conn.pageInfo && conn.pageInfo.hasNextPage);
  const last = edges.length ? edges[edges.length - 1].cursor : null;
  return { edges, hasNext, lastCursor: last };
}

function pidFromTags(tags) {
  for (const t of (tags || [])) {
    const m = String(t).match(/^cj-pid-(.+)$/);
    if (m) return m[1];
  }
  return null;
}

// ─── Fetch CJ base costs via deployed proxy (valid env keys live there) ───
async function fetchCjCostsBySku(sku) {
  const url = `https://bargain-drop.online/api/cj-product-query?variantSku=${encodeURIComponent(sku)}`;
  try {
    const r = await fetch(url, { headers: { 'X-Admin-Pin': '03091996', 'User-Agent': 'bargain-drop-reprice/1.0' } });
    const j = await r.json();
    if (!j || j.code !== 200 || !j.data) return null;
    const map = {};
    for (const v of (j.data.variants || [])) if (v.variantSku) map[v.variantSku] = parseFloat(v.variantSellPrice) || 0;
    return map;
  } catch { return null; }
}

async function fetchCjCosts(pid) {
  const url = `https://bargain-drop.online/api/cj-product-query?pid=${encodeURIComponent(pid)}`;
  try {
    const r = await fetch(url, { headers: { 'X-Admin-Pin': '03091996', 'User-Agent': 'bargain-drop-reprice/1.0' } });
    const j = await r.json();
    if (!j || j.code !== 200 || !Array.isArray(j.data)) return null;
    const map = {};
    for (const v of j.data) if (v.variantSku) map[v.variantSku] = parseFloat(v.variantSellPrice) || 0;
    return map;
  } catch { return null; }
}

// ─── Fire bulk productSet op for a batch of products ──────────────────────
async function fireBulkReprice(env, productInputs) {
  const mutation = 'mutation call($input: ProductSetInput!) { productSet(input: $input) { product { id } userErrors { field message } } }';
  const lines = productInputs.map(inp => JSON.stringify({ input: inp }));
  if (!lines.length) return { ok: true, fired: 0, opId: null };
  const jsonl = lines.join('\n') + '\n';

  const stageQ = `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) { stagedUploadsCreate(input: $input) { stagedTargets { url parameters { name value } } userErrors { field message } } }`;
  const stageRes = await gqlRaw(env, stageQ, { input: [{ resource: 'BULK_MUTATION_VARIABLES', filename: 'reprice-flat.jsonl', mimeType: 'text/jsonl', httpMethod: 'POST' }] });
  const targets = (stageRes && stageRes.data && stageRes.data.stagedUploadsCreate && stageRes.data.stagedUploadsCreate.stagedTargets) || [];
  if (!targets.length) return { ok: false, error: 'staged upload failed: ' + JSON.stringify(stageRes && stageRes.data).slice(0, 300) };
  const params = {};
  for (const p of (targets[0].parameters || [])) params[p.name] = p.value;

  const form = new FormData();
  for (const [name, value] of Object.entries(params)) form.append(name, value);
  form.append('file', new Blob([jsonl], { type: 'text/jsonl' }), 'reprice-flat.jsonl');
  const up = await fetch(targets[0].url, { method: 'POST', body: form });
  if (up.status !== 200 && up.status !== 201) return { ok: false, error: 'staged upload HTTP ' + up.status + ': ' + (await up.text()).slice(0, 300) };

  const runQ = `mutation bulkOperationRunMutation($mutation: String!, $stagedUploadPath: String!, $clientIdentifier: String) { bulkOperationRunMutation(mutation: $mutation, stagedUploadPath: $stagedUploadPath, clientIdentifier: $clientIdentifier) { bulkOperation { id status } userErrors { field message } } }`;
  const runRes = await gqlRaw(env, runQ, { mutation, stagedUploadPath: params.key, clientIdentifier: 'cjreprice-' + Date.now() });
  const bu = (runRes && runRes.data && runRes.data.bulkOperationRunMutation && runRes.data.bulkOperationRunMutation.bulkOperation) || null;
  const runErrs = (runRes && runRes.data && runRes.data.bulkOperationRunMutation && runRes.data.bulkOperationRunMutation.userErrors) || [];
  if (!bu) return { ok: false, error: 'bulk run failed: ' + JSON.stringify(runRes && runRes.data).slice(0, 300) };
  if (runErrs.length) return { ok: false, error: 'bulk run userErrors: ' + JSON.stringify(runErrs).slice(0, 300), opId: bu.id };
  return { ok: true, fired: lines.length, opId: bu.id };
}

// Build ProductSetInput for a product (with newPrice on each variant).
function buildProductSetInput(p) {
  const options = (p.options || []).map((o, i) => ({
    name: o.name,
    position: i + 1,
    values: (o.values || []).map(v => ({ name: v })),
  }));
  if (!options.length) options.push({ name: 'Title', position: 1, values: [{ name: 'Default Title' }] });

  const variants = (p.variants || []).map(v => {
    if (!v || !v.id || v.newPrice == null) return null;
    const optionValues = (v.selectedOptions || []).filter(so => so && so.name && so.value).map(so => ({ optionName: so.name, name: so.value }));
    const out = { id: v.id, price: String(v.newPrice.toFixed(2)), compareAtPrice: null };
    if (optionValues.length) out.optionValues = optionValues;
    return out;
  }).filter(Boolean);

  if (!variants.length) return null;
  return { id: p.id, productOptions: options, variants };
}

export async function onRequest(context) {
  try {
    const { request, env } = context;
    if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
    if (!isAdmin(request, env)) return adminDenied();
    const url = new URL(request.url);
    const preview = url.searchParams.get('preview') === '1';
    const apply = url.searchParams.get('apply') === '1';
    const statusOnly = url.searchParams.get('status') === '1';
    const reset = url.searchParams.get('reset') === '1';

    let state = reset ? { donePids: {}, cursor: null, errors: [], progress: { processed: 0, ok: 0, fail: 0 } } : await loadState(env);

    if (statusOnly) return new Response(JSON.stringify({ state }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    if (!preview && !apply && !reset) return new Response(JSON.stringify({ usage: '?preview=1 | ?apply=1 | ?status=1 | ?reset=1' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    if (reset) { await saveState(env, state); return new Response(JSON.stringify({ reset: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }

    const { edges, hasNext, lastCursor } = await fetchProductsPage(env, state.cursor);

    // Fetch CJ costs + compute for each product
    const productInputs = [];
    const previewRows = [];
    let pricedProducts = 0, skippedNoPid = 0, skippedNoCost = 0;

    for (const edge of edges) {
      const p = edge.node;
      const pid = pidFromTags(p.tags);
      const variants = (p.variants && p.variants.edges || []).map(e => e.node);

      let costMap = null;
      if (pid) {
        costMap = await fetchCjCosts(pid);
      } else {
        // no cj-pid tag — resolve via first variant SKU (returns full variant list)
        const firstSku = variants.find(v => v && v.sku)?.sku;
        if (firstSku) costMap = await fetchCjCostsBySku(firstSku);
      }
      if (!costMap) { skippedNoCost++; continue; }

      let allPriced = true;
      const pricedVariants = variants.map(v => {
        const baseUsd = costMap[v.sku] != null ? costMap[v.sku] : 0;
        const newPrice = computePriceAUD(baseUsd);
        if (newPrice <= 0) allPriced = false;
        return { id: v.id, sku: v.sku, baseUsd, newPrice, selectedOptions: v.selectedOptions || [], oldPrice: v.price };
      });

      for (const pv of pricedVariants) {
        previewRows.push({ pid, productId: p.id, title: p.title, sku: pv.sku, cjBaseUsd: pv.baseUsd, newPriceAud: pv.newPrice, oldPrice: pv.oldPrice });
      }
      if (allPriced && pricedVariants.length) {
        productInputs.push({ id: p.id, options: p.options, variants: pricedVariants.map(pv => ({ id: pv.id, newPrice: pv.newPrice, selectedOptions: pv.selectedOptions })) });
        pricedProducts++;
      }
    }

    if (preview) {
      const header = 'pid,product_id,title,sku,cj_base_usd,new_price_aud,old_price';
      const csvRows = previewRows.map(r => [r.pid, r.productId, '"' + String(r.title).replace(/"/g, '""') + '"', r.sku, r.cjBaseUsd, r.newPriceAud, r.oldPrice].join(','));
      const csv = [header, ...csvRows].join('\n');
      return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="reprice-preview.csv"', ...corsHeaders() } });
    }

    // apply mode
    const fired = await fireBulkReprice(env, productInputs);
    if (fired.ok && fired.fired > 0) {
      for (const inp of productInputs) state.donePids[inp.id] = true;
      state.progress.processed += pricedProducts;
      state.progress.ok += pricedProducts;
    } else if (!fired.ok) {
      state.errors.push({ cursor: state.cursor, error: fired.error || 'bulk fire failed' });
    }

    state.cursor = hasNext ? lastCursor : null;
    state.eof = !hasNext;
    await saveState(env, state);

    return new Response(JSON.stringify({ fired, scanned: edges.length, pricedProducts, skippedNoPid, skippedNoCost, hasNext, eof: !hasNext, progress: state.progress }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message || err), stack: String(err && err.stack || '').slice(0, 400) }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }
}
