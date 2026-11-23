// Cloudflare Pages Function: /api/create-checkout-session
// POST — Atomic Inventory Lock + Idempotent Stripe Checkout Session Creation (Module 3)

import {
  corsHeaders,
  lockAndVerifyInventory,
  saveOrderRecord,
  listOrders,
  normalizePhoneE164,
} from '../_sync-lib.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const body = await request.json().catch(() => ({}));
  const {
    line_items,
    customer_email,
    success_url,
    cancel_url,
    metadata,
    payment_method,
    shipping_options,
    promo_code,
    idempotency_key,
    order,
  } = body;

  const STRIPE_KEY = env.STRIPE_SECRET_KEY || '';
  if (!STRIPE_KEY) {
    return new Response(JSON.stringify({ error: 'Stripe key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  if (!Array.isArray(line_items) || line_items.length === 0) {
    return new Response(JSON.stringify({ error: 'Cart is empty' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  try {
    const orderId =
      (metadata && metadata.order_id) ||
      (order && order.id) ||
      'BD' + Date.now().toString(36).toUpperCase();
    const idemKey =
      String(idempotency_key || (metadata && metadata.idempotency_key) || '').trim() ||
      `idem_checkout_${orderId}`;

    // 1. Check idempotent replay in durable order ledger
    try {
      const existingOrders = await listOrders(env);
      const existing = existingOrders.find(
        (o) =>
          (o.idempotency_key && o.idempotency_key === idemKey) ||
          (o.id && o.id === orderId)
      );
      if (
        existing &&
        (existing.status === 'paid' ||
          existing.status === 'fulfilling' ||
          existing.status === 'shipped')
      ) {
        return new Response(
          JSON.stringify({
            error: 'Order already paid and processed',
            alreadyPaid: true,
            orderId: existing.id,
          }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json', ...corsHeaders() },
          }
        );
      }
      if (
        existing &&
        existing.stripe_session_url &&
        existing.stripe_session_id &&
        existing.idempotency_key === idemKey
      ) {
        return new Response(
          JSON.stringify({
            url: existing.stripe_session_url,
            id: existing.stripe_session_id,
            orderId: existing.id,
            idempotentReplay: true,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders() },
          }
        );
      }
    } catch {}

    // 2. Apply atomic inventory row lock & stock verification BEFORE initiating payment
    const itemsToLock =
      order && Array.isArray(order.items) && order.items.length
        ? order.items
        : line_items.map((li) => ({
            product_id: li.product_id || null,
            variant_id: li.variant_id || null,
            sku: li.sku || null,
            title:
              (li.price_data &&
                li.price_data.product_data &&
                li.price_data.product_data.name) ||
              li.name ||
              'Product',
            qty: li.quantity || 1,
          }));

    const lockResult = await lockAndVerifyInventory(env, itemsToLock, orderId);
    if (!lockResult.ok) {
      return new Response(
        JSON.stringify({
          error: lockResult.message || 'Insufficient inventory',
          code: lockResult.code || 'INSUFFICIENT_STOCK',
          details: lockResult,
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        }
      );
    }

    // 3. Server-side promo code validation & enforcement (aligned with cart-v3.js & checkout.html)
    const PROMO_CODES = {
      BARGAIN26: 30,
      SAVE10: 10,
      WELCOME10: 10,
      COMEBACK10: 10,
      FREESHIP: 0,
      FREESHIP29: 0,
      SAVE5AUD: 15,
    };
    let discountPct = 0;
    let isFreeShipCode = false;
    if (promo_code && String(promo_code).trim()) {
      const code = String(promo_code).trim().toUpperCase();
      if (Object.prototype.hasOwnProperty.call(PROMO_CODES, code)) {
        discountPct = PROMO_CODES[code];
        if (code === 'FREESHIP' || code === 'FREESHIP29') isFreeShipCode = true;
      } else if (code.startsWith('COMEBACK10')) {
        discountPct = 10;
      } else {
        return new Response(JSON.stringify({ error: 'Invalid promo code' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        });
      }
    }
    const factor = (100 - discountPct) / 100;

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', success_url);
    params.append('cancel_url', cancel_url);
    if (customer_email) {
      params.append('customer_email', customer_email);
    }

    if (payment_method === 'card') {
      params.append('payment_method_types[]', 'card');
    } else {
      const methods = ['card', 'link', 'afterpay_clearpay', 'klarna', 'zip'];
      methods.forEach((m) => params.append('payment_method_types[]', m));
    }

    const mergedMetadata = {
      ...(metadata || {}),
      order_id: orderId,
      idempotency_key: idemKey,
    };
    Object.entries(mergedMetadata).forEach(([k, v]) => {
      if (v != null) params.append(`metadata[${k}]`, String(v));
    });

    line_items.forEach((item, i) => {
      const pd = item.price_data || {};
      const name =
        (pd.product_data && pd.product_data.name) || item.name || 'Product';
      const images = (pd.product_data && pd.product_data.images) || [];
      const currency = pd.currency || item.currency || 'aud';
      const unitAmount = Math.max(
        50,
        Math.round(Number(pd.unit_amount ?? item.unit_amount ?? 0) * factor)
      );
      const quantity = Number(item.quantity > 0 ? item.quantity : 1);

      params.append(`line_items[${i}][price_data][currency]`, currency);
      params.append(`line_items[${i}][price_data][product_data][name]`, name);
      images.forEach((img) => {
        if (img && /^https?:\/\//i.test(img)) {
          params.append(
            `line_items[${i}][price_data][product_data][images][]`,
            img
          );
        }
      });
      params.append(
        `line_items[${i}][price_data][unit_amount]`,
        String(unitAmount)
      );
      params.append(`line_items[${i}][quantity]`, String(quantity));
    });

    // Collect shipping address & phone on Stripe if not already supplied on order
    const ordShip = (order && order.shipping) || {};
    if (!ordShip.address1 || !ordShip.city || !ordShip.zip) {
      ['AU', 'NZ', 'US', 'CA', 'GB', 'DE', 'FR', 'SG', 'IE', 'NL'].forEach((cc) => {
        params.append('shipping_address_collection[allowed_countries][]', cc);
      });
    }
    if (!ordShip.phone && !(order && order.phone)) {
      params.append('phone_number_collection[enabled]', 'true');
    }

    if (isFreeShipCode) {
      params.append('shipping_options[0][shipping_rate_data][display_name]', 'Free Tracked Express Shipping');
      params.append('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
      params.append('shipping_options[0][shipping_rate_data][fixed_amount][amount]', '0');
      params.append('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'aud');
    } else if (Array.isArray(shipping_options) && shipping_options.length) {
      shipping_options.forEach((so, i) => {
        const srd = so.shipping_rate_data || {};
        if (srd) {
          params.append(
            `shipping_options[${i}][shipping_rate_data][display_name]`,
            srd.display_name || 'Shipping'
          );
          params.append(
            `shipping_options[${i}][shipping_rate_data][type]`,
            srd.type || 'fixed_amount'
          );
          params.append(
            `shipping_options[${i}][shipping_rate_data][fixed_amount][amount]`,
            String(
              srd.fixed_amount && srd.fixed_amount.amount != null
                ? srd.fixed_amount.amount
                : 0
            )
          );
          params.append(
            `shipping_options[${i}][shipping_rate_data][fixed_amount][currency]`,
            (srd.fixed_amount && srd.fixed_amount.currency) ||
              srd.currency ||
              'aud'
          );
        }
      });
    }

    // 4. Create Stripe Checkout Session with Stripe-level Idempotency-Key header
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + STRIPE_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': idemKey,
      },
      body: params.toString(),
    });

    const data = await r.json();
    if (!r.ok) {
      return new Response(
        JSON.stringify({ error: data.error?.message || 'Stripe error' }),
        {
          status: r.status,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        }
      );
    }

    // 5. Persist the order record atomically in pending_payment state with inventory lock
    if (order && typeof order === 'object') {
      const ship = order.shipping || {};
      const countryCode = (ship.country_code || 'AU').toUpperCase();
      if (ship.phone || order.phone) {
        ship.phone = normalizePhoneE164(ship.phone || order.phone, countryCode);
      }
      await saveOrderRecord(env, {
        ...order,
        id: orderId,
        idempotency_key: idemKey,
        status: 'pending_payment',
        cartCleared: false,
        shipping: ship,
        phone: ship.phone || order.phone || '',
        inventoryLock: lockResult,
        stripe_session_id: data.id,
        stripe_session_url: data.url,
      }).catch(() => null);
    }

    return new Response(
      JSON.stringify({
        url: data.url,
        id: data.id,
        orderId,
        idempotencyKey: idemKey,
        inventoryLocked: true,
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
