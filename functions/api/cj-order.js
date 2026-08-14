import { corsHeaders, cjFetch, shopifyFetch, shopifyToCjOrder, buildCjOrderFromBody } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  try {
    const body = await request.json().catch(() => ({}));
    if (body.shopifyOrderId) {
      const { body: res } = await shopifyFetch(env, '/orders/'+body.shopifyOrderId+'.json');
      const cjPayload = shopifyToCjOrder(res.order);
      const result = await cjFetch(env, '/order/createOrderV2', { method: 'POST', body: JSON.stringify(cjPayload) });
      return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    }
    const payload = body.products || body.line_items ? buildCjOrderFromBody(body) : body;
    const result = await cjFetch(env, '/order/createOrderV2', { method: 'POST', body: JSON.stringify(payload) });
    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
}