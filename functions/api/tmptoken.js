import { corsHeaders, isAdmin, adminDenied } from '../_sync-lib.js';
import { getShopifyToken } from '../_shopify-token.js';
// TEMPORARY admin endpoint: returns current valid Shopify token + oauth creds for
// rotating the GitHub Actions secret. REMOVE after use.
let _t = null;
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();
  const tok = await getShopifyToken(env, true);
  return new Response(JSON.stringify({
    token: tok,
    oauth_client_id: env.SHOPIFY_OAUTH_CLIENT_ID || env.SHOPIFY_CLIENT_ID || '',
    oauth_client_secret: env.SHOPIFY_OAUTH_CLIENT_SECRET || env.SHOPIFY_CLIENT_SECRET || '',
  }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}
