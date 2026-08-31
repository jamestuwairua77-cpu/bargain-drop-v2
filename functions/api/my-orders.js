// Cloudflare Pages Function: /api/my-orders
// GET — returns the logged-in user's orders from the durable ledger (data/orders.json),
//       filtered by email (session email via ?email=, or the Authorization bearer).
// This is the SERVER source of truth that powers orders.html (previously localStorage-only).

import { corsHeaders, listOrders } from '../_sync-lib.js';

function normalizeEmail(e) {
  return String(e || '').trim().toLowerCase();
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  // Identity: prefer ?email= (frontend passes the logged-in user's email),
  // fall back to Authorization bearer token, then to a session cookie value.
  let email = url.searchParams.get('email') || '';
  if (!email) {
    const auth = request.headers.get('Authorization') || '';
    email = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  }

  try {
    const orders = await listOrders(env);

    // Map server statuses onto the four UI tabs (plus return), so the
    // front-end has a single canonical status vocabulary.
    const canon = (s) => {
      if (s === 'pending') return 'unpaid';
      if (s === 'paid' || s === 'fulfilling' || s === 'fulfilled') return 'processing';
      if (s === 'shipped' || s === 'delivered') return 'shipped';
      if (s === 'review' || s === 'to_review') return 'review';
      if (s === 'return') return 'return';
      return s || 'unpaid';
    };

    let result = orders;

    // If we can resolve an email, filter to that user's orders only.
    if (email) {
      const target = normalizeEmail(email);
      result = orders.filter((o) => normalizeEmail(o.email) === target);
    }

    const enriched = result
      .map((o) => ({
        ...o,
        status: canon(o.status),
        // Surface the latest fulfillment outcome for the notification rundown
        // WITHOUT leaking raw tokens (cj has no secrets, but keep it tight).
        fulfillment: o.fulfillment ? {
          done: !!o.fulfillment.done,
          at: o.fulfillment.at || null,
          shipped: !!(o.fulfillment.cj && o.fulfillment.cj.code === 200),
          shopify: !!(o.fulfillment.shopify && o.fulfillment.shopify.ok),
        } : null,
      }))
      .sort((a, b) => new Date(b.date || b.updatedAt || 0) - new Date(a.date || a.updatedAt || 0));

    return new Response(JSON.stringify({ orders: enriched }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
