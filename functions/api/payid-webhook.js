// Cloudflare Pages Function: /api/payid-webhook
// 100% Automated Australian PayID / Osko Settlement Webhook Receiver.
// Compatible with Australian NPP/PayID providers (Zai, Monoova, Zepto, Azupay) AND
// automated Bank Deposit Alert email forwarding (Cloudflare Email Routing / Resend Inbound / Zapier / Make).
// Matches reference BD-PID-XXXXXX, verifies AUD amount + webhook secret, marks order PAID,
// and IMMEDIATELY triggers fulfillOrder() -> CJ Dropshipping create + auto-pay + dispatch (zero clicks!).

import { corsHeaders, listOrders, updateOrderStatus, fulfillOrder, appendSyncLog } from '../_sync-lib.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function timingSafeEqual(a, b) {
  const s1 = String(a || ''), s2 = String(b || '');
  if (!s1 || s1.length !== s2.length) return false;
  let diff = 0;
  for (let i = 0; i < s1.length; i++) diff |= s1.charCodeAt(i) ^ s2.charCodeAt(i);
  return diff === 0;
}

async function verifyWebhookAuth(request, env, rawBody) {
  const secret = String((env && (env.PAYID_WEBHOOK_SECRET || env.ADMIN_PIN)) || '').trim();
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const headerSecret = request.headers.get('x-payid-secret') || request.headers.get('x-webhook-secret') || '';
  if (timingSafeEqual(bearer, secret) || timingSafeEqual(headerSecret, secret)) return true;

  const sig = request.headers.get('x-payid-signature') || request.headers.get('x-signature') || '';
  if (sig) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
    const hex = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, '0')).join('');
    if (timingSafeEqual(sig.toLowerCase(), hex.toLowerCase())) return true;
  }
  return false;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const rawBody = await request.text();
    const authorized = await verifyWebhookAuth(request, env, rawBody);
    if (!authorized) {
      return json({ ok: false, error: 'Unauthorized PayID webhook signature or secret' }, 401);
    }

    const payload = JSON.parse(rawBody || '{}');
    // Extract BD-PID-XXXXXX reference from structured NPP fields OR raw bank notification email text
    const searchableText = [
      payload.reference,
      payload.remittance_information,
      payload.description,
      payload.orderId,
      payload.order_id,
      payload.subject,
      payload.text,
      payload.body,
      payload.data?.reference,
      payload.data?.description,
    ]
      .filter(Boolean)
      .join(' ');

    const refMatch = searchableText.match(/\bBD-(?:PID-)?[A-Z0-9]{4,12}\b/i);
    const orderId = refMatch ? refMatch[0].toUpperCase() : String(payload.orderId || payload.reference || '').trim();
    if (!orderId) {
      return json({ ok: false, error: 'No Bargain Drop order reference (BD-PID-...) found in payload' }, 400);
    }

    const receivedAud = Number(
      payload.amount ??
        payload.amount_aud ??
        payload.data?.amount ??
        (searchableText.match(/(?:A\$|\$|AUD\s*)([0-9]+(?:\.[0-9]{1,2})?)/i)?.[1] || 0)
    );

    const orders = await listOrders(env);
    const existing = orders.find((o) => String(o.id).toUpperCase() === orderId.toUpperCase());
    if (!existing) {
      return json({ ok: false, error: 'Order not found: ' + orderId }, 404);
    }

    const expectedAud = Number(existing.total || 0);
    if (receivedAud > 0 && expectedAud > 0 && receivedAud + 0.05 < expectedAud) {
      return json(
        {
          ok: false,
          error: `Underpayment detected for ${orderId}: received A$${receivedAud.toFixed(2)}, expected A$${expectedAud.toFixed(2)}`,
        },
        409
      );
    }

    const paidAt = new Date().toISOString();
    const bankRef = String(payload.transaction_id || payload.npp_transaction_id || payload.id || `PAYID-${Date.now()}`).trim();
    const updated = await updateOrderStatus(env, existing.id, 'paid', {
      paymentStatus: 'paid',
      payment_verified: true,
      paidAt,
      payment: {
        ...(typeof existing.payment === 'object' && existing.payment ? existing.payment : {}),
        gateway: 'payid',
        bankReference: bankRef,
        receivedAud: receivedAud > 0 ? receivedAud : expectedAud,
        verifiedBy: 'payid_npp_webhook_auto',
        verifiedAt: paidAt,
      },
    });

    const fulfillment = await fulfillOrder(env, updated || existing);
    await appendSyncLog(env, {
      action: 'payid-webhook-auto-fulfill',
      orderId: existing.id,
      bankRef,
      cjOrderId: fulfillment?.cjOrderId || null,
      status: fulfillment?.status || 'paid',
    });

    return json({
      ok: true,
      orderId: existing.id,
      status: fulfillment?.status || 'paid',
      cjOrderId: fulfillment?.cjOrderId || null,
      cjPayStatus: fulfillment?.cj?.cjPayStatus || null,
    });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
