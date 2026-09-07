// Cloudflare Pages Function: /api/dedup-delete
// Deletes duplicate products previously detected by /api/dedup-detect.
// Reads persisted groups (metafield NS=dedupdetect, KEY=state) and deletes ONLY
// the dupIds (never keepers). Bounded, resumable. Deletion is permanent.
//
//   GET ?status=1          -> { totalDups, deleted, remaining, done }
//   GET ?run=1[&limit=N]   -> delete up to N dups (default 25)

import { corsHeaders, isAdmin, adminDenied, shopifyFetch } from '../_sync-lib.js';

const SHOP_GID = 'gid://shopify/Shop/73594044547';
const DET_NS = 'dedupdetect';
const DET_KEY = 'state';
const DEL_NS = 'dedupdelete';
const DEL_KEY = 'state';

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
    m: [{ ownerId: SHOP_GID, namespace: ns, key, type: 'json', value: JSON.stringify(value) }],
  });
  const ue = (res && res.data && res.data.metafieldsSet && res.data.metafieldsSet.userErrors) || [];
  if (ue.length) throw new Error('save: ' + ue.map(x => x.message).join('; '));
}

export async function onRequest(context) {
  try {
    const { request, env } = context;
    if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
    if (!isAdmin(request, env)) return adminDenied();
    const url = new URL(request.url);
    const reset = url.searchParams.get('reset') === '1';
    const run = url.searchParams.get('run') === '1';

    const det = await loadMeta(env, DET_NS, DET_KEY, { groups: [], stats: {} });
    const groups = det.groups || [];
    const allDup = [];
    for (const g of groups) for (const id of (g.dupIds || [])) allDup.push(String(id));

    const del = reset ? { deleted: [] } : await loadMeta(env, DEL_NS, DEL_KEY, { deleted: [] });
    const deletedSet = new Set((del.deleted || []).map(String));

    if (reset) {
      await saveMeta(env, DEL_NS, DEL_KEY, { deleted: [] });
      return json({ ok: true, reset: true, totalDups: allDup.length, deleted: 0, remaining: allDup.length });
    }

    if (!run) {
      const remaining = allDup.filter(id => !deletedSet.has(id)).length;
      return json({ ok: true, totalDups: allDup.length, deleted: deletedSet.size, remaining, done: remaining === 0 });
    }

    const limit = parseInt(url.searchParams.get('limit') || '25', 10);
    const pending = allDup.filter(id => !deletedSet.has(id)).slice(0, limit);

    let done = 0, rateLimited = false;
    for (const id of pending) {
      const r = await shopifyFetch(env, `/products/${id}.json`, { method: 'DELETE', skip429Retry: true });
      if (r.ok || r.status === 404) {
        done++;
        del.deleted = (del.deleted || []).concat(id);
        deletedSet.add(id);
      } else if (r.status === 429) {
        rateLimited = true;
        break;
      }
      await new Promise(res => setTimeout(res, 350));
    }

    await saveMeta(env, DEL_NS, DEL_KEY, { deleted: del.deleted });

    const remaining = allDup.filter(id => !deletedSet.has(id)).length;
    return json({ ok: true, processed: pending.length, thisRunDeleted: done, rateLimited, totalDups: allDup.length, deleted: deletedSet.size, remaining, done: remaining === 0 });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err), stack: String(err && err.stack || '').slice(0, 500) }, 500);
  }
}
