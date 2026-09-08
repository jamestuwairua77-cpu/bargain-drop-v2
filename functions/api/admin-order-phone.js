// /api/admin-order-phone — admin-gated phone + SMS-consent setter.
// POST { order_id, phone, email?, step? }
//   step omitted/undefined -> both (order PUT + customer upsert)
//   step='order'    -> update the order's phone + sms_consent note only
//   step='customer' -> upsert the customer's phone + SMS consent only
// NOTE: always pass order_id explicitly (the order-lookup-by-email path was
// removed — a full order scan was slow and caused worker timeouts).
import { corsHeaders, shopifyFetch, syncCustomer, isAdmin, adminDenied } from '../_sync-lib.js';

function normalizeAuMobile(input) {
  const d = String(input || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('0')) return '+61' + d.slice(1);
  if (d.startsWith('61')) return '+' + d;
  if (d.length === 9) return '+61' + d;
  return '+' + d;
}

async function setOrderPhone(env, orderId, phone) {
  const r = await shopifyFetch(env, `/orders/${orderId}.json`, {
    method: 'PUT',
    body: JSON.stringify({ order: { id: Number(orderId), phone, note_attributes: [{ name: 'customer_phone', value: phone }, { name: 'sms_consent', value: 'opted_in' }] } }),
  });
  return { ok: r.ok, status: r.status, error: r.ok ? null : (r.body?.errors || r.body) };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();

  let body = {}; try { body = await request.json(); } catch {}
  const phone = normalizeAuMobile(body.phone);
  const email = (body.email || '').trim().toLowerCase();
  const orderId = body.order_id;
  const step = body.step || 'both';

  if (!phone) return new Response(JSON.stringify({ error: 'phone required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });

  const out = { phone, email, order: null, customer: null };

  if (step === 'order' || step === 'both') {
    if (!orderId) out.order = { error: 'order_id required' };
    else out.order = { orderId, ...(await setOrderPhone(env, orderId, phone)) };
  }
  if (step === 'customer' || step === 'both') {
    if (!email) out.customer = { error: 'email required for customer step' };
    else out.customer = await syncCustomer(env, { email, phone });
  }

  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}
