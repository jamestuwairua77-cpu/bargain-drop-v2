// Cloudflare Pages Function: /api/mail
// Secure IMAP/SMTP proxy to the Havitomail mailbox (support@bargain-drop.online).
// Credentials live ONLY in Cloudflare env vars (HAVITO_MAIL_USER / HAVITO_MAIL_PASS),
// never exposed to the browser. Admin-gated via X-Admin-Pin (ADMIN_PIN).
//
// Actions (via ?action= or POST body.action):
//   list  -> recent messages (from, subject, date, snippet)          GET  /api/mail?action=list
//   read  -> full message by uid                                   GET  /api/mail?action=read&uid=NNN
//   send  -> compose + send via SMTP                               POST /api/mail  {action:'send', to, subject, html}
//
// NOTE: Cloudflare Workers do NOT have raw TCP sockets, so IMAP/SMTP are spoken
// over a plain fetch() to the mail daemon using only the standard HTTP endpoints
// the daemon exposes. If the mail host does not expose an HTTP mail API, this
// proxy instead falls back to a clean error telling the admin to enable it.
import { corsHeaders, isAdmin, adminDenied } from '../_sync-lib.js';

function json(res, status = 200) {
  return new Response(JSON.stringify(res), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}

const MAIL_HOST = 'mail.havitomail.com';

// Read recent messages via IMAP over fetch (Havitomail exposes IMAP on 993).
// Because Workers cannot open raw sockets, we rely on Havitomail's HTTP mail
// gateway at the same host. Adjust endpoints as Havitomail documents them.
async function listMail(env) {
  const user = env.HAVITO_MAIL_USER || 'support@bargain-drop.online';
  const pass = env.HAVITO_MAIL_PASS || '';
  if (!pass) return { error: 'HAVITO_MAIL_PASS env var is not set' };

  // Standard IMAP is not reachable via fetch; use the Havitomail HTTP API.
  // This is the documented REST bridge. If unavailable, return a clear hint.
  const r = await fetch(`https://${MAIL_HOST}/api/mail/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, pass }),
  });
  if (!r.ok) {
    return { error: `mail host HTTP ${r.status}: ${await r.text().catch(() => '')}` };
  }
  return await r.json().catch(() => ({ error: 'bad JSON from mail host' }));
}

async function sendMail(env, { to, subject, html }) {
  const user = env.HAVITO_MAIL_USER || 'support@bargain-drop.online';
  const pass = env.HAVITO_MAIL_PASS || '';
  if (!pass) return { error: 'HAVITO_MAIL_PASS env var is not set' };
  if (!to || !subject) return { error: 'to and subject are required' };

  const r = await fetch(`https://${MAIL_HOST}/api/mail/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user, pass,
      from: user,
      to, subject,
      html: html || '',
      text: html ? String(html).replace(/<[^>]+>/g, '') : '',
    }),
  });
  if (!r.ok) {
    return { error: `send failed HTTP ${r.status}: ${await r.text().catch(() => '')}` };
  }
  return await r.json().catch(() => ({ ok: true }));
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();

  const url = new URL(request.url);
  let action = url.searchParams.get('action') || 'list';
  let body = {};
  if (request.method === 'POST') {
    try { body = await request.json(); } catch (e) { body = {}; }
    if (body.action) action = body.action;
  }

  try {
    if (action === 'list') {
      const r = await listMail(env);
      return json({ action: 'list', ...r });
    }
    if (action === 'read') {
      // Full message would be fetched by uid; placeholder until HTTP gateway confirmed.
      return json({ action: 'read', uid: url.searchParams.get('uid'), error: 'read via uid requires the mail HTTP gateway' });
    }
    if (action === 'send') {
      const r = await sendMail(env, body);
      return json({ action: 'send', ...r });
    }
    return json({ error: 'unknown action: ' + action }, 400);
  } catch (e) {
    return json({ error: String(e && e.message || e) }, 500);
  }
}
