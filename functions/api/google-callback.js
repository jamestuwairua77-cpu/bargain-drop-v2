import { corsHeaders } from '../_sync-lib.js';
import { ghRead, ghWrite } from '../_sync-lib.js';

const USERS_PATH = 'users-seed.json';
const COOKIE_NAME = '__session';
const COOKIE_MAX_AGE = 2592000; // 30 days

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
function cookieHeader(name, value, maxAge) {
  const parts = [ name + '=' + value, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Secure' ];
  if (maxAge != null) parts.push('Max-Age=' + maxAge);
  return parts.join('; ');
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
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const state = url.searchParams.get('state') || '/profile.html';

  if (error) {
    return Response.redirect(url.origin + '/sign-in.html?error=' + encodeURIComponent(error), 302);
  }
  if (!code) {
    return Response.redirect(url.origin + '/sign-in.html?error=no_code', 302);
  }

  const clientId = env.GOOGLE_CLIENT_ID || '489382559871-vp4q2enpqf5f8avj8hadjabatn27la7k.apps.googleusercontent.com';
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const redirectUri = url.origin + '/api/google-callback';

  if (!clientSecret) {
    console.error('GOOGLE_CLIENT_SECRET missing');
    return Response.redirect(url.origin + '/sign-in.html?error=env_configuration_error', 302);
  }

  try {
    // 1. Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return Response.redirect(url.origin + '/sign-in.html?error=token_exchange_failed', 302);
    }
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch Google user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': 'Bearer ' + accessToken },
    });
    if (!userResponse.ok) {
      return Response.redirect(url.origin + '/sign-in.html?error=user_info_failed', 302);
    }
    const userData = await userResponse.json();
    const email = (userData.email || '').toLowerCase();
    if (!email) {
      return Response.redirect(url.origin + '/sign-in.html?error=no_email', 302);
    }

    // 3. Provision (or match) the user in users-seed.json
    const users = await loadUsers(env);
    let user = users.find(u => (u.email || '').toLowerCase() === email);
    if (!user) {
      const fullName = [(userData.given_name || '').trim(), (userData.family_name || '').trim()].filter(Boolean).join(' ');
      user = {
        id: 'u-' + Date.now(),
        email,
        name: null,
        username: fullName || email.split('@')[0],
        picture: userData.picture || null,
        first_name: (userData.given_name) || null,
        last_name: (userData.family_name) || null,
        phone: null,
        addresses: null,
        provider: 'google',
        credits: 0,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
    } else {
      // Update picture/name/username on subsequent Google logins but preserve provider fields
      if (userData.picture && !user.picture) user.picture = userData.picture;
      if (userData.given_name && !user.first_name) user.first_name = userData.given_name;
      if (userData.family_name && !user.last_name) user.last_name = userData.family_name;
      if (!user.username) {
        const fullName = [(user.first_name || '').trim(), (user.last_name || '').trim()].filter(Boolean).join(' ');
        user.username = fullName || user.email.split('@')[0];
      }
    }

    let existing = null;
    try { existing = await ghRead(env, USERS_PATH); } catch (e) {}
    try {
      await ghWrite(env, USERS_PATH, JSON.stringify(users, null, 2), 'auth: google sign-in ' + email, existing && existing.sha);
    } catch (w) {
      console.error('ghWrite users fail:', w.message);
    }

    // 4. Create a real server session cookie
    const cookie = await createSessionCookie(user.id, env);
    const safeUser = {
      id: user.id, email: user.email, name: user.name,
      username: user.username || null,
      first_name: user.first_name || null, last_name: user.last_name || null,
      phone: user.phone || null, picture: user.picture || null,
      credits: user.credits || 0, provider: user.provider || 'google',
      createdAt: user.createdAt || null,
    };

    // 5. Redirect to auth.html with the user payload so the client stores it in localStorage too
    const userJson = encodeURIComponent(JSON.stringify(safeUser));
    const target = (state.charAt(0) === '/' && state.indexOf('//') !== 0) ? state : '/profile.html';
    return new Response(null, {
      status: 302,
      headers: {
        'Location': url.origin + '/auth.html?redirect=' + encodeURIComponent(target) + '#google-auth=' + userJson,
        'Set-Cookie': cookieHeader(COOKIE_NAME, cookie, COOKIE_MAX_AGE),
      },
    });
  } catch (err) {
    console.error('OAuth error:', err);
    return Response.redirect(url.origin + '/sign-in.html?error=internal_oauth_error', 302);
  }
}
