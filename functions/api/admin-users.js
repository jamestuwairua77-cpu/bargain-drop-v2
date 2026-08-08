import { corsHeaders, ghRead } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  try {
    const existing = await ghRead(env, 'users-seed.json');
    let users = []; if (existing && existing.content) users = JSON.parse(atob(existing.content));
    const safe = users.map(u => ({ id: u.id, email: u.email, name: u.name, provider: u.provider, createdAt: u.createdAt }));
    return new Response(JSON.stringify(safe), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (e) { return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
}
