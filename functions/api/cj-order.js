// Cloudflare Pages Function: /api/cj-order
// POST — Maps local variant IDs/SKUs to cj_variant_id (vid), normalizes E.164 phone,
// enforces idempotency so orders are never forwarded twice, and submits to CJ createOrderV2.

import {
  corsHeaders,
  cjFetchMulti,
  shopifyFetch,
  shopifyToCjOrder,
  buildCjOrderFromBody,
  resolveCjVid,
  listOrders,
  updateOrderStatus,
  appendSyncLog,
} from '../_sync-lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  try {
    const body = await request.json().catch(() => ({}));

    // 1. Shopify Order ID forwarding path
    if (body.shopifyOrderId) {
      const { body: res } = await shopifyFetch(
        env,
        '/orders/' + body.shopifyOrderId + '.json'
      );
      const cjPayload = shopifyToCjOrder(res.order);
      for (const p of cjPayload.products || []) {
        p.vid = await resolveCjVid(env, p.vid, p.vid);
      }
      const result = await cjFetchMulti(env, '/shopping/order/createOrderV2', {
        method: 'POST',
        body: JSON.stringify(cjPayload),
      });
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    // 2. Idempotency check against durable order ledger
    const orderId = body.order_id || body.orderNumber || null;
    if (orderId) {
      const existingOrders = await listOrders(env);
      const existing = existingOrders.find((o) => String(o.id) === String(orderId));
      if (existing && existing.cjOrderId) {
        return new Response(
          JSON.stringify({
            code: 200,
            result: true,
            idempotentReplay: true,
            orderId,
            cjOrderId: existing.cjOrderId,
            message: 'Order already forwarded to CJ Dropshipping',
          }),
          {
            headers: { 'Content-Type': 'application/json', ...corsHeaders() },
          }
        );
      }
    }

    // 3. Resolve local product/variant IDs or SKUs to cj_variant_id (vid)
    const rawItems = body.products || body.line_items || [];
    const resolvedProducts = [];
    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      const resolvedVid = await resolveCjVid(
        env,
        item.sku || null,
        item.cj_variant_id || item.vid || item.variant_id || null,
        item.product_id || item.id || null
      );
      resolvedProducts.push({
        ...item,
        vid: resolvedVid,
        cj_variant_id: resolvedVid,
        quantity: Math.max(1, Number(item.quantity || item.qty || 1)),
        storeLineItemId: item.storeLineItemId || `${orderId || 'BD'}-${i}`,
      });
    }

    const payload =
      rawItems.length > 0
        ? buildCjOrderFromBody({
            ...body,
            products: resolvedProducts,
          })
        : body;

    const result = await cjFetchMulti(env, '/shopping/order/createOrderV2', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const cjOrderId =
      (result &&
        result.data &&
        (result.data.orderId ||
          result.data.cjOrderId ||
          (typeof result.data === 'string' ? result.data : null))) ||
      null;

    let confirmRes = null;
    let payRes = null;
    if (cjOrderId) {
      try {
        let numericOrderId =
          result?.data?.orderId && /^\d+$/.test(String(result.data.orderId))
            ? String(result.data.orderId)
            : /^\d+$/.test(String(cjOrderId))
            ? String(cjOrderId)
            : '';
        if (!numericOrderId) {
          const det = await cjFetchMulti(
            env,
            '/shopping/order/getOrderDetail?orderId=' + encodeURIComponent(cjOrderId)
          );
          if (det?.data?.orderId) numericOrderId = String(det.data.orderId);
        }
        if (numericOrderId) {
          confirmRes = await cjFetchMulti(env, '/shopping/order/confirmOrder', {
            method: 'PATCH',
            body: JSON.stringify({ orderId: numericOrderId }),
          });
          payRes = await cjFetchMulti(env, '/shopping/pay/payBalance', {
            method: 'POST',
            body: JSON.stringify({ orderId: numericOrderId }),
          });
        }
      } catch {}
    }

    if (orderId && cjOrderId) {
      await updateOrderStatus(env, orderId, 'fulfilling', {
        cjOrderId,
        cjConfirmed: !!(confirmRes && confirmRes.code === 200),
        cjPaidFromBalance: !!(payRes && payRes.code === 200),
        cjForwardedAt: new Date().toISOString(),
      }).catch(() => null);
    }

    await appendSyncLog(env, {
      action: 'cj-order-forward',
      orderId,
      cjOrderId,
      code: result?.code,
      confirmed: confirmRes?.code === 200,
      paid: payRes?.code === 200,
      message: result?.message,
    }).catch(() => null);

    return new Response(
      JSON.stringify({
        ...result,
        orderId,
        cjOrderId,
        confirm: confirmRes,
        pay: payRes,
        forwardedPayload: payload,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}