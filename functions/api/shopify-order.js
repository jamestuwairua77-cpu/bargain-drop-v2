import { corsHeaders, shopifyFetch } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context; if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  try { const body = await request.json().catch(() => ({})); const result = await shopifyFetch(env, '/orders.json', { method: 'POST', body: JSON.stringify({ order: body }) }); return new Response(JSON.stringify(result.body), { status: result.ok ? 200 : result.status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
  catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
}