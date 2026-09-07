// Cloudflare Pages Function: /api/dedup-bulk-delete
// Deletes ALL duplicate products in ONE Shopify Bulk Operation (bulkOperationRunMutation).
//
// Reads the persisted duplicate groups (NS=dedupdetect, KEY=state) from the
// detector, builds a JSONL of `productDelete` mutations for every dupId (never
// the keepers), stages it, and fires ONE background bulk op.
//
//   GET ?run=1      -> stage + fire the bulk delete op (all dups), return opId
//   GET ?poll=1     -> poll the op; when COMPLETED, parse result and report
//                      succeeded/failed counts
//   GET ?status=1   -> { totalDups, opId, opStatus, deleted, failed }

import { corsHeaders, isAdmin, adminDenied, shopifyFetch } from '../_sync-lib.js';

const DET_NS = 'dedupdetect';
const DET_KEY = 'state';
const BULK_NS = 'dedupbulk';
const BULK_KEY = 'state';

function json(o, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}

async function gqlRaw(env, query, variables) {
  const body = { query };
  if (variables !== undefined) body.variables = variables;
  const r = await shopifyFetch(env, '/graphql.json', { method: 'POST', body: JSON.stringify(body) });
  return r.body;
}
async function loadMeta(env, ns, key, fallback) {
  const q = `query { shop { metafields(first: 5, namespace: "${ns}") { edges { node { key value } } } } }`;
  const res = await gqlRaw(env, q);
  const edges = (res && res.data && res.data.shop && res.data.shop.metafields && res.data.shop.metafields.edges) || [];
  for (const e of edges) {
    if (e.node && e.node.key === key) {
      try { const s = JSON.parse(e.node.value); if (s && typeof s === 'object') return s; } catch {}
    }
  }
  return fallback;
}
async function saveMeta(env, ns, key, value) {
  const mq = `mutation set($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { metafields { id } userErrors { field message } } }`;
  const res = await gqlRaw(env, mq, {
    m: [{ ownerId: 'gid://shopify/Shop/73594044547', namespace: ns, key, type: 'json', value: JSON.stringify(value) }],
  });
  const ue = (res && res.data && res.data.metafieldsSet && res.data.metafieldsSet.userErrors) || [];
  if (ue.length) throw new Error('save: ' + ue.map(x => x.message).join('; '));
}

// Build the full set of duplicate GIDs (excluding any already deleted via REST).
async function collectDupGids(env) {
  const det = await loadMeta(env, DET_NS, DET_KEY, { groups: [] });
  const groups = det.groups || [];
  const gids = [];
  for (const g of groups) {
    for (const id of (g.dupIds || [])) {
      gids.push('gid://shopify/Product/' + id);
    }
  }
  return gids;
}

async function fireBulkDelete(env, gids) {
  const mutation = 'mutation call($input: ProductDeleteInput!) { productDelete(input: $input) { deletedProductId userErrors { field message } } }';
  const lines = gids.map(id => JSON.stringify({ input: { id } }));
  const jsonl = lines.join('\n') + '\n';

  const stageQ = `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) { stagedUploadsCreate(input: $input) { stagedTargets { url parameters { name value } } userErrors { field message } } }`;
  const stageRes = await gqlRaw(env, stageQ, { input: [{ resource: 'BULK_MUTATION_VARIABLES', filename: 'dedup-delete.jsonl', mimeType: 'text/jsonl', httpMethod: 'POST' }] });
  const targets = (stageRes && stageRes.data && stageRes.data.stagedUploadsCreate && stageRes.data.stagedUploadsCreate.stagedTargets) || [];
  if (!targets.length) return { ok: false, error: 'staged upload failed: ' + JSON.stringify(stageRes && stageRes.data).slice(0, 300) };
  const params = {};
  for (const p of (targets[0].parameters || [])) params[p.name] = p.value;

  const form = new FormData();
  for (const [name, value] of Object.entries(params)) form.append(name, value);
  form.append('file', new Blob([jsonl], { type: 'text/jsonl' }), 'dedup-delete.jsonl');
  const up = await fetch(targets[0].url, { method: 'POST', body: form });
  if (up.status !== 200 && up.status !== 201) return { ok: false, error: 'staged upload HTTP ' + up.status + ': ' + (await up.text()).slice(0, 300) };

  const runQ = `mutation bulkOperationRunMutation($mutation: String!, $stagedUploadPath: String!, $clientIdentifier: String) { bulkOperationRunMutation(mutation: $mutation, stagedUploadPath: $stagedUploadPath, clientIdentifier: $clientIdentifier) { bulkOperation { id status } userErrors { field message } } }`;
  const runRes = await gqlRaw(env, runQ, { mutation, stagedUploadPath: params.key, clientIdentifier: 'dedup-delete-' + Date.now() });
  const bu = (runRes && runRes.data && runRes.data.bulkOperationRunMutation && runRes.data.bulkOperationRunMutation.bulkOperation) || null;
  const runErrs = (runRes && runRes.data && runRes.data.bulkOperationRunMutation && runRes.data.bulkOperationRunMutation.userErrors) || [];
  if (!bu) return { ok: false, error: 'bulk run failed: ' + JSON.stringify(runRes && runRes.data).slice(0, 300) };
  if (runErrs.length) return { ok: false, error: 'bulk run userErrors: ' + JSON.stringify(runErrs).slice(0, 300), opId: bu.id };
  return { ok: true, fired: lines.length, opId: bu.id };
}

