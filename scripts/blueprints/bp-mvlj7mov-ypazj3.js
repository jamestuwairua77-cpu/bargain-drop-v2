// ============================================================================
// BARGAIN DROP — SECURE PASSWORD RECOVERY PIPELINE (/api/forgot-password)
// - 32-byte cryptographically secure token (256-bit entropy)
// - Stored as a SHA-256 hash (`tokenHash`) in `users-seed.json`
// - 1-hour expiration window (3,600,000 ms)
// - Real email delivery via Resend API (`RESEND_API_KEY`) + SMTP Relay fallback
// - Auto-provisions account record if email is not yet in `users-seed.json`
//   so every valid email address receives the reset email and can set a password
// ============================================================================

import { corsHeaders, hashPassword, ghRead, ghWrite } from '../_sync-lib.js';

const USERS_PATH = 'users-seed.json';
const RESET_TTL_MS = 60 * 60 * 1000; // 1-Hour Expiration (3,600,000 ms)

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function getSecret(env, name, fallback = '') {
  return (env && env[name]) || fallback;
}

async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(String(input || ''));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqualHex(a, b) {
  const strA = String(a || '');
  const strB = String(b || '');
  if (strA.length !== strB.length || strA.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < strA.length; i++) {
    diff |= strA.charCodeAt(i) ^ strB.charCodeAt(i);
  }
  return diff === 0;
}

function generateSecureRandomTokenHex() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function validatePasswordStrength(password) {
  const pwd = String(password || '');
  const errors = [];
  if (pwd.length < 6 || pwd.length > 128) {
    errors.push('Password must be between 6 and 128 characters.');
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

async function loadUsersSafe(env) {
  const existing = await ghRead(env, USERS_PATH);
  if (!existing || !existing.content) {
    return { users: [], sha: existing ? existing.sha : null };
  }
  const cleanB64 = String(existing.content).replace(/\s+/g, '');
  const decoded = atob(cleanB64);
  const parsed = JSON.parse(decoded);
  const users = Array.isArray(parsed) ? parsed : Array.isArray(parsed.users) ? parsed.users : [];
  return { users, sha: existing.sha || null };
}

async function saveUsersSafe(env, users, sha, commitMessage) {
  await ghWrite(env, USERS_PATH, JSON.stringify(users, null, 2), commitMessage, sha || undefined);
}

function resolvePublicOrigin(request) {
  const reqUrl = new URL(request.url);
  const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || reqUrl.host)
    .split(',')[0]
    .trim();
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.includes('.run.app')) {
    const proto = (request.headers.get('x-forwarded-proto') || reqUrl.protocol.replace(':', '') || 'https')
      .split(',')[0]
      .trim();
    return `${proto}://${host}`;
  }
  return 'https://bargain-drop.online';
}

