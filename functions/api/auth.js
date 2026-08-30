// Cloudflare Pages Function: /api/auth
// Full contract:
//   POST { action:"register", email, password, name? }        → sets __session cookie
//   POST { action:"signin", email, password }                 → sets __session cookie
//   POST { action:"signout" }                                 → clears __session cookie
//   POST { action:"update_profile", email, ...fields }        → updates profile (email-keyed)
//   GET  ?action=me                                           → { user } or { user:null }
// Session is a stateless __session cookie: <userId>.<expiry>.<hmac>, signed with SESSION_SECRET.

import { corsHeaders, hashPassword, verifyPassword, syncCustomer } from '../_sync-lib.js';
import { ghRead, ghWrite } from '../_sync-lib.js';

const USERS_PATH = 'users-seed.json';
const COOKIE_NAME = '__session';
const COOKIE_MAX_AGE = 2592000; // 30 days
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 min
const RATE_LIMIT_MAX = 10;

const rateLimitMap = new Map();

function getSecret(env) { return (env && env.SESSION_SECRET) || 'bargain-drop-session-secret-v1'; }

async function b64url(buf) {
  const bytes = new Uint8Array(buf); let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function signCookie(payload, env) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(getSecret(env)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
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
  const parts = cookieVal.split('.');
  if (parts.length !== 3) return null;
  const expiry = parseInt(parts[1], 10);
  if (!expiry || Date.now() / 1000 > expiry) return null;
  const expected = await signCookie(parts[0] + '.' + parts[1], env);
  if (parts[2] !== expected) return null;
  return parts[0];
}
function cookieHeader(name, value, maxAge) {
  const parts = [ name + '=' + value, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Secure' ];
  if (maxAge != null) {
    parts.push('Max-Age=' + maxAge);
    // For deletion (maxAge=0), also send a past Expires date. Max-Age=0 alone is
    // ignored/mishandled by some browsers with Secure+SameSite cookies, which was
    // leaving the __session cookie intact and "magically" re-authenticating users.
    if (maxAge === 0) parts.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  }
  return parts.join('; ');
}
function parseCookies(request) {
  const out = {};
  (request.headers.get('cookie') || '').split(';').forEach(function (p) {
    const i = p.indexOf('='); if (i < 0) return;
    out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  });
  return out;
}
function json(data, status) {
  return new Response(JSON.stringify(data), { status: status || 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}
function checkRateLimit(ip) {
  const now = Date.now();
  const rec = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  if (now > rec.resetAt) { rec.count = 0; rec.resetAt = now + RATE_LIMIT_WINDOW; }
  rec.count++;
  rateLimitMap.set(ip, rec);
  return rec.count <= RATE_LIMIT_MAX;
}
function safeUser(u) {
  return {
    id: u.id, email: u.email, name: u.name,
    username: u.username || null,
    first_name: u.first_name || null, last_name: u.last_name || null,
    phone: u.phone || null, picture: u.picture || null,
    credits: u.credits || 0, provider: u.provider || 'email',
    createdAt: u.createdAt || null,
  };
}
async function loadUsers(env) {
  try {
    const existing = await ghRead(env, USERS_PATH);
    if (existing && existing.content) return JSON.parse(atob(existing.content));
  } catch (e) {}
  return [];
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });

  if (request.method === 'GET') {
    const url = new URL(request.url);
    if (url.searchParams.get('action') === 'me') {
      const userId = await verifySessionCookie(parseCookies(request)[COOKIE_NAME], env);
      if (!userId) return json({ user: null });
      const users = await loadUsers(env);
      const u = users.find(x => x.id === userId);
      if (!u) return json({ user: null });
      return json({ user: safeUser(u) });
    }
    return json({ error: 'Unknown GET action' }, 400);
  }

  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (!checkRateLimit(ip)) return json({ error: 'Too many attempts. Try again later.' }, 429);

  const body = await request.json().catch(() => ({}));
  const { action, password, name, username, picture, first_name, last_name, phone, addresses } = body;
  const email = body.email ? String(body.email).trim().toLowerCase() : '';

  if (action === 'signout') {
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders(), 'Set-Cookie': cookieHeader(COOKIE_NAME, '', 0) },
    });
  }

  if (!email) return json({ error: 'Email required' }, 400);
  if (action !== 'update_profile' && !password) return json({ error: 'Password required' }, 400);

  const users = await loadUsers(env);

  if (action === 'register') {
    if (users.find(u => u.email === email)) return json({ error: 'Email already registered' }, 409);
    const hashed = await hashPassword(password);
    const user = {
      id: 'u-' + Date.now(), email, name: name || email.split('@')[0],
      username: username || null, picture: picture || null,
      first_name: first_name || null, last_name: last_name || null, phone: phone || null, addresses: addresses || null,
      password: hashed, provider: 'email', credits: 0, createdAt: new Date().toISOString(),
    };
    users.push(user);
    const existing = await ghRead(env, USERS_PATH);
    await ghWrite(env, USERS_PATH, JSON.stringify(users, null, 2), 'auth: register user', existing && existing.sha);

    let shopify_customer;
    try { shopify_customer = await syncCustomer(env, { email, first_name, last_name, phone, addresses }); }
    catch (ce) { shopify_customer = { error: ce.message }; }

    const cookie = await createSessionCookie(user.id, env);
    return new Response(JSON.stringify({ success: true, user: safeUser(user), shopify_customer }), {
      status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders(), 'Set-Cookie': cookieHeader(COOKIE_NAME, cookie, COOKIE_MAX_AGE) },
    });
  }

  if (action === 'signin') {
    const user = users.find(u => (u.email || '').toLowerCase() === email);
    if (!user || !user.password || !(await verifyPassword(password, user.password))) return json({ error: 'Invalid email or password' }, 401);
    const cookie = await createSessionCookie(user.id, env);
    return new Response(JSON.stringify({ success: true, user: safeUser(user) }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders(), 'Set-Cookie': cookieHeader(COOKIE_NAME, cookie, COOKIE_MAX_AGE) },
    });
  }

  if (action === 'update_profile') {
    const user = users.find(u => (u.email || '').toLowerCase() === email);
    if (!user) return json({ error: 'User not found' }, 404);
    if (first_name != null) user.first_name = first_name;
    if (last_name != null) user.last_name = last_name;
    if (phone != null) user.phone = phone;
    if (addresses != null) user.addresses = addresses;
    if (name != null) user.name = name;
    if (username != null) user.username = username;
    if (picture != null) user.picture = picture;
    const ex = await ghRead(env, USERS_PATH);
    await ghWrite(env, USERS_PATH, JSON.stringify(users, null, 2), 'auth: update profile', ex && ex.sha);

    let shopify_customer;
    try { shopify_customer = await syncCustomer(env, { email, first_name: user.first_name, last_name: user.last_name, phone: user.phone, addresses: user.addresses }); }
    catch (ce) { shopify_customer = { error: ce.message }; }

    return json({ success: true, user: safeUser(user), shopify_customer });
  }

  return json({ error: 'Invalid action. Use register, signin, signout, update_profile, or me.' }, 400);
}
