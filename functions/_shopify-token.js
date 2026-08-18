// Shopify access-token manager with AUTO-REFRESH via client-credentials grant.
//
// The ephemeral client-credentials token expires in 24h. This module transparently
// re-exchanges the OAuth client_id/secret for a fresh token whenever needed, so the
// webhook + hourly worker never hard-fail on an expired token.
//
// Precedence:
//   1. env.SHOPIFY_ACCESS_TOKEN — if set, treated as a manual/static override (used as-is).
//      To get auto-refresh behaviour, ALSO set SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET,
//      in which case a cached access token is preferred and re-exchanged on 401.
//   2. Otherwise exchange client credentials on demand.

const SHOPIFY_DOMAIN = 'bargain-drop-8194.myshopify.com';
const OAUTH_URL = `https://${SHOPIFY_DOMAIN}/admin/oauth/access_token`;

// In-memory cache (per isolate). Cloudflare isolates are short-lived, so a 20h cache
// is safe and still re-exchanges before the 24h token expires.
let _cached = { token: null, exp: 0 };

async function exchangeClientCredentials(env) {
  const clientId = env.SHOPIFY_CLIENT_ID || '';
  const clientSecret = env.SHOPIFY_CLIENT_SECRET || '';
  if (!clientId || !clientSecret) throw new Error('SHOPIFY_CLIENT_ID/SECRET not configured');
  const r = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' }),
  });
  const j = await r.json();
  const tok = j && j.access_token;
  if (!tok) throw new Error('Shopify token exchange failed: ' + (j && (j.error || j.error_description || JSON.stringify(j))));
  const expiresIn = Number(j.expires_in) || 86399;
  _cached = { token: tok, exp: Date.now() + (expiresIn - 600) * 1000 }; // refresh 10 min early
  return tok;
}

/**
 * Return a valid Shopify access token, re-exchanging when needed.
 * @param {object} env Cloudflare env (bindings/secrets/vars)
 * @param {boolean} force If true, always re-exchange (e.g. after a 401).
 */
export async function getShopifyToken(env, force = false) {
  const clientId = env.SHOPIFY_CLIENT_ID || '';
  const clientSecret = env.SHOPIFY_CLIENT_SECRET || '';
  const staticToken = env.SHOPIFY_ACCESS_TOKEN || env.SHOPIFY_TOKEN || '';

  // Auto-refresh only possible when client credentials are present.
  if (clientId && clientSecret) {
    if (!force && _cached.token && Date.now() < _cached.exp) return _cached.token;
    const tok = await exchangeClientCredentials(env);
    return tok;
  }

  // Fallback: static token (no auto-refresh).
  if (staticToken) return staticToken;
  throw new Error('Shopify token not configured (set SHOPIFY_ACCESS_TOKEN or SHOPIFY_CLIENT_ID+SECRET)');
}

/**
 * Invalidate the cached token (call after a 401 so the next call re-exchanges).
 */
export function invalidateShopifyToken() {
  _cached = { token: null, exp: 0 };
}
