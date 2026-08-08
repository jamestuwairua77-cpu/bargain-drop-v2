import { corsHeaders } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context; const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  const query = (url.searchParams.get('q') || '').toLowerCase().trim();
  if (!query) return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  try {
    const r = await fetch(new URL('/all-products.json', request.url)); if (!r.ok) throw new Error('Products not available');
    const allProducts = await r.json();
    const results = allProducts.filter(p => {
      const title = (p.title || '').toLowerCase(); const desc = (p.body_html || '').replace(/<[^>]+>/g, '').toLowerCase();
      return title.includes(query) || desc.includes(query);
    }).slice(0, 50);
    return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (e) { return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
}