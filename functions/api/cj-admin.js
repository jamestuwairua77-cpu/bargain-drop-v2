// Cloudflare Pages Function: /api/cj-admin
// Admin-only (X-Admin-Pin) CJ order ops: balance, order status, confirm, pay.
// Why this exists: the store's createOrderV2 pays via the CJ *payment page* (
// payType=1 default), so once a customer pays US (Stripe), the CJ order still
// needs to be CONFIRMED + PAID from the CJ account balance before CJ ships.
// These are the missing steps that leave orders stuck in "CREATED" status.
import { corsHeaders, isAdmin, adminDenied, cjFetch } from '../_sync-lib.js';

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

    if (action === 'status') {
      const cjOrderCode = url.searchParams.get('cjOrderCode');
      const cjOrderId = url.searchParams.get('orderId');
      if (!cjOrderCode && !cjOrderId) return json({ error: 'Provide cjOrderCode or orderId' }, 400);
      const id = cjOrderCode || cjOrderId;
      const r = await cjFetch(env, '/shopping/order/getOrderDetail?orderId=' + encodeURIComponent(id));
      return json({ action: 'status', query: id, ...r });
    }

    if (action === 'delete' || action === 'cancel') {
      // CJ "Order Delete" = DELETE /shopping/order/deleteOrder?orderId={numeric orderId}.
      // Only works on CREATED / IN_CART orders. UNPAID+ cannot be deleted.
      // Accept a numeric orderId directly, or a cjOrderCode (SD../DP..) resolved to numeric orderId.
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
      // Resolve the CJ orderId (numeric) from either cjOrderCode or a bare numeric id.
      let cjOrderId = url.searchParams.get('orderId') || '';
      const cjOrderCode = url.searchParams.get('cjOrderCode') || '';
      if (!cjOrderId && cjOrderCode) {
        const det = await cjFetch(env, '/shopping/order/getOrderDetail?orderId=' + encodeURIComponent(cjOrderCode));
        const d = det && det.data;
        // getOrderDetail returns numeric orderId in `data.orderId` when queried by code.
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
      // Re-fetch status to confirm the result.
      out.status = await cjFetch(env, '/shopping/order/getOrderDetail?orderId=' + encodeURIComponent(cjOrderId));
      return json({ action, cjOrderId, ...out });
    }

    return json({ error: 'Unknown action. Use balance|status|confirm|pay|confirmpay|delete' }, 400);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
