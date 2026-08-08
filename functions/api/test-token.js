import { corsHeaders, shopifyFetch } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context; if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  try { const { body, ok } = await shopifyFetch(env, '/shop.json'); return new Response(JSON.stringify({ ok, shop: body.shop?.name, plan: body.shop?.plan_name }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
  catch (e) { return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
}