// Cloudflare Pages Function: /api/store-credit
// GET  ?action=balance   → { balance } (cents-free dollars) for the signed-in user
// POST { action:"spend", amount } → deduct credit (used by checkout), validates session
// Starts new users at $10 (see auth.js / google-callback.js register paths).

import { corsHeaders, ghRead, ghWrite } from '../_sync-lib.js';

const USERS_PATH = 'users-seed.json';
const COOKIE_NAME = '__session';

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
async function loadUsers(env) {
  try {
    const existing = await ghRead(env, USERS_PATH);
    if (existing && existing.content) return JSON.parse(atob(existing.content));
  } catch (e) {}
  return [];
}
function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });

  const userId = await verifySessionCookie(parseCookies(request)[COOKIE_NAME], env);
  if (!userId) return json({ error: 'Sign in required' }, 401);

  const users = await loadUsers(env);
  const idx = users.findIndex(x => x.id === userId);
  if (idx < 0) return json({ error: 'User not found' }, 404);
  const user = users[idx];

  const url = new URL(request.url);

  // GET balance
  if (request.method === 'GET') {
    return json({ balance: round2(user.credits || 0) });
  }

  // POST spend / adjust
  if (request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const action = body.action;

    if (action === 'spend') {
      const amount = round2(body.amount);
      const balance = round2(user.credits || 0);
      if (!(amount > 0)) return json({ error: 'Invalid amount' }, 400);
      if (amount > balance) return json({ error: 'Insufficient store credit', balance }, 400);
      const newBal = round2(balance - amount);
      user.credits = newBal;
      try {
        const existing = await ghRead(env, USERS_PATH);
        await ghWrite(env, USERS_PATH, JSON.stringify(users, null, 2), 'store-credit: spend ' + amount, existing && existing.sha);
        return json({ success: true, balance: newBal, spent: amount });
      } catch (e) {
        console.error('store-credit spend ghWrite fail:', e && e.message);
        return json({ error: 'Could not update credit right now. Please try again.' }, 503);
      }
    }

    return json({ error: 'Unknown action' }, 400);
  }

  return json({ error: 'Method not allowed' }, 405);
}
