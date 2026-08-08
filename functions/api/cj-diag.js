import { corsHeaders, cjToken } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  try {
    const token = await cjToken(env);
    const masked = token ? token.slice(0, 8) + '...' + token.slice(-4) : 'none';
    return new Response(JSON.stringify({ connected: true, token: masked, api: 'https://developers.cjdropshipping.com/api2.0/v1' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (e) { return new Response(JSON.stringify({ connected: false, error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
}