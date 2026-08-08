// Cloudflare Pages Function: /api/stripe-pk
// GET — returns the Stripe publishable key

import { corsHeaders } from '../_sync-lib.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  const key = env.STRIPE_PUBLISHABLE_KEY || 'pk_live_51TndeRJ3f0xAyevchYmstcKzEeAD27L3ZPBQtHfPqgXxfr00AKqZhfLV';
  return new Response(JSON.stringify({ key }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...corsHeaders() },
  });
}
