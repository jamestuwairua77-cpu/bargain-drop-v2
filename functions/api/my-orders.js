// Cloudflare Pages Function: /api/my-orders
// GET — returns the *logged-in* user's orders from the durable ledger (data/orders.json).
// Identity is resolved SERVER-SIDE from the verified __session cookie (never a
// client-supplied email), so each account only ever sees its own orders.
//
// Scoping: orders are matched to the user by their stored email (order.email or
// order.shipping.email) against the session user's email. If the session user has
// no email (should not happen), it falls back to exact userId match on order.userId.

import { corsHeaders, listOrders, getSessionUser } from '../_sync-lib.js';

function normalizeEmail(e) {
  return String(e || '').trim().toLowerCase();
}

function orderEmails(o) {
  const set = [];
  if (o.email) set.push(normalizeEmail(o.email));
  if (o.shipping && o.shipping.email) set.push(normalizeEmail(o.shipping.email));
  if (o.customer_email) set.push(normalizeEmail(o.customer_email));
  return set;
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const user = await getSessionUser(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Sign in required' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  try {
    const orders = await listOrders(env);
    const target = normalizeEmail(user.email);

    // Scope strictly to this account's orders.
    const result = orders.filter((o) => {
      if (o.userId && user.id && String(o.userId) === String(user.id)) return true;
      if (target && orderEmails(o).indexOf(target) >= 0) return true;
      return false;
    });

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