function buildResetEmailHtml(resetUrl, expiresAtIso, email) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Reset Your Bargain Drop Password</title></head>
<body style="margin:0;padding:28px 16px;background-color:#121515;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;margin:0 auto;background-color:#08090a;border:1px solid #222425;border-radius:8px;overflow:hidden;box-shadow:0 14px 32px rgba(0,0,0,0.65);">
    <tr>
      <td style="padding:20px 24px;border-bottom:1px solid #222425;background-color:#060708;">
        <span style="font-size:18px;font-weight:900;letter-spacing:-0.4px;text-transform:uppercase;">
          <span style="color:#DC2626;">BARGAIN</span> <span style="color:#ffffff;">DROP</span>
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 24px;">
        <div style="font-size:20px;font-weight:800;color:#ffffff;margin-bottom:12px;">Password Reset Request</div>
        <p style="font-size:14px;color:#dedede;line-height:1.6;margin:0 0 22px;">
          We received a request to reset the password for your Bargain Drop account (<strong>${email}</strong>). Click the button below to choose a new password:
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:22px;">
          <tr>
            <td align="center" style="border-radius:6px;background:linear-gradient(180deg,#DC2626 0%,#b91c1c 100%);border:1px solid #DC2626;">
              <a href="${resetUrl}" style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:6px;">
                Reset My Password
              </a>
            </td>
          </tr>
        </table>
        <p style="font-size:12px;color:#818181;line-height:1.6;margin:0 0 14px;word-break:break-all;">
          Or copy and paste this direct link into your browser:<br>
          <a href="${resetUrl}" style="color:#FACC15;text-decoration:underline;">${resetUrl}</a>
        </p>
        <div style="padding:12px;background-color:#121515;border:1px solid #202223;border-radius:6px;font-size:12px;color:#dedede;">
          <strong>Security Notice:</strong> This link is valid for <strong>1 hour</strong> (until ${expiresAtIso}) and can only be used once. If you did not request a password reset, you can safely ignore this message.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function dispatchPasswordResetEmail(env, toEmail, resetUrl, expiresAtIso) {
  const subject = 'Reset your Bargain Drop password (Valid for 1 Hour)';
  const plainText = [
    'Reset your Bargain Drop password',
    '',
    `We received a request to reset the password for ${toEmail}.`,
    'Open the link below within 1 hour to set a new password:',
    resetUrl,
    '',
    `Expires at: ${expiresAtIso}`,
    'If you did not request this, you can safely ignore this email.',
  ].join('\n');
  const html = buildResetEmailHtml(resetUrl, expiresAtIso, toEmail);

  const fromAddress =
    getSecret(env, 'RESEND_FROM_EMAIL', '') ||
    getSecret(env, 'EMAIL_FROM_ADDRESS', '') ||
    'Bargain Drop <no-reply@bargain-drop.online>';

  const transportErrors = [];

  // Transport 1: Resend API (Primary verified HTTPS transactional mailer on Cloudflare Pages)
  const resendKey = getSecret(env, 'RESEND_API_KEY', '');
  if (resendKey) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [toEmail],
          reply_to: 'support@bargain-drop.online',
          subject,
          text: plainText,
          html,
        }),
      });
      const out = await resendRes.json().catch(() => ({}));
      if (resendRes.ok) {
        return {
          sent: true,
          provider: 'resend_api',
          emailId: out.id || null,
          status: resendRes.status,
        };
      }
      transportErrors.push(`Resend HTTP ${resendRes.status}: ${JSON.stringify(out).slice(0, 160)}`);
    } catch (resendErr) {
      transportErrors.push(`Resend Transport Error: ${resendErr.message}`);
    }
  }

  // Transport 2: Custom SMTP Mail Relay Endpoint (Fallback)
  const mailRelayUrl = getSecret(env, 'MAIL_RELAY_URL', '');
  const mailRelaySecret = getSecret(env, 'MAIL_RELAY_SECRET', '');
  if (mailRelayUrl) {
    try {
      const relayRes = await fetch(mailRelayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Pin': getSecret(env, 'ADMIN_PIN', '03091996'),
          ...(mailRelaySecret ? { Authorization: `Bearer ${mailRelaySecret}` } : {}),
        },
        body: JSON.stringify({
          from: fromAddress,
          to: toEmail,
          subject,
          text: plainText,
          html,
        }),
      });
      if (relayRes.ok) {
        return { sent: true, provider: 'havitomail_smtp_relay', status: relayRes.status };
      }
      const errBody = await relayRes.text().catch(() => '');
      transportErrors.push(`SMTP Relay HTTP ${relayRes.status}: ${errBody.slice(0, 160)}`);
    } catch (smtpErr) {
      transportErrors.push(`SMTP Handshake Error: ${smtpErr.message}`);
    }
  }

  return {
    sent: false,
    provider: 'fallback_outbox',
    errors: transportErrors,
  };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON request body' }, 400);
  }

  const action = String(body.action || 'request').trim().toLowerCase();
  const rawEmail = String(body.email || '').trim().toLowerCase();
  const rawToken = String(body.token || '').trim();
  const newPassword = String(body.password || body.newPassword || '');

  // --------------------------------------------------------------------------
  // ACTION 1: REQUEST PASSWORD RESET LINK (1-Hour Expiry, Hashed Token in DB)
  // --------------------------------------------------------------------------
  if (action === 'request') {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!rawEmail || !emailRegex.test(rawEmail)) {
      return json({ error: 'Please enter a valid email address.' }, 400);
    }

    let users = [];
    let sha = null;
    try {
      const loaded = await loadUsersSafe(env);
      users = loaded.users;
      sha = loaded.sha;
    } catch (readErr) {
      console.error('[forgot-password] Failed to read user store:', readErr);
      return json({ error: 'Authentication storage temporarily unavailable. Please try again.' }, 503);
    }

    let user = users.find((u) => String(u.email || '').trim().toLowerCase() === rawEmail);

    // If the user is not in users-seed.json yet, provision their account record
    // so the recovery email is genuinely sent and they can set their password.
    if (!user) {
      const defaultName = rawEmail.split('@')[0];
      user = {
        id: 'u-' + Date.now(),
        email: rawEmail,
        name: defaultName,
        username: defaultName,
        provider: 'email',
        credits: 0,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
    }

    const plainResetToken = generateSecureRandomTokenHex();
    const tokenHash = await sha256Hex(plainResetToken);
    const nowMs = Date.now();
    const expiresAtMs = nowMs + RESET_TTL_MS;
    const expiresAtIso = new Date(expiresAtMs).toISOString();

    user._reset = {
      tokenHash,
      createdAt: new Date(nowMs).toISOString(),
      expires: expiresAtMs,
      expiresAt: expiresAtIso,
      ttlSeconds: 3600,
      used: false,
    };

    try {
      await saveUsersSafe(env, users, sha, `auth(reset-request): 1h token issued for ${rawEmail}`);
    } catch (saveErr) {
      console.error('[forgot-password] Failed to persist hashed reset token:', saveErr);
      return json({ error: 'Could not save password reset request. Please try again.' }, 500);
    }

    const origin = resolvePublicOrigin(request);
    const resetUrl = `${origin}/reset-password.html?token=${encodeURIComponent(plainResetToken)}&email=${encodeURIComponent(rawEmail)}`;
    const dispatchResult = await dispatchPasswordResetEmail(env, rawEmail, resetUrl, expiresAtIso);

    if (!dispatchResult.sent) {
      return json(
        {
          success: false,
          ok: false,
          error: 'Could not dispatch reset email right now. Please try again shortly.',
          diagnostics: dispatchResult.errors,
        },
        502
      );
    }

    return json({
      success: true,
      ok: true,
      sent: true,
      provider: dispatchResult.provider,
      emailId: dispatchResult.emailId || null,
      expiresAt: expiresAtIso,
      expiresInSeconds: 3600,
      message: `A 1-hour password reset link has been sent to ${rawEmail}.`,
    });
  }

  // --------------------------------------------------------------------------
  // ACTION 2: PRE-VERIFY TOKEN VALIDITY (Used by /reset-password.html on load)
  // --------------------------------------------------------------------------
  if (action === 'verify') {
    if (!rawToken || !/^[a-f0-9]{64}$/i.test(rawToken)) {
      return json({ valid: false, error: 'Malformed or missing password reset token.' }, 400);
    }

    try {
      const { users } = await loadUsersSafe(env);
      const candidateHash = await sha256Hex(rawToken);
      const user = users.find((u) => {
        if (!u._reset || u._reset.used) return false;
        if (u._reset.tokenHash) return timingSafeEqualHex(u._reset.tokenHash, candidateHash);
        if (u._reset.token) return timingSafeEqualHex(u._reset.token, rawToken);
        return false;
      });

      if (!user || !user._reset) {
        return json({ valid: false, error: 'This password reset link is invalid or has already been used.' }, 400);
      }

      const expMs = Number(user._reset.expires) || new Date(user._reset.expiresAt || 0).getTime();
      if (!expMs || Date.now() > expMs) {
        return json({ valid: false, error: 'This password reset link has expired (1-hour limit).' }, 400);
      }

      return json({
        valid: true,
        email: user.email,
        expiresAt: new Date(expMs).toISOString(),
        remainingSeconds: Math.max(0, Math.floor((expMs - Date.now()) / 1000)),
      });
    } catch (err) {
      return json({ valid: false, error: 'Unable to verify reset token at this time.' }, 500);
    }
  }

  // --------------------------------------------------------------------------
  // ACTION 3: CONSUME TOKEN & UPDATE HASHED PASSWORD
  // --------------------------------------------------------------------------
  if (action === 'reset') {
    if (!rawToken || !newPassword) {
      return json({ error: 'Reset token and new password are required.' }, 400);
    }

    if (!/^[a-f0-9]{64}$/i.test(rawToken)) {
      return json({ error: 'Invalid reset token format.' }, 400);
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return json({
        error: strength.errors[0],
        errors: strength.errors,
      }, 400);
    }

    let users = [];
    let sha = null;
    try {
      const loaded = await loadUsersSafe(env);
      users = loaded.users;
      sha = loaded.sha;
    } catch (readErr) {
      return json({ error: 'Database read failed. Please try again.' }, 503);
    }

    const candidateHash = await sha256Hex(rawToken);
    const user = users.find((u) => {
      if (!u._reset || u._reset.used) return false;
      if (u._reset.tokenHash) return timingSafeEqualHex(u._reset.tokenHash, candidateHash);
      if (u._reset.token) return timingSafeEqualHex(u._reset.token, rawToken);
      return false;
    });

    if (!user || !user._reset) {
      return json({
        error: 'Invalid or already-used password reset link. Please request a new one.',
      }, 400);
    }

    const expMs = Number(user._reset.expires) || new Date(user._reset.expiresAt || 0).getTime();
    if (!expMs || Date.now() > expMs) {
      delete user._reset;
      try {
        await saveUsersSafe(env, users, sha, `auth(reset-expired): purged expired token for ${user.email}`);
      } catch {}
      return json({
        error: 'This password reset link has expired (1-hour limit). Please request a new link.',
      }, 400);
    }

    user.password = await hashPassword(newPassword);
    user.passwordUpdatedAt = new Date().toISOString();
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    delete user._reset;

    try {
      await saveUsersSafe(env, users, sha, `auth(password-reset): completed for ${user.email}`);
    } catch (saveErr) {
      console.error('[forgot-password] Failed to save updated password:', saveErr);
      return json({ error: 'Could not save your new password. Please try again.' }, 500);
    }

    return json({
      success: true,
      ok: true,
      email: user.email,
      message: 'Your password has been securely updated and the recovery token has been invalidated.',
    });
  }

  return json({ error: 'Invalid action. Supported actions: request, verify, reset.' }, 400);
}