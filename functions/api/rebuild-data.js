import { corsHeaders, shopifyFetch } from '../_sync-lib.js';

// NOTE: catalog rebuild has been MOVED to GitHub Actions (scripts/rebuild_catalog.py +
// .github/workflows/rebuild-catalog.yml). This Cloudflare Function previously rebuilt the
// catalog by writing root manifests per-file, which clobbered the correct GitHub-Actions-built
// catalog (producing {shards:0,count:0} and stale shards). The `sync` action is now a no-op
// so that legacy scheduled tasks that still call ?action=sync cannot corrupt the catalog again.
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'status';
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });

  if (action === 'status') {
    const TK = env.SHOPIFY_ACCESS_TOKEN || env.SHOPIFY_TOKEN || '';
    if (!TK) return new Response(JSON.stringify({ ok: false, error: 'Missing env variables' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    try {
      const { body } = await shopifyFetch(env, '/products/count.json');
      return new Response(JSON.stringify({ ok: true, count: body.count }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    }
  }

  // `syn` (and any other action) is now intentionally a no-op.
  return new Response(JSON.stringify({
    ok: true,
    disabled: true,
    message: 'Catalog rebuild has moved to GitHub Actions (rebuild-catalog.yml). This endpoint no longer writes catalog files; trigger the workflow or wait for the 6-hourly cron instead.'
  }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}
