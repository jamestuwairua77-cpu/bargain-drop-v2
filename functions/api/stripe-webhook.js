// Cloudflare Pages Function: /api/stripe-webhook
// POST — verifies Stripe webhook signature and marks orders paid.
// Security: do NOT trust order-success.html?id= — this is the authoritative
// confirmation that money actually moved.

import { updateOrderStatus, appendSyncLog } from '../_sync-lib.js';

async function verifyStripeSignature(rawBody, signature, secret) {
  // Web Crypto HMAC-SHA256 over `${timestamp}.${payload}` (v1 scheme)
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
  // constant-time-ish compare via lengths + equality
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
      const orderId = (session.metadata && session.metadata.order_id) || null;
      const paymentStatus = session.payment_status || 'paid';
      const amount = session.amount_total || 0;
      if (orderId) {
        const updated = await updateOrderStatus(env, orderId, 'paid', {
          paymentStatus,
          amount_total: amount,
          stripe_session_id: session.id,
          paidAt: new Date().toISOString(),
        });
        await appendSyncLog(env, { action: 'stripe-webhook', event: event.type, order_id: orderId, paymentStatus });
        return new Response(JSON.stringify({ received: true, order: orderId, updated: !!updated }), { status: 200 });
      } else {
        await appendSyncLog(env, { action: 'stripe-webhook', event: event.type, session: session.id, warning: 'no order_id metadata' });
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }
    }
    // acknowledge other events (ignore)
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
