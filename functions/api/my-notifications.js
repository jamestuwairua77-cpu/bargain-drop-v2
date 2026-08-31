// Cloudflare Pages Function: /api/my-notifications
// GET — returns order-status notifications for the logged-in user.
//
// Notifications are DERIVED from the durable order ledger (data/orders.json) on read,
// so they are always in sync with the actual order state — no separate write path,
// no GitHub write contention, no desync between "order status" and "notification".
//
// Each notification gives the user a plain-language rundown of what's happening
// to their order right now: payment received, packed, shipped, delivered, or an issue.

import { corsHeaders, listOrders } from '../_sync-lib.js';

function normalizeEmail(e) {
  return String(e || '').trim().toLowerCase();
}

// Canonical status → human messaging.
const STATUS_LABEL = {
  unpaid: 'Payment pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  review: 'To review',
  return: 'Return',
  fulfilled: 'Fulfilled',
};

const STATUS_ICON = {
  unpaid: '💳',
  processing: '📦',
  shipped: '🚚',
  delivered: '✅',
  review: '⭐',
  return: '↩️',
  fulfilled: '✅',
};

function canonStatus(s) {
  if (s === 'pending') return 'unpaid';
  if (s === 'paid' || s === 'fulfilling') return 'processing';
  if (s === 'fulfilled') return 'fulfilled';
  if (s === 'shipped') return 'shipped';
  if (s === 'delivered') return 'delivered';
  if (s === 'review' || s === 'to_review') return 'review';
  if (s === 'return') return 'return';
  return s || 'unpaid';
}

// Descriptive "what's happening" copy per status.
function statusMessage(o, st) {
  const id = String(o.id || '').slice(0, 18);
  const items = (o.items && o.items.length) ? o.items.length : 1;
  switch (st) {
    case 'unpaid':
      return `We're still waiting for payment on order ${id}. Complete payment to get it moving.`;
    case 'processing':
      return `Good news — order ${id} is paid and being prepared for dispatch.`;
    case 'fulfilled':
      return `Order ${id} has been handed to our fulfilment partner and is on its way.`;
    case 'shipped':
      return `Order ${id} has shipped and is heading to your door.`;
    case 'delivered':
      return `Order ${id} was delivered. Enjoy your ${items} item${items === 1 ? '' : 's'}!`;
    case 'review':
      return `Your ${items} item${items === 1 ? '' : 's'} from order ${id} are ready — please leave a review.`;
    case 'return':
      return `A return was recorded for order ${id}.`;
    default:
      return `Order ${id} status updated.`;
  }
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

  let email = url.searchParams.get('email') || '';
  if (!email) {
    const auth = request.headers.get('Authorization') || '';
    email = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  }

  try {
    const all = await listOrders(env);
    let orders = all;
    if (email) {
      const target = normalizeEmail(email);
      orders = all.filter((o) => normalizeEmail(o.email) === target);
    }

    // Build a notification per order (most recent activity first).
    const notifications = orders
      .map((o) => {
        const st = canonStatus(o.status);
        const when = o.updatedAt || (o.fulfillment && o.fulfillment.at) || o.date || null;
        const hasIssue = !!(o.fulfillment && o.fulfillment.errors && o.fulfillment.errors.length);
        return {
          id: 'ord-' + (o.id || Math.random()),
          orderId: o.id || null,
          type: 'order',
          status: st,
          icon: STATUS_ICON[st] || '📦',
          title: STATUS_LABEL[st] || 'Order update',
          message: hasIssue
            ? `Order ${String(o.id || '').slice(0, 18)} needs attention — an issue occurred during fulfilment.`
            : statusMessage(o, st),
          total: o.total != null ? o.total : null,
          currency: o.currency || 'AUD',
          at: when,
          hasIssue,
        };
      })
      .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

    return new Response(JSON.stringify({ notifications, count: notifications.length }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
