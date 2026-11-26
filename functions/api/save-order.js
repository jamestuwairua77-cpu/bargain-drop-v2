// Cloudflare Pages Function: /api/save-order
// Persists orders with atomic inventory row locks, E.164 phone normalization,
// and automatic end-to-end CJ Dropshipping fulfillment on verified PayPal / PayID / Crypto payments.
// Zero Stripe or Shopify dependencies.

import {
  saveOrderRecord,
  listOrders,
  corsHeaders,
  lockAndVerifyInventory,
  normalizePhoneE164,
  fulfillOrder,
  isAdmin,
  adminDenied,
} from '../_sync-lib.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders() },
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });

  if (request.method === 'GET') {
    const id = url.searchParams.get('id');
    const all = await listOrders(env);
    if (id) {
      const found = all.find((o) => String(o.id) === String(id)) || null;
      return json({ order: found });
    }
    if (!isAdmin(request, env)) return adminDenied();
    return json({ orders: all });
  }

  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await request.json();
    const order = body.order || body;
    if (!order || !order.id) return json({ error: 'order.id required' }, 400);

    // Normalize customer phone to E.164 (required by CJ Dropshipping)
    const ship = order.shipping || order.shippingAddress || {};
    const countryCode = (ship.country_code || ship.countryCode || 'AU').toUpperCase();
    const normalizedPhone = normalizePhoneE164(ship.phone || order.phone || '', countryCode);
    if (normalizedPhone) {
      order.phone = normalizedPhone;
      if (order.shipping) order.shipping.phone = normalizedPhone;
    }

    // Atomic inventory verification & stock reservation lock
    const isAlreadyPaid = order.status === 'paid' || order.paymentStatus === 'paid' || order.payment_verified === true;
    const isPendingTransfer = order.status === 'awaiting_payid' || order.status === 'awaiting_crypto';
    let inventoryLock = null;
    if (Array.isArray(order.items) && order.items.length > 0) {
      inventoryLock = await lockAndVerifyInventory(env, order.items, order.id);
      if (!inventoryLock.ok && !isAlreadyPaid) {
        return json(
          {
            ok: false,
            error: inventoryLock.message || 'Stock verification failed',
            code: inventoryLock.code || 'STOCK_LOCK_FAILED',
            details: inventoryLock,
          },
          409
        );
      }
      if (inventoryLock.ok) {
        order.inventory_lock = inventoryLock;
      }
    }

    // Enforce zero active discounts across all storefront orders
    order.discount = { code: null, percent: 0, amount: 0 };

    const record = await saveOrderRecord(env, {
      ...order,
      discount: { code: null, percent: 0, amount: 0 },
      status: isAlreadyPaid ? 'paid' : isPendingTransfer ? order.status : order.status || 'pending_payment',
      payment_verified: isAlreadyPaid,
      cartCleared: isAlreadyPaid || isPendingTransfer || !!order.cartCleared,
    });

    // Verified instant payment (PayPal Capture, verified Crypto IPN, or Admin-confirmed PayID)
    // immediately triggers direct CJ Dropshipping fulfillment (payType=3 no-wallet) + confirmation email!
    let fulfillment = null;
    if (
      isAlreadyPaid &&
      (order.method === 'PayPal' ||
        order.paymentMethod === 'PayPal' ||
        order.payment?.gateway === 'paypal' ||
        order.payment?.gateway === 'payid' ||
        order.payment?.gateway === 'crypto' ||
        order.triggerFulfillment === true)
    ) {
      try {
        fulfillment = await fulfillOrder(env, record);
      } catch (e) {
        fulfillment = { ok: false, error: e.message };
      }
    }

    return json({ ok: true, order: record, inventoryLock, fulfillment });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
