// Cloudflare Pages Function: /api/admin-stats
// GET — returns aggregated Shopify + CJ stats for the admin dashboard

import { corsHeaders, shopifyFetch, cjFetch } from '../_sync-lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });

  try {
    const [productCount, orderCount, cjOrders] = await Promise.all([
      shopifyFetch(env, '/products/count.json'),
      shopifyFetch(env, '/orders/count.json?status=any'),
      cjFetch(env, '/order/getOrderList?pageNum=1&pageSize=50').catch(() => ({ data: { total: 0 } })),
    ]);

    return new Response(JSON.stringify({
      productCount: productCount.body?.count || 0,
      orderCount: orderCount.body?.count || 0,
      cjOrderCount: cjOrders.data?.total || 0,
    }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
