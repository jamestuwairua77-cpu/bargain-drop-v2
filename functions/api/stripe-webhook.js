// Cloudflare Pages Function: /api/stripe-webhook
// POST — Verifies Stripe webhook signature, enforces idempotency, marks order paid,
// commits inventory lock, marks cartCleared: true, and triggers automated CJ Dropshipping forwarding.

import {
  updateOrderStatus,
  appendSyncLog,
  listOrders,
  fulfillOrder,
  findShopifyOrderByBDId,
  recordShopifyTransaction,
  shopifyFetch,
  ghRead,
  ghWrite,
  b64DecodeUtf8,
} from '../_sync-lib.js';

async function verifyStripeSignature(rawBody, signature, secret) {
  const parts = (signature || '').split(',');
  let ts = '';
  const sigs = [];
  for (const p of parts) {
    const trimmed = p.trim();
    if (trimmed.startsWith('t=')) ts = trimmed.slice(2);
    else if (trimmed.startsWith('v1=')) sigs.push(trimmed.slice(3));
  }
  if (!ts || !sigs.length || !secret) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signed = await crypto.subtle.sign('HMAC', key, enc.encode(ts + '.' + rawBody));
  const hex = [...new Uint8Array(signed)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return sigs.some((sig) => hex.length === sig.length && hex === sig);
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature') || '';
  const WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET || '';

  if (!WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
      status: 500,
    });
  }
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature' }), {
      status: 400,
    });
  }

  const ok = await verifyStripeSignature(rawBody, signature, WEBHOOK_SECRET);
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  try {
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'payment_intent.succeeded'
    ) {
      const session = event.data.object || {};
      const md = session.metadata || {};

      // ── STORE CREDIT TOP-UP ──
      if (md.credit_topup === '1' || md.credit_topup === 1) {
        const userId = md.user_id || null;
        const email = md.email || null;
        const credits = Math.round((session.amount_total || session.amount || 0) / 100);
        try {
          const ex = await ghRead(env, 'users-seed.json');
          let users = [];
          if (ex && ex.content) {
            users = JSON.parse(b64DecodeUtf8(ex.content));
          }
          const user = users.find(
            (u) => (userId && u.id === userId) || (email && u.email === email)
          );
          if (user) {
            user.credits = (Number(user.credits) || 0) + credits;
            await ghWrite(
              env,
              'users-seed.json',
              JSON.stringify(users, null, 2),
              'credits: top-up ' + credits,
              ex && ex.sha
            );
            await appendSyncLog(env, {
              action: 'credit-topup',
              user_id: user.id,
              email: user.email,
              credits_added: credits,
              total_credits: user.credits,
              stripe_session_id: session.id,
            });
          } else {
            await appendSyncLog(env, {
              action: 'credit-topup',
              warning: 'user not found',
              user_id: userId,
              email,
              credits,
            });
          }
        } catch (ce) {
          await appendSyncLog(env, {
            action: 'credit-topup',
            warning: 'credit apply failed',
            error: ce.message,
          });
        }
        return new Response(
          JSON.stringify({ received: true, credit_topup: true, credits }),
          { status: 200 }
        );
      }

      const orderId = md.order_id || null;
      const paymentStatus = session.payment_status || 'paid';
      const amount = session.amount_total ?? session.amount ?? 0;

      if (orderId) {
        // Idempotency check: prevent duplicate webhook processing
        const existingOrders = await listOrders(env);
        const existingOrder = existingOrders.find((o) => o.id === orderId);
        if (
          existingOrder &&
          existingOrder.fulfillment &&
          existingOrder.fulfillment.done &&
          (existingOrder.stripe_event_id === event.id ||
            existingOrder.paymentStatus === 'paid')
        ) {
          return new Response(
            JSON.stringify({
              received: true,
              order: orderId,
              idempotentReplay: true,
              fulfillment: existingOrder.fulfillment,
            }),
            { status: 200 }
          );
        }

        // Capture any customer details collected on Stripe Checkout if missing on local order
        const custDetails = session.customer_details || {};
        const shippingDetails = session.shipping_details || custDetails || {};
        const addr = shippingDetails.address || {};

        const extraPatch = {
          paymentStatus,
          cartCleared: true,
          amount_total: amount,
          stripe_session_id: session.id,
          stripe_event_id: event.id,
          payment_intent_id: session.payment_intent || session.id,
          paidAt: new Date().toISOString(),
        };

        if (existingOrder) {
          const ship = { ...(existingOrder.shipping || {}) };
          if (!ship.address1 && addr.line1) ship.address1 = addr.line1;
          if (!ship.address2 && addr.line2) ship.address2 = addr.line2;
          if (!ship.city && addr.city) ship.city = addr.city;
          if (!ship.state && addr.state) ship.state = addr.state;
          if (!ship.zip && addr.postal_code) ship.zip = addr.postal_code;
          if (!ship.country_code && addr.country) ship.country_code = addr.country;
          if (!ship.phone && custDetails.phone) ship.phone = custDetails.phone;
          extraPatch.shipping = ship;
          if (!existingOrder.email && custDetails.email) {
            extraPatch.email = custDetails.email;
          }
        }

        const updatedOrder = await updateOrderStatus(env, orderId, 'paid', extraPatch);
        await appendSyncLog(env, {
          action: 'stripe-webhook',
          event: event.type,
          order_id: orderId,
          paymentStatus,
        });

        // Module 4 Step A: Automatically forward authorized order to CJ Dropshipping
        // Use context.waitUntil so Cloudflare NEVER terminates the worker before CJ responds.
        let fulfillment = null;
        try {
          const orderToFulfill =
            updatedOrder ||
            existingOrder || {
              id: orderId,
              email: custDetails.email || md.email || '',
              shipping: extraPatch.shipping || {},
              items: [],
            };
          const fulfillPromise = fulfillOrder(env, orderToFulfill).catch((fe) => ({
            done: false,
            error: fe.message,
          }));
          if (typeof context.waitUntil === 'function') {
            context.waitUntil(fulfillPromise);
          }
          const WITHIN = await Promise.race([
            fulfillPromise,
            new Promise((r) => setTimeout(() => r('pending'), 9000)),
          ]);
          fulfillment = WITHIN === 'pending' ? 'started_in_background' : WITHIN;
        } catch (fe) {
          fulfillment = { error: fe.message };
        }

        let transaction = null;
        try {
          const shopOrder = await findShopifyOrderByBDId(env, orderId);
          if (shopOrder) {
            const gateway =
              session.payment_method_types && session.payment_method_types[0]
                ? session.payment_method_types[0]
                : 'stripe';
            transaction = await recordShopifyTransaction(env, shopOrder.id, {
              amount: amount / 100,
              currency: (session.currency || 'aud').toUpperCase(),
              gateway,
              authorization: session.payment_intent || session.id,
              kind: 'sale',
              status: 'success',
              processed_at: new Date().toISOString(),
            });
            await shopifyFetch(env, `/orders/${shopOrder.id}.json`, {
              method: 'PUT',
              body: JSON.stringify({
                order: { id: shopOrder.id, financial_status: 'paid' },
              }),
            });
          } else {
            transaction = { note: 'no Shopify order found for bd_order_id ' + orderId };
          }
        } catch (te) {
          transaction = { error: te.message };
        }
        await appendSyncLog(env, {
          action: 'stripe-webhook-transaction',
          order_id: orderId,
          transaction,
        });

        return new Response(
          JSON.stringify({ received: true, order: orderId, fulfillment }),
          { status: 200 }
        );
      } else {
        await appendSyncLog(env, {
          action: 'stripe-webhook',
          event: event.type,
          session: session.id,
          warning: 'no order_id metadata',
        });
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }
    }
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
