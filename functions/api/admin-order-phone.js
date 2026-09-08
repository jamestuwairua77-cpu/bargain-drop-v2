import { corsHeaders, shopifyFetch, syncCustomer, isAdmin, adminDenied } from '../_sync-lib.js';

function normalizeAuMobile(input) {
  const d = String(input || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('0')) return '+61' + d.slice(1);
  if (d.startsWith('61')) return '+' + d;
  if (d.length === 9) return '+61' + d;
  return '+' + d;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();
  let body = {}; try { body = await request.json(); } catch {}

  const phone = normalizeAuMobile(body.phone);
  const email = (body.email || '').trim().toLowerCase();
  const step = body.step || 'both';

  if (step === 'order') {
    const r = await shopifyFetch(env, `/orders/${body.order_id}.json`, {
      method: 'PUT',
      body: JSON.stringify({ order: { id: Number(body.order_id), phone, note_attributes: [{ name: 'customer_phone', value: phone }, { name: 'sms_consent', value: 'opted_in' }] } }),
    });
    return new Response(JSON.stringify({ step, ok: r.ok, status: r.status, body: r.body }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  if (step === 'customer') {
    const res = await syncCustomer(env, { email, phone });
    return new Response(JSON.stringify({ step, ...res }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  // both
  const out = { phone, email, order: null, customer: null };
  const r = await shopifyFetch(env, `/orders/${body.order_id}.json`, {
    method: 'PUT',
    body: JSON.stringify({ order: { id: Number(body.order_id), phone, note_attributes: [{ name: 'customer_phone', value: phone }, { name: 'sms_consent', value: 'opted_in' }] } }),
  });
  out.order = { ok: r.ok, status: r.status, error: r.ok ? null : (r.body?.errors || r.body) };
  out.customer = await syncCustomer(env, { email, phone });
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}
