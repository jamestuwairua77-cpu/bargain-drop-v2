// Cloudflare Pages Function: /api/fix-descriptions
// Write composed body_html descriptions to Shopify via ONE bulk productUpdate.
//
// The composed descriptions are served as a static JSON at /writeback_list.json
// (committed to repo root). This endpoint fetches it from the CDN, builds the
// JSONL, stages it, and fires a bulk mutation. Uses Cloudflare's OWN Shopify
// token (via shopifyFetch) which is the live source of truth.
//
//   GET ?run=1    -> stage + fire bulk op, return opId (starts background poller)
//   GET ?poll=1&opId=<gid> -> poll an op; parse result on COMPLETED
//   GET ?status=1 -> persisted progress
//
// Auth: X-Admin-Pin (or ?pin=) matching ADMIN_PIN.

import { corsHeaders, isAdmin, adminDenied, shopifyFetch } from '../_sync-lib.js';

const NS = 'fixdesc';
const KEY = 'state';
const SHOP_GID = 'gid://shopify/Shop/73594044547';
const DATA_URL = '/writeback_list.json';

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
  const res = await gqlRaw(env, q);
  const edges = (res && res.data && res.data.shop && res.data.shop.metafields && res.data.shop.metafields.edges) || [];
  for (const e of edges) {
    if (e.node && e.node.key === KEY) {
      try { const s = JSON.parse(e.node.value); if (s && typeof s === 'object') return s; } catch {}
    }
  }
  return {};
}

async function saveState(env, value) {
  const mq = `mutation set($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { metafields { id } userErrors { field message } } }`;
  await gqlRaw(env, mq, {
    m: [{ ownerId: SHOP_GID, namespace: NS, key: KEY, type: 'json', value: JSON.stringify(value) }],
  });
}

// build JSONL for productUpdate with bodyHtml
async function buildJsonl(env) {
  const origin = (env.URL || 'https://bargain-drop.online').replace(/\/$/, '');
  const r = await fetch(origin + DATA_URL);
  if (!r.ok) throw new Error('fetch writeback_list.json failed: ' + r.status);
  const wb = await r.json();
  const lines = wb.map(it => JSON.stringify({ input: { id: 'gid://shopify/Product/' + it.id, bodyHtml: it.body_html } }));
  return { jsonl: lines.join('\n') + '\n', count: wb.length };
}

async function fireBulk(env) {
  const { jsonl, count } = await buildJsonl(env);
  const mutation = 'mutation call($input: ProductUpdateInput!) { productUpdate(product: $input) { product { id } userErrors { field message } } }';

  const stageQ = `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) { stagedUploadsCreate(input: $input) { stagedTargets { url parameters { name value } } userErrors { field message } } }`;
  const stageRes = await gqlRaw(env, stageQ, { input: [{ resource: 'BULK_MUTATION_VARIABLES', filename: 'desc_vars.jsonl', mimeType: 'text/jsonl', httpMethod: 'POST' }] });
  const targets = (stageRes && stageRes.data && stageRes.data.stagedUploadsCreate && stageRes.data.stagedUploadsCreate.stagedTargets) || [];
  if (!targets.length) return { ok: false, error: 'staged upload failed: ' + JSON.stringify(stageRes && stageRes.data).slice(0, 400) };
  const params = {};
  for (const p of (targets[0].parameters || [])) params[p.name] = p.value;

  const form = new FormData();
  for (const [name, value] of Object.entries(params)) form.append(name, value);
  form.append('file', new Blob([jsonl], { type: 'text/jsonl' }), 'desc_vars.jsonl');
  const up = await fetch(targets[0].url, { method: 'POST', body: form });
  if (up.status !== 200 && up.status !== 201) {
    return { ok: false, error: 'staged upload HTTP ' + up.status + ' ' + (await up.text()).slice(0, 300) };
  }
  const stagedPath = params.key;

  const runQ = `mutation bulkOperationRunMutation($mutation: String!, $stagedUploadPath: String!, $clientIdentifier: String) { bulkOperationRunMutation(mutation: $mutation, stagedUploadPath: $stagedUploadPath, clientIdentifier: $clientIdentifier) { bulkOperation { id status } userErrors { field message } } }`;
  const runRes = await gqlRaw(env, runQ, { mutation, stagedUploadPath: stagedPath, clientIdentifier: 'fix-desc-' + Date.now() });
  const bu = (runRes && runRes.data && runRes.data.bulkOperationRunMutation && runRes.data.bulkOperationRunMutation.bulkOperation) || null;
  const runErrs = (runRes && runRes.data && runRes.data.bulkOperationRunMutation && runRes.data.bulkOperationRunMutation.userErrors) || [];
  if (!bu) return { ok: false, error: 'run mutation failed: ' + JSON.stringify(runErrs).slice(0, 400) };
  return { ok: true, opId: bu.id, count };
}

async function pollBulk(env, opId) {
  const q = `query($id: ID!){ node(id: $id){ ... on BulkOperation { id status objectCount errorCode url } } }`;
  const res = await gqlRaw(env, q, { id: opId });
  const n = (res && res.data && res.data.node) || null;
  if (!n) return { status: 'UNKNOWN' };
  let out = { status: n.status, objectCount: n.objectCount, errorCode: n.errorCode };
  if (n.status === 'COMPLETED' && n.url) {
    try {
      const r = await fetch(n.url);
      const txt = await r.text();
      let ok = 0, err = 0, samples = [];
      for (const ln of txt.split('\n')) {
        if (!ln.trim()) continue;
        let d; try { d = JSON.parse(ln); } catch { samples.push('UNPARSEABLE: ' + ln.slice(0, 200)); continue; }
        if (samples.length < 3) samples.push(JSON.stringify(d).slice(0, 300));
        if (d.errors || (d.data && d.data.productUpdate && d.data.productUpdate.userErrors && d.data.productUpdate.userErrors.length)) err++;
        else ok++;
      }
      out.ok = ok; out.err = err; out.samples = samples;
    } catch (e) { out.resultError = String(e && e.message); }
  }
  return out;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();

  const url = new URL(request.url);
  try {
    if (url.searchParams.get('run') === '1') {
      const res = await fireBulk(env);
      if (!res.ok) return json(res, 500);
      await saveState(env, { opId: res.opId, count: res.count, status: 'RUNNING' });
      return json(res);
    }
    if (url.searchParams.get('poll') === '1') {
      const opId = url.searchParams.get('opId');
      if (!opId) return json({ error: 'missing opId' }, 400);
      const res = await pollBulk(env, opId);
      if (res.status === 'COMPLETED') await saveState(env, { opId, count: res.objectCount, status: 'COMPLETED', ok: res.ok, err: res.err });
      return json(res);
    }
    if (url.searchParams.get('status') === '1') {
      return json(await loadState(env));
    }
    if (url.searchParams.get('verify') === '1') {
      const id = url.searchParams.get('id');
      if (!id) return json({ error: 'missing id' }, 400);
      const r = await shopifyFetch(env, '/products/' + id + '.json', { skip429Retry: true });
      const p = r.body && r.body.product;
      return json({ id, title: p && p.title, body_html: p && p.body_html });
    }
    return json({ usage: '?run=1 | ?poll=1&opId=<gid> | ?status=1 | ?verify=1&id=<pid>' });
  } catch (e) {
    return json({ error: String(e && e.message || e) }, 500);
  }
}
