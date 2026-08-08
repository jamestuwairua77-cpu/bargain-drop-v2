import { corsHeaders } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context; if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  const url = new URL(request.url);
  return new Response(JSON.stringify({ redirect: url.origin + '/api/sync-full?action=sync', note: 'Use /api/sync-full?action=sync for product data refresh' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}