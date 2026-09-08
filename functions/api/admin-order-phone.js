// /api/admin-order-phone — admin-gated. Set a phone (+ SMS consent) on a
// Shopify order and upsert the customer via the proven syncCustomer helper.
import { corsHeaders, shopifyFetch, syncCustomer, isAdmin, adminDenied } from '../_sync-lib.js';

function normalizeAuMobile(input) {
  if (!input) return '';
  const digits = String(input).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return '+61' + digits.slice(1);
  if (digits.startsWith('61')) return '+' + digits;
  if (digits.length === 9) return '+61' + digits;
  return '+' + digits;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();

  let body = {};
  try { body = await request.json(); } catch {}

  const phone = normalizeAuMobile(body.phone);
  const email = (body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim();
  const fn = name.split(/\s+/)[0] || '';
  const ln = name.split(/\s+/).slice(1).join(' ') || '';

  if (!phone) return new Response(JSON.stringify({ error: 'phone required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });

  const out = { phone, email, order: null, customer: null };

  // 1. Resolve order id
  let orderId = body.order_id || null;
  if (!orderId && email) {
    try {
      const r = await shopifyFetch(env, '/orders.json?status=any&limit=250');
      const m = (r.body?.orders || []).find(o => (o.email || o.contact_email || '').toLowerCase() === email);
      if (m) orderId = m.id;
    } catch (e) { out.order = { error: 'lookup failed: ' + e.message }; }
  }

  // 2. Update the order phone
  if (orderId) {
    try {
      const put = await shopifyFetch(env, `/orders/${orderId}.json`, {
        method: 'PUT',
        body: JSON.stringify({ order: { id: Number(orderId), phone, note_attributes: [{ name: 'customer_phone', value: phone }, { name: 'sms_consent', value: 'opted_in' }] } }),
      });
      out.order = { orderId, ok: put.ok, status: put.status, error: put.ok ? null : (put.body?.errors || put.body) };
    } catch (e) { out.order = { orderId, error: e.message }; }
  } else if (!out.order) {
    out.order = { orderId: null, error: 'order not found (pass order_id or matching email)' };
  }

  // 3. Upsert customer (proven helper)
  if (email) {
    try {
      const prof = { email, phone };
      if (fn) prof.first_name = fn;
      if (ln) prof.last_name = ln;
      out.customer = await syncCustomer(env, prof);
    } catch (e) { out.customer = { error: e.message }; }
  } else {
    out.customer = { error: 'no email; customer skipped' };
  }

  const okAll = (out.order && out.order.ok) || (out.customer && (out.customer.ok || out.customer.error === 'no email; customer skipped'));
  return new Response(JSON.stringify(out), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
