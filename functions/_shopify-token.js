// Shopify access-token manager with AUTO-REFRESH via client-credentials grant.
//
// The ephemeral client-credentials token expires in 24h. This module transparently
// re-exchanges the OAuth client_id/secret for a fresh token whenever needed, so the
// webhook + workers never hard-fail on an expired token.
//
// Precedence:
//   1. Cached client-credentials token (still valid) — reused to save subrequests.
//   2. env.SHOPIFY_ACCESS_TOKEN — static override, used ONLY when client creds are absent.
//   3. client_credentials exchange (env creds, or client_id fallback + env secret).

const SHOPIFY_DOMAIN = 'bargain-drop-8194.myshopify.com';
const OAUTH_URL = `https://${SHOPIFY_DOMAIN}/admin/oauth/access_token`;

// client_id is not secret (public identifier in OAuth). Fallback so refresh works
// even when SHOPIFY_OAUTH_CLIENT_ID / SHOPIFY_CLIENT_ID env var is unset.
const FALLBACK_CLIENT_ID = '9ab0d272cfd0e8d378145a7eee7634ee';

// In-memory cache (per isolate). Cloudflare isolates are short-lived, so a 20h cache
// is safe and still re-exchanges before the 24h token expires.
let _cached = { token: null, exp: 0 };

function clientId(env) {
  return env.SHOPIFY_OAUTH_CLIENT_ID || env.SHOPIFY_CLIENT_ID || FALLBACK_CLIENT_ID;
}
function clientSecret(env) {
  return env.SHOPIFY_OAUTH_CLIENT_SECRET || env.SHOPIFY_CLIENT_SECRET || '';
}

async function exchangeClientCredentials(env) {
  const cid = clientId(env);
  const csec = clientSecret(env);
  if (!cid || !csec) throw new Error('Shopify client_id/secret not configured');
  const r = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: cid, client_secret: csec, grant_type: 'client_credentials' }),
  });
  const j = await r.json();
  const tok = j && j.access_token;
  if (!tok) throw new Error('Shopify token exchange failed: ' + (j && (j.error || j.error_description || JSON.stringify(j))));
  const expiresIn = Number(j.expires_in) || 86399;
  _cached = { token: tok, exp: Date.now() + (expiresIn - 600) * 1000 }; // refresh 10 min early
  return tok;
}

/**
 * Return a valid Shopify access token.
 * @param {object} env Cloudflare env
 * @param {boolean} force If true, re-exchange even if a cached token is still valid.
 */
export async function getShopifyToken(env, force = false) {
  // 1. Cached client-credentials token wins when still valid.
  if (!force && _cached.token && Date.now() < _cached.exp) return _cached.token;

  const cid = clientId(env);
  const csec = clientSecret(env);

  // 2. Prefer client_credentials exchange (self-heals forever). Static token is a
  //    fallback only, because it tends to go stale and has no built-in refresh.
  if (cid && csec) return exchangeClientCredentials(env);

  const staticToken = env.SHOPIFY_ACCESS_TOKEN || env.SHOPIFY_TOKEN || '';
  if (staticToken) return staticToken;

  throw new Error('Shopify token not configured (set SHOPIFY_ACCESS_TOKEN or SHOPIFY_CLIENT_ID+SECRET)');
}

/**
 * Invalidate the cached token (call after a 401 so the next call re-exchanges).
 */
export function invalidateShopifyToken() {
  _cached = { token: null, exp: 0 };
}
