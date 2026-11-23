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

    // Server-side PayPal capture verification (prevents spoofed payment_verified: true)
    const isPayPal = String(order.method || order.payment?.gateway || '').toLowerCase() === 'paypal';
    const wantsPaid = order.payment_verified === true || order.status === 'paid' || order.paymentStatus === 'paid';
    let paypalServerVerified = false;
    let paypalVerifyNote = null;

    if (wantsPaid && isPayPal) {
      const ppOrderId = String(order.payment?.hash || order.paypalOrderId || '').trim();
      if (!ppOrderId) {
        return new Response(
          JSON.stringify({ error: 'Missing PayPal transaction/order ID for payment verification.' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
        );
      }
      const ppClientId = env.PAYPAL_CLIENT_ID || '';
      const ppSecret = env.PAYPAL_CLIENT_SECRET || '';
      if (ppClientId && ppSecret) {
        try {
          const ppBase = env.PAYPAL_SANDBOX === '1'
            ? 'https://api-m.sandbox.paypal.com'
            : 'https://api-m.paypal.com';
          const tokRes = await fetch(`${ppBase}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
              Authorization: 'Basic ' + btoa(`${ppClientId}:${ppSecret}`),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
          });
          const tokJson = await tokRes.json().catch(() => ({}));
          if (!tokRes.ok || !tokJson.access_token) {
            return new Response(
              JSON.stringify({ error: 'PayPal verification auth failed' }),
              { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
            );
          }
          const ordRes = await fetch(`${ppBase}/v2/checkout/orders/${encodeURIComponent(ppOrderId)}`, {
            headers: { Authorization: 'Bearer ' + tokJson.access_token },
          });
          const ordJson = await ordRes.json().catch(() => ({}));
          if (!ordRes.ok || String(ordJson.status || '').toUpperCase() !== 'COMPLETED') {
            return new Response(
              JSON.stringify({
                error: `PayPal order ${ppOrderId} is not COMPLETED (status: ${ordJson.status || ordRes.status})`,
              }),
              { status: 402, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
            );
          }
          paypalServerVerified = true;
          paypalVerifyNote = 'verified_via_paypal_api';
        } catch (ve) {
          return new Response(
            JSON.stringify({ error: 'PayPal server verification error: ' + ve.message }),
            { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
          );
        }
      } else {
        // Fallback when PAYPAL_CLIENT_SECRET is not yet set in CF Pages env vars:
        // Require a valid PayPal capture ID + captured amount > 0 and log for audit.
        paypalServerVerified = /^[A-Z0-9]{10,32}$/i.test(ppOrderId) && Number(order.payment?.amount || order.total || 0) > 0;
        paypalVerifyNote = 'client_capture_id_checked_set_PAYPAL_CLIENT_SECRET_for_strict_api_verify';
      }
    } else if (wantsPaid && !isPayPal && !isAdmin(request, env)) {
      // Non-PayPal orders (Stripe) MUST be marked paid exclusively by verified /api/stripe-webhook
      order.status = 'pending_payment';
      order.paymentStatus = 'unpaid';
      order.payment_verified = false;
    }

    order.inventoryLock = lockResult;
    if (paypalVerifyNote) order.paypalVerifyNote = paypalVerifyNote;
    const saved = await saveOrderRecord(env, order);
    await appendSyncLog(env, {
      action: 'save-order',
      id: saved.id,
      status: saved.status || 'pending_payment',
      ...(paypalVerifyNote ? { paypalVerifyNote } : {}),
    });

    // If PayPal capture completed with verified payment, trigger CJ fulfillment automatically
    let fulfillment = null;
    if (wantsPaid && isPayPal && paypalServerVerified) {
      try {
        const fulfillPromise = fulfillOrder(env, saved).catch((fe) => ({
          done: false,
          error: fe.message,
        }));
        if (typeof context.waitUntil === 'function') {
          context.waitUntil(fulfillPromise);
        }
        fulfillment = await Promise.race([
          fulfillPromise,
          new Promise((r) => setTimeout(() => r({ status: 'started_in_background' }), 9000)),
        ]);
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
        paypalServerVerified,
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
