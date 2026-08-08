import { corsHeaders } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  const vars = {};
  for (const [k, v] of Object.entries(env)) { if (typeof v === 'string') vars[k] = v.length > 8 ? v.slice(0, 4) + '...' + v.slice(-4) : '***'; }
  return new Response(JSON.stringify({ env: vars, platform: 'cloudflare-pages' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}