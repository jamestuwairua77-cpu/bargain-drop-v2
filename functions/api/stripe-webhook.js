// Cloudflare Pages Function: /api/stripe-webhook
// POST — verifies Stripe webhook signature and marks orders paid.
// Security: do NOT trust order-success.html?id= — this is the authoritative
// confirmation that money actually moved.

import { updateOrderStatus, appendSyncLog, listOrders, fulfillOrder, findShopifyOrderByBDId, recordShopifyTransaction, shopifyFetch, ghRead, ghWrite } from '../_sync-lib.js';

async function verifyStripeSignature(rawBody, signature, secret) {
  const parts = (signature || '').split(',');
  let ts = '', sig = '';
  for (const p of parts) {
    if (p.startsWith('t=')) ts = p.slice(2);
    else if (p.startsWith('v1=')) sig = p.slice(3);
  }
  if (!ts || !sig || !secret) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signed = await crypto.subtle.sign('HMAC', key, enc.encode(ts + '.' + rawBody));
  const hex = [...new Uint8Array(signed)].map(b => b.toString(16).padStart(2, '0')).join('');
  return hex.length === sig.length && hex === sig;
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
    return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), { status: 500 });
  }
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature' }), { status: 400 });
  }

  const ok = await verifyStripeSignature(rawBody, signature, WEBHOOK_SECRET);
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
  }

  let event;
  try { event = JSON.parse(rawBody); } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object || {};
      const md = session.metadata || {};

      // ── STORE CREDIT TOP-UP ──
      if (md.credit_topup === '1' || md.credit_topup === 1) {
        const userId = md.user_id || null;
        const email = md.email || null;
        const credits = Math.round((session.amount_total || 0) / 100);
        try {
          const ex = await ghRead(env, 'users-seed.json');
          let users = [];
          if (ex && ex.content) users = JSON.parse(atob(ex.content));
          const user = users.find(u => (userId && u.id === userId) || (email && u.email === email));
          if (user) {
            user.credits = (Number(user.credits) || 0) + credits;
            await ghWrite(env, 'users-seed.json', JSON.stringify(users, null, 2), 'credits: top-up ' + credits, ex && ex.sha);
            await appendSyncLog(env, { action: 'credit-topup', user_id: user.id, email: user.email, credits_added: credits, total_credits: user.credits, stripe_session_id: session.id });
          } else {
            await appendSyncLog(env, { action: 'credit-topup', warning: 'user not found', user_id: userId, email, credits });
          }
        } catch (ce) {
          await appendSyncLog(env, { action: 'credit-topup', warning: 'credit apply failed', error: ce.message });
        }
        return new Response(JSON.stringify({ received: true, credit_topup: true, credits }), { status: 200 });
      }

      const orderId = md.order_id || null;
      const paymentStatus = session.payment_status || 'paid';
      const amount = session.amount_total || 0;
      if (orderId) {
        await updateOrderStatus(env, orderId, 'paid', {
          paymentStatus,
          amount_total: amount,
          stripe_session_id: session.id,
          paidAt: new Date().toISOString(),
        });
        await appendSyncLog(env, { action: 'stripe-webhook', event: event.type, order_id: orderId, paymentStatus });

        let fulfillment = null;
        try {
          const orders = await listOrders(env);
          const order = orders.find(o => o.id === orderId);
          if (order) {
            const p = fulfillOrder(env, order);
            const WITHIN = await Promise.race([p, new Promise(r => setTimeout(() => r('pending'), 9000))]);
            fulfillment = (WITHIN === 'pending') ? 'started' : WITHIN;
          }
        } catch (fe) {
          fulfillment = { error: fe.message };
        }

        let transaction = null;
        try {
          const shopOrder = await findShopifyOrderByBDId(env, orderId);
          if (shopOrder) {
            const gateway = (session.payment_method_types && session.payment_method_types[0])
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
              body: JSON.stringify({ order: { id: shopOrder.id, financial_status: 'paid' } }),
            });
          } else {
            transaction = { note: 'no Shopify order found for bd_order_id ' + orderId };
          }
        } catch (te) {
          transaction = { error: te.message };
        }
        await appendSyncLog(env, { action: 'stripe-webhook-transaction', order_id: orderId, transaction });

        return new Response(JSON.stringify({ received: true, order: orderId, fulfillment }), { status: 200 });
      } else {
        await appendSyncLog(env, { action: 'stripe-webhook', event: event.type, session: session.id, warning: 'no order_id metadata' });
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }
    }
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
