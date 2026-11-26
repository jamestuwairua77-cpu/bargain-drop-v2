// Cloudflare Pages Function: /api/paypal-webhook
// 100% Automated PayPal Webhook Receiver (PAYMENT.CAPTURE.COMPLETED / CHECKOUT.ORDER.APPROVED).
// Guarantees that even if a customer closes their browser right after paying PayPal,
// the order is automatically marked PAID, created on CJ, auto-paid via CJ Wallet, and shipped!

import { corsHeaders, listOrders, updateOrderStatus, fulfillOrder, appendSyncLog } from '../_sync-lib.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

async function getPayPalAccessToken(env) {
  const clientId = String((env && env.PAYPAL_CLIENT_ID) || '').trim();
  const clientSecret = String((env && env.PAYPAL_CLIENT_SECRET) || '').trim();
  if (!clientId || !clientSecret) return null;
  const base =
    String((env && env.PAYPAL_MODE) || 'live').toLowerCase() === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  const auth = btoa(`${clientId}:${clientSecret}`);
  const r = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!r.ok) return null;
  const d = await r.json();
  return d?.access_token ? { token: d.access_token, base } : null;
}

async function verifyPayPalSignature(request, env, webhookEvent) {
  const webhookId = String((env && env.PAYPAL_WEBHOOK_ID) || '').trim();
  if (!webhookId) return { checked: true, valid: false, reason: 'PAYPAL_WEBHOOK_ID not configured' };
  const authInfo = await getPayPalAccessToken(env);
  if (!authInfo) return { checked: true, valid: false, reason: 'PayPal OAuth credentials not configured' };
  const verifyRes = await fetch(`${authInfo.base}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authInfo.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: request.headers.get('paypal-auth-algo') || '',
      cert_url: request.headers.get('paypal-cert-url') || '',
      transmission_id: request.headers.get('paypal-transmission-id') || '',
      transmission_sig: request.headers.get('paypal-transmission-sig') || '',
      transmission_time: request.headers.get('paypal-transmission-time') || '',
      webhook_id: webhookId,
      webhook_event: webhookEvent,
    }),
  });
  if (!verifyRes.ok) return { checked: true, valid: false, reason: 'PayPal signature verification request failed' };
  const verifyData = await verifyRes.json();
  return { checked: true, valid: verifyData?.verification_status === 'SUCCESS' };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const event = await request.json();
    const sig = await verifyPayPalSignature(request, env, event);
    if (!sig.valid) {
      return json({ ok: false, error: sig.reason || 'Invalid PayPal webhook signature' }, 401);
    }

    const eventType = String(event?.event_type || '').toUpperCase();
    const resource = event?.resource || {};
    if (eventType !== 'PAYMENT.CAPTURE.COMPLETED' && eventType !== 'CHECKOUT.ORDER.COMPLETED') {
      return json({ ok: true, ignored: true, eventType });
    }

    const customOrderId = String(
      resource.custom_id ||
        resource.invoice_id ||
        resource.purchase_units?.[0]?.custom_id ||
        resource.purchase_units?.[0]?.reference_id ||
        ''
    ).trim();
    const paypalCaptureId = String(resource.id || '').trim();
    const payerEmail = String(resource.payer?.email_address || '').trim().toLowerCase();

    const orders = await listOrders(env);
    let target = customOrderId ? orders.find((o) => String(o.id) === customOrderId) : null;
    if (!target && paypalCaptureId) {
      target = orders.find((o) => String(o.payment?.paypalOrderId || o.payment?.captureId || '') === paypalCaptureId);
    }
    if (!target && payerEmail) {
      target = orders.find(
        (o) =>
          String(o.email || '').toLowerCase() === payerEmail &&
          (o.status === 'pending_payment' || o.status === 'unpaid')
      );
    }
    if (!target) {
      return json({ ok: true, matched: false, eventType, customOrderId, paypalCaptureId });
    }

    const paidOrder = await updateOrderStatus(env, target.id, 'paid', {
      paymentStatus: 'paid',
      payment_verified: true,
      paidAt: new Date().toISOString(),
      payment: {
        ...(typeof target.payment === 'object' && target.payment ? target.payment : {}),
        gateway: 'paypal',
        captureId: paypalCaptureId || target.payment?.captureId || null,
        verifiedBy: 'paypal_webhook_auto',
      },
    });

    const fulfillment = await fulfillOrder(env, paidOrder || target);
    await appendSyncLog(env, {
      action: 'paypal-webhook-auto-fulfill',
      orderId: target.id,
      cjOrderId: fulfillment?.cjOrderId || null,
      status: fulfillment?.status || 'paid',
    });

    return json({
      ok: true,
      orderId: target.id,
      status: fulfillment?.status || 'paid',
      cjOrderId: fulfillment?.cjOrderId || null,
    });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
