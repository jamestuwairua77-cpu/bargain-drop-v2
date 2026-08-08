// Cloudflare Pages Function: /api/admin-cj
import { corsHeaders, cjFetch } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  try {
    const orders = await cjFetch(env, '/order/getOrderList?pageNum=1&pageSize=20');
    return new Response(JSON.stringify({connected: true, recentOrders: orders.data?.list || [], total: orders.data?.total || 0}), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (e) {
    return new Response(JSON.stringify({ connected: false, error: e.message }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }
}