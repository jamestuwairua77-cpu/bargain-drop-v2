// Cloudflare Pages Function: /api/register-shopify-webhooks
// Registers all required Shopify webhooks (idempotent: skips topics already registered).
// product topics -> /api/product-sync-webhook (rebuilds catalog JSON)
// order/inventory -> /api/shopify-webhook (ledger + tracking + stock back-sync)
//
// GET             -> list currently-registered webhooks (no mutation)
// GET ?run=1      -> register missing webhooks

import { corsHeaders, shopifyFetch, isAdmin, adminDenied } from '../_sync-lib.js';

const WANTED = [
  { topic: 'products/create', path: '/api/product-sync-webhook' },
  { topic: 'products/update', path: '/api/product-sync-webhook' },
  { topic: 'products/delete', path: '/api/product-sync-webhook' },
  { topic: 'orders/create', path: '/api/shopify-webhook' },
  { topic: 'orders/fulfilled', path: '/api/shopify-webhook' },
  { topic: 'inventory_levels/update', path: '/api/shopify-webhook' },
  { topic: 'inventory_items/update', path: '/api/shopify-webhook' },
];

export async function onRequest(context) {
  const { request, env } = context;
  const H = { 'Content-Type': 'application/json', ...corsHeaders() };
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();

  const url = new URL(request.url);
  const run = url.searchParams.get('run') === '1';

  // current state
  const existing = await shopifyFetch(env, '/webhooks.json');
  const current = (existing.body?.webhooks || []).map(w => ({ id: w.id, topic: w.topic, address: w.address }));

  if (!run) {
    return new Response(JSON.stringify({ current, wanted: WANTED }), { headers: H });
  }

  const results = [];
  for (const w of WANTED) {
    const already = current.find(c => c.topic === w.topic);
    if (already) {
      results.push({ topic: w.topic, status: 'exists', id: already.id });
      continue;
    }
    try {
      const r = await shopifyFetch(env, '/webhooks.json', {
        method: 'POST',
        body: JSON.stringify({ webhook: { topic: w.topic, address: url.origin + w.path, format: 'json' } }),
      });
      results.push({ topic: w.topic, status: r.ok ? 'created' : ('failed:' + r.status), id: r.body?.webhook?.id });
    } catch (e) {
      results.push({ topic: w.topic, status: 'error', error: e.message });
    }
  }
  return new Response(JSON.stringify({ results }), { headers: H });
}
