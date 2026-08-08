import { corsHeaders, ghRead, ghWrite } from '../_sync-lib.js';
const USERS_PATH = 'users-seed.json';
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  const code = url.searchParams.get('code');
  if (!code) return new Response(JSON.stringify({ error: 'Authorization code required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  try {
    const CLIENT_ID = env.SHOPIFY_CLIENT_ID || '9ab0d272cfd0e8d378145a7eee7634ee';
    const CLIENT_SECRET = env.SHOPIFY_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET || '';
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: url.origin + '/auth.html', grant_type: 'authorization_code' }).toString() });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Token exchange failed');
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { 'Authorization': 'Bearer ' + tokenData.access_token } });
    const userInfo = await userRes.json();
    let users = [];
    try { const existing = await ghRead(env, USERS_PATH); if (existing && existing.content) users = JSON.parse(atob(existing.content)); } catch {}
    let user = users.find(u => u.email === userInfo.email);
    if (!user) {
      user = { id: 'g-' + userInfo.sub, email: userInfo.email, name: userInfo.name || userInfo.email.split('@')[0], provider: 'google', picture: userInfo.picture, createdAt: new Date().toISOString() };
      users.push(user);
      const existing = await ghRead(env, USERS_PATH);
      await ghWrite(env, USERS_PATH, JSON.stringify(users, null, 2), 'auth: google signup', existing?.sha);
    }
    const token = btoa(JSON.stringify({ userId: user.id, email: user.email }));
    return Response.redirect(url.origin + '/auth.html?token=' + encodeURIComponent(token), 302);
  } catch (e) { return Response.redirect(url.origin + '/sign-in.html?error=' + encodeURIComponent(e.message), 302); }
}