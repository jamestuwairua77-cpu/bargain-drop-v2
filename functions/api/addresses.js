// Cloudflare Pages Function: /api/addresses
// GET  → { addresses: [...] } for the signed-in user (server source of truth)
// POST { action:"save", addresses:[...] } → replace the user's address list
// Identity is resolved from the verified __session cookie (per-account privacy).

import { corsHeaders, ghRead, ghWrite, getSessionUser, listUsers } from '../_sync-lib.js';

const USERS_PATH = 'users-seed.json';

function json(data, status) {
  return new Response(JSON.stringify(data), { status: status || 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });

  const user = await getSessionUser(request, env);
  if (!user) return json({ error: 'Sign in required' }, 401);

  // GET — return current addresses
  if (request.method === 'GET') {
    return json({ addresses: Array.isArray(user.addresses) ? user.addresses : [] });
  }

  // POST — save addresses
  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const addresses = Array.isArray(body.addresses) ? body.addresses : null;
    if (addresses === null) return json({ error: 'addresses array required' }, 400);

    try {
      const users = await listUsers(env);
      const idx = users.findIndex(u => u.id === user.id);
      if (idx < 0) return json({ error: 'User not found' }, 404);
      users[idx].addresses = addresses;
      const existing = await ghRead(env, USERS_PATH);
      await ghWrite(env, USERS_PATH, JSON.stringify(users, null, 2), 'addresses: save', existing && existing.sha);
      return json({ success: true, addresses });
    } catch (e) {
      console.error('addresses ghWrite fail:', e && e.message);
      return json({ error: 'Could not save addresses right now. Please try again.' }, 503);
    }
  }

  return json({ error: 'Method not allowed' }, 405);
}
