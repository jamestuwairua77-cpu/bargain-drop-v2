import { corsHeaders } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  const STRIPE_KEY = env.STRIPE_SECRET_KEY || '';
  if (!STRIPE_KEY) return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  try {
    const body = await request.json().catch(() => ({}));
    const params = new URLSearchParams();
    params.append('amount', body.amount || 0); params.append('currency', body.currency || 'aud');
    params.append('payment_method_data[type]', 'card');
    params.append('payment_method_data[card][token]', JSON.stringify(body.token || {}));
    const r = await fetch('https://api.stripe.com/v1/payment_intents', { method: 'POST', headers: { 'Authorization': 'Bearer ' + STRIPE_KEY, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
    const data = await r.json();
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
}