async function bulkStatus(env, opId) {
  const q = `query($id: ID!) { node(id: $id) { ... on BulkOperation { id status objectCount errorCode url } } }`;
  const { body } = await shopifyFetch(env, '/graphql.json', { method: 'POST', body: JSON.stringify({ query: q, variables: { id: opId } }) });
  return body && body.data && body.data.node;
}

export async function onRequest(context) {
  try {
    const { request, env } = context;
    if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
    if (!isAdmin(request, env)) return adminDenied();
    const url = new URL(request.url);
    const run = url.searchParams.get('run') === '1';
    const poll = url.searchParams.get('poll') === '1';

    const gids = await collectDupGids(env);
    const totalDups = gids.length;

    if (run) {
      const st = await loadMeta(env, BULK_NS, BULK_KEY, {});
      const fired = await fireBulkDelete(env, gids);
      if (!fired.ok) return json(fired, 500);
      st.opId = fired.opId;
      st.totalDups = totalDups;
      await saveMeta(env, BULK_NS, BULK_KEY, st);
      return json({ ok: true, opId: fired.opId, status: 'CREATED', totalDups, firedLines: fired.fired });
    }

    if (poll) {
      const st = await loadMeta(env, BULK_NS, BULK_KEY, {});
      if (!st.opId) return json({ ok: false, error: 'no bulk op; call ?run=1 first' }, 400);
      const node = await bulkStatus(env, st.opId);
      if (!node) return json({ ok: false, error: 'cannot read bulk status' }, 500);
      if (node.status !== 'COMPLETED') {
        return json({ ok: true, opId: st.opId, status: node.status, objectCount: node.objectCount, errorCode: node.errorCode || null });
      }
      // completed: download result and count successes/failures
      let deleted = 0, failed = 0, sampleErrors = [];
      if (node.url) {
        const r = await fetch(node.url);
        if (r.ok) {
          const txt = await r.text();
          for (const line of txt.split('\n')) {
            const s = line.trim();
            if (!s) continue;
            try {
              const o = JSON.parse(s);
              const d = o && o.data && o.data.productDelete;
              if (!d) { failed++; continue; }
              if (d.deletedProductId) deleted++;
              else { failed++; if ((d.userErrors || []).length && sampleErrors.length < 5) sampleErrors.push(d.userErrors[0].message); }
            } catch { failed++; }
          }
        } else {
          return json({ ok: false, error: 'bulk download ' + r.status }, 500);
        }
      }
      st.status = node.status;
      st.deleted = deleted;
      st.failed = failed;
      await saveMeta(env, BULK_NS, BULK_KEY, st);
      return json({ ok: true, opId: st.opId, status: node.status, totalDups, deleted, failed, sampleErrors });
    }

    // status (default)
    const st = await loadMeta(env, BULK_NS, BULK_KEY, {});
    return json({ ok: true, totalDups, opId: st.opId || null, status: st.status || (st.opId ? 'pending-poll' : 'not-started'), deleted: st.deleted || 0, failed: st.failed || 0 });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err), stack: String(err && err.stack || '').slice(0, 500) }, 500);
  }
}
