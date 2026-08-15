// Cloudflare Pages Function: /api/shop-pay
// POST — creates a Shopify Storefront checkout and returns a Shop Pay web URL.
//
// Robust variant resolution: the client sends variant_id / product_id / sku / size /
// color, and we resolve every line to a valid Shopify variant gid using the catalog,
// so Shop Pay never breaks due to missing/bad client cart data.

import { corsHeaders } from '../_sync-lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });

  const SF_TOKEN = env.SHOPIFY_STOREFRONT_TOKEN || '';
  const SF_DOMAIN = env.SHOPIFY_STORE_DOMAIN || 'bargain-drop-8194.myshopify.com';
  if (!SF_TOKEN) return new Response(JSON.stringify({ error: 'Shop Pay not configured (missing Storefront token)' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });

  const body = await request.json().catch(() => ({}));
  const rawLines = Array.isArray(body.lines) ? body.lines : [];

  // Load catalog for server-side variant resolution.
  let catalog = [];
  try { const rc = await fetch(new URL('/all-products.json', request.url)); if (rc.ok) catalog = await rc.json(); } catch {}

  const bySku = new Map();
  const prodById = new Map();
  for (const p of catalog) {
    prodById.set(String(p.id), p);
    for (const v of (p.variants || [])) {
      const sk = (v.sku || '').toString().trim();
      if (sk && v.id && !bySku.has(sk)) bySku.set(sk, v.id);
    }
  }

  const lines = [];
  for (const raw of rawLines) {
    if (!raw) continue;
    const gid = resolveGid(raw, prodById, bySku);
    if (!gid) continue;
    lines.push({ merchandiseId: gid, quantity: (Number(raw.quantity) > 0 ? Number(raw.quantity) : 1) });
  }

  if (!lines.length) {
    return new Response(JSON.stringify({ error: 'No valid line items could be resolved' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  const GQL_URL = `https://${SF_DOMAIN}/api/2025-10/graphql.json`;
  const query = `mutation cartCreate($lines:[CartLineInput!]!){ cartCreate(input:{ lines:$lines, buyerIdentity:{ email:${JSON.stringify(body.email || '')}, countryCode:AU } }){ cart{ id checkoutUrl } userErrors{ field message } } }`;
  const variables = { lines: lines.map(l => ({ merchandiseId: l.merchandiseId, quantity: l.quantity })) };

  try {
    const r1 = await fetch(GQL_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': SF_TOKEN }, body: JSON.stringify({ query, variables }) });
    const d1 = await r1.json();
    const cart = d1.data?.cartCreate?.cart;
    const errors = d1.data?.cartCreate?.userErrors || d1.errors;
    if (!cart || !cart.checkoutUrl) return new Response(JSON.stringify({ error: 'Cart creation failed', details: errors }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });

    let url = cart.checkoutUrl;
    try { const u = new URL(url); u.searchParams.set('pay', 'shop_pay'); url = u.toString(); } catch {}
    return new Response(JSON.stringify({ url, cartId: cart.id }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }
}

function resolveGid(raw, prodById, bySku) {
  // 1. If a merchandiseId gid was given and its numeric id is a real variant, use it.
  if (raw.merchandiseId) {
    const num = raw.merchandiseId.split('/').pop();
    if (num) {
      const prod = prodById.get(String(num));
      if (prod) {
        const isVariant = (prod.variants || []).some(v => String(v.id) === String(num));
        if (isVariant) return raw.merchandiseId;
        // else it's a product id — fall through to resolve by sku/options
      } else {
        // unknown — might itself be a variant not in catalog's product-id map; try sku
      }
    }
  }

  // 2. variant_id numeric (could be right or wrong)
  const vid = raw.variant_id ? String(raw.variant_id) : null;
  if (vid) {
    // if it's a variant id present in some product's variants, accept it
    for (const p of prodById.values()) {
      if ((p.variants || []).some(v => String(v.id) === vid)) return `gid://shopify/ProductVariant/${vid}`;
    }
  }

  // 3. product_id -> match by sku/size/color
  if (raw.product_id) {
    const prod = prodById.get(String(raw.product_id));
    if (prod) {
      const g = bestVariantGid(prod, raw);
      if (g) return g;
    }
  }

  // 4. sku across catalog
  if (raw.sku) {
    const svid = bySku.get((raw.sku || '').toString().trim());
    if (svid) return `gid://shopify/ProductVariant/${svid}`;
  }

  // 5. last resort: raw variant_id as-is (may be invalid, but let Shopify tell us)
  if (vid) return `gid://shopify/ProductVariant/${vid}`;

  return null;
}

function bestVariantGid(product, raw) {
  const vars = product.variants || [];
  if (!vars.length) return null;
  const sku = (raw.sku || '').toString().trim();
  if (sku) {
    const v = vars.find(vv => (vv.sku || '').toString().trim() === sku);
    if (v && v.id) return `gid://shopify/ProductVariant/${v.id}`;
  }
  const size = (raw.size || '').toString().trim();
  const color = (raw.color || '').toString().trim();
  if (size || color) {
    const v = vars.find(vv =>
      (size ? (vv.option1 === size || vv.option2 === size) : true) &&
      (color ? (vv.option1 === color || vv.option2 === color) : true));
    if (v && v.id) return `gid://shopify/ProductVariant/${v.id}`;
  }
  const first = vars.find(vv => vv.available !== false) || vars[0];
  return first && first.id ? `gid://shopify/ProductVariant/${first.id}` : null;
}
