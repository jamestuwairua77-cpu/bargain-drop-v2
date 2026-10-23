import { corsHeaders, ghRead, ghWrite } from '../_sync-lib.js';

const USERS_PATH = 'users-seed.json';
const SESSION_COOKIE_NAME = '__session';
const ACCESS_COOKIE_NAME = 'bd_access_token';
const REFRESH_COOKIE_NAME = 'bd_refresh_token';
const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
const LEGACY_SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

function getSessionSecret(env) {
  return (env && env.SESSION_SECRET) || 'bargain-drop-session-secret-v1';
}

function getJwtSecret(env, type = 'access') {
  if (type === 'refresh') {
    return (env && env.JWT_REFRESH_SECRET) || getSessionSecret(env);
  }
  return (env && env.JWT_ACCESS_SECRET) || getSessionSecret(env);
}

function b64urlEncodeBytes(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlEncodeString(str) {
  return b64urlEncodeBytes(new TextEncoder().encode(str));
}

async function signHmacSha256(signingInput, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  return b64urlEncodeBytes(new Uint8Array(sig));
}

async function signJwt(payload, secret, ttlSeconds) {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const fullPayload = {
    ...payload,
    iat: nowSec,
    exp: nowSec + ttlSeconds,
  };
  const headerSeg = b64urlEncodeString(JSON.stringify(header));
  const payloadSeg = b64urlEncodeString(JSON.stringify(fullPayload));
  const signingInput = `${headerSeg}.${payloadSeg}`;
  const sigSeg = await signHmacSha256(signingInput, secret);
  return `${signingInput}.${sigSeg}`;
}

async function createLegacySessionCookie(userId, env) {
  const expiry = Math.floor(Date.now() / 1000) + LEGACY_SESSION_MAX_AGE;
  const payload = `${userId}.${expiry}`;
  const sig = await signHmacSha256(payload, getSessionSecret(env));
  return `${payload}.${sig}`;
}

function buildCookieHeader(name, value, maxAge, path = '/', sameSite = 'Lax') {
  const parts = [
    `${name}=${value}`,
    `Path=${path}`,
    'HttpOnly',
    `SameSite=${sameSite}`,
    'Secure',
  ];
  if (typeof maxAge === 'number') {
    parts.push(`Max-Age=${maxAge}`);
  }
  return parts.join('; ');
}

async function loadUsersSafe(env) {
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

/**
 * Always resolves to https://bargain-drop.online on Cloudflare Pages
 * even when internal request.url is bargain-drop.pages.dev.
 */
function resolvePublicOrigin(request, url) {
  const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host)
    .split(',')[0]
    .trim();
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    return `${url.protocol}//${host}`;
  }
  return 'https://bargain-drop.online';
}

function resolveCanonicalRedirectUri(request, url, env) {
  if (env && env.GOOGLE_REDIRECT_URI) {
    return String(env.GOOGLE_REDIRECT_URI).trim();
  }
  return `${resolvePublicOrigin(request, url)}/api/google-callback`;
}

