// Cloudflare Pages Function: /api/google-callback
// Exchanges the Google OAuth authorization code for a token and redirects
// back to /auth.html#google-auth=<user JSON>.
import { corsHeaders } from '../_sync-lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  const code = url.searchParams.get('code');
  const home = url.origin;

  if (!code) {
    return Response.redirect(home + '/auth.html?error=no_code', 302);
  }

  const clientId = env.GOOGLE_CLIENT_ID || '';
  const clientSecret = env.GOOGLE_CLIENT_SECRET || '';
  const redirectUri = 'https://bargain-drop.online/api/google-callback';

  if (!clientId || !clientSecret) {
    return Response.redirect(home + '/auth.html?error=google_not_configured', 302);
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
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
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.id_token) {
      return Response.redirect(home + '/auth.html?error=token_exchange_failed', 302);
    }

    const idToken = tokenData.id_token;
    const payloadB64 = idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = payloadB64.length % 4 ? '='.repeat(4 - (payloadB64.length % 4)) : '';
    const claims = JSON.parse(decodeURIComponent(escape(atob(payloadB64 + pad))));

    const user = {
      email: claims.email || '',
      name: claims.name || ((claims.given_name ? claims.given_name + ' ' : '') + (claims.family_name || '')).trim() || '',
      picture: claims.picture || '',
    };

    const userJson = encodeURIComponent(JSON.stringify(user));
    return Response.redirect(home + '/auth.html#google-auth=' + userJson, 302);
  } catch (e) {
    return Response.redirect(home + '/auth.html?error=google_callback_error', 302);
  }
}
