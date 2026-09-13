// Cloudflare Pages Function: /api/wishlist
// GET  → { wishlist: [...] } for the signed-in user (server source of truth)
// POST { action:"save", wishlist:[...] } → replace the user's wishlist list
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

  if (request.method === 'GET') {
    return json({ wishlist: Array.isArray(user.wishlist) ? user.wishlist : [] });
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const wishlist = Array.isArray(body.wishlist) ? body.wishlist : null;
    if (wishlist === null) return json({ error: 'wishlist array required' }, 400);
    try {
      const users = await listUsers(env);
      const idx = users.findIndex(u => u.id === user.id);
      if (idx < 0) return json({ error: 'User not found' }, 404);
      users[idx].wishlist = wishlist;
      const existing = await ghRead(env, USERS_PATH);
      await ghWrite(env, USERS_PATH, JSON.stringify(users, null, 2), 'wishlist: save', existing && existing.sha);
      return json({ success: true, wishlist });
    } catch (e) {
      console.error('wishlist ghWrite fail:', e && e.message);
      return json({ error: 'Could not save wishlist right now. Please try again.' }, 503);
    }
  }

  return json({ error: 'Method not allowed' }, 405);
}
