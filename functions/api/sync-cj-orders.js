import { corsHeaders, cjFetch } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context; if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  try { const result = await cjFetch(env, '/order/getOrderList?pageNum=1&pageSize=50'); return new Response(JSON.stringify({ success: true, total: result.data?.total || 0, orders: result.data?.list || [] }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
  catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
}