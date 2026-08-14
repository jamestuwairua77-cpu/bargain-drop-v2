import { corsHeaders, appendSyncLog, saveOrderRecord } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  try {
    const body = await request.json().catch(() => ({}));
    const order = body.order || body;
    if (!order || !order.id) return new Response(JSON.stringify({ error: 'order.id required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    // Persist to durable ledger (GitHub-backed data/orders.json)
    await saveOrderRecord(env, order);
    // Keep an audit trail too
    await appendSyncLog(env, { action: 'save-order', id: order.id, status: order.status || 'unpaid' });
    return new Response(JSON.stringify({ success: true, id: order.id }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }
}
