import { corsHeaders } from '../../_sync-lib.js';

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

  // Safely grab configuration from system variables, using secure placeholders for validation bypassing
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const clientId = env.GOOGLE_CLIENT_ID || '489382559871-vp4q2enpqf5f8avj8hadjabatn27la7k.apps.googleusercontent.com';
  const redirectUri = url.origin + '/api/google-callback';

  if (!clientSecret) {
    console.error('Fatal: GOOGLE_CLIENT_SECRET environment variable is missing on Cloudflare Pages');
    return Response.redirect(url.origin + '/sign-in.html?error=env_configuration_error', 302);
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('Token exchange failed:', errText);
      return Response.redirect(url.origin + '/sign-in.html?error=token_exchange_failed', 302);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!userResponse.ok) {
      return Response.redirect(url.origin + '/sign-in.html?error=user_info_failed', 302);
    }

    const userData = await userResponse.json();
    const email = userData.email;
    const name = userData.name || email.split('@')[0];

    // Log the user in or register them under our internal auth session
    const authPayload = {
      action: 'google-oauth',
      email: email,
      name: name,
      googleId: userData.id
    };

    // Forward the authenticated Google identity to our main API session provider to issue cookies/tokens
    const authResponse = await fetch(url.origin + '/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(authPayload)
    });

    if (!authResponse.ok) {
      return Response.redirect(url.origin + '/sign-in.html?error=session_creation_failed', 302);
    }

    // Capture response cookies to propagate the session cookie correctly to the browser
    const authHeaders = new Headers();
    const cookieHeader = authResponse.headers.get('set-cookie');
    if (cookieHeader) {
      authHeaders.set('set-cookie', cookieHeader);
    }
    
    // Redirect cleanly to the profile page with cookie established
    const state = url.searchParams.get('state');
    const targetRedirect = (state && state.startsWith('/') && !state.includes('//')) ? state : '/profile.html';
    
    authHeaders.set('Location', url.origin + targetRedirect);
    return new Response(null, {
      status: 302,
      headers: authHeaders
    });

  } catch (err) {
    console.error('OAuth processing error:', err);
    return Response.redirect(url.origin + '/sign-in.html?error=internal_oauth_error', 302);
  }
}