// Cloudflare Pages Function: /api/save-order
// GET  ?id=<orderId> — Fetches authoritative server-side order & payment/tracking status
// POST               — Idempotent order save with inventory lock & verified PayPal fulfillment trigger

import {
  corsHeaders,
  appendSyncLog,
  saveOrderRecord,
  listOrders,
  lockAndVerifyInventory,
  normalizePhoneE164,
  fulfillOrder,
  getSessionUser,
  isAdmin,
} from '../_sync-lib.js';

function privateHeaders() {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Vary': 'Cookie, Authorization',
    'X-Content-Type-Options': 'nosniff',
    ...corsHeaders(),
  };
}

function redactOrderPiiForGuest(order) {
  const ship = order.shipping || {};
  return {
    id: order.id,
    orderNumber: order.orderNumber || order.id,
    date: order.date || order.createdAt,
    status: order.status || 'paid',
    total: order.total,
    currency: order.currency || 'AUD',
    items: Array.isArray(order.items) ? order.items : [],
    tracking: order.tracking || (order.trackingNumber ? { number: order.trackingNumber, carrier: order.trackingCarrier } : undefined),
    cjOrderId: order.cjOrderId,
    shipping: {
      city: ship.city || '',
      province: ship.province || ship.state || '',
      country: ship.country || 'Australia',
    },
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: privateHeaders() });
  }

  const url = new URL(request.url);

  // GET /api/save-order?id=BD... or ?mine=1
  if (request.method === 'GET') {
    const sessionUser = await getSessionUser(request, env).catch(() => null);
    const adminAuthorized = isAdmin(request, env);

    // Authenticated Account Holder fetching their own order history (?mine=1)
    if (url.searchParams.get('mine') === '1') {
      if (!sessionUser) {
        return new Response(JSON.stringify({ ok: false, error: 'Authentication required' }), {
          status: 401,
          headers: privateHeaders(),
        });
      }
      const allOrders = await listOrders(env);
      const userEmail = String(sessionUser.email || '').trim().toLowerCase();
      const ownOrders = allOrders.filter((o) => {
        const oEmail = String(o.email || o.shipping?.email || '').trim().toLowerCase();
        return (
          (o.userId && String(o.userId) === String(sessionUser.id)) ||
          (userEmail && oEmail === userEmail)
        );
      });
      return new Response(JSON.stringify({ ok: true, orders: ownOrders }), {
        status: 200,
        headers: privateHeaders(),
      });
    }

    const id = (url.searchParams.get('id') || url.searchParams.get('order') || '').trim();
    if (!id) {
      return new Response(JSON.stringify({ error: 'id query parameter required' }), {
        status: 400,
        headers: privateHeaders(),
      });
    }
    try {
      const orders = await listOrders(env);
      const found = orders.find(
        (o) =>
          String(o.id) === id ||
          String(o.cjOrderId || '') === id ||
          String(o.tracking?.number || o.trackingNumber || '') === id
      );
      if (!found) {
        return new Response(JSON.stringify({ found: false, order: null }), {
          status: 404,
          headers: privateHeaders(),
        });
      }

      const isOwner =
        sessionUser &&
        ((found.userId && String(found.userId) === String(sessionUser.id)) ||
          (sessionUser.email &&
            String(found.email || found.shipping?.email || '').toLowerCase() ===
              String(sessionUser.email).toLowerCase()));

      const isPaid =
        found.status === 'paid' ||
        found.status === 'processing' ||
        found.status === 'fulfilling' ||
        found.status === 'fulfilled' ||
        found.status === 'shipped' ||
        found.paymentStatus === 'paid';

      return new Response(
        JSON.stringify({
          found: true,
          paid: isPaid,
          cartCleared: Boolean(found.cartCleared || isPaid),
          // Full PII only if owner or admin; redacted summary for guest tracking lookup
          order: isOwner || adminAuthorized ? found : redactOrderPiiForGuest(found),
        }),
        {
          status: 200,
          headers: privateHeaders(),
        }
      );
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: privateHeaders(),
      });
    }
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const order = body.order || body;
    if (!order || !order.id) {
      return new Response(JSON.stringify({ error: 'order.id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    // Normalize E.164 phone on shipping address
    const ship = order.shipping || {};
    const countryCode = (ship.country_code || 'AU').toUpperCase();
    if (ship.phone || order.phone) {
      ship.phone = normalizePhoneE164(ship.phone || order.phone, countryCode);
      order.phone = ship.phone;
      order.shipping = ship;
    }

    // Verify & lock inventory before saving
    const lockResult = await lockAndVerifyInventory(env, order.items || [], order.id);
    if (!lockResult.ok && Array.isArray(order.items) && order.items.length > 0) {
      return new Response(
        JSON.stringify({
          error: lockResult.message || 'Insufficient stock',
          code: lockResult.code || 'INSUFFICIENT_STOCK',
          details: lockResult,
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        }
      );
    }

    order.inventoryLock = lockResult;
    const saved = await saveOrderRecord(env, order);
    await appendSyncLog(env, {
      action: 'save-order',
      id: saved.id,
      status: saved.status || 'pending_payment',
    });

    // If PayPal capture completed with verified payment, trigger CJ fulfillment automatically
    let fulfillment = null;
    if (
      (order.payment_verified === true || order.status === 'paid') &&
      String(order.method || '').toLowerCase() === 'paypal'
    ) {
      try {
        fulfillment = await fulfillOrder(env, saved);
      } catch (fe) {
        fulfillment = { error: fe.message };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: saved.id,
        status: saved.status,
        inventoryLocked: true,
        fulfillment,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}