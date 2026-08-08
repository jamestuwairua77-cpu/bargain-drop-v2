// Cloudflare Pages Function: /api/product-data
// GET ?id= — returns product data from categories-data.json

import { corsHeaders } from '../_sync-lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  try {
    // Try reading categories-data.json from the repo / from static assets
    const r = await fetch(new URL('/categories-data.json', request.url));
    if (!r.ok) throw new Error('Data not available');
    const data = await r.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300, s-maxage=600', ...corsHeaders() },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal error', message: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
