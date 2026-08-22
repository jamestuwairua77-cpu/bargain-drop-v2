import { corsHeaders } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  try {
    const base = new URL(request.url).origin;
    const ci = await fetch(base + '/categories-index.json');
    let data = null;
    if (ci.ok) { const j = await ci.json(); if (j && Object.keys(j).length) data = j; }
    if (!data) {
      const pi = await fetch(base + '/products-index.json');
      if (!pi.ok) throw new Error('Index not available');
      data = await pi.json();
    }
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...corsHeaders() } });
  } catch (e) { return new Response(JSON.stringify({}), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
}
