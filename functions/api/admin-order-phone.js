// Cloudflare Pages Function: /api/admin-order-phone
// Admin-gated. Sets a phone number (+ SMS marketing consent) on a Shopify
// order and upserts the matching customer so Shopify's native SMS / Track123
// "send tracking events to Shopify" notifications have a number to reach.
//
// POST { order_id | email, phone, name? }
//   order_id : Shopify internal order ID (or use email to find the order)
//   email    : customer email (used to locate order + customer)
//   phone    : E.164 or local AU number (we normalize to E.164/Shopify-safe)
//   name     : optional customer full name for first/last split

import { corsHeaders, shopifyFetch, isAdmin, adminDenied } from '../_sync-lib.js';

function normalizeAuMobile(input) {
  if (!input) return '';
  const digits = String(input).replace(/\D/g, '');
  if (!digits) return '';
  let d = digits;
  if (d.startsWith('0')) d = '61' + d.slice(1);
  else if (d.startsWith('610')) d = d;            // already 61...
  else if (d.startsWith('61')) d = d;
  else if (d.length === 9) d = '61' + d;          // bare 9-digit AU mobile
  return '+' + d;
}

function splitName(name) {
  const parts = String(name || '').trim().split(/\s+/);
  if (!parts[0]) return { first_name: '', last_name: '' };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();

  let body;
  try { body = await request.json(); } catch { body = {}; }

  const phoneRaw = body.phone || '';
  const phone = normalizeAuMobile(phoneRaw);
  if (!phone) {
    return new Response(JSON.stringify({ error: 'phone required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  const email = (body.email || '').trim();
  const name = splitName(body.name);

  const results = { phone, order: null, customer: null };

  // ── 1. Resolve order id (explicit or by email) ──
  let orderId = body.order_id || null;
  if (!orderId && email) {
    const q = `/orders.json?status=any&limit=250`;
    const { body: ordersBody } = await shopifyFetch(env, q);
    const match = (ordersBody.orders || []).find(o => (o.email || o.contact_email || '').toLowerCase() === email.toLowerCase());
    if (match) orderId = match.id;
  }

  // ── 2. Update the order: shipping phone + SMS consent via note_attributes ──
  if (orderId) {
    const put = await shopifyFetch(env, `/orders/${orderId}.json`, {
      method: 'PUT',
      body: JSON.stringify({
        order: {
          id: Number(orderId),
          phone,
          note_attributes: [
            { name: 'customer_phone', value: phone },
            { name: 'sms_consent', value: 'opted_in' },
          ],
        },
      }),
    });
    results.order = { orderId, ok: put.ok, status: put.status, error: put.ok ? null : (put.body?.errors || put.body) };
  } else {
    results.order = { orderId: null, error: 'order not found (provide order_id or matching email)' };
  }

  // ── 3. Upsert customer phone + SMS consent ──
  if (email) {
    const sync = await syncCustomerWithPhone(env, { email, phone, ...name });
    results.customer = sync;
  } else {
    results.customer = { error: 'no email provided; customer not updated' };
  }

  return new Response(JSON.stringify({ success: !results.order.error || !results.customer.error, ...results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

// Minimal customer upsert focused on phone + SMS consent (mirrors syncCustomer).
async function syncCustomerWithPhone(env, profile) {
  const email = (profile.email || '').trim().toLowerCase();
  if (!email) return { error: 'email required' };

  const search = await shopifyFetch(env, `/customers/search.json?query=${encodeURIComponent('email:' + email)}`);
  const existing = (search.body && search.body.customers && search.body.customers[0]) || null;

  if (existing) {
    const patch = { customer: { id: existing.id } };
    patch.customer.phone = profile.phone;
    if (profile.first_name) patch.customer.first_name = profile.first_name;
    if (profile.last_name) patch.customer.last_name = profile.last_name;
    patch.customer.sms_marketing_consent = { state: 'subscribed', opt_in_level: 'single_opt_in', consent_updated_at: new Date().toISOString() };
    const upd = await shopifyFetch(env, `/customers/${existing.id}.json`, { method: 'PUT', body: JSON.stringify(patch) });
    return { updated: true, shopifyId: existing.id, ok: upd.ok, error: upd.ok ? null : (upd.body?.errors || upd.body) };
  }

  const create = {
    customer: {
      email,
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      phone: profile.phone,
      tags: 'bargain-drop',
      sms_marketing_consent: { state: 'subscribed', opt_in_level: 'single_opt_in', consent_updated_at: new Date().toISOString() },
      send_email_invite: false,
    },
  };
  const res = await shopifyFetch(env, '/customers.json', { method: 'POST', body: JSON.stringify(create) });
  if (res.ok && res.body?.customer) return { created: true, shopifyId: res.body.customer.id, ok: true, error: null };
  return { created: false, ok: false, error: res.body?.errors || res.body };
}
