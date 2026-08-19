// Cloudflare Pages Function: /api/credit-topup
// POST { amount: number } — requires valid __session cookie.
// Creates a Stripe Checkout Session with metadata.credit_topup=1; the webhook credits the user.

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

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const userId = await verifySessionCookie(parseCookies(request)[COOKIE_NAME], env);
  if (!userId) return json({ error: 'Sign in required' }, 401);

  const body = await request.json().catch(() => ({}));
  const amount = Math.round(Number(body.amount));
  if (!amount || amount < 5 || amount > 2000) return json({ error: 'Amount must be a whole number between A$5 and A$2000' }, 400);

  let email = null;
  try {
    const ex = await ghRead(env, USERS_PATH);
    if (ex && ex.content) {
      const users = JSON.parse(atob(ex.content));
      const u = users.find(x => x.id === userId);
      if (u) email = u.email;
    }
  } catch (e) {}
  if (!email) return json({ error: 'User not found' }, 404);

  const STRIPE_KEY = env.STRIPE_SECRET_KEY || '';
  if (!STRIPE_KEY) return json({ error: 'Stripe key not configured' }, 500);

  try {
    const origin = new URL(request.url).origin;
    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', origin + '/wallet.html?topup=success&amount=' + amount);
    params.append('cancel_url', origin + '/wallet.html?topup=cancelled');
    params.append('customer_email', email);
    params.append('payment_method_types[]', 'card');
    params.append('payment_method_types[]', 'link');
    params.append('payment_method_types[]', 'afterpay_clearpay');
    params.append('metadata[credit_topup]', '1');
    params.append('metadata[user_id]', userId);
    params.append('metadata[email]', email);
    params.append('metadata[amount]', String(amount));
    params.append('line_items[0][price_data][currency]', 'aud');
    params.append('line_items[0][price_data][product_data][name]', 'Store Credit Top Up');
    params.append('line_items[0][price_data][unit_amount]', String(amount * 100));
    params.append('line_items[0][quantity]', '1');

    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + STRIPE_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await r.json();
    if (!r.ok) return json({ error: (data.error && data.error.message) || 'Stripe error' }, r.status);
    return json({ url: data.url, id: data.id });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
