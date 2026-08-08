import { corsHeaders } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  try {
    const r = await fetch(new URL('/categories-index.json', request.url));
    if (!r.ok) throw new Error('Categories not available');
    const data = await r.json();
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...corsHeaders() } });
  } catch (e) { return new Response(JSON.stringify({}), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
}