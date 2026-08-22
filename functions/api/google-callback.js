import { corsHeaders } from '../_sync-lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

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

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': 'Bearer ' + accessToken },
    });

    if (!userResponse.ok) {
      return Response.redirect(url.origin + '/sign-in.html?error=user_info_failed', 302);
    }

    const userData = await userResponse.json();
    const user = {
      email: userData.email || '',
      name: userData.name || (userData.email ? userData.email.split('@')[0] : ''),
      picture: userData.picture || '',
    };

    const userJson = encodeURIComponent(JSON.stringify(user));
    return Response.redirect(url.origin + '/auth.html#google-auth=' + userJson, 302);
  } catch (err) {
    console.error('OAuth error:', err);
    return Response.redirect(url.origin + '/sign-in.html?error=internal_oauth_error', 302);
  }
}
