// Cloudflare Pages Function: /api/rebuild-bulk
// Rebuilds the storefront catalog using the Shopify BULK OPERATION API (avoids
// the throttled REST /products.json path). Writes are done INCREMENTALLY — one
// file per ?step=1 invocation — to stay under Cloudflare CPU limits. Driven by
// a scheduled task (or repeated manual ?step=1 calls).
//
//   GET ?build=1  -> fire bulk query, store opId + a full write-plan
//   GET ?step=1   -> (a) if op not done, poll status; (b) write next file in plan
//   GET ?status=1 -> { opId, status, count, written, total }

import { corsHeaders, isAdmin, adminDenied, shopifyFetch, ghRead, ghWrite } from '../_sync-lib.js';

const NS = 'rebuildbulk';
const KEY = 'state';

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
  const q = `query { shop { metafields(first: 10, namespace: "${NS}") { edges { node { key value } } } } }`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await gqlRaw(env, q);
    const edges = (res && res.data && res.data.shop && res.data.shop.metafields && res.data.shop.metafields.edges) || [];
    for (const e of edges) {
      if (e.node && e.node.key === KEY) {
        try { const s = JSON.parse(e.node.value); if (s && typeof s === 'object') return s; } catch {}
      }
    }
    await new Promise(r => setTimeout(r, 400));
  }
  return { opId: null };
}
async function saveState(env, st) {
  const mq = `mutation set($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { metafields { id } userErrors { field message } } }`;
  const res = await gqlRaw(env, mq, { m: [{ ownerId: 'gid://shopify/Shop/73594044547', namespace: NS, key: KEY, type: 'json', value: JSON.stringify(st) }] });
  const ue = (res && res.data && res.data.metafieldsSet && res.data.metafieldsSet.userErrors) || [];
  if (ue.length) throw new Error('meta save: ' + ue.map(x => x.message).join('; '));
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

function parseRows(rows) {
  const products = new Map();
  for (const r of rows) {
    if (r.__parentId) continue;
    const m = /\d+$/.exec(String(r.id || ''));
    if (!m) continue;
    products.set(m[0], {
      id: m[0], title: r.title || '', status: r.status || 'active',
      vendor: r.vendor || '', productType: r.productType || '',
      tags: r.tags || [], descriptionHtml: r.descriptionHtml || '',
      featuredImage: r.featuredImage ? r.featuredImage.src : null,
      images: [], variants: [],
    });
  }
  for (const r of rows) {
    if (!r.__parentId) continue;
    const m = /\d+$/.exec(String(r.__parentId || ''));
    if (!m) continue;
    const p = products.get(m[0]);
    if (!p) continue;
    if (r.src != null && r.sku == null && r.price == null && r.title == null && r.selectedOptions == null) {
      p.images.push(r.src);
    } else if (r.sku != null || r.price != null || r.title != null || r.selectedOptions != null) {
      const so = Array.isArray(r.selectedOptions) ? r.selectedOptions : [];
      p.variants.push({
        sku: r.sku || '', price: r.price, compareAtPrice: r.compareAtPrice,
        option1: (so[0] && so[0].value) || '', option2: (so[1] && so[1].value) || '', option3: (so[2] && so[2].value) || '',
        inventoryQuantity: r.inventoryQuantity == null ? 0 : r.inventoryQuantity,
      });
    }
  }
  return Array.from(products.values());
}

function buildCatalog(prods) {
  const cats = {}, all = [], idx = {};
  for (const p of prods) {
    if (!p.status || p.status.toUpperCase() !== 'ACTIVE' || !p.title) continue;
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
function shardArray(arr) { const out = []; for (let i = 0; i < arr.length; i += 1200) out.push(arr.slice(i, i + 1200)); return out; }

export async function onRequest(context) {
  try {
    const { request, env } = context;
    if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
    if (!isAdmin(request, env)) return adminDenied();
    const url = new URL(request.url);
    const build = url.searchParams.get('build') === '1';
    const poll = url.searchParams.get('poll') === '1';
    const step = url.searchParams.get('step') === '1';

    // Wait: keep both 'poll' and 'step' for compat; 'step' does incremental writes.
    const op = build ? 'build' : (step || poll) ? 'step' : 'status';

    if (op === 'build') {
      const opId = await startBulk(env);
      const st = await loadState(env);
      st.opId = opId; st.plan = []; st.ptr = 0; st.count = 0; st.status = 'built';
      await saveState(env, st);
      return json({ ok: true, opId, status: 'CREATED' });
    }

    if (op === 'step') {
      const st = await loadState(env);
      if (!st.opId) return json({ ok: false, error: 'no op; call ?build=1 first' }, 400);

      // Wait for the bulk op to finish if not already done.
      if (st.status !== 'COMPLETED') {
        const node = await bulkStatus(env, st.opId);
        if (!node) return json({ ok: false, error: 'cannot read bulk status' }, 500);
        if (node.status !== 'COMPLETED') {
          return json({ ok: true, opId: st.opId, status: node.status, objectCount: node.objectCount, errorCode: node.errorCode || null, progress: 'waiting for Shopify' });
        }
        // Just completed: download, parse, build the write PLAN.
        if (!node.url) return json({ ok: false, error: 'completed but no url' }, 500);
        const r = await fetch(node.url);
        if (!r.ok) return json({ ok: false, error: 'bulk download ' + r.status }, 500);
        const txt = await r.text();
        const rows = [];
        for (const line of txt.split('\n')) { const s = line.trim(); if (s) { try { rows.push(JSON.parse(s)); } catch {} } }
        if (url.searchParams.get('debug') === '1') {
          const statusCounts = {}; let parentRows = 0;
          for (const rr of rows) if (!rr.__parentId && rr.id) { parentRows++; const s2 = rr.status || '(none)'; statusCounts[s2] = (statusCounts[s2] || 0) + 1; }
          return json({ ok: true, rawRowCount: rows.length, parentRows, statusCounts });
        }
        const prods = parseRows(rows);
        const { cats, all, idx } = buildCatalog(prods);
        const plan = [];
        Object.entries(cats).map(([k, v]) => ({ key: k, name: v.name, products: v.products })).forEach((e, i) => plan.push(['categories-data-' + i + '.json', JSON.stringify(e), 'categories']));
        shardArray(all).forEach((shard, i) => plan.push(['all-products-' + i + '.json', JSON.stringify(shard), 'all-products']));
        plan.push(['products-index.json', JSON.stringify(idx), 'index']);
        // Manifests LAST (so loaders never see a partial catalog): categories-data.json, all-products.json
        plan.push(['categories-data.json', JSON.stringify({ shards: Math.ceil(Object.keys(cats).length / 1200), count: Object.keys(cats).length }), 'categories-index']);
        plan.push(['all-products.json', JSON.stringify({ shards: Math.ceil(all.length / 1200), count: all.length }), 'all-products-index']);
        st.plan = plan;
        st.ptr = 0;
        st.count = all.length;
        st.categories = Object.keys(cats).length;
        st.status = 'PLANNED';
        await saveState(env, st);
        return json({ ok: true, opId: st.opId, status: 'PLANNED', products: all.length, categories: Object.keys(cats).length, totalFiles: plan.length });
      }

      // Write the next file in the plan (one per invocation).
      if (!st.plan || st.ptr >= st.plan.length) {
        return json({ ok: true, opId: st.opId, status: 'COMPLETED', count: st.count || 0, written: st.ptr, total: st.plan ? st.plan.length : 0, done: true });
      }
      const [path, data, name] = st.plan[st.ptr];
      let err = null;
      try { await putFile(env, path, data, 'data: rebuild ' + name + ' from Shopify (bulk)'); }
      catch (e) { err = String(e && e.message || e); }
      if (!err) st.ptr++;
      await saveState(env, st);
      return json({ ok: !err, file: path, name, ptr: st.ptr, total: st.plan.length, count: st.count, status: st.ptr >= st.plan.length ? 'COMPLETED' : 'IN_PROGRESS', error: err || undefined });
    }

    const st = await loadState(env);
    if (url.searchParams.get('url') === '1' && st.opId) {
      const node = await bulkStatus(env, st.opId);
      return json({ ok: true, opId: st.opId, status: node ? node.status : null, resultUrl: node ? node.url || null : null, errorCode: node ? node.errorCode || null : null });
    }
    return json({ ok: true, opId: st.opId || null, status: st.status || 'not-started', count: st.count || 0, written: st.ptr || 0 });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err), stack: String(err && err.stack || '').slice(0, 500) }, 500);
  }
}
