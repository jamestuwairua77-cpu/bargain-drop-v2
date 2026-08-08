import { corsHeaders } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context; const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  const id = url.searchParams.get('id'); const sku = url.searchParams.get('sku');
  if (!id && !sku) return new Response(JSON.stringify({ error: 'id or sku required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  try {
    // Load full product catalogue
    const rProducts = await fetch(new URL('/all-products.json', request.url));
    if (!rProducts.ok) throw new Error('Products not available');
    const allProducts = await rProducts.json();
    let product;
    if (id) product = allProducts.find(p => String(p.id) === String(id));
    else product = allProducts.find(p => (p.variants || []).some(v => v.sku === sku));
    if (!product) return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });

    // Look up category slug for this product
    let category = null;
    try {
      const rIndex = await fetch(new URL('/categories-index.json', request.url));
      if (rIndex.ok) {
        const idx = await rIndex.json();
        const entry = idx[String(product.id)];
        if (entry && entry.category) category = entry.category;
      }
    } catch {}
    // Fallback: derive category from product_type
    if (!category && product.product_type) {
      category = String(product.product_type).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    return new Response(JSON.stringify({ product, category }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...corsHeaders() },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }
}
