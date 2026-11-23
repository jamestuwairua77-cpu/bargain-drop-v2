// Cloudflare Pages Function: /api/sync-cj-orders
// Automated background polling & reconciliation service (Module 4 Step B):
//   1. Queries CJ Dropshipping /shopping/order/list for live order states & tracking numbers
//   2. Detects orders transitioned to 'SHIPPED' (or with a live trackNumber)
//   3. Updates data/orders.json with carrier name (logisticName) & live tracking number (trackNumber)
//   4. Auto-triggers a transactional dispatch email to the customer with an interactive tracking link

import {
  corsHeaders,
  cjFetchMulti,
  isAdmin,
  adminDenied,
  listOrders,
  fulfillOrder,
  appendSyncLog,
} from '../_sync-lib.js';
import { handleOrderStatusPush } from '../_cj-import.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  const url = new URL(request.url);
  // Allow cron/daemon trigger with ?cron=1 or standard admin PIN
  const isCronTrigger = url.searchParams.get('cron') === '1';
  if (!isCronTrigger && !isAdmin(request, env)) {
    return adminDenied();
  }

  try {
    // 1. Poll CJ Dropshipping order list
    const result = await cjFetchMulti(env, '/shopping/order/list?pageNum=1&pageSize=50');
    const cjOrders = (result && result.data && Array.isArray(result.data.list)) ? result.data.list : [];

    // 2. Reconcile local orders
    const localOrders = await listOrders(env);
    const forwardedNew = [];
    const trackingUpdated = [];
    const emailsDispatched = [];

    // Step A catch-up: any paid local order not yet forwarded to CJ gets forwarded now
    for (const loc of localOrders) {
      if (
        loc.status === 'paid' &&
        (!loc.fulfillment || !loc.fulfillment.done) &&
        !loc.cjOrderId
      ) {
        try {
          const ff = await fulfillOrder(env, loc);
          forwardedNew.push({ orderId: loc.id, cjOrderId: ff.cjOrderId || null });
        } catch {}
      }
    }

    // Step B tracking reconciliation: match CJ orders to local orders & trigger dispatch emails
    for (const cjOrd of cjOrders) {
      const trackNum = String(
        cjOrd.trackNumber || cjOrd.trackingNumber || cjOrd.logisticTrackNumber || ''
      ).trim();
      const cjStatus = String(cjOrd.orderStatus || '').toUpperCase();
      if (trackNum || cjStatus === 'SHIPPED' || cjStatus === 'DELIVERED') {
        const pushRes = await handleOrderStatusPush(env, {
          orderId: cjOrd.orderId || cjOrd.cjOrderId,
          orderNumber: cjOrd.orderNumber || cjOrd.orderNum,
          trackNumber: trackNum,
          logisticName: cjOrd.logisticName || cjOrd.logisticsName || 'CJ Packet Tracked Air',
          orderStatus: cjStatus || 'SHIPPED',
        });
        if (pushRes && pushRes.imported) {
          trackingUpdated.push({
            orderId: pushRes.orderId,
            cjOrderId: pushRes.cjOrderId,
            trackingNumber: pushRes.trackingNumber,
            carrierName: pushRes.carrierName,
          });
          if (pushRes.emailDispatch && pushRes.emailDispatch.sent) {
            emailsDispatched.push(pushRes.emailDispatch);
          }
        }
      }
    }

    if (forwardedNew.length || trackingUpdated.length) {
      await appendSyncLog(env, {
        action: 'sync-cj-orders-poll',
        forwardedNewCount: forwardedNew.length,
        trackingUpdatedCount: trackingUpdated.length,
        emailsDispatchedCount: emailsDispatched.length,
      }).catch(() => null);
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: result?.data?.total || cjOrders.length,
        orders: cjOrders,
        reconciliation: {
          forwardedNew,
          trackingUpdated,
          emailsDispatched,
        },
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