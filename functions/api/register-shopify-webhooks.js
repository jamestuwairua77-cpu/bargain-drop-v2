import { corsHeaders, shopifyFetch } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context; const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  const webhooks = [
    { topic: 'products/create', address: url.origin + '/api/product-sync-webhook', format: 'json' },
    { topic: 'products/update', address: url.origin + '/api/product-sync-webhook', format: 'json' },
    { topic: 'products/delete', address: url.origin + '/api/product-sync-webhook', format: 'json' },
    { topic: 'orders/create', address: url.origin + '/api/shopify-webhook', format: 'json' },
    { topic: 'orders/fulfilled', address: url.origin + '/api/shopify-webhook', format: 'json' },
    { topic: 'inventory_levels/update', address: url.origin + '/api/shopify-webhook', format: 'json' },
    { topic: 'inventory_items/update', address: url.origin + '/api/shopify-webhook', format: 'json' },
  ];
  const results = [];
  for (const wh of webhooks) {
    try {
      const result = await shopifyFetch(env, '/webhooks.json', { method: 'POST', body: JSON.stringify({ webhook: wh }) });
      results.push({ topic: wh.topic, ok: result.ok, id: result.body?.webhook?.id });
    } catch (e) { results.push({ topic: wh.topic, ok: false, error: e.message }); }
  }
  return new Response(JSON.stringify({ success: true, webhooks: results }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}