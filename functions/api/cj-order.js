// Cloudflare Pages Function: /api/cj-order
// Creates & confirms a real CJ Dropshipping order using payType=3 (No CJ Wallet required).
// Supports direct order submission from Admin Command Center or storefront automation.

import {
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

    // Optional lookup by order_id from durable order ledger
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
      payType: 3, // No-Wallet Card/PayPal Settlement Mode
      logisticName: body.logisticName || 'CJPacket Ordinary',
      remark: body.remark || `Bargain Drop direct order ${body.order_id || (sourceOrder && sourceOrder.id) || ''}`.trim(),
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

    // Confirm order cleanly on CJ (moves to UNPAID ready for 1-click Card/PayPal payment — NEVER uses CJ Wallet)
    let confirmRes = null;
    if (/^\d+$/.test(String(cjOrderId))) {
      try {
        confirmRes = await cjFetchMulti(env, '/shopping/order/confirmOrder', {
          method: 'PATCH',
          body: JSON.stringify({ orderId: String(cjOrderId) }),
        });
      } catch {}
    }

    const cjDirectPayUrl = `https://app.cjdropshipping.com/myCJ.html#/order-list?orderId=${encodeURIComponent(cjOrderId)}`;
    const cjTotalUsd = Number(createRes?.data?.orderAmount || 0) || null;

    if (body.order_id || (sourceOrder && sourceOrder.id)) {
      const targetId = body.order_id || sourceOrder.id;
      await updateOrderStatus(env, targetId, 'awaiting_supplier_payment', {
        cjOrderId: String(cjOrderId),
        cjPayStatus: 'awaiting_external_payment',
        cjDirectPayUrl,
        ...(cjTotalUsd ? { cjTotalUsd } : {}),
      });
      if (sourceOrder) {
        try {
          await sendAdminOrderPayAlertEmail(env, sourceOrder, { cjOrderId, cjDirectPayUrl, cjTotalUsd });
        } catch {}
      }
    }

    await appendSyncLog(env, {
      action: 'cj-order-create-nowallet',
      orderId: cjPayload.orderNumber,
      cjOrderId,
      payType: 3,
      ok: true,
    });

    return json({
      ok: true,
      orderNumber: cjPayload.orderNumber,
      cjOrderId: String(cjOrderId),
      payMode: 'no_wallet_card_paypal',
      cjPayStatus: 'awaiting_external_payment',
      cjDirectPayUrl,
      confirm: confirmRes,
      cjResponse: createRes,
    });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}