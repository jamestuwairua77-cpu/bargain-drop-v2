// Cloudflare Pages Function: /api/crypto-webhook
// Automated NOWPayments IPN webhook listener.
// Verifies HMAC-SHA512 signature (x-nowpayments-sig), marks order paid,
// and IMMEDIATELY triggers fulfillOrder() -> CJ Dropshipping (payType=3 no-wallet) + confirmation email.

import { corsHeaders, listOrders, updateOrderStatus, fulfillOrder, appendSyncLog } from '../_sync-lib.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function sortKeysDeep(val) {
  if (Array.isArray(val)) return val.map(sortKeysDeep);
  if (val && typeof val === 'object') {
    const out = {};
    for (const k of Object.keys(val).sort()) {
      out[k] = sortKeysDeep(val[k]);
    }
    return out;
  }
  return val;
}

async function verifyNowPaymentsSignature(payloadObj, receivedSig, secret) {
  if (!secret || !receivedSig) return false;
  const canonical = JSON.stringify(sortKeysDeep(payloadObj));
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(canonical));
  const expectedHex = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return expectedHex.toLowerCase() === String(receivedSig).trim().toLowerCase();
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const payload = await request.json();
    const secret = String((env && env.NOWPAYMENTS_IPN_SECRET) || '').trim();
    const sig = request.headers.get('x-nowpayments-sig') || '';

    if (secret) {
      const valid = await verifyNowPaymentsSignature(payload, sig, secret);
      if (!valid) return json({ ok: false, error: 'Invalid IPN HMAC-SHA512 signature' }, 401);
    }

    const orderId = String(payload.order_id || '').trim();
    const payStatus = String(payload.payment_status || '').toLowerCase();
    if (!orderId) return json({ ok: false, error: 'Missing order_id' }, 400);

    const orders = await listOrders(env);
    const existing = orders.find((o) => String(o.id) === orderId);
    if (!existing) return json({ ok: false, error: 'Order not found: ' + orderId }, 404);

    if (payStatus === 'finished' || payStatus === 'confirmed') {
      const paidOrder = await updateOrderStatus(env, orderId, 'paid', {
        paymentStatus: 'paid',
        payment_verified: true,
        paidAt: new Date().toISOString(),
        payment: {
          ...(typeof existing.payment === 'object' && existing.payment ? existing.payment : { gateway: 'crypto' }),
          gateway: 'crypto',
          nowPaymentsPaymentId: String(payload.payment_id || ''),
          hash: String(payload.payin_hash || payload.payment_id || ''),
          payCurrency: String(payload.pay_currency || ''),
          actuallyPaid: payload.actually_paid ?? null,
          verifiedBy: 'nowpayments_ipn',
        },
      });

      const fulfillment = await fulfillOrder(env, paidOrder || existing);
      await appendSyncLog(env, {
        action: 'crypto-ipn-paid-fulfilled',
        orderId,
        cjOrderId: fulfillment?.cjOrderId || null,
        payStatus,
      });
      return json({ ok: true, orderId, status: fulfillment?.status || 'paid', cjOrderId: fulfillment?.cjOrderId || null });
    }

    await updateOrderStatus(env, orderId, 'awaiting_crypto', {
      cryptoIpnStatus: payStatus,
      cryptoIpnUpdatedAt: new Date().toISOString(),
    });
    return json({ ok: true, orderId, cryptoIpnStatus: payStatus });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
