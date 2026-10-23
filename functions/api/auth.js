// Cloudflare Pages Function: /api/auth
// Full contract:
//   POST { action:"register", email, password, username?, name? } → sets __session cookie
//   POST { action:"signin", email, password }                     → sets __session cookie
//   POST { action:"signout" }                                     → clears __session cookie
//   POST { action:"update_profile", ...fields }                   → updates profile
//   GET  ?action=me                                               → { user } or { user:null }

import { corsHeaders, hashPassword, verifyPassword, syncCustomer, ghRead, ghWrite } from '../_sync-lib.js';

const USERS_PATH = 'users-seed.json';
const COOKIE_NAME = '__session';
const COOKIE_MAX_AGE = 2592000; // 30 days
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 min
const RATE_LIMIT_MAX = 25;

const rateLimitMap = new Map();

function getSecret(env) {
  return (env && env.SESSION_SECRET) || 'bargain-drop-session-secret-v1';
}

async function b64url(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signCookie(payload, env) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret(env)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return await b64url(sig);
}

async function createSessionCookie(userId, env) {
  const expiry = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE;
  const payload = userId + '.' + expiry;
  const sig = await signCookie(payload, env);
  return payload + '.' + sig;
}

async function verifySessionCookie(cookieVal, env) {
  if (!cookieVal) return null;
  const decoded = decodeURIComponent(cookieVal);
  const parts = decoded.split('.');
  if (parts.length !== 3) return null;
  const expiry = parseInt(parts[1], 10);
  if (!expiry || Date.now() / 1000 > expiry) return null;
  const expected = await signCookie(parts[0] + '.' + parts[1], env);
  if (parts[2] !== expected) return null;
  return parts[0];
}

function cookieHeader(name, value, maxAge) {
  const parts = [name + '=' + value, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Secure'];
  if (maxAge != null) {
    parts.push('Max-Age=' + maxAge);
    if (maxAge === 0) parts.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  }
  return parts.join('; ');
}

function parseCookies(request) {
  const out = {};
  (request.headers.get('cookie') || '').split(';').forEach(function (p) {
    const i = p.indexOf('=');
    if (i < 0) return;
    out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  });
  return out;
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function checkRateLimit(ip) {
  const now = Date.now();
  const rec = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  if (now > rec.resetAt) {
    rec.count = 0;
    rec.resetAt = now + RATE_LIMIT_WINDOW;
  }
  rec.count++;
  rateLimitMap.set(ip, rec);
  return rec.count <= RATE_LIMIT_MAX;
}

function safeUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name || u.username || (u.email ? u.email.split('@')[0] : 'Customer'),
    username: u.username || u.name || (u.email ? u.email.split('@')[0] : null),
    first_name: u.first_name || null,
    last_name: u.last_name || null,
    phone: u.phone || null,
    picture: u.picture || null,
    credits: u.credits || 0,
    provider: u.provider || 'email',
    createdAt: u.createdAt || null,
  };
}

