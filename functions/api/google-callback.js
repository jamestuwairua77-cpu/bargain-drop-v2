import { corsHeaders, ghRead, ghWrite } from '../_sync-lib.js';

const USERS_PATH = 'users-seed.json';
const COOKIE_MAX_AGE = 2592000;

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

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  const code = url.searchParams.get('code');
  if (!code) return new Response(JSON.stringify({ error: 'Authorization code required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });

  let user;
  try {
    const CLIENT_ID = env.GOOGLE_CLIENT_ID || '489382559871-t7hh34fgbr23vkifi1u8kd9s7dolrv20.apps.googleusercontent.com';
    const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET || '';
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: url.origin + '/auth.html', grant_type: 'authorization_code' }).toString() });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Token exchange failed');
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { 'Authorization': 'Bearer ' + tokenData.access_token } });
    const userInfo = await userRes.json();

    let users = [];
    try { const existing = await ghRead(env, USERS_PATH); if (existing && existing.content) users = JSON.parse(atob(existing.content)); } catch {}
    user = users.find(u => u.email === userInfo.email);
    if (!user) {
      user = { id: 'g-' + userInfo.sub, email: userInfo.email, name: userInfo.name || userInfo.email.split('@')[0], provider: 'google', picture: userInfo.picture, credits: 0, createdAt: new Date().toISOString() };
      users.push(user);
      const existing = await ghRead(env, USERS_PATH);
      await ghWrite(env, USERS_PATH, JSON.stringify(users, null, 2), 'auth: google signup', existing && existing.sha);
    }
  } catch (e) {
    return Response.redirect(url.origin + '/sign-in.html?error=' + encodeURIComponent(e.message), 302);
  }

  const cookie = await createSessionCookie(user.id, env);
  return new Response(null, {
    status: 302,
    headers: { 'Location': url.origin + '/profile.html', 'Set-Cookie': '__session=' + cookie + '; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=' + COOKIE_MAX_AGE },
  });
}
