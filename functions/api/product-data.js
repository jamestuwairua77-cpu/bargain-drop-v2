// Cloudflare Pages Function: /api/product-data
// GET ?id= — returns product data from categories-data.json

import { corsHeaders, loadAllCategories } from '../_sync-lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  try {
    // Read categories data (sharded) and return the reconstructed object.
    const data = await loadAllCategories(request);
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300, s-maxage=600', ...corsHeaders() },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal error', message: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
