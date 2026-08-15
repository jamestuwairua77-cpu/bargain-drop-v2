// Cloudflare Pages Function: /api/stripe-pk
// GET — returns the Stripe publishable key

import { corsHeaders } from '../_sync-lib.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  const key = env.STRIPE_PUBLISHABLE_KEY || '';
  if (!key) {
    return new Response(JSON.stringify({ error: 'Stripe publishable key not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }
  return new Response(JSON.stringify({ key }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders() },
  });
}
