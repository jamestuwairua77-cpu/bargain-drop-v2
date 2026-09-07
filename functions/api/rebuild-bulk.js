// Cloudflare Pages Function: /api/rebuild-bulk
// Rebuilds the storefront catalog (all-products / categories / index) using the
// Shopify BULK OPERATION API instead of the throttled REST /products.json path.
//
//   GET ?build=1   -> fire bulk query (all active products + fields), store opId
//   GET ?poll=1    -> when COMPLETED, download + transform + write catalog files
//   GET ?status=1  -> { opId, status }
//
// Output files (identical shape to /api/rebuild-data):
//   categories-data-<i>.json + categories-data.json (manifest)
//   all-products-<i>.json    + all-products.json     (manifest)
//   products-index.json

import { corsHeaders, isAdmin, adminDenied, shopifyFetch, ghRead, ghWrite } from '../_sync-lib.js';

const NS = 'rebuildbulk';
const KEY = 'state';
const SHARD_SIZE = 1200;

function json(o, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}

async function gqlRaw(env, query, variables) {
  const body = { query };
  if (variables !== undefined) body.variables = variables;
  const r = await shopifyFetch(env, '/graphql.json', { method: 'POST', body: JSON.stringify(body) });
  return r.body;
}
async function loadState(env) {
  const q = `query { shop { metafields(first: 5, namespace: "${NS}") { edges { node { key value } } } } }`;
  const res = await gqlRaw(env, q);
  const edges = (res && res.data && res.data.shop && res.data.shop.metafields && res.data.shop.metafields.edges) || [];
  for (const e of edges) {
    if (e.node && e.node.key === KEY) {
      try { const s = JSON.parse(e.node.value); if (s && typeof s === 'object') return s; } catch {}
    }
  }
  return { opId: null };
}
async function saveState(env, st) {
  const mq = `mutation set($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { metafields { id } userErrors { field message } } }`;
  await gqlRaw(env, mq, {
    m: [{ ownerId: 'gid://shopify/Shop/73594044547', namespace: NS, key: KEY, type: 'json', value: JSON.stringify(st) }],
  });
}

