// Cloudflare Pages Function: /api/create-checkout-session
// POST — creates a Stripe Checkout Session

import { corsHeaders } from '../_sync-lib.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const body = await request.json().catch(() => ({}));
  const { line_items, customer_email, success_url, cancel_url, metadata, payment_method } = body;
  const STRIPE_KEY = env.STRIPE_SECRET_KEY || '';

  if (!STRIPE_KEY) {
    return new Response(JSON.stringify({ error: 'Stripe key not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  try {
    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', success_url);
    params.append('cancel_url', cancel_url);
    params.append('customer_email', customer_email);

    if (payment_method === 'card') {
      params.append('payment_method_types[]', 'card');
    } else {
      const methods = ['card', 'link', 'afterpay_clearpay', 'klarna', 'zip'];
      methods.forEach(m => params.append('payment_method_types[]', m));
    }

    if (metadata) {
      Object.entries(metadata).forEach(([k, v]) => params.append(`metadata[${k}]`, v));
    }

    line_items.forEach((item, i) => {
      params.append(`line_items[${i}][price_data][currency]`, item.currency || 'aud');
      params.append(`line_items[${i}][price_data][product_data][name]`, item.name || 'Product');
      params.append(`line_items[${i}][price_data][unit_amount]`, item.unit_amount || 0);
      params.append(`line_items[${i}][quantity]`, item.quantity || 1);
    });

    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + STRIPE_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await r.json();
    if (!r.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'Stripe error' }), {
        status: r.status, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    return new Response(JSON.stringify({ url: data.url, id: data.id }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
