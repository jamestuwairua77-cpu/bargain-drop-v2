// Cloudflare Pages Function: /api/addresses
// GET  → { addresses: [...] } strictly scoped to the signed-in user's verified __session cookie
// POST { action:"save", addresses:[...] } → sanitizes & binds addresses to user.id
// Enforces Zero-Trust private cache isolation headers.

import { corsHeaders, ghRead, ghWrite, getSessionUser, listUsers } from '../_sync-lib.js';

const USERS_PATH = 'users-seed.json';

function privateHeaders() {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Vary': 'Cookie, Authorization',
    'X-Content-Type-Options': 'nosniff',
    ...corsHeaders(),
  };
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: privateHeaders(),
  });
}

function sanitizeField(val, maxLen = 140) {
  return String(val ?? '')
    .trim()
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .slice(0, maxLen);
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: privateHeaders() });
  }

  // Cryptographic server-side session validation (__session HMAC-SHA256)
  const user = await getSessionUser(request, env);
  if (!user || !user.id) {
    return json({ ok: false, error: 'Sign in required' }, 401);
  }

  // GET — return ONLY the authenticated user's addresses
  if (request.method === 'GET') {
    const ownAddresses = (Array.isArray(user.addresses) ? user.addresses : []).filter(
      (a) => !a.userId || String(a.userId) === String(user.id)
    );
    return json({ ok: true, addresses: ownAddresses });
  }

  // POST — sanitize & bind addresses strictly to user.id (IDOR prevention)
  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const rawAddresses = Array.isArray(body.addresses) ? body.addresses : null;
    if (rawAddresses === null) {
      return json({ ok: false, error: 'addresses array required' }, 400);
    }

    const sanitizedAddresses = rawAddresses.slice(0, 20).map((addr, idx) => ({
      id: sanitizeField(addr.id || `addr_${user.id}_${idx}`, 64),
      userId: String(user.id), // Strictly bound to authenticated session user ID
      name: sanitizeField(addr.name || addr.fullName || user.name || '', 100),
      fullName: sanitizeField(addr.fullName || addr.name || user.name || '', 100),
      street: sanitizeField(addr.street || addr.address1 || addr.streetLine1 || '', 160),
      address1: sanitizeField(addr.address1 || addr.street || addr.streetLine1 || '', 160),
      address2: sanitizeField(addr.address2 || addr.streetLine2 || '', 120),
      city: sanitizeField(addr.city || '', 80),
      state: sanitizeField(addr.state || addr.province || addr.stateProvince || '', 60),
      zip: sanitizeField(addr.zip || addr.postcode || addr.postalZipCode || '', 24),
      country: sanitizeField(addr.country || addr.countryCode || 'Australia', 60),
      phone: sanitizeField(addr.phone || addr.phoneE164 || '', 32),
      isDefault: Boolean(addr.isDefault || addr.isDefaultShipping),
      updatedAt: new Date().toISOString(),
    }));

    try {
      const users = await listUsers(env);
      const idx = users.findIndex((u) => String(u.id) === String(user.id));
      if (idx < 0) return json({ ok: false, error: 'User not found' }, 404);
      users[idx].addresses = sanitizedAddresses;
      const existing = await ghRead(env, USERS_PATH);
      await ghWrite(
        env,
        USERS_PATH,
        JSON.stringify(users, null, 2),
        'addresses: save (user-scoped)',
        existing && existing.sha
      );
      return json({ ok: true, success: true, addresses: sanitizedAddresses });
    } catch (e) {
      console.error('addresses ghWrite fail:', e && e.message);
      return json({ ok: false, error: 'Could not save addresses right now. Please try again.' }, 503);
    }
  }

  return json({ ok: false, error: 'Method not allowed' }, 405);
}