async function loadUsersWithSha(env) {
  const existing = await ghRead(env, USERS_PATH);
  if (!existing || !existing.content) {
    return { users: [], sha: existing ? existing.sha : null };
  }
  const cleanB64 = String(existing.content).replace(/\s+/g, '');
  const decoded = atob(cleanB64);
  const parsed = JSON.parse(decoded);
  const users = Array.isArray(parsed) ? parsed : Array.isArray(parsed.users) ? parsed.users : [];
  return { users, sha: existing.sha || null };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });

  if (request.method === 'GET') {
    const url = new URL(request.url);
    if (url.searchParams.get('action') === 'me') {
      const userId = await verifySessionCookie(parseCookies(request)[COOKIE_NAME], env);
      if (!userId) return json({ user: null });
      try {
        const { users } = await loadUsersWithSha(env);
        const u = users.find((x) => x.id === userId);
        if (!u) return json({ user: null });
        return json({ user: safeUser(u) });
      } catch {
        return json({ user: null });
      }
    }
    return json({ error: 'Unknown GET action' }, 400);
  }

  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (!checkRateLimit(ip)) return json({ error: 'Too many attempts. Try again later.' }, 429);

  const body = await request.json().catch(() => ({}));
  const { action, password, name, username, picture, first_name, last_name, phone, addresses } = body;
  const email = body.email ? String(body.email).trim().toLowerCase() : '';
  const cleanUsername = (username || name || (email ? email.split('@')[0] : '')).trim();

  if (action === 'me') {
    const userId = await verifySessionCookie(parseCookies(request)[COOKIE_NAME], env);
    if (!userId) return json({ ok: false, user: null });
    try {
      const { users } = await loadUsersWithSha(env);
      const u = users.find((x) => x.id === userId);
      if (!u) return json({ ok: false, user: null });
      return json({ ok: true, user: safeUser(u) });
    } catch {
      return json({ ok: false, user: null });
    }
  }

  if (action === 'signout') {
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
        'Set-Cookie': cookieHeader(COOKIE_NAME, '', 0),
      },
    });
  }

  if (action !== 'update_profile') {
    if (!email) return json({ error: 'Email required' }, 400);
    if (!password) return json({ error: 'Password required' }, 400);
  }

  let users = [];
  let sha = null;
  try {
    const loaded = await loadUsersWithSha(env);
    users = loaded.users;
    sha = loaded.sha;
  } catch (e) {
    console.error('[auth] Failed to load users-seed.json:', e && e.message);
    return json({ error: 'Authentication storage temporarily unavailable. Please try again.' }, 503);
  }

  if (action === 'register') {
    if (!cleanUsername) return json({ error: 'Username is required' }, 400);
    if (String(password).length < 6) return json({ error: 'Password must be at least 6 characters' }, 400);
    if (users.find((u) => String(u.email || '').trim().toLowerCase() === email)) {
      return json({ error: 'Email already registered. Please sign in or reset your password.' }, 409);
    }
    if (
      users.find(
        (u) =>
          u.username &&
          String(u.username).trim().toLowerCase() === cleanUsername.toLowerCase() &&
          String(u.email || '').trim().toLowerCase() !== email
      )
    ) {
      return json({ error: 'Username is already taken' }, 409);
    }

    const hashed = await hashPassword(password);
    const user = {
      id: 'u-' + Date.now(),
      email,
      name: name || cleanUsername,
      username: cleanUsername,
      picture: picture || null,
      first_name: first_name || null,
      last_name: last_name || null,
      phone: phone || null,
      addresses: addresses || null,
      password: hashed,
      provider: 'email',
      credits: 0,
      createdAt: new Date().toISOString(),
    };
    users.push(user);

    try {
      await ghWrite(env, USERS_PATH, JSON.stringify(users, null, 2), 'auth: register user ' + email, sha || undefined);
    } catch (we) {
      console.error('register ghWrite fail:', we && we.message);
      return json({ error: 'Account could not be saved right now. Please try again in a few moments.' }, 503);
    }

    let shopify_customer;
    try {
      shopify_customer = await syncCustomer(env, { email, first_name, last_name, phone, addresses });
    } catch (ce) {
      shopify_customer = { error: ce.message };
    }

    const cookie = await createSessionCookie(user.id, env);
    return new Response(JSON.stringify({ success: true, ok: true, user: safeUser(user), shopify_customer }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
        'Set-Cookie': cookieHeader(COOKIE_NAME, cookie, COOKIE_MAX_AGE),
      },
    });
  }

  if (action === 'signin') {
    const user = users.find((u) => String(u.email || '').trim().toLowerCase() === email);
    if (!user || !user.password || !(await verifyPassword(password, user.password))) {
      return json({ error: 'Invalid email or password' }, 401);
    }
    const cookie = await createSessionCookie(user.id, env);
    return new Response(JSON.stringify({ success: true, ok: true, user: safeUser(user) }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
        'Set-Cookie': cookieHeader(COOKIE_NAME, cookie, COOKIE_MAX_AGE),
      },
    });
  }

  if (action === 'update_profile') {
    const userId = await verifySessionCookie(parseCookies(request)[COOKIE_NAME], env);
    if (!userId) return json({ error: 'Sign in required' }, 401);
    const user = users.find((u) => u.id === userId);
    if (!user) return json({ error: 'User not found' }, 404);
    if (first_name != null) user.first_name = first_name;
    if (last_name != null) user.last_name = last_name;
    if (phone != null) user.phone = phone;
    if (addresses != null) user.addresses = addresses;
    if (username != null) user.username = username;
    if (picture != null) user.picture = picture;
    try {
      await ghWrite(env, USERS_PATH, JSON.stringify(users, null, 2), 'auth: update profile', sha || undefined);
    } catch (we) {
      console.error('update_profile ghWrite fail:', we && we.message);
      return json({ error: 'Could not save your profile right now. Please try again in a few moments.' }, 503);
    }

    let shopify_customer;
    try {
      shopify_customer = await syncCustomer(env, {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        addresses: user.addresses,
      });
    } catch (ce) {
      shopify_customer = { error: ce.message };
    }

    return json({ success: true, ok: true, user: safeUser(user), shopify_customer });
  }

  return json({ error: 'Invalid action. Use register, signin, signout, update_profile, or me.' }, 400);
}