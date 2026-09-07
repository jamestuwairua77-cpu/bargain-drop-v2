// Cloudflare Pages Function: /api/dedup-detect
// READ-ONLY duplicate detector for Bargain Drop.
//
// Duplicate = same PRIMARY variant SKU (case/whitespace normalized).
// Keeper = the "most complete" copy: most variants, then most images, then
//          most recent updatedAt. Duplicates = every other copy in the group.

import { corsHeaders, isAdmin, adminDenied, shopifyFetch } from '../_sync-lib.js';

const SHOP_GID = 'gid://shopify/Shop/73594044547';
const NS = 'dedupdetect';
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
  const q = `query { shop { metafields(first: 5, namespace: "${NS}") { edges { node { key value } } } } }`;
  const res = await gqlRaw(env, q);
  const edges = (res && res.data && res.data.shop && res.data.shop.metafields && res.data.shop.metafields.edges) || [];
  for (const e of edges) {
    if (e.node && e.node.key === KEY) {
      try { const s = JSON.parse(e.node.value); if (s && typeof s === 'object') return s; } catch {}
    }
  }
  return { opId: null, groups: [], stats: { total: 0, groups: 0, dupCount: 0, keeperCount: 0 } };
}
async function saveState(env, st) {
  const mq = `mutation set($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { metafields { id } userErrors { field message } } }`;
  const res = await gqlRaw(env, mq, {
    m: [{ ownerId: SHOP_GID, namespace: NS, key: KEY, type: 'json', value: JSON.stringify(st) }],
  });
  const ue = (res && res.data && res.data.metafieldsSet && res.data.metafieldsSet.userErrors) || [];
  if (ue.length) throw new Error('metafield save: ' + ue.map(x => x.message).join('; '));
}

async function startBulk(env) {
  const mutation = `mutation {
  bulkOperationRunQuery(query: """{
    products {
      edges {
        node {
          id
          title
          updatedAt
          images(first: 20) { edges { node { id } } }
          variants(first: 100) { edges { node { sku price } } }
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

function normSku(s) {
  if (s == null) return '';
  return String(s).trim().toLowerCase().replace(/\s+/g, '');
}

function parseRows(rows) {
  const products = new Map();
  for (const r of rows) {
    if (r.__parentId) continue;
    const m = /(\d+)$/.exec(String(r.id || ''));
    if (!m) continue;
    products.set(m[1], {
      id: m[1],
      title: r.title || '',
      updatedAt: r.updatedAt || '',
      imageCount: 0,
      variantCount: 0,
      primarySku: '',
    });
  }
  for (const r of rows) {
    if (!r.__parentId) continue;
    const m = /(\d+)$/.exec(String(r.__parentId || ''));
    if (!m) continue;
    const p = products.get(m[1]);
    if (!p) continue;
    if (r.sku != null) {
      p.variantCount++;
      if (!p.primarySku && r.sku !== '') p.primarySku = String(r.sku);
    } else if (r.id != null) {
      p.imageCount++;
    }
  }
  return Array.from(products.values());
}

function detect(prods) {
  const bySku = new Map();
  for (const p of prods) {
    const k = normSku(p.primarySku);
    if (!k) continue;
    if (!bySku.has(k)) bySku.set(k, []);
    bySku.get(k).push(p);
  }
  const groups = [];
  for (const [sku, list] of bySku) {
    if (list.length < 2) continue;
    list.sort((a, b) =>
      (b.variantCount - a.variantCount) ||
      (b.imageCount - a.imageCount) ||
      (String(b.updatedAt).localeCompare(String(a.updatedAt)))
    );
    const keeper = list[0];
    const dups = list.slice(1);
    groups.push({
      sku,
      keeperId: keeper.id,
      keeperVariantCount: keeper.variantCount,
      keeperImageCount: keeper.imageCount,
      dupIds: dups.map(d => d.id),
      titles: list.map(d => ({ id: d.id, title: d.title.slice(0, 50), variants: d.variantCount, images: d.imageCount })),
    });
  }
  const dupCount = groups.reduce((s, g) => s + g.dupIds.length, 0);
  return { groups, stats: { total: prods.length, groups: groups.length, dupCount, keeperCount: groups.length } };
}

export async function onRequest(context) {
  try {
    const { request, env } = context;
    if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
    if (!isAdmin(request, env)) return adminDenied();
    const url = new URL(request.url);
    const action = url.searchParams.get('build') === '1' ? 'build'
      : url.searchParams.get('poll') === '1' ? 'poll'
      : url.searchParams.get('preview') === '1' ? 'preview'
      : 'status';

    if (action === 'build') {
      const opId = await startBulk(env);
      const st = await loadState(env);
      st.opId = opId;
      await saveState(env, st);
      return json({ ok: true, opId, status: 'CREATED' });
    }

    if (action === 'poll') {
      const st = await loadState(env);
      if (!st.opId) return json({ ok: false, error: 'no op; call ?build=1 first' }, 400);
      const node = await bulkStatus(env, st.opId);
      if (!node) return json({ ok: false, error: 'cannot read bulk status' }, 500);
      if (node.status !== 'COMPLETED') {
        return json({ ok: true, opId: st.opId, status: node.status, objectCount: node.objectCount, errorCode: node.errorCode || null });
      }
      if (!node.url) return json({ ok: false, error: 'completed but no url', status: node.status }, 500);
      const rows = await downloadBulk(node.url);
      const prods = parseRows(rows);
      const { groups, stats } = detect(prods);
      st.opId = node.id;
      st.groups = groups;
      st.stats = stats;
      await saveState(env, st);
      return json({ ok: true, status: 'COMPLETED', stats, sampleGroups: groups.length });
    }

    if (action === 'preview') {
      const st = await loadState(env);
      const n = parseInt(url.searchParams.get('n') || '20', 10);
      return json({ ok: true, stats: st.stats, groups: (st.groups || []).slice(0, n) });
    }

    const st = await loadState(env);
    return json({ ok: true, opId: st.opId || null, stats: st.stats, groupCount: (st.groups || []).length });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err), stack: String(err && err.stack || '').slice(0, 500) }, 500);
  }
}
