// Cloudflare Pages Function: /api/shopify-webhook
// Shopify webhook receiver for order + inventory back-sync (bilateral integration).
//
// Handles topics:
//   orders/create                → ack (order already created via stripe-webhook/fulfillOrder)
//   orders/fulfilled             → push tracking numbers back to BD ledger (requirement #4)
//   inventory_items/update       → push stock levels back to BD catalog (requirement #4)
//   inventory_levels/update      → push available count back to BD catalog
//
// Security: every request is HMAC-SHA256 verified using the Shopify webhook secret
// (SHOPIFY_WEBHOOK_SECRET) before any processing.

import {
  corsHeaders,
  verifyHmac,
  appendSyncLog,
  backsyncFulfillment,
  backsyncInventory,
} from '../_sync-lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  const raw = new Uint8Array(await request.arrayBuffer());
  const hmac = request.headers.get('x-shopify-hmac-sha256');
  const topic = request.headers.get('x-shopify-topic') || '';
  const shopDomain = request.headers.get('x-shopify-shop-domain') || '';

  const secret = env.SHOPIFY_WEBHOOK_SECRET || '';
  const verified = await verifyHmac(raw, hmac, secret);
  if (!verified) {
    return new Response(JSON.stringify({ error: 'Invalid HMAC' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  let payload;
  try { payload = JSON.parse(new TextDecoder().decode(raw)); }
  catch { return new Response(JSON.stringify({ error: 'Bad JSON' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }

  try {
    // ── ORDER FULFILLMENT → tracking numbers back to BD ──
    if (topic === 'orders/fulfilled') {
      const orderId = payload.id;
      const fulfillment = Array.isArray(payload.fulfillments) && payload.fulfillments[0]
        ? payload.fulfillments[0]
        : (payload.fulfillment || {});
      const result = await backsyncFulfillment(env, orderId, fulfillment);
      return new Response(JSON.stringify({ success: true, topic, result }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    // ── INVENTORY UPDATE → stock back to BD catalog ──
    // inventory_levels/update: payload has { inventory_item_id, available, location_id }
    if (topic === 'inventory_levels/update') {
      const itemId = payload.inventory_item_id;
      const available = Number(payload.available ?? 0);
      const result = await backsyncInventory(env, itemId, available);
      return new Response(JSON.stringify({ success: true, topic, result }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
    // inventory_items/update: payload { id, sku?, ... } (no available count directly)
    if (topic === 'inventory_items/update') {
      const itemId = payload.id;
      // This topic carries item metadata; available count lives on inventory_levels.
      // Log it and treat as informational (the levels/update topic delivers the count).
      await appendSyncLog(env, { action: 'shopify-webhook', topic, inventory_item_id: itemId });
      return new Response(JSON.stringify({ success: true, topic, note: 'informational' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    // ── orders/create → ack (order already reconciled via fulfillOrder) ──
    if (topic === 'orders/create') {
      await appendSyncLog(env, { action: 'shopify-webhook', topic, shopify_order_id: payload.id, name: payload.name });
      return new Response(JSON.stringify({ success: true, topic }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    // unknown topic → ack (prevents Shopify retry storms)
    await appendSyncLog(env, { action: 'shopify-webhook', topic, note: 'unhandled' });
    return new Response(JSON.stringify({ success: true, topic: topic || 'unknown' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, topic }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
