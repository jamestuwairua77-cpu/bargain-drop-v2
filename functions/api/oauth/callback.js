import { corsHeaders } from '../../_sync-lib.js';
export async function onRequest(context) {
  const { request } = context; const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  const code = url.searchParams.get('code'); const state = url.searchParams.get('state');
  const redirect = url.searchParams.get('redirect_uri') || '/auth.html';
  if (code) return Response.redirect(url.origin + redirect + '?code=' + encodeURIComponent(code) + '&state=' + encodeURIComponent(state || ''), 302);
  return Response.redirect(url.origin + '/sign-in.html?error=no_code', 302);
}
