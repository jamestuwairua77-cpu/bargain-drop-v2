import { corsHeaders, shopifyFetch } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context; if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  try { const { body } = await shopifyFetch(env, '/products/count.json'); return new Response(JSON.stringify({ success: true, count: body.count, note: 'Use /api/sync-full?action=sync for full rebuild' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
  catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
}