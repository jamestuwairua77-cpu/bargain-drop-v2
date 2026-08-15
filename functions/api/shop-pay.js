// Cloudflare Pages Function: /api/shop-pay
// POST — creates a Shopify Storefront checkout and returns a Shop Pay web URL.
//
// Shop Pay is Shopify's accelerated checkout wallet. We offer it by building a
// cart through the Storefront Cart API and returning the checkout web URL, which
// Shopify hosts (and which natively surfaces Shop Pay as the primary wallet).
//
// Requires env:
//   SHOPIFY_STOREFRONT_TOKEN  (public Storefront API access token)
//   SHOPIFY_STORE_DOMAIN      (storefront domain, e.g. 'bargain-drop-8194.myshopify.com')

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

  const SF_TOKEN = env.SHOPIFY_STOREFRONT_TOKEN || '';
  const SF_DOMAIN = env.SHOPIFY_STORE_DOMAIN || 'bargain-drop-8194.myshopify.com';
  if (!SF_TOKEN) {
    return new Response(JSON.stringify({ error: 'Shop Pay not configured (missing Storefront token)' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const body = await request.json().catch(() => ({}));
  const lines = (body.lines || []).filter(l => l && l.merchandiseId);
  if (!lines.length) {
    return new Response(JSON.stringify({ error: 'No line items' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const GQL_URL = `https://${SF_DOMAIN}/api/2025-10/graphql.json`;

  // Step 1 — create a cart with line items (each references a Shopify variant gid)
  const cartInput = lines.map((l, i) =>
    `{ merchandiseId: "${l.merchandiseId}", quantity: ${l.quantity || 1} }`
  ).join(', ');
  const createCartQuery = `
    mutation {
      cartCreate(input: { lines: [${cartInput}], buyerIdentity: { email: ${JSON.stringify(body.email || '')}, countryCode: AU } }) {
        cart { id checkoutUrl }
        userErrors { field message }
      }
    }`;

  try {
    const r1 = await fetch(GQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SF_TOKEN,
      },
      body: JSON.stringify({ query: createCartQuery }),
    });
    const d1 = await r1.json();
    const cart = d1.data?.cartCreate?.cart;
    const errors = d1.data?.cartCreate?.userErrors || d1.errors;

    if (!cart || !cart.checkoutUrl) {
      return new Response(JSON.stringify({ error: 'Cart creation failed', details: errors }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    // Return the Shopify hosted checkout URL — natively offers Shop Pay + card/other wallets.
    // To bias toward Shop Pay, append the pay parameter.
    let url = cart.checkoutUrl;
    try {
      const u = new URL(url);
      u.searchParams.set('pay', 'shop_pay');
      url = u.toString();
    } catch {}

    return new Response(JSON.stringify({ url, cartId: cart.id }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
