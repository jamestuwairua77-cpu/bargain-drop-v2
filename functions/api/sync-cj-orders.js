// Cloudflare Pages Function: /api/sync-cj-orders
// Automated background polling & reconciliation service:
//   1. Runs full autonomous cycle (on-chain crypto verify + unpushed paid orders + CJ auto-pay retry)
//   2. Queries CJ Dropshipping /shopping/order/list for live order states & tracking numbers
//   3. Updates order ledger with carrier name & live tracking number
//   4. Auto-triggers transactional dispatch emails to customers with live tracking links

import {
  corsHeaders,
  cjFetchMulti,
  isAdmin,
  adminDenied,
  listOrders,
  fulfillOrder,
  autoPayCjOrder,
  appendSyncLog,
} from '../_sync-lib.js';
import { handleOrderStatusPush } from '../_cj-import.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  const url = new URL(request.url);
  const isCronTrigger = url.searchParams.get('cron') === '1';
  if (!isCronTrigger && !isAdmin(request, env)) {
    return adminDenied();
  }

  try {
    const result = await cjFetchMulti(env, '/shopping/order/list?pageNum=1&pageSize=50');
    const cjOrders = (result && result.data && Array.isArray(result.data.list)) ? result.data.list : [];

    const localOrders = await listOrders(env);
    const forwardedNew = [];
    const autoPaidCj = [];
    const trackingUpdated = [];
    const emailsDispatched = [];

    // Step A: Push any paid local order not yet forwarded to CJ (creates + auto-pays via CJ Wallet)
    for (const loc of localOrders) {
      if (loc.status === 'paid' && !loc.cjOrderId) {
        try {
          const ff = await fulfillOrder(env, loc);
          forwardedNew.push({ orderId: loc.id, cjOrderId: ff.cjOrderId || null, status: ff.status });
        } catch {}
      } else if (
        loc.cjOrderId &&
        (loc.status === 'queued_auto_pay' ||
          loc.status === 'awaiting_supplier_payment' ||
          loc.cjPayStatus === 'queued_auto_pay')
      ) {
        try {
          const payRes = await autoPayCjOrder(env, loc);
          if (payRes.paid) {
            autoPaidCj.push({ orderId: loc.id, cjOrderId: loc.cjOrderId });
          }
        } catch {}
      }
    }

    // Step B: Tracking reconciliation & automatic shipped emails
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

    if (forwardedNew.length || autoPaidCj.length || trackingUpdated.length) {
      await appendSyncLog(env, {
        action: 'sync-cj-orders-poll',
        forwardedNewCount: forwardedNew.length,
        autoPaidCjCount: autoPaidCj.length,
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
          autoPaidCj,
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