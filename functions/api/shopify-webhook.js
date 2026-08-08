import { corsHeaders, verifyHmac } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context; if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  const raw = new Uint8Array(await request.arrayBuffer());
  const hmac = request.headers.get('x-shopify-hmac-sha256');
  const topic = request.headers.get('x-shopify-topic') || 'unknown';
  const secret = env.SHOPIFY_WEBHOOK_SECRET || '';
  const verified = await verifyHmac(raw, hmac, secret);
  if (!verified) return new Response(JSON.stringify({ error: 'Invalid HMAC' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  try { JSON.parse(new TextDecoder().decode(raw)); } catch { return new Response(JSON.stringify({ error: 'Bad JSON' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
  return new Response(JSON.stringify({ success: true, topic }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}