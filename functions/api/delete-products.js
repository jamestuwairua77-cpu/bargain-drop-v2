// Cloudflare Pages Function: /api/delete-products
// Deletes "dead" products (no size option2 = delisted from CJ) from Shopify AND
// removes them from all-products.json.
//
// GET ?run=1[&limit=N][&dryRun=1]
//   dryRun=1: returns the list of product ids that WOULD be deleted (no mutation).
//   run=1: deletes up to `limit` products from Shopify, then prunes them from the
//          catalog and commits to GitHub. Resumable: call repeatedly until done.
// Returns { processed, deleted, remaining, done }.

import { corsHeaders, shopifyFetch, ghRead, ghWrite } from '../_sync-lib.js';

const RAW = 'https://raw.githubusercontent.com/jamestuwairua77-cpu/bargain-drop-v2/main/all-products.json';

function isDead(p) {
  const v = p.variants || [];
  // dead = no variant carries a size (option2)
  return v.length > 0 && !v.some(x => x.option2);
}

export async function onRequest(context) {
  try {
    const { request, env } = context;
    if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
    const url = new URL(request.url);
    const run = url.searchParams.get('run') === '1';
    const dryRun = url.searchParams.get('dryRun') === '1';
    const limit = parseInt(url.searchParams.get('limit') || '30', 10);

    const rawRes = await fetch(RAW);
    if (!rawRes.ok) return new Response(JSON.stringify({ error: 'cannot read catalog: ' + rawRes.status }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    const catalog = await rawRes.json();
    const doc = await ghRead(env, 'all-products.json'); // for sha

    const dead = catalog.map((p, i) => ({ p, i })).filter(x => isDead(x.p));
    const deadIds = dead.map(x => String(x.p.id));

    if (dryRun) {
      return new Response(JSON.stringify({ total: catalog.length, dead: dead.length, ids: deadIds.slice(0, 200) }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    }

    if (!run) {
      return new Response(JSON.stringify({ total: catalog.length, dead: dead.length }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    }

    // Delete up to `limit` from Shopify (bounded, resumable).
    let deleted = 0;
    const toDelete = dead.slice(0, limit);
    for (const { p } of toDelete) {
      const id = p.id;
      try {
        const r = await shopifyFetch(env, `/products/${id}.json`, { method: 'DELETE' });
        if (r.ok || r.status === 404) deleted++;
        else if (r.status === 429) {
          // rate limited — stop this batch, keep remaining for next run
          break;
        }
      } catch (e) {
        // count 404/no-longer-exists as success; otherwise skip this run
      }
      await new Promise(r => setTimeout(r, 350));
    }

    // Prune successfully-deleted products from the catalog.
    const deletedIdSet = new Set(toDelete.slice(0, deleted).map(x => String(x.p.id)));
    const pruned = catalog.filter(p => !deletedIdSet.has(String(p.id)));
    await ghWrite(env, 'all-products.json', JSON.stringify(pruned, null, 1), `delete ${deleted} dead product(s)`, doc ? doc.sha : undefined);

    const remaining = pruned.filter(isDead).length;
    return new Response(JSON.stringify({ processed: toDelete.length, deleted, remaining, done: remaining === 0 }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message || err), stack: String(err && err.stack || '').slice(0, 400) }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }
}
