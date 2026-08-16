// Cloudflare Pages Function: /api/cj-webhook
//
// CJ Dropshipping real-time webhook receiver (product / stock / order / logistics).
//
// Security model (per CJ Webhook Mechanism docs):
//   - CJ POSTs the raw JSON body with a `sign` HTTP header.
//   - sign = Base64( HMAC-SHA256( secret = your openId string, message = raw JSON request body ) )
//   - The same `openId` is returned by the Get Access Token API and stored here as
//     the `CJ_OPEN_ID` secret. It is BOTH your account id AND the signing secret.
//   - NEVER log / persist the openId or the raw sign header. Leaking it lets an
//     attacker forge valid pushes. We only log a masked digest of the signature.
//
// Request lifecycle:
//   1. Read the RAW body bytes (do NOT parse/re-serialize — that breaks the HMAC).
//   2. Verify HMAC-SHA256 against `sign`. Mismatch → 401 (before any work).
//   3. Structurally parse JSON. On success → immediately return empty 200 OK to CJ
//      (CJ retries up to 3× if we don't ack within ~3s, and auto-closes the channel
//      on repeated failures). Long-running processing happens AFTER the ack via
//      event.waitUntil so it never blocks the response.
//   4. Any unexpected error is caught so the connection never hangs.

import { corsHeaders, appendSyncLog } from '../_sync-lib.js';
import { handleCjWebhook } from '../_cj-import.js';

const VALID_TYPES = new Set(['PRODUCT', 'VARIANT', 'STOCK', 'ORDER', 'LOGISTIC', 'LOGISTICS', 'MAKEUP', 'PRIVATE_ORDER', 'ORDERSPLIT', 'SOURCINGCREATE']);

/**
 * Base64( HMAC-SHA256( rawBody, openId ) ) — matches CJ's signing scheme exactly.
 * Signs the RAW bytes (not re-serialized JSON) so field order is preserved.
 * Returns null if the secret is missing, so callers can distinguish "unconfigured"
 * (should reject) from "mismatch".
 */
async function cjSignature(raw, secret) {
  if (!secret) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, raw);
  const bytes = new Uint8Array(sig);
  // Standard padded Base64, byte-by-byte (avoids stack overflow on large bodies).
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

// Constant-time string comparison to avoid timing attacks on the signature.
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/**
 * CJ `messageId` is a Snowflake-style decimal string that can exceed
 * Number.MAX_SAFE_INTEGER. Convert to a lossless mask for logging.
 */
function maskMessageId(id) {
  const s = String(id ?? '');
  if (!s) return 'n/a';
  const hex = crypto.subtle ? null : null; // not used; kept out
  // Naive but lossless digest-less mask: first 2 + '…' + last 2 chars.
  if (s.length <= 6) return s + '*';
  return s.slice(0, 2) + ('*').repeat(Math.min(8, s.length - 4)) + s.slice(-2);
}

export async function onRequest(context) {
  const { request, env } = context;
  const headers = { 'Content-Type': 'application/json', ...corsHeaders() };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), { status: 405, headers });
  }

  const raw = new Uint8Array(await request.arrayBuffer());
  const sign = request.headers.get('sign') || '';

  const secret = env.CJ_OPEN_ID || '';
  if (!secret) {
    return new Response(JSON.stringify({ ok: false, error: 'CJ_OPEN_ID not configured' }), { status: 500, headers });
  }
  if (!sign) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing sign header' }), { status: 401, headers });
  }

  let payload;
  try {
    // ── 3. SECURITY: verify HMAC-SHA256 BEFORE touching the payload ──
    const expected = await cjSignature(raw, secret);
    if (expected === null || !timingSafeEqual(expected, sign)) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid signature' }), { status: 401, headers });
    }

    // ── 1. structural parse (raw bytes preserved above for HMAC) ──
    payload = JSON.parse(new TextDecoder().decode(raw));
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'Bad request: ' + e.message }), { status: 400, headers });
  }

  // ── 2. IMMEDIATE empty 200 OK — ack CJ before any long-running work ──
  const response = new Response(null, { status: 200, headers: corsHeaders() });

  // ── 4. do real processing AFTER the ack, never blocking the response ──
  context.waitUntil((async () => {
    try {
      const type = String(payload.type || '').toUpperCase();
      const messageType = String(payload.messageType || '').toUpperCase();

      // Masked param keys for diagnosis (keys only, never values / openId).
      const paramKeys = payload.params && typeof payload.params === 'object'
        ? Object.keys(payload.params).slice(0, 20)
        : null;
      // Top-level keys of the whole payload (for shape diagnosis on STOCK etc).
      const topKeys = payload && typeof payload === 'object' ? Object.keys(payload).slice(0, 20) : null;

      // Import the push into the catalog (PRODUCT/VARIANT/STOCK → all-products.json
      // + Shopify; ORDER/LOGISTIC → ledger/tracking; others log-only). Idempotent on messageId.
      const result = await handleCjWebhook(env, payload).catch((e) => ({ imported: false, error: String(e && e.message) }));

      await appendSyncLog(env, {
        action: 'cj-webhook',
        type,
        messageType,
        messageId: maskMessageId(payload.messageId),
        valid: VALID_TYPES.has(type),
        paramKeys,
        topKeys,
        ...result,
        receivedAt: new Date().toISOString(),
      });
    } catch (e) {
      // best-effort; never throw into the ack path
      await appendSyncLog(env, { action: 'cj-webhook-error', error: String(e && e.message) }).catch(() => {});
    }
  })());

  return response;
}
