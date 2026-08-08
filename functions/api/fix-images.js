import { corsHeaders } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  return new Response(JSON.stringify({ ok: true, message: 'Image fixer - run /api/sync-full?action=sync to rebuild data' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}