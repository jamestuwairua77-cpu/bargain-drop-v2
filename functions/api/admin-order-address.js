// /api/admin-order-address — admin-gated shipping address updater for Shopify orders and customer profile
// POST { order_id, customer_id?, address: { first_name, last_name, address1, address2, city, province, province_code, zip, country, country_code, phone } }

import { corsHeaders, shopifyFetch, isAdmin, adminDenied } from '../_sync-lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST required' }), { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  let body = {};
  try { body = await request.json(); } catch {}

  const orderId = body.order_id;
  const customerId = body.customer_id;
  const addr = body.address || {};

  if (!orderId && !customerId) {
    return new Response(JSON.stringify({ error: 'order_id or customer_id required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  const shipping_address = {
    first_name: addr.first_name || 'Shae',
    last_name: addr.last_name || 'Grant',
    address1: addr.address1 || '',
    address2: addr.address2 || null,
    city: addr.city || '',
    province: addr.province || 'Western Australia',
    province_code: addr.province_code || 'WA',
    zip: addr.zip || '',
    country: addr.country || 'Australia',
    country_code: addr.country_code || 'AU',
    phone: addr.phone || ''
  };

  const results = { order: null, customer: null };

  if (orderId) {
    try {
      const r = await shopifyFetch(env, `/orders/${orderId}.json`, {
        method: 'PUT',
        body: JSON.stringify({
          order: {
            id: Number(orderId),
            shipping_address
          }
        })
      });
      results.order = { ok: r.ok, status: r.status, body: r.body };
    } catch (e) {
      results.order = { ok: false, error: e.message };
    }
  }

  if (customerId) {
    try {
      // Fetch customer addresses
      const { body: custBody } = await shopifyFetch(env, `/customers/${customerId}/addresses.json`);
      const addrs = custBody?.addresses || [];
      if (addrs.length > 0) {
        const addrId = addrs[0].id;
        const r = await shopifyFetch(env, `/customers/${customerId}/addresses/${addrId}.json`, {
          method: 'PUT',
          body: JSON.stringify({
            customer_address: {
              id: addrId,
              ...shipping_address
            }
          })
        });
        results.customer = { ok: r.ok, status: r.status, body: r.body };
      } else {
        const r = await shopifyFetch(env, `/customers/${customerId}/addresses.json`, {
          method: 'POST',
          body: JSON.stringify({
            customer_address: shipping_address
          })
        });
        results.customer = { ok: r.ok, status: r.status, body: r.body };
      }
    } catch (e) {
      results.customer = { ok: false, error: e.message };
    }
  }

  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}
