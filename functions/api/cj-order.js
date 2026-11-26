// Cloudflare Pages Function: /api/cj-order
// Creates, confirms, and AUTOMATICALLY PAYS a CJ Dropshipping order via CJ Wallet (zero clicks).
// Falls back cleanly to queued_auto_pay (auto-retried by /api/auto-fulfill-cron) if CJ wallet balance is temporarily low.

import {
  cjFetch,
  cjFetchMulti,
  buildCjOrderFromBody,
  resolveCjVid,
  appendSyncLog,
  corsHeaders,
  listOrders,
  updateOrderStatus,
  sendAdminOrderPayAlertEmail,
  isAdmin,
  adminDenied,
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

    let sourceOrder = null;
    if (body.order_id && (!body.products || !body.products.length)) {
      const orders = await listOrders(env);
      sourceOrder = orders.find((o) => String(o.id) === String(body.order_id)) || null;
      if (!sourceOrder) return json({ error: 'Order not found in ledger: ' + body.order_id }, 404);
    }

    const rawProducts = body.products || body.line_items || (sourceOrder && sourceOrder.items) || [];
    if (!rawProducts.length) return json({ error: 'No line items found for CJ order creation' }, 400);

    const resolvedProducts = [];
    for (let i = 0; i < rawProducts.length; i++) {
      const it = rawProducts[i];
      const vid = await resolveCjVid(
        env,
        it.sku || null,
        it.cj_variant_id || it.vid || it.variant_id || null,
        it.product_id || it.id || null
      );
      if (!vid) {
        return json({ error: `Could not resolve CJ variant ID for item: ${it.title || it.sku || i}` }, 400);
      }
      resolvedProducts.push({
        vid,
        cj_variant_id: vid,
        quantity: Math.max(1, Number(it.quantity || it.qty || 1)),
        storeLineItemId: `${body.order_id || (sourceOrder && sourceOrder.id) || 'BD'}-${i}`,
      });
    }

    const ship = body.shipping_address || (sourceOrder && (sourceOrder.shipping || sourceOrder.shippingAddress)) || {};
    const cjPayload = buildCjOrderFromBody({
      order_id: body.order_id || (sourceOrder && sourceOrder.id),
      customer_email: body.customer_email || (sourceOrder && sourceOrder.email) || ship.email || '',
      customer_phone: body.customer_phone || (sourceOrder && sourceOrder.phone) || ship.phone || '',
      shipping_address: ship,
      products: resolvedProducts,
      payType: 3,
      logisticName: body.logisticName || 'CJPacket Ordinary',
      remark: body.remark || `Bargain Drop automated order ${body.order_id || (sourceOrder && sourceOrder.id) || ''}`.trim(),
    });

    const createRes = await cjFetchMulti(env, '/shopping/order/createOrderV2', {
      method: 'POST',
      body: JSON.stringify(cjPayload),
    });

    const cjOrderId =
      createRes?.data?.orderId ||
      createRes?.data?.cjOrderId ||
      (typeof createRes?.data === 'string' ? createRes.data : null);

    if (!cjOrderId) {
      return json({ ok: false, error: createRes?.message || 'CJ order creation failed', cjResponse: createRes }, 400);
    }

    let numericOrderId = /^\d+$/.test(String(cjOrderId)) ? String(cjOrderId) : '';
    let cjTotalUsd = Number(createRes?.data?.orderAmount || 0) || 0;
    try {
      const det = await cjFetchMulti(env, '/shopping/order/getOrderDetail?orderId=' + encodeURIComponent(cjOrderId));
      if (det?.code === 200 && det.data) {
        if (!numericOrderId && det.data.orderId) numericOrderId = String(det.data.orderId);
        const amt = Number(det.data.orderAmount || 0) + Number(det.data.postageAmount || 0);
        if (amt > 0) cjTotalUsd = +amt.toFixed(2);
      }
    } catch {}

    // Confirm order cleanly on CJ
    let confirmRes = null;
    if (numericOrderId) {
      try {
        confirmRes = await cjFetchMulti(env, '/shopping/order/confirmOrder', {
          method: 'PATCH',
          body: JSON.stringify({ orderId: numericOrderId }),
        });
      } catch {}
    }

    // Automatically pay CJ via CJ Wallet (zero clicks) when balance covers the order
    const payMode = String((env && env.CJ_PAY_MODE) || 'auto').toLowerCase();
    let payRes = null;
    let cjPayStatus = 'queued_auto_pay';
    let walletBalanceUsd = 0;
    if (payMode !== 'manual' && payMode !== 'no_wallet' && numericOrderId) {
      try {
        const balRes = await cjFetch(env, '/shopping/pay/getBalance');
        walletBalanceUsd = Number(balRes?.data?.amount || 0);
        if (walletBalanceUsd > 0 && (cjTotalUsd <= 0 || walletBalanceUsd >= cjTotalUsd)) {
          payRes = await cjFetchMulti(env, '/shopping/pay/payBalance', {
            method: 'POST',
            body: JSON.stringify({ orderId: numericOrderId }),
          });
          if (payRes && (payRes.code === 200 || payRes.result === true)) {
            cjPayStatus = 'paid_auto_wallet';
          }
        }
      } catch {}
    }

    const cjDirectPayUrl = `https://app.cjdropshipping.com/myCJ.html#/order-list?orderId=${encodeURIComponent(cjOrderId)}`;
    const nextStatus = cjPayStatus === 'paid_auto_wallet' ? 'fulfilling' : 'queued_auto_pay';

    if (body.order_id || (sourceOrder && sourceOrder.id)) {
      const targetId = body.order_id || sourceOrder.id;
      await updateOrderStatus(env, targetId, nextStatus, {
        cjOrderId: String(cjOrderId),
        cjPayStatus,
        cjDirectPayUrl,
        ...(cjTotalUsd ? { cjTotalUsd } : {}),
      });
      if (sourceOrder && cjPayStatus !== 'paid_auto_wallet') {
        try {
          await sendAdminOrderPayAlertEmail(env, sourceOrder, { cjOrderId, cjDirectPayUrl, cjTotalUsd, walletBalanceUsd });
        } catch {}
      }
    }

    await appendSyncLog(env, {
      action: 'cj-order-create-autopay',
      orderId: cjPayload.orderNumber,
      cjOrderId,
      cjPayStatus,
      walletBalanceUsd,
      ok: true,
    });

    return json({
      ok: true,
      orderNumber: cjPayload.orderNumber,
      cjOrderId: String(cjOrderId),
      payMode,
      cjPayStatus,
      walletBalanceUsd: +walletBalanceUsd.toFixed(2),
      cjTotalUsd: cjTotalUsd || null,
      cjDirectPayUrl,
      confirm: confirmRes,
      pay: payRes,
      cjResponse: createRes,
    });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}