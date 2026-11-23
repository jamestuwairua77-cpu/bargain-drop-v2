// Cloudflare Pages Function: /api/track-order
// Supports ?number=, ?order=, ?id=, ?orderNumber=, ?tracking=
// Checks durable order ledger + live CJ Dropshipping order/logistics API (100% direct, zero Shopify).

import { corsHeaders, cjFetchMulti, listOrders } from '../_sync-lib.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders() },
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });

  const q = (
    url.searchParams.get('number') ||
    url.searchParams.get('order') ||
    url.searchParams.get('id') ||
    url.searchParams.get('orderNumber') ||
    url.searchParams.get('tracking') ||
    ''
  ).trim();

  if (!q) return json({ error: 'Order number or tracking number required' }, 400);

  try {
    let localOrder = null;
    try {
      const orders = await listOrders(env);
      localOrder = (orders || []).find(
        (o) =>
          String(o.id) === q ||
          String(o.orderNumber || '') === q ||
          String(o.cjOrderId || '') === q ||
          String(o.tracking?.number || o.trackingNumber || o.tracking_number || '') === q
      ) || null;
    } catch {}

    const cjQueryId = (localOrder && localOrder.cjOrderId) || q;
    let cjOrderData = null;
    let trackingInfo = null;
    let trackNumber =
      (localOrder && (localOrder.tracking?.number || localOrder.trackingNumber || localOrder.tracking_number)) || '';
    let carrierName =
      (localOrder && (localOrder.tracking?.carrier || localOrder.carrierName || localOrder.tracking_company)) ||
      'CJ Packet Tracked Air';

    try {
      let cjResult = await cjFetchMulti(env, '/shopping/order/getOrderDetail?orderId=' + encodeURIComponent(cjQueryId));
      if (cjResult?.code === 200 && cjResult.data && cjResult.data.orderStatus === 'TRASH' && !String(cjQueryId).endsWith('-R')) {
        const retryR = await cjFetchMulti(env, '/shopping/order/getOrderDetail?orderId=' + encodeURIComponent(cjQueryId + '-R'));
        if (retryR?.code === 200 && retryR.data) cjResult = retryR;
      }
      if (cjResult?.code === 200 && cjResult.data) {
        cjOrderData = cjResult.data;
        if (cjOrderData.trackNumber) trackNumber = cjOrderData.trackNumber;
        if (cjOrderData.logisticName) carrierName = cjOrderData.logisticName;
      }
    } catch {}

    const lookupTrackNum = trackNumber || (/^[A-Z0-9]{10,32}$/i.test(q) && !q.startsWith('BD') ? q : '');
    if (lookupTrackNum) {
      try {
        const tr = await cjFetchMulti(env, '/logistic/getTrackInfo?trackNumber=' + encodeURIComponent(lookupTrackNum));
        if (tr?.code === 200 && tr.data) {
          trackingInfo = Array.isArray(tr.data) ? tr.data[0] : tr.data;
          if (!trackNumber) trackNumber = lookupTrackNum;
        }
      } catch {}
    }

    if (localOrder || cjOrderData || trackingInfo) {
      const rawStatus = String(
        (cjOrderData && cjOrderData.orderStatus) || (localOrder && localOrder.status) || (trackNumber ? 'shipped' : 'processing')
      ).toLowerCase();
      const normalizedStatus =
        rawStatus === 'delivered'
          ? 'delivered'
          : trackNumber || rawStatus === 'shipped' || rawStatus === 'dispatched' || rawStatus === 'fulfilled'
          ? 'shipped'
          : rawStatus === 'awaiting_payid' || rawStatus === 'awaiting_crypto'
          ? rawStatus
          : rawStatus === 'awaiting_supplier_payment' || rawStatus === 'unpaid' || rawStatus === 'created' || rawStatus === 'paid' || rawStatus === 'fulfilling'
          ? 'processing'
          : rawStatus;

      return json({
        found: true,
        source: cjOrderData ? 'cj' : localOrder ? 'ledger' : 'cj-tracking',
        orderId: (localOrder && localOrder.id) || (cjOrderData && cjOrderData.orderNum) || q,
        cjOrderId: (cjOrderData && cjOrderData.orderId) || (localOrder && localOrder.cjOrderId) || null,
        status: normalizedStatus,
        paymentMethod: (localOrder && (localOrder.paymentMethod || localOrder.method)) || null,
        tracking: trackNumber
          ? {
              number: trackNumber,
              carrier: carrierName,
              externalUrl: `https://t.17track.net/en#nums=${encodeURIComponent(trackNumber)}`,
              events: (trackingInfo && (trackingInfo.routes || trackingInfo.trackingList || trackingInfo.events)) || [],
            }
          : null,
        data: cjOrderData || {
          orderNum: localOrder?.id || q,
          orderStatus: normalizedStatus.toUpperCase(),
          trackNumber: trackNumber || null,
          logisticName: carrierName,
        },
        trackingInfo,
      });
    }

    return json({ found: false, error: 'Order not found' }, 404);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}