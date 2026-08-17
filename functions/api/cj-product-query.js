import { corsHeaders, cjFetchMulti } from '../_sync-lib.js';
// Cross-check proxy: query a CJ product by variantSku to compare against our catalog.
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  const url = new URL(request.url);
  const sku = url.searchParams.get('sku') || url.searchParams.get('variantSku');
  const pid = url.searchParams.get('pid');
  if (!sku && !pid) return new Response(JSON.stringify({ error: 'sku or pid required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  try {
    const path = sku
      ? '/product/query?variantSku=' + encodeURIComponent(sku)
      : '/product/variant/query?pid=' + encodeURIComponent(pid);
    const body = await cjFetchMulti(env, path);
    return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }
}
