import { corsHeaders, cjFetch, shopifyFetch } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context; const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  const orderNumber = url.searchParams.get('number');
  if (!orderNumber) return new Response(JSON.stringify({ error: 'Order number required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  try {
    const cjResult = await cjFetch(env, '/order/getOrderDetail?orderNumber='+encodeURIComponent(orderNumber));
    if (cjResult.code === 200 && cjResult.data) return new Response(JSON.stringify({ source: 'cj', data: cjResult.data }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    const { body } = await shopifyFetch(env, '/orders.json?name='+encodeURIComponent(orderNumber)+'&status=any');
    const order = body.orders?.[0];
    if (order) return new Response(JSON.stringify({ source: 'shopify', data: order }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
}