// Cloudflare Pages Function: /api/admin-orders
// Returns all real Bargain Drop orders directly from the durable order ledger (KV + GitHub).
// Zero Shopify dependency.

import { corsHeaders, listOrders, isAdmin, adminDenied } from '../_sync-lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();

  try {
    const limit = Math.min(250, Math.max(1, parseInt(url.searchParams.get('limit') || '100', 10) || 100));
    const statusFilter = String(url.searchParams.get('status') || 'any').toLowerCase();
    let orders = await listOrders(env);
    if (!Array.isArray(orders)) orders = [];

    if (statusFilter && statusFilter !== 'any' && statusFilter !== 'all') {
      orders = orders.filter((o) => String(o.status || '').toLowerCase() === statusFilter);
    }

    orders.sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime());

    return new Response(JSON.stringify(orders.slice(0, limit)), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders() },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
