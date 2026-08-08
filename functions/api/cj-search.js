import { corsHeaders, cjFetch } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  const body = await request.json().catch(() => ({}));
  const { keyword, pageNum = 1, pageSize = 20 } = body;
  if (!keyword) return new Response(JSON.stringify({ error: 'keyword required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  try {
    const result = await cjFetch(env, '/product/search?keyword='+encodeURIComponent(keyword)+'&pageNum='+pageNum+'&pageSize='+pageSize);
    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
}