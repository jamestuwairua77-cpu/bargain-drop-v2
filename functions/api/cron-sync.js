import { corsHeaders } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  const url = new URL(request.url);
  const delegateReq = new Request(url.origin + '/api/sync-full?action=sync', { headers: request.headers });
  try {
    const resp = await fetch(delegateReq);
    const data = await resp.json();
    return new Response(JSON.stringify(data), { status: resp.status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
}