function sanitizeRedirectTarget(rawState) {
  if (!rawState) return '/profile.html';
  try {
    const decoded = decodeURIComponent(String(rawState).trim());
    if (decoded.startsWith('https://bargain-drop.online/')) {
      const parsed = new URL(decoded);
      return parsed.pathname + parsed.search;
    }
    if (decoded.startsWith('/') && !decoded.startsWith('//')) {
      return decoded;
    }
  } catch {}
  return '/profile.html';
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const publicOrigin = resolvePublicOrigin(request, url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  let code = url.searchParams.get('code');
  let oauthError = url.searchParams.get('error');
  let rawState = url.searchParams.get('state') || '/profile.html';
  let gsiCredential = url.searchParams.get('credential') || null;

  if (request.method === 'POST') {
    try {
      const contentType = (request.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const formText = await request.text();
        const params = new URLSearchParams(formText);
        gsiCredential = gsiCredential || params.get('credential');
        code = code || params.get('code');
        rawState = params.get('state') || rawState;
      } else if (contentType.includes('application/json')) {
        const body = await request.json();
        gsiCredential = gsiCredential || body.credential || body.idToken || null;
        code = code || body.code || null;
        rawState = body.state || rawState;
      }
    } catch (parseErr) {
      console.error('[Google OAuth] Failed to parse POST callback payload:', parseErr);
    }
  }

  if (oauthError) {
    return Response.redirect(`${publicOrigin}/sign-in.html?error=${encodeURIComponent(oauthError)}`, 302);
  }

  if (!code && !gsiCredential) {
    return Response.redirect(`${publicOrigin}/sign-in.html?error=no_code`, 302);
  }

  const clientId =
    (env && env.GOOGLE_CLIENT_ID) ||
    '489382559871-vp4q2enpqf5f8avj8hadjabatn27la7k.apps.googleusercontent.com';
  const clientSecret = (env && env.GOOGLE_CLIENT_SECRET) || '';
  const redirectUri = resolveCanonicalRedirectUri(request, url, env);

  try {
    let googleProfile = null;

    if (gsiCredential) {
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(gsiCredential)}`
      );
      if (!verifyRes.ok) {
        return Response.redirect(`${publicOrigin}/sign-in.html?error=invalid_google_id_token`, 302);
      }
      const tokenInfo = await verifyRes.json();
      if (tokenInfo.aud && tokenInfo.aud !== clientId) {
        return Response.redirect(`${publicOrigin}/sign-in.html?error=oauth_audience_mismatch`, 302);
      }
      googleProfile = {
        id: tokenInfo.sub,
        email: tokenInfo.email,
        verified_email: tokenInfo.email_verified === 'true' || tokenInfo.email_verified === true,
        given_name: tokenInfo.given_name || '',
        family_name: tokenInfo.family_name || '',
        name: tokenInfo.name || '',
        picture: tokenInfo.picture || '',
      };
    } else {
      if (!clientSecret) {
        return Response.redirect(`${publicOrigin}/sign-in.html?error=env_configuration_error`, 302);
      }

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          code: String(code),
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text().catch(() => 'Unknown token error');
        console.error('[Google OAuth] Code exchange rejected:', tokenResponse.status, errText, 'redirectUri:', redirectUri);
        return Response.redirect(
          `${publicOrigin}/sign-in.html?error=token_exchange_failed`,
          302
        );
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      const idToken = tokenData.id_token;

      if (accessToken) {
        const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userResponse.ok) {
          const rawUser = await userResponse.json();
          googleProfile = {
            id: rawUser.sub || rawUser.id,
            email: rawUser.email,
            verified_email: rawUser.email_verified !== false && rawUser.verified_email !== false,
            given_name: rawUser.given_name || '',
            family_name: rawUser.family_name || '',
            name: rawUser.name || '',
            picture: rawUser.picture || '',
          };
        }
      }

      if (!googleProfile && idToken) {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
        );
        if (verifyRes.ok) {
          const tokenInfo = await verifyRes.json();
          googleProfile = {
            id: tokenInfo.sub,
            email: tokenInfo.email,
            verified_email: tokenInfo.email_verified === 'true' || tokenInfo.email_verified === true,
            given_name: tokenInfo.given_name || '',
            family_name: tokenInfo.family_name || '',
            name: tokenInfo.name || '',
            picture: tokenInfo.picture || '',
          };
        }
      }

      if (!googleProfile) {
        return Response.redirect(`${publicOrigin}/sign-in.html?error=user_info_failed`, 302);
      }
    }

    const normalizedEmail = String(googleProfile?.email || '').trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      return Response.redirect(`${publicOrigin}/sign-in.html?error=no_email`, 302);
    }

    let users = [];
    let sha = null;
    try {
      const loaded = await loadUsersSafe(env);
      users = loaded.users;
      sha = loaded.sha;
    } catch (readErr) {
      console.error('[Google OAuth] Warning reading users-seed.json:', readErr);
    }

    const nowIso = new Date().toISOString();
    let user = users.find((u) => String(u.email || '').trim().toLowerCase() === normalizedEmail);

    const derivedFullName =
      [String(googleProfile.given_name || '').trim(), String(googleProfile.family_name || '').trim()]
        .filter(Boolean)
        .join(' ') ||
      String(googleProfile.name || '').trim() ||
      normalizedEmail.split('@')[0];

    if (!user) {
      user = {
        id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        email: normalizedEmail,
        name: derivedFullName,
        username: derivedFullName,
        role: 'Customer',
        status: 'ACTIVE',
        picture: googleProfile.picture || null,
        first_name: googleProfile.given_name || null,
        last_name: googleProfile.family_name || null,
        phone: null,
        addresses: [],
        provider: 'google',
        googleSub: googleProfile.id || null,
        emailVerified: true,
        credits: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
        lastLoginAt: nowIso,
      };
      users.push(user);
    } else {
      if (!user.role) user.role = 'Customer';
      if (!user.status) user.status = 'ACTIVE';
      if (googleProfile.picture && !user.picture) user.picture = googleProfile.picture;
      if (googleProfile.given_name && !user.first_name) user.first_name = googleProfile.given_name;
      if (googleProfile.family_name && !user.last_name) user.last_name = googleProfile.family_name;
      if (!user.name) user.name = derivedFullName;
      if (!user.username) user.username = derivedFullName;
      if (googleProfile.id && !user.googleSub) user.googleSub = googleProfile.id;
      user.emailVerified = true;
      user.lastLoginAt = nowIso;
      user.updatedAt = nowIso;
    }

    if (users.length > 0) {
      try {
        await ghWrite(
          env,
          USERS_PATH,
          JSON.stringify(users, null, 2),
          `auth(google): login/provision ${normalizedEmail}`,
          sha || undefined
        );
      } catch (writeErr) {
        console.error('[Google OAuth] Warning: Failed to persist user update to GitHub:', writeErr.message);
      }
    }

    const accessJti = crypto.randomUUID();
    const refreshJti = crypto.randomUUID();
    const familyId = crypto.randomUUID();

    const accessToken = await signJwt(
      {
        sub: user.id,
        email: user.email,
        role: user.role || 'Customer',
        mfaVerified: true,
        jti: accessJti,
        type: 'access',
      },
      getJwtSecret(env, 'access'),
      ACCESS_TOKEN_MAX_AGE
    );

    const refreshToken = await signJwt(
      {
        sub: user.id,
        email: user.email,
        role: user.role || 'Customer',
        mfaVerified: true,
        jti: refreshJti,
        familyId,
        type: 'refresh',
      },
      getJwtSecret(env, 'refresh'),
      REFRESH_TOKEN_MAX_AGE
    );

    const legacyCookie = await createLegacySessionCookie(user.id, env);

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name || derivedFullName,
      fullName: user.name || derivedFullName,
      username: user.username || derivedFullName,
      role: user.role || 'Customer',
      first_name: user.first_name || null,
      last_name: user.last_name || null,
      phone: user.phone || null,
      picture: user.picture || null,
      credits: user.credits || 0,
      provider: user.provider || 'google',
      createdAt: user.createdAt || nowIso,
    };

    const targetPath = sanitizeRedirectTarget(rawState);
    const userJson = encodeURIComponent(JSON.stringify(safeUser));
    const redirectLocation = `${publicOrigin}/auth.html?redirect=${encodeURIComponent(targetPath)}#google-auth=${userJson}`;

    const headers = new Headers();
    headers.set('Location', redirectLocation);
    headers.append(
      'Set-Cookie',
      buildCookieHeader(SESSION_COOKIE_NAME, legacyCookie, LEGACY_SESSION_MAX_AGE, '/', 'Lax')
    );
    headers.append(
      'Set-Cookie',
      buildCookieHeader(ACCESS_COOKIE_NAME, accessToken, ACCESS_TOKEN_MAX_AGE, '/', 'Lax')
    );
    headers.append(
      'Set-Cookie',
      buildCookieHeader(REFRESH_COOKIE_NAME, refreshToken, REFRESH_TOKEN_MAX_AGE, '/', 'Lax')
    );

    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (err) {
    console.error('[Google OAuth] Unhandled exception in callback:', err);
    return Response.redirect(`${publicOrigin}/sign-in.html?error=internal_oauth_error`, 302);
  }
}