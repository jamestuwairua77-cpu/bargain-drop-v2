// Cloudflare Pages Function: /api/cj-admin
// Admin-only (X-Admin-Pin) CJ order ops: balance, order status, confirm, pay.
// Why this exists: the store's createOrderV2 pays via the CJ *payment page* (
// payType=1 default), so once a customer pays US (Stripe), the CJ order still
// needs to be CONFIRMED + PAID from the CJ account balance before CJ ships.
// These are the missing steps that leave orders stuck in "CREATED" status.
import { corsHeaders, isAdmin, adminDenied, cjFetch, listOrders, fulfillOrder } from '../_sync-lib.js';

async function json(res, status = 200) {
  return new Response(JSON.stringify(res), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();

  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'status';

  try {
    if (action === 'balance') {
      const r = await cjFetch(env, '/shopping/pay/getBalance');
      return json({ action: 'balance', ...r });
    }

    if (action === 'queue') {
      const orders = await listOrders(env);
      const pendingPay = (orders || []).filter(
        (o) =>
          o.cjPayStatus === 'awaiting_external_payment' ||
          o.status === 'awaiting_supplier_payment' ||
          (o.status === 'paid' && !o.cjOrderId)
      );
      return json({
        action: 'queue',
        count: pendingPay.length,
        orders: pendingPay.map((o) => ({
          id: o.id,
          date: o.paidAt || o.createdAt || o.date,
          customer: o.name || o.shipping?.fullName || 'Customer',
          email: o.email || o.shipping?.email || '',
          customerPaidAud: Number(o.total || 0),
          cjOrderId: o.cjOrderId || null,
          cjTotalUsd: o.cjTotalUsd || null,
          cjPayStatus: o.cjPayStatus || (o.cjOrderId ? 'awaiting_external_payment' : 'not_pushed'),
          cjDirectPayUrl:
            o.cjDirectPayUrl ||
            (o.cjOrderId
              ? `https://app.cjdropshipping.com/myCJ.html#/order-list?orderId=${encodeURIComponent(o.cjOrderId)}`
              : 'https://app.cjdropshipping.com/myCJ.html#/order-list'),
          status: o.status,
        })),
      });
    }

    if (action === 'retry_fulfill') {
      const bdOrderId = url.searchParams.get('orderId') || url.searchParams.get('id') || '';
      if (!bdOrderId) return json({ error: 'Provide orderId (BD order ID)' }, 400);
      const orders = await listOrders(env);
      const ord = (orders || []).find((o) => String(o.id) === String(bdOrderId));
      if (!ord) return json({ error: 'Order not found in ledger: ' + bdOrderId }, 404);
      const res = await fulfillOrder(env, ord);
      return json({ action: 'retry_fulfill', orderId: bdOrderId, result: res });
    }

    if (action === 'status') {
      const cjOrderCode = url.searchParams.get('cjOrderCode');
      const cjOrderId = url.searchParams.get('orderId');
      if (!cjOrderCode && !cjOrderId) return json({ error: 'Provide cjOrderCode or orderId' }, 400);
      const id = cjOrderCode || cjOrderId;
      const r = await cjFetch(env, '/shopping/order/getOrderDetail?orderId=' + encodeURIComponent(id));
      return json({ action: 'status', query: id, ...r });
    }

    if (action === 'delete' || action === 'cancel') {
      let orderId = url.searchParams.get('orderId') || '';
      const cjOrderCode = url.searchParams.get('cjOrderCode') || '';
      if (!orderId && cjOrderCode) {
        const det = await cjFetch(env, '/shopping/order/getOrderDetail?orderId=' + encodeURIComponent(cjOrderCode));
        const d = det && det.data;
        orderId = (d && (d.orderId || d.cjOrderId)) || '';
      }
      if (!orderId) return json({ error: 'Could not resolve CJ orderId' }, 400);
      const r = await cjFetch(env, '/shopping/order/deleteOrder?orderId=' + encodeURIComponent(orderId), { method: 'DELETE' });
      return json({ action: 'delete', orderId, delete: r });
    }

    if (action === 'confirm' || action === 'pay' || action === 'confirmpay') {
      let cjOrderId = url.searchParams.get('orderId') || '';
      const cjOrderCode = url.searchParams.get('cjOrderCode') || '';
      if (!cjOrderId && cjOrderCode) {
        const det = await cjFetch(env, '/shopping/order/getOrderDetail?orderId=' + encodeURIComponent(cjOrderCode));
        const d = det && det.data;
        cjOrderId = (d && (d.orderId || d.cjOrderId)) || '';
      }
      if (!cjOrderId) return json({ error: 'Could not resolve CJ orderId' }, 400);

      const out = {};
      if (action === 'confirm' || action === 'confirmpay') {
        out.confirm = await cjFetch(env, '/shopping/order/confirmOrder', { method: 'PATCH', body: JSON.stringify({ orderId: cjOrderId }) });
      }
      if (action === 'pay' || action === 'confirmpay') {
        out.pay = await cjFetch(env, '/shopping/pay/payBalance', { method: 'POST', body: JSON.stringify({ orderId: cjOrderId }) });
      }
      out.status = await cjFetch(env, '/shopping/order/getOrderDetail?orderId=' + encodeURIComponent(cjOrderId));
      return json({ action, cjOrderId, ...out });
    }

    return json({ error: 'Unknown action. Use balance|queue|retry_fulfill|status|confirm|pay|confirmpay|delete' }, 400);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
