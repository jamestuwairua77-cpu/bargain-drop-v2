// Cloudflare Pages Function: POST /api/architect/auth
// Verifies the admin PIN server-side and sets an HttpOnly, signed session
// cookie that gates access to the Architect Console (functions/architect.js).
//
// The PIN/secret never touches the browser in plaintext; the cookie is an
// HMAC-SHA256 signature over a timestamp, keyed by env.ADMIN_PIN + a fixed
// application secret. The console route re-verifies this signature on every
// load.

import { json, err, corsHeaders } from './_lib.js';

// Fixed application secret (not sensitive — it only binds the cookie to this
// app; the actual PIN remains in env.ADMIN_PIN). Used as HMAC key material.
const APP_SECRET = 'bargain-drop-architect-console-v1';

const COOKIE_NAME = 'architect_auth';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const SECRET_PATH = '/'; // cookie valid for the whole domain

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacHex(keyText, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(keyText),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return b64url(sig);
}

// Build a signed token: `${expiresAt}.${signature}`
async function signSession(env, nowSeconds) {
  const expiresAt = nowSeconds + SESSION_TTL_SECONDS;
  const keyText = (env.ADMIN_PIN || '') + '|' + APP_SECRET;
  const sig = await hmacHex(keyText, String(expiresAt));
  return `${expiresAt}.${sig}`;
}

// Verify a signed token; returns true if the signature matches and not expired.
export async function verifySession(token, env, nowSeconds) {
  if (!token || typeof token !== 'string') return false;
  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const expiresAt = parseInt(token.slice(0, dot), 10);
  const sig = token.slice(dot + 1);
  if (!Number.isFinite(expiresAt) || expiresAt < nowSeconds) return false;
  const keyText = (env.ADMIN_PIN || '') + '|' + APP_SECRET;
  const expected = await hmacHex(keyText, String(expiresAt));
  // constant-time compare
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

function getCookie(request, name) {
  const h = request.headers.get('Cookie') || '';
  for (const part of h.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (k === name) return part.slice(i + 1).trim();
  }
  return '';
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let pin = '';
  try {
    const body = await request.json();
    pin = String((body && body.pin) || '').trim();
  } catch (e) {
    return err('Invalid JSON body', 400);
  }

  const expected = String(env.ADMIN_PIN || '');
  if (!expected) return err('Admin PIN not configured', 500);

  // Timing-safe compare (mirrors requireAdmin in _lib.js).
  const a = pin, b = expected;
  let ok = a.length === b.length;
  if (ok) {
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    ok = diff === 0;
  }

  if (!ok) {
    return json({ ok: false, error: 'Incorrect PIN' }, 401);
  }

  const now = Math.floor(Date.now() / 1000);
  const token = await signSession(env, now);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
      'Set-Cookie': `${COOKIE_NAME}=${token}; Path=${SECRET_PATH}; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}; Secure`,
    },
  });
}

export async function onRequest(context) {
  // GET /logout — clears the session cookie.
  const { request } = context;
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname.endsWith('/logout')) {
    return new Response('logged out', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Set-Cookie': `${COOKIE_NAME}=; Path=${SECRET_PATH}; HttpOnly; SameSite=Lax; Max-Age=0; Secure`,
      },
    });
  }
  return err('Method not allowed', 405);
}