async function startBulk(env) {
  const mutation = `mutation {
  bulkOperationRunQuery(query: """{
    products {
      edges {
        node {
          id
          title
          status
          vendor
          productType
          tags
          descriptionHtml
          featuredImage { src }
          images(first: 50) { edges { node { src } } }
          variants(first: 100) { edges { node { sku price compareAtPrice title selectedOptions { name value } inventoryQuantity } } }
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
  const op = j && j.data && j.data.bulkOperationRunQuery && j.data.bulkOperationRunQuery.bulkOperation;
  const errs = (j && j.data && j.data.bulkOperationRunQuery && j.data.bulkOperationRunQuery.userErrors) || [];
  if (!op || !op.id) throw new Error('bulk op failed: ' + (errs.map(e => e.message).join('; ') || JSON.stringify(j)));
  return String(op.id);
}
async function bulkStatus(env, opId) {
  const q = `query($id: ID!) { node(id: $id) { ... on BulkOperation { id status objectCount errorCode url } } }`;
  const { body } = await shopifyFetch(env, '/graphql.json', { method: 'POST', body: JSON.stringify({ query: q, variables: { id: opId } }) });
  return body && body.data && body.data.node;
}

// Parse flattened JSONL rows back into product objects.
function parseRows(rows) {
  const products = new Map();
  for (const r of rows) {
    if (r.__parentId) continue;
    const m = /\d+$/.exec(String(r.id || ''));
    if (!m) continue;
    products.set(m[0], {
      id: m[0],
      title: r.title || '',
      status: r.status || 'active',
      vendor: r.vendor || '',
      productType: r.productType || '',
      tags: Array.isArray(r.tags) ? r.tags : [],
      descriptionHtml: r.descriptionHtml || '',
      featuredImage: r.featuredImage ? r.featuredImage.src : null,
      images: [],
      variants: [],
    });
  }
  for (const r of rows) {
    if (!r.__parentId) continue;
    const m = /\d+$/.exec(String(r.__parentId || ''));
    if (!m) continue;
    const p = products.get(m[0]);
    if (!p) continue;
    // images child rows have `src` (and no sku/price)
    if (r.src != null && r.sku == null && r.price == null && r.title == null && r.selectedOptions == null) {
      p.images.push(r.src);
    } else if (r.sku != null || r.price != null || r.title != null || r.selectedOptions != null) {
      const so = Array.isArray(r.selectedOptions) ? r.selectedOptions : [];
      p.variants.push({
        sku: r.sku || '',
        price: r.price,
        compareAtPrice: r.compareAtPrice,
        option1: (so[0] && so[0].value) || '',
        option2: (so[1] && so[1].value) || '',
        option3: (so[2] && so[2].value) || '',
        inventoryQuantity: r.inventoryQuantity == null ? 0 : r.inventoryQuantity,
      });
    }
  }
  return Array.from(products.values());
}

function buildCatalog(prods) {
  const cats = {}, all = [], idx = {};
  for (const p of prods) {
    if (p.status !== 'active' || !p.title) continue;
    const imgs = [];
    if (p.featuredImage) imgs.push(p.featuredImage);
    for (const s of p.images) if (s && !imgs.includes(s)) imgs.push(s);
    const price = Number(p.variants[0]?.price || 0);
    const comp = Number(p.variants[0]?.compareAtPrice || 0);
    const vars = p.variants.map(v => ({ option1: v.option1, option2: v.option2, option3: v.option3, price: Number(v.price || 0), sku: v.sku, available: (v.inventoryQuantity || 0) > 0 }));
    all.push({ id: p.id, title: p.title, price, compare_at_price: comp > price ? comp : undefined, image: imgs[0] || null, images: imgs, body_html: p.descriptionHtml || '', vendor: p.vendor, product_type: p.productType, tags: p.tags, variants: vars });
    const ptype = p.productType || 'other';
    const key = ptype.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-').replace(/["',]/g, '');
    if (!cats[key]) cats[key] = { name: ptype, products: [] };
    cats[key].products.push({ id: p.id, title: p.title, price, image: imgs[0] || null, body_html: p.descriptionHtml || '', vendor: p.vendor, product_type: p.productType, variants: vars.length, images: imgs.length });
    idx[p.id] = { idx: cats[key].products.length - 1, category: key };
  }
  return { cats, all, idx };
}

async function putFile(env, path, content, cmsg) {
  let sha = null;
  const existing = await ghRead(env, path);
  if (existing) sha = existing.sha;
  return ghWrite(env, path, content, cmsg, sha);
}
function shardArray(arr) { const out = []; for (let i = 0; i < arr.length; i += SHARD_SIZE) out.push(arr.slice(i, i + SHARD_SIZE)); return out; }

export async function onRequest(context) {
  try {
    const { request, env } = context;
    if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
    if (!isAdmin(request, env)) return adminDenied();
    const url = new URL(request.url);
    const build = url.searchParams.get('build') === '1';
    const poll = url.searchParams.get('poll') === '1';

    if (build) {
      const opId = await startBulk(env);
      const st = await loadState(env);
      st.opId = opId;
      st.stage = 'built';
      await saveState(env, st);
      return json({ ok: true, opId, status: 'CREATED' });
    }

    if (poll) {
      const st = await loadState(env);
      if (!st.opId) return json({ ok: false, error: 'no op; call ?build=1 first' }, 400);
      const node = await bulkStatus(env, st.opId);
      if (!node) return json({ ok: false, error: 'cannot read bulk status' }, 500);
      if (node.status !== 'COMPLETED') {
        return json({ ok: true, opId: st.opId, status: node.status, objectCount: node.objectCount, errorCode: node.errorCode || null });
      }
      if (!node.url) return json({ ok: false, error: 'completed but no url', status: node.status }, 500);
      const r = await fetch(node.url);
      if (!r.ok) return json({ ok: false, error: 'bulk download ' + r.status }, 500);
      const txt = await r.text();
      const rows = [];
      for (const line of txt.split('\n')) { const s = line.trim(); if (s) { try { rows.push(JSON.parse(s)); } catch {} } }
      if (url.searchParams.get('debug') === '1') {
        const statusCounts = {};
        let parentRows = 0;
        for (const r of rows) { if (!r.__parentId && r.id) { parentRows++; const st = r.status || '(none)'; statusCounts[st] = (statusCounts[st] || 0) + 1; } }
        return json({ ok: true, rawRowCount: rows.length, parentRows, statusCounts, firstRow: rows[0] || null });
      }
      const prods = parseRows(rows);
      const { cats, all, idx } = buildCatalog(prods);

      const writes = [];
      const catObjs = Object.entries(cats).map(([k, v]) => ({ key: k, name: v.name, products: v.products }));
      shardArray(catObjs).forEach((shard, i) => writes.push(['categories-data-' + i + '.json', JSON.stringify(shard), 'categories']));
      writes.push(['categories-data.json', JSON.stringify({ shards: Math.ceil(catObjs.length / SHARD_SIZE), count: catObjs.length }), 'categories-index']);
      shardArray(all).forEach((shard, i) => writes.push(['all-products-' + i + '.json', JSON.stringify(shard), 'all-products']));
      writes.push(['all-products.json', JSON.stringify({ shards: Math.ceil(all.length / SHARD_SIZE), count: all.length }), 'all-products-index']);
      writes.push(['products-index.json', JSON.stringify(idx), 'index']);

      let written = 0; const errors = [];
      for (const [path, data, name] of writes) {
        try { await putFile(env, path, data, 'data: rebuild ' + name + ' from Shopify (bulk)'); written++; }
        catch (e) { errors.push({ file: path, error: e.message }); }
      }
      const desc = all.filter(p => p.body_html && p.body_html.length > 20).length;
      st.status = 'COMPLETED';
      st.count = all.length;
      st.categories = Object.keys(cats).length;
      await saveState(env, st);
      return json({ ok: true, status: 'COMPLETED', products: all.length, categories: Object.keys(cats).length, with_descriptions: desc, files_written: written, errors: errors.length ? errors : undefined });
    }

    const st = await loadState(env);
    return json({ ok: true, opId: st.opId || null, status: st.status || 'not-started', count: st.count || 0 });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err), stack: String(err && err.stack || '').slice(0, 500) }, 500);
  }
}
