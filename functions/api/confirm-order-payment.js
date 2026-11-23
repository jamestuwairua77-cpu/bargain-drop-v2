// Cloudflare Pages Function: /api/confirm-order-payment
// Admin 1-Click Payment Verification -> Automatic CJ Dropshipping Fulfillment (payType=3 no-wallet).
// Used to confirm incoming Australian PayID / Osko bank transfers or direct Non-Custodial Crypto TxIDs.

import {
  corsHeaders,
  isAdmin,
  adminDenied,
  listOrders,
  updateOrderStatus,
  fulfillOrder,
  appendSyncLog,
} from '../_sync-lib.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders() },
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!isAdmin(request, env)) return adminDenied();

  try {
    const body = await request.json();
    const orderId = String(body.orderId || body.order_id || body.id || '').trim();
    const reference = String(body.reference || body.txHash || body.bankReference || '').trim();
    if (!orderId) return json({ ok: false, error: 'orderId is required' }, 400);

    const orders = await listOrders(env);
    const existing = orders.find((o) => String(o.id) === orderId);
    if (!existing) return json({ ok: false, error: 'Order not found: ' + orderId }, 404);

    const paidAt = new Date().toISOString();
    const updated = await updateOrderStatus(env, orderId, 'paid', {
      paymentStatus: 'paid',
      payment_verified: true,
      paidAt,
      payment: {
        ...(typeof existing.payment === 'object' && existing.payment ? existing.payment : {}),
        gateway:
          (typeof existing.payment === 'object' && existing.payment?.gateway) ||
          (String(existing.method || '').toLowerCase().includes('crypto') ? 'crypto' : 'payid'),
        verifiedBy: 'admin_1click_confirm',
        verifiedAt: paidAt,
        ...(reference ? { hash: reference, bankReference: reference } : {}),
      },
    });

    const fulfillment = await fulfillOrder(env, updated || existing);

    await appendSyncLog(env, {
      action: 'admin-confirm-payment-and-dispatch',
      orderId,
      method: existing.paymentMethod || existing.method || 'PayID / Crypto',
      cjOrderId: fulfillment?.cjOrderId || null,
      status: fulfillment?.status || 'paid',
    });

    return json({
      ok: true,
      orderId,
      status: fulfillment?.status || 'paid',
      cjOrderId: fulfillment?.cjOrderId || null,
      cjDirectPayUrl: fulfillment?.cj?.cjDirectPayUrl || null,
      fulfillment,
    });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
