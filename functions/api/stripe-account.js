import { corsHeaders } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context; if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  const STRIPE_KEY = env.STRIPE_SECRET_KEY || '';
  if (!STRIPE_KEY) return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  try {
    const r = await fetch('https://api.stripe.com/v1/account', { headers: { 'Authorization': 'Bearer ' + STRIPE_KEY } });
    const data = await r.json();
    return new Response(JSON.stringify({ id: data.id, country: data.country, email: data.email, payouts_enabled: data.payouts_enabled }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
}