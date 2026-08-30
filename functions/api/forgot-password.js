// Cloudflare Pages Function: /api/forgot-password
// Actions:
//   POST { action:"request", email }                 → always 200 (no user enumeration); sends reset email if account exists
//   POST { action:"reset", token, password }         → verify token → set new password
// Reset tokens are stored in users-seed.json under each user's `_reset` field, or in a
// sidecar `_reset_tokens` map. We store a single-use, expiring token keyed by user id.

import { corsHeaders, hashPassword, ghRead, ghWrite } from '../_sync-lib.js';

const USERS_PATH = 'users-seed.json';
const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function getSecret(env, name, fallback) {
  return (env && env[name]) || fallback || '';
}

async function loadUsers(env) {
  try {
    const existing = await ghRead(env, USERS_PATH);
    if (existing && existing.content) {
      const raw = existing.content.replace(/\n/g, '');
      const d = JSON.parse(atob(raw));
      return { users: Array.isArray(d) ? d : (d.users || []), sha: existing.sha };
    }
  } catch (e) { console.error('loadUsers fail', e && e.message); }
  return { users: [], sha: null };
}

async function saveUsers(env, users, sha, msg) {
  await ghWrite(env, USERS_PATH, JSON.stringify(users, null, 2), msg, sha || undefined);
}

function cryptoToken() {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
}

async function sendResetEmail(env, toEmail, resetUrl) {
  const key = getSecret(env, 'RESEND_API_KEY');
  const from = getSecret(env, 'RESEND_FROM_EMAIL', 'Bargain Drop <onboarding@bargain-drop.online>');

  if (!key) {
    // No email provider configured yet — log for admin but do not fail the request.
    console.error('[forgot-password] RESEND_API_KEY not set; cannot send reset email to', toEmail, 'link:', resetUrl);
    return { sent: false, reason: 'no_email_provider' };
  }

  const subject = 'Reset your Bargain Drop password';
  const plainText = 'Reset your Bargain Drop password\n\n'
    + 'We received a request to reset your password. Click the link below to set a new one:\n\n'
    + resetUrl + '\n\n'
    + 'This link expires in 30 minutes. If you did not request this, you can safely ignore this email.\n';

  const html = '<div style="font-family:Arial,Helvetica,sans-serif;background:#f4f4f5;padding:24px">'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">'
    + '<tr><td style="padding:32px 36px">'
    + '<div style="font-size:22px;font-weight:bold;color:#111111;margin-bottom:8px">Reset your password</div>'
    + '<p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 24px">We received a request to reset your Bargain Drop password. Click the button below to set a new one.</p>'
    + '<table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" style="border-radius:8px;background:#111111">'
    + '<a href="' + resetUrl + '" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px">Reset password</a>'
    + '</td></tr></table>'
    + '<p style="font-size:13px;color:#6b7280;line-height:1.6;margin:24px 0 0;word-break:break-all">Or copy and paste this link into your browser:<br><a href="' + resetUrl + '" style="color:#2563eb">' + resetUrl + '</a></p>'
    + '<p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:24px 0 0">This link expires in 30 minutes. If you did not request this, you can safely ignore this email.</p>'
    + '</td></tr></table></div>';

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [toEmail],
      subject,
      text: plainText,
      html,
    }),
  });
  return { sent: r.ok, status: r.status };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });

  let body = {};
  try { body = await request.json(); } catch (e) {}
  const { action, email, token, password } = body;

  if (action === 'request') {
    if (!email) return json({ error: 'Email required' }, 400);
    const em = String(email).toLowerCase().trim();

    const { users, sha } = await loadUsers(env);
    const user = users.find(u => (u.email || '').toLowerCase() === em);

    // Always return success to avoid leaking account existence.
    if (!user) return json({ success: true });

    const resetToken = cryptoToken();
    user._reset = { token: resetToken, expires: Date.now() + RESET_TTL_MS };

    try {
      await saveUsers(env, users, sha, 'auth: reset request ' + em);
    } catch (e) {
      console.error('[forgot-password] save fail', e && e.message);
      return json({ error: 'Could not process request', detail: e && e.message }, 500);
    }

    const resetUrl = new URL(request.url).origin + '/reset-password.html?token=' + resetToken + '&email=' + encodeURIComponent(em);
    const sent = await sendResetEmail(env, em, resetUrl);

    return json({ success: true, sent: sent.sent, detail: sent });
  }

  if (action === 'reset') {
    if (!token || !password) return json({ error: 'token and password required' }, 400);
    if (String(password).length < 6) return json({ error: 'Password must be at least 6 characters' }, 400);

    const { users, sha } = await loadUsers(env);
    const user = users.find(u => u._reset && u._reset.token === token);
    if (!user) return json({ error: 'Invalid or expired reset link' }, 400);

    if (Date.now() > user._reset.expires) {
      return json({ error: 'Reset link has expired. Please request a new one.' }, 400);
    }

    user.password = await hashPassword(String(password));
    delete user._reset;

    try {
      await saveUsers(env, users, sha, 'auth: password reset ' + user.email);
    } catch (e) {
      console.error('[forgot-password] save reset fail', e && e.message);
      return json({ error: 'Could not update password', detail: e && e.message }, 500);
    }

    return json({ success: true });
  }

  return json({ error: 'Invalid action. Use request or reset.' }, 400);
}
