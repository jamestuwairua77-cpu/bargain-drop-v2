// Shared helpers for CJ↔Shopify sync — Cloudflare Workers edition.
// All Node.js built-ins (fs, crypto, Buffer) replaced with Web APIs.

// ─── Environment ─────────────────────────────────────────────────────────
// In Cloudflare Pages Functions, env vars are accessed via context.env
// This module receives env when called from the handler.

import { getShopifyToken, invalidateShopifyToken } from './_shopify-token.js';

export function getEnv(env) {
  return {
    SHOPIFY_DOMAIN: env.SHOPIFY_DOMAIN || 'bargain-drop-8194.myshopify.com',
    SHOPIFY_TOKEN: env.SHOPIFY_ACCESS_TOKEN || env.SHOPIFY_TOKEN || '',
    CJ_API_KEY: env.CJ_ACCESS_TOKEN || '',
    SHOPIFY_API: `https://${env.SHOPIFY_DOMAIN || 'bargain-drop-8194.myshopify.com'}/admin/api/2025-10`,
    CJ_BASE: 'https://developers.cjdropshipping.com/api2.0/v1',
  };
}

// ─── CJ auth (in-memory token cache per worker instance) ────────────────
let _cjToken = null, _cjExp = 0, _cjTokIdx = 0;
const _mcpToks = []; // MCP access tokens (already-issued JWTs), used directly as Bearer tokens

// Collect any MCP access tokens (prefix 'MCP@') from env. These are ALREADY access tokens,
// so they skip the getAccessToken exchange AND carry a much higher rate limit (~8 req/burst) than
// an apiKey-derived token (1 req/sec). Set them via CJ_ACCESS_TOKEN (single) or CJ_MCP_TOKEN_1..N.
export function mcpTokens(env) {
  if (_mcpToks.length) return _mcpToks;
  const list = [];
  if (env.CJ_ACCESS_TOKEN && String(env.CJ_ACCESS_TOKEN).startsWith('MCP@')) list.push(env.CJ_ACCESS_TOKEN);
  for (let i = 1; i <= 6; i++) {
    const t = env['CJ_MCP_TOKEN_' + i];
    if (t && String(t).startsWith('MCP@')) list.push(t);
  }
  for (const t of list) _mcpToks.push(t);
  return _mcpToks;
}

export async function cjToken(env) {
  if (_cjToken && Date.now() < _cjExp) return _cjToken;
  // Prefer MCP tokens (higher rate limit) — rotate through them to avoid any single-token throttle.
  const mcps = mcpTokens(env);
  if (mcps.length) {
    _cjToken = mcps[_cjTokIdx % mcps.length];
    _cjTokIdx++;
    _cjExp = Date.now() + 3600 * 1000; // rotate every hour
    return _cjToken;
  }
  const CJ_API_KEY = env.CJ_ACCESS_TOKEN || '';
  if (!CJ_API_KEY) throw new Error('CJ_ACCESS_TOKEN not configured');
  const r = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: CJ_API_KEY }),
  });
  const j = await r.json();
  const tok = j?.data?.accessToken;
  if (!tok) throw new Error('CJ auth failed: ' + (j?.message || JSON.stringify(j)));
  _cjToken = tok;
  _cjExp = Date.now() + 12 * 3600 * 1000; // refresh after 12h
  return tok;
}

export async function cjFetch(env, path, opts = {}) {
  const tok = await cjToken(env);
  const r = await fetch(`https://developers.cjdropshipping.com/api2.0/v1${path}`, {
    ...opts,
    headers: { 'CJ-Access-Token': tok, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  return r.json();
}

// ─── Multi-key CJ support ────────────────────────────────────────────────
// The CJ keys live across multiple accounts; some accounts cannot see products
// sourced under others (return code 1600014). cjFetchMulti rotates through all
// configured keys and returns the first successful (non-1600014) result.

const _keyTokens = new Map(); // key -> { tok, exp }

// ── Sticky key selection (sequential failover) ────────────────────────────
// Keeps using one healthy key until it reports it's out of points (remaining
// → 0 or a 16900500/429), and only then falls through to the NEXT key with
// points. Prevents needless flapping between near-equal keys every call.
let _preferredKey = null; // module-level "current" key, per isolate
function _setExhausted(apiKey) {
  const c = _keyTokens.get(apiKey);
  if (c) c.remaining = 0;
  if (_preferredKey === apiKey) _preferredKey = null; // step off the dead key
}

// ── DURABLE key-health persistence (survives isolate recycling) ───────────
// Cloudflare Pages Functions recycle isolates per request, so in-memory state
// (pointsInfo / preferred key) is lost between webhook events. To make "use one
// key until exhausted, then the next" actually hold across requests, we persist
// a small health map to a Shopify shop metafield (namespace cjkeys / key health).
// Only MASKS (first 10 chars) + point counts are stored — never the key secret.
const SHOP_GID = 'gid://shopify/Shop/73594044547';
const KEYHEALTH_NS = 'cjkeys';
const KEYHEALTH_KEY = 'health';
function maskKey(apiKey) {
  return typeof apiKey === 'string' ? apiKey.slice(0, 10) : '';
}
let _healthLoaded = false;         // have we read the metafield this isolate?
let _healthDirty = false;          // pending write?
let _healthLastSaved = 0;          // throttle metafield writes
const HEALTH_TTL_MS = 20 * 1000;   // re-read persisted health at most every 20s

// Read persisted key health from Shopify. Returns { preferred, keys: { mask: {remaining,usedToday,at} } }.
async function _loadKeyHealth(env) {
  try {
    const q = `query { shop { metafields(first:1, keys: ["${KEYHEALTH_NS}.${KEYHEALTH_KEY}"]) { edges { node { value } } } } }`;
    const { body } = await shopifyFetch(env, '/graphql.json', { method: 'POST', body: JSON.stringify({ query: q }) });
    const edges = body?.data?.shop?.metafields?.edges || [];
    if (!edges.length) return { preferred: null, keys: {} };
    const parsed = JSON.parse(edges[0].node.value || '{}');
    return { preferred: parsed.preferred || null, keys: parsed.keys || {} };
  } catch { return { preferred: null, keys: {} }; }
}

// Apply persisted health to the in-memory _keyTokens map (mask -> full key).
function _applyHealthToMemory(env, health) {
  const byMask = new Map();
  for (const k of cjKeys(env)) byMask.set(maskKey(k), k);
  // restore preferred
  if (health.preferred && byMask.has(health.preferred)) _preferredKey = byMask.get(health.preferred);
  for (const [mask, info] of Object.entries(health.keys || {})) {
    const full = byMask.get(mask);
    if (!full) continue;
    const c = _keyTokens.get(full);
    if (c && typeof info.remaining === 'number') {
      c.remaining = info.remaining;
      c.usedToday = info.usedToday;
    }
  }
}

// Build the health snapshot to persist (only masks, never secrets).
function _healthSnapshot(env) {
  const keys = {};
  for (const k of cjKeys(env)) {
    const c = _keyTokens.get(k);
    if (c && typeof c.remaining === 'number') {
      keys[maskKey(k)] = { remaining: c.remaining, usedToday: c.usedToday, at: Date.now() };
    }
  }
  return { preferred: _preferredKey ? maskKey(_preferredKey) : null, keys };
}

async function _saveKeyHealth(env) {
  if (!_healthDirty) return;
  const snap = _healthSnapshot(env);
  try {
    const mq = `mutation set($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { metafields { id } userErrors { field message } } }`;
    await shopifyFetch(env, '/graphql.json', {
      method: 'POST',
      body: JSON.stringify({ query: mq, variables: { m: [{ ownerId: SHOP_GID, namespace: KEYHEALTH_NS, key: KEYHEALTH_KEY, type: 'json', value: JSON.stringify(snap) }] } }),
    });
    _healthDirty = false;
    _healthLastSaved = Date.now();
  } catch { /* non-fatal: keep in-memory state for this isolate */ }
}

async function keyToken(apiKey) {
  const c = _keyTokens.get(apiKey);
  if (c && Date.now() < c.exp) return c.tok;
  const r = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  });
  const j = await r.json();
  const tok = j?.data?.accessToken;
  if (!tok) return null;
  // openId is the account's webhook signing secret (present in the same response).
  const openId = j?.data?.openId != null ? String(j.data.openId) : null;
  _keyTokens.set(apiKey, { tok, openId, exp: Date.now() + 12 * 3600 * 1000, remaining: null, usedToday: null });
  return tok;
}

// Record a key's observed points budget (every CJ response carries pointsInfo).
// Used to prefer keys that still have headroom so one exhausted account can't
// block the others. remaining=0 (or code 16900500 / 429) marks it exhausted.
function recordKeyPoints(apiKey, code, pointsInfo) {
  const c = _keyTokens.get(apiKey);
  if (!c) return;
  const pi = pointsInfo || null;
  if (pi && typeof pi.remaining === 'number') { c.remaining = pi.remaining; c.usedToday = pi.usedToday; }
  // Insufficient-points (16900500) / HTTP 429 => treat as exhausted so sibling calls
  // deprioritize this key until its per-minute replenishment / daily reset recovers it.
  // Also an explicit remaining === 0 from pointsInfo means it's empty.
  if (code === 16900500 || code === 429 || (pi && pi.remaining === 0)) { _setExhausted(apiKey); }
  _healthDirty = true;
}

// Sort the configured keys so the healthiest (most remaining points) is tried first.
// Keys known to be exhausted (remaining === 0) are moved to the END, and keys whose
// budget is unknown sort in the middle. This yields the same key SET as cjKeys(),
// only ordered, so single-key behavior is unchanged.
// Order keys for sequential failover: the currently-preferred key first (if it
// still has points), then by remaining points desc, exhausted keys last.
export function orderedCjKeys(env) {
  const keys = cjKeys(env);
  const out = keys.slice();
  const pref = _preferredKey;
  if (pref) {
    const pc = _keyTokens.get(pref);
    const prefOk = pc && pc.remaining !== 0; // still has points (or unknown)
    if (prefOk && keys.includes(pref)) {
      // keep preferred first, then remaining by points
      out.sort((a, b) => {
        if (a === pref && b !== pref) return -1;
        if (b === pref && a !== pref) return 1;
        const ca = _keyTokens.get(a); const cb = _keyTokens.get(b);
        const ra = ca && typeof ca.remaining === 'number' ? ca.remaining : null;
        const rb = cb && typeof cb.remaining === 'number' ? cb.remaining : null;
        if (ra === 0 && rb !== 0) return 1;
        if (rb === 0 && ra !== 0) return -1;
        if (ra !== null && rb !== null && ra !== rb) return (rb||0) - (ra||0);
        return 0;
      });
      return out;
    }
  }
  // no sticky preference -> pure points-desc, exhausted last (existing behavior)
  return sortedCjKeys(env);
}

export function sortedCjKeys(env) {
  const keys = cjKeys(env);
  return keys.slice().sort((a, b) => {
    const ca = _keyTokens.get(a); const cb = _keyTokens.get(b);
    const ra = ca && typeof ca.remaining === 'number' ? ca.remaining : null;
    const rb = cb && typeof cb.remaining === 'number' ? cb.remaining : null;
    // exhausted (0) -> last
    if (ra === 0 && rb !== 0) return 1;
    if (rb === 0 && ra !== 0) return -1;
    // known vs unknown: known-with-headroom first
    if (ra === null && rb !== null && rb > 0) return 1;
    if (rb === null && ra !== null && ra > 0) return -1;
    // both known -> higher remaining first
    if (ra !== null && rb !== null && ra !== rb) return rb - ra;
    return 0;
  });
}

// Fetch (and cache) the openId for every configured CJ key. openId is the
// webhook HMAC signing secret — each account has its own, so verification
// must try against ALL of them. populateCjOpenIds() ensures the cache is warm.
export async function populateCjOpenIds(env) {
  const keys = cjKeys(env);
  for (const k of keys) { try { await keyToken(k); } catch {} }
}

// Return the list of openIds for all configured keys (strings, deduped).
export async function cjOpenIds(env) {
  await populateCjOpenIds(env);
  const out = new Set();
  for (const k of cjKeys(env)) {
    const c = _keyTokens.get(k);
    if (c && c.openId) out.add(c.openId);
  }
  return [...out];
}

export function cjKeys(env) {
  const list = [];
  if (env.CJ_ACCESS_TOKEN) list.push(env.CJ_ACCESS_TOKEN);
  for (let i = 2; i <= 6; i++) {
    const k = env['CJ_ACCESS_TOKEN_' + i];
    if (k) list.push(k);
  }
  // dedupe
  return [...new Set(list)];
}

export async function cjFetchMulti(env, path, opts = {}) {
  // Restore persisted key health (survives isolate recycling) once per isolate.
  if (!_healthLoaded) {
    _healthLoaded = true;
    const h = await _loadKeyHealth(env);
    _applyHealthToMemory(env, h);
  }
  const keys = orderedCjKeys(env);
  let lastErr = null, lastBody = null;
  for (const apiKey of keys) {
    try {
      const tok = await keyToken(apiKey);
      if (!tok) { lastErr = new Error('auth fail ' + apiKey.slice(0,10)); continue; }
      const r = await fetch(`https://developers.cjdropshipping.com/api2.0/v1${path}`, {
        ...opts,
        headers: { 'CJ-Access-Token': tok, 'Content-Type': 'application/json', ...(opts.headers || {}) },
      });
      const body = await r.json();
      // Track this key's points budget so sibling calls prefer healthy keys.
      recordKeyPoints(apiKey, body && body.code, body && body.pointsInfo);
      // Any account-level failure (product-not-found 1600014, insufficient points,
      // subscription/location errors like 1600200, HTTP 429, etc.) -> try the next
      // key, because each CJ account has its OWN points bucket and subscription.
      // One failing/limited account must never block a sibling key that works.
      const code = body && body.code;
      const msg = String((body && body.message) || '');
      const isAccountError =
        code === 1600014 ||
        code === 1600200 ||
        code === 429 ||
        (typeof code === 'number' && code !== 200) ||
        msg.toLowerCase().includes('insufficient api points');
      if (isAccountError) { lastBody = body; continue; }
      _preferredKey = apiKey; // sticky: keep using this key until it's exhausted
      await _saveKeyHealth(env); // persist preferred + points (best-effort)
      return body;
    } catch (e) { lastErr = e; }
  }
  await _saveKeyHealth(env); // persist whatever we learned (best-effort)
  if (lastBody) return lastBody; // all keys failed (not-found OR points) -> return last
  throw lastErr || new Error('all CJ keys failed');
}

export async function shopifyFetch(env, path, opts = {}) {
  const SHOPIFY_DOMAIN = env.SHOPIFY_DOMAIN || 'bargain-drop-8194.myshopify.com';
  // Auto-refresh token: on 401 (expired/revoked), re-exchange client credentials
  // and retry once. Uses the shared token manager (statically imported above).
  let token;
  try {
    token = await getShopifyToken(env);
  } catch (e) {
    // no client creds AND no static token -> fall back to legacy env token
    token = env.SHOPIFY_ACCESS_TOKEN || env.SHOPIFY_TOKEN || '';
    if (!token) throw new Error('SHOPIFY_ACCESS_TOKEN not configured');
  }

  const doFetch = async (tk) => fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2025-10${path}`, {
    ...opts,
    headers: {
      'X-Shopify-Access-Token': tk,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });

  let r = await doFetch(token);

  // 401 → token was invalid/expired. Invalidate + re-exchange + retry once.
  if (r.status === 401) {
    invalidateShopifyToken();
    try {
      token = await getShopifyToken(env, true);
      r = await doFetch(token);
    } catch {}
  }

  // 429 → rate limited. Honor Retry-After (fall back to exponential backoff),
  // retrying a bounded number of times so bursts during sync/import don't abort.
  let attempts = 1;
  const MAX_429_ATTEMPTS = 5;
  while (r.status === 429 && attempts <= MAX_429_ATTEMPTS) {
    const ra = parseFloat(r.headers.get('retry-after'));
    const waitMs = Number.isFinite(ra) && ra > 0
      ? Math.min(ra * 1000, 20000)
      : Math.min(500 * Math.pow(2, attempts), 20000);
    await new Promise((res) => setTimeout(res, waitMs));
    r = await doFetch(token);
    attempts++;
  }

  const text = await r.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  return { ok: r.ok, status: r.status, body, headers: r.headers };
}

// Parse Shopify's Link header (<.../products.json?...&page_info=XYZ>; rel="next")
// and return the next cursor, or null when there are no more pages.
export function nextPageCursor(headers) {
  if (!headers) return null;
  const link = headers.get('link');
  if (!link) return null;
  const next = link.split(',').map(s => s.trim()).find(s => s.includes('rel="next"'));
  if (!next) return null;
  const m = next.match(/[?&]page_info=([^>&"\s]+)/);
  return m ? m[1] : null;
}

// ─── CORS headers helper ─────────────────────────────────────────────────
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Pin, Authorization, X-Shopify-Hmac-Sha256, X-Shopify-Topic',
  };
}

// ─── Admin authentication ───────────────────────────────────────────────
// Server-side gate: requires the request to carry the admin PIN (header
// X-Admin-Pin, Authorization: Bearer, or ?pin= query) matching env ADMIN_PIN.
// Also updates the CORS allow-list so the header can be sent cross-origin.
export function isAdmin(request, env) {
  const expected = env.ADMIN_PIN || '';
  if (!expected) return false; // not configured → deny by default
  const h = request.headers.get('X-Admin-Pin') || '';
  const auth = request.headers.get('Authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  let pin = '';
  try { pin = new URL(request.url).searchParams.get('pin') || ''; } catch (e) {}
  const candidate = h || bearer || pin;
  // constant-time-ish compare
  const a = String(candidate || ''), b = String(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function adminDenied() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

// ─── GitHub helpers (Cloudflare KV or direct API) ────────────────────────
const GH_TOKEN_FN = (env) => env.GITHUB_TOKEN || '';
const REPO = 'jamestuwairua77-cpu/bargain-drop-v2';
const GHAPI = 'https://api.github.com/repos/' + REPO;

export async function ghRead(env, path) {
  const r = await fetch(GHAPI + '/contents/' + path, {
    headers: {
      'Authorization': 'Bearer ' + GH_TOKEN_FN(env),
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'bargain-drop-cloudflare',
    },
  });
  if (!r.ok) return null;
  return await r.json();
}

function b64Encode(bytes) {
  // Chunked base64 encode — avoids "Maximum call stack size exceeded"
  // on large payloads (the old fromCharCode(...spread) blew the stack >~500KB).
  const CHUNK = 0x8000; // 32768 bytes per chunk
  let bin = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

export async function ghWriteLarge(env, path, content, msg) {
  // The catalog is write-contended (background "auto: rebuild" jobs commit to main
  // every few seconds), so a single read→commit→ref-update can lose the race with a
  // 422 conflict. Retry the whole sequence a few times so large-file writes converge.
  let lastErr = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const r = await ghWriteLargeOnce(env, path, content, msg);
      return r;
    } catch (e) {
      lastErr = e;
      const transient = String(e && e.message).includes('ref update fail') || String(e && e.message).includes('429');
      if (!transient) throw e;
      await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  throw lastErr || new Error('ghWriteLarge failed');
}

async function ghWriteLargeOnce(env, path, content, msg) {
  const token = GH_TOKEN_FN(env);
  const gh = (url, opts) => fetch(url, { ...opts, headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'User-Agent': 'bargain-drop-cloudflare',
  }});

  // 1. Get current HEAD commit sha for main
  const ref = await gh(GHAPI + '/git/ref/heads/main');
  if (!ref.ok) throw new Error('git ref fail: ' + ref.status);
  const baseSha = (await ref.json()).object.sha;

  // 2. Get current commit tree sha
  const commit = await gh(GHAPI + '/git/commits/' + baseSha);
  if (!commit.ok) throw new Error('commit fail: ' + commit.status);
  const treeSha = (await commit.json()).tree.sha;

  // 3. Create a blob for the new content (supports >1MB via git blob API)
  const bytes = new TextEncoder().encode(content);
  const base64 = b64Encode(bytes);
  const blob = await gh(GHAPI + '/git/blobs', {
    method: 'POST',
    body: JSON.stringify({ content: base64, encoding: 'base64' }),
  });
  if (!blob.ok) throw new Error('blob fail: ' + blob.status + ' ' + (await blob.text()).slice(0,200));
  const blobSha = (await blob.json()).sha;

  // 4. Create a new tree pointing `path` -> blob (base_tree = existing tree)
  const tree = await gh(GHAPI + '/git/trees', {
    method: 'POST',
    body: JSON.stringify({ base_tree: treeSha, tree: [ { path, mode: '100644', type: 'blob', sha: blobSha } ] }),
  });
  if (!tree.ok) throw new Error('tree fail: ' + tree.status + ' ' + (await tree.text()).slice(0,200));
  const newTreeSha = (await tree.json()).sha;

  // 5. Create commit
  const newCommit = await gh(GHAPI + '/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message: msg, tree: newTreeSha, parents: [baseSha] }),
  });
  if (!newCommit.ok) throw new Error('commit fail: ' + newCommit.status);
  const newCommitSha = (await newCommit.json()).sha;

  // 6. Update main ref to new commit
  const upd = await gh(GHAPI + '/git/refs/heads/main', {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommitSha, force: false }),
  });
  if (!upd.ok) throw new Error('ref update fail: ' + upd.status);
  return { sha: newCommitSha };
}

export async function ghWrite(env, path, content, msg, existingSha) {
  const bytes = new TextEncoder().encode(content);

  // Files >1MB exceed GitHub /contents API limits → use Git Data (tree/blob) API.
  if (bytes.length > 900 * 1024) {
    return ghWriteLarge(env, path, content, msg);
  }

  let sha = existingSha;
  if (!sha) {
    try {
      const cur = await ghRead(env, path);
      if (cur && cur.sha) sha = cur.sha;
    } catch { /* file may not exist yet -> create without sha */ }
  }
  const base64 = b64Encode(bytes);
  const body = {
    message: msg,
    content: base64,
    branch: 'main',
  };
  if (sha) body.sha = sha;
  const r = await fetch(GHAPI + '/contents/' + path, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + GH_TOKEN_FN(env),
      'Content-Type': 'application/json',
      'User-Agent': 'bargain-drop-cloudflare',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const d = await r.text();
    throw new Error('GH write ' + r.status + ': ' + d.slice(0, 200));
  }
  return await r.json();
}

// ─── Sync log via GitHub (no /tmp in Cloudflare) ─────────────────────────
const SYNC_LOG_PATH = 'data/sync-log.json';
const ORDERS_PATH = 'data/orders.json';

// Module-level throttle to stop the runaway "sync: append log entry" flood.
// CJ re-delivers a huge backlog of webhook pushes, each of which calls
// appendSyncLog → ghWrite → a 6-step git commit. Writing every push saturates
// the GitHub API and cancels real deploys. We coalesce to at most one write
// per SYNC_LOG_MIN_INTERVAL_MS across ALL isolates (backed by the log file's
// own latest timestamp, so it survives isolate resets).
const SYNC_LOG_MIN_INTERVAL_MS = 60 * 1000; // 60 seconds
let _lastSyncLogWrite = 0; // per-isolate fast-path guard

export async function appendSyncLog(env, entry) {
  try {
    const now = Date.now();
    // Fast path: if this isolate already wrote within the window, skip immediately
    if (now - _lastSyncLogWrite < SYNC_LOG_MIN_INTERVAL_MS) return false;

    const existing = await ghRead(env, SYNC_LOG_PATH);
    let log = [];
    let latestAt = 0;
    if (existing && existing.content) {
      const decoded = atob(existing.content);
      try {
        log = JSON.parse(decoded);
        if (Array.isArray(log) && log.length && log[0] && log[0].at) {
          latestAt = new Date(log[0].at).getTime() || 0;
        }
      } catch {}
    }
    // Cross-isolate throttle: if the last persisted entry is within the window, skip.
    if (now - latestAt < SYNC_LOG_MIN_INTERVAL_MS) {
      _lastSyncLogWrite = now; // still refresh local guard
      return false;
    }

    log.unshift({ ...entry, at: new Date().toISOString() });
    await ghWrite(env, SYNC_LOG_PATH, JSON.stringify(log.slice(0, 200), null, 2),
      'sync: append log entry', existing?.sha);
    _lastSyncLogWrite = now;
    return true;
  } catch (e) {
    console.error('appendSyncLog failed:', e.message);
    return false;
  }
}

// ─── Durable order ledger (GitHub-backed, same mechanism as sync log) ────
export async function listOrders(env) {
  const existing = await ghRead(env, ORDERS_PATH);
  if (!existing || !existing.content) return [];
  try { return JSON.parse(atob(existing.content)); } catch { return []; }
}

export async function saveOrderRecord(env, order) {
  const orders = await listOrders(env);
  const existing = await ghRead(env, ORDERS_PATH);
  const idx = orders.findIndex(o => o.id === order.id);
  const record = { ...order, updatedAt: new Date().toISOString() };
  if (idx >= 0) { orders[idx] = record; } else { orders.push(record); }
  await ghWrite(env, ORDERS_PATH, JSON.stringify(orders, null, 2), 'orders: save ' + (order.id || ''), existing && existing.sha);
  return record;
}

export async function updateOrderStatus(env, orderId, status, extra) {
  const orders = await listOrders(env);
  const existing = await ghRead(env, ORDERS_PATH);
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx < 0) return null;
  orders[idx] = { ...orders[idx], status, ...(extra || {}), updatedAt: new Date().toISOString() };
  await ghWrite(env, ORDERS_PATH, JSON.stringify(orders, null, 2), 'orders: ' + status + ' ' + orderId, existing && existing.sha);
  return orders[idx];
}

// ─── Find Shopify order by BD id ─────────────────────────────────────────
export async function findShopifyOrderByBDId(env, bdId) {
  const { body } = await shopifyFetch(env, `/orders.json?status=any&limit=250`);
  return (body.orders || []).find(o =>
    (o.note_attributes || []).some(a => a.name === 'bd_order_id' && a.value === bdId)
  ) || null;
}

// ─── Build CJ createOrderV2 body from a Shopify order ────────────────────
export function shopifyToCjOrder(shopOrder) {
  const sa = shopOrder.shipping_address || {};
  const bdId = (shopOrder.note_attributes || []).find(a => a.name === 'bd_order_id')?.value
    || `SH${shopOrder.id}`;
  return {
    orderNumber: bdId,
    shippingCountryCode: sa.country_code || 'AU',
    shippingCountry: sa.country || 'Australia',
    shippingProvince: sa.province || '',
    shippingCity: sa.city || '',
    shippingZip: sa.zip || '',
    shippingPhone: sa.phone || shopOrder.phone || '',
    shippingCustomerName: `${sa.first_name || ''} ${sa.last_name || ''}`.trim() || 'Customer',
    shippingAddress: [sa.address1, sa.address2].filter(Boolean).join(' '),
    email: shopOrder.email || shopOrder.contact_email || '',
    remark: `Shopify order ${shopOrder.name}`,
    platform: 'shopify',
    fromCountryCode: 'CN',
    logisticName: 'CJPacket Ordinary',
    products: (shopOrder.line_items || []).map((li, i) => ({
      vid: (li.properties || []).find(p => p.name === 'cj_vid')?.value || li.sku || null,
      quantity: li.quantity || 1,
      storeLineItemId: `${bdId}-${i}`,
    })),
  };
}

// ─── Build a CJ createOrderV2 body from a generic checkout payload ────────
// The custom checkout sends { order_id, customer_email, shipping_address, products:[{vid,quantity}] }.
// Normalize into the exact CJ createOrderV2 field names.
export function buildCjOrderFromBody(body) {
  const sa = body.shipping_address || {};
  const orderNumber = body.order_id || body.orderNumber || ('BD' + Date.now().toString(36).toUpperCase());
  const products = (body.products || body.line_items || []).map((it, i) => ({
    vid: it.vid || it.sku || null,
    quantity: it.quantity || it.qty || 1,
    storeLineItemId: it.storeLineItemId || (orderNumber + '-' + i),
  }));
  return {
    orderNumber,
    shippingCountryCode: sa.country_code || 'AU',
    shippingCountry: sa.country || 'Australia',
    shippingProvince: sa.province || sa.state || '',
    shippingCity: sa.city || '',
    shippingZip: sa.zip || sa.postal_code || '',
    shippingPhone: sa.phone || '',
    shippingCustomerName: ((sa.first_name || '') + ' ' + (sa.last_name || '')).trim() || 'Customer',
    shippingAddress: [sa.address1 || sa.addr || sa.address, sa.address2].filter(Boolean).join(' '),
    email: body.customer_email || body.email || sa.email || '',
    remark: body.remark || ('BD order ' + orderNumber),
    platform: 'shopify',
    fromCountryCode: 'CN',
    logisticName: 'CJPacket Ordinary',
    products,
  };
}

// ─── Web Crypto HMAC verification (replaces Node crypto.createHmac) ──────
export async function verifyHmac(raw, header, secret) {
  if (!secret || !header) return true;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, raw);
  const digest = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return digest === header;
}

// ─── PBKDF2 password hashing (replaces Node crypto.pbkdf2Sync) ───────────
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-512' }, key, 512
  );
  const hashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex + ':' + saltHex;
}

export async function verifyPassword(password, stored) {
  const [hash, saltHex] = stored.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)));
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-512' }, key, 512
  );
  const verify = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hash === verify;
}

// ─── Server-side fulfillment: push a paid order to CJ + Shopify (idempotent) ──
// Resolve a CJ numeric variant id (`vid`) from a store SKU or a raw numeric vid.
// CJ createOrderV2 requires the numeric `vid` (from /product/query variants[]),
// NOT the store SKU (e.g. CJGJ30573020001). If the item carries a numeric vid we
// use it directly; otherwise we look it up via /product/query?variantSku=.
async function resolveCjVid(env, sku, vid) {
  if (vid && /^[0-9]+$/.test(String(vid))) return String(vid); // already numeric vid
  if (sku) {
    try {
      const r = await cjFetch(env, '/product/query?variantSku=' + encodeURIComponent(sku));
      if (r && r.code === 200 && r.data && Array.isArray(r.data.variants) && r.data.variants.length) {
        const v = r.data.variants[0];
        if (v && v.vid) return String(v.vid);
      }
    } catch (e) { /* fall through */ }
  }
  // also accept non-numeric vid strings (UUID-style) as a last resort
  if (vid) return String(vid);
  return null;
}

async function pushOrderToCj(env, order) {
  const items = order.items || [];
  const products = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const vid = await resolveCjVid(env, it.sku || it.vid || null, it.vid || null);
    products.push({
      vid,
      quantity: it.qty || it.quantity || 1,
      storeLineItemId: order.id + '-' + i,
    });
  }
  const payload = buildCjOrderFromBody({
    order_id: order.id,
    customer_email: order.email || (order.shipping && order.shipping.email) || '',
    shipping_address: order.shipping || {},
    products,
  });
  return await cjFetch(env, '/shopping/order/createOrderV2', { method: 'POST', body: JSON.stringify(payload) });
}

async function pushOrderToShopify(env, order) {
  const ship = order.shipping || {};
  // Payment is already confirmed (fulfillOrder runs after the payment webhook),
  // so mark the order Paid at creation. Shopify's REST does NOT allow flipping
  // financial_status via PATCH later; it must be set on create. Gateway/transaction
  // details are carried as note_attributes (reliable; native transaction creation
  // via REST requires an 'authorization' parent kind that no longer exists).
  const payNotes = (order.payment && (order.payment.gateway || order.payment.hash))
    ? [
        { name: 'payment_gateway', value: String(order.payment.gateway || 'stripe') },
        { name: 'transaction_hash', value: String(order.payment.hash || '') },
        { name: 'amount_paid', value: String(order.payment.amount || order.total || '') + ' ' + (order.payment.currency || 'AUD') },
      ]
    : [];
  const shopOrder = {
    email: order.email || ship.email || '',
    financial_status: 'paid',
    line_items: (order.items || []).map((it) => ({
      variant_id: it.variant_id || null,
      title: it.title || 'Item',
      price: it.price || 0,
      quantity: it.qty || it.quantity || 1,
      sku: it.sku || '',
    })),
    shipping_address: {
      first_name: ship.first_name || (order.name ? order.name.split(' ')[0] : ''),
      last_name: ship.last_name || (order.name ? order.name.split(' ').slice(1).join(' ') : ''),
      address1: ship.address1 || ship.addr || '',
      city: ship.city || '',
      province: ship.province || ship.state || '',
      zip: ship.zip || '',
      country: ship.country || 'Australia',
      country_code: ship.country_code || 'AU',
      phone: ship.phone || '',
    },
    note_attributes: [
      { name: 'bd_order_id', value: String(order.id) },
      ...payNotes,
    ],
  };
  return await shopifyFetch(env, '/orders.json', { method: 'POST', body: JSON.stringify({ order: shopOrder }) });
}

// Idempotent fulfillment: run ONCE, record results in the ledger, never double-push.
export async function fulfillOrder(env, order) {
  const orders = await listOrders(env);
  const existing = orders.find(o => o.id === order.id);
  if (existing && existing.fulfillment && existing.fulfillment.done) {
    return { skipped: true, already: true, fulfillment: existing.fulfillment };
  }
  const result = { done: true, at: new Date().toISOString(), cj: null, shopify: null, errors: [] };
  try { result.cj = await pushOrderToCj(env, order); } catch (e) { result.cj = { error: e.message }; result.errors.push('cj: ' + e.message); }
  try { result.shopify = await pushOrderToShopify(env, order); } catch (e) { result.shopify = { error: e.message }; result.errors.push('shopify: ' + e.message); }
  await updateOrderStatus(env, order.id, 'fulfilling', { fulfillment: result });
  return result;
}

// ─── Customer sync: reconcile a BD profile against Shopify Customers ─────
// Upsert customer by email. Returns { created | updated, shopifyId }.
export async function syncCustomer(env, profile) {
  const email = (profile.email || '').trim().toLowerCase();
  if (!email) return { error: 'email required' };

  // 1. Search existing by email (Shopify customers/search?query=email:...)
  const search = await shopifyFetch(env, `/customers/search.json?query=${encodeURIComponent('email:' + email)}`);
  const existing = (search.body && search.body.customers && search.body.customers[0]) || null;

  if (existing) {
    // 2. Update profile (only touched fields)
    const patch = { customer: { id: existing.id } };
    const c = patch.customer;
    if (profile.first_name != null) c.first_name = profile.first_name;
    if (profile.last_name != null) c.last_name = profile.last_name;
    if (profile.phone != null) c.phone = profile.phone;
    // default address (first of addresses → default_address)
    if (profile.addresses && profile.addresses.length) {
      const a = profile.addresses[0];
      c.addresses = [{
        first_name: a.first_name || profile.first_name || existing.first_name || '',
        last_name: a.last_name || profile.last_name || existing.last_name || '',
        address1: a.address1 || a.addr || '',
        address2: a.address2 || '',
        city: a.city || '',
        province: a.province || a.state || '',
        zip: a.zip || a.postal_code || '',
        country: a.country || 'Australia',
        country_code: a.country_code || 'AU',
        phone: a.phone || profile.phone || '',
        default: true,
      }];
    }
    const upd = await shopifyFetch(env, `/customers/${existing.id}.json`, { method: 'PUT', body: JSON.stringify(patch) });
    return { updated: true, shopifyId: existing.id, ok: upd.ok, error: upd.ok ? null : (upd.body?.errors || upd.body) };
  }

  // 3. Create new customer
  const a = (profile.addresses && profile.addresses[0]) || {};
  const create = {
    customer: {
      email,
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      phone: profile.phone || '',
      tags: 'bargain-drop',
      // Shopify requires a password for create (defaults randomly if omitted); set a secure placeholder,
      // or omit to let Shopify send a reset invite. We send invite to avoid storing passwords.
      send_email_invite: true,
      addresses: [{
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        address1: a.address1 || a.addr || '',
        address2: a.address2 || '',
        city: a.city || '',
        province: a.province || a.state || '',
        zip: a.zip || a.postal_code || '',
        country: a.country || 'Australia',
        country_code: a.country_code || 'AU',
        phone: a.phone || profile.phone || '',
        default: true,
      }],
    },
  };
  const res = await shopifyFetch(env, '/customers.json', { method: 'POST', body: JSON.stringify(create) });
  if (res.ok && res.body?.customer) {
    return { created: true, shopifyId: res.body.customer.id, ok: true };
  }
  return { created: false, ok: false, error: res.body?.errors || res.body };
}

// ─── Mark a Shopify order as paid via a transaction, with gateway details ──
// Shopify REST no longer accepts 'sale'/'authorization' native transaction kinds, and
// 'capture' requires a parent authorization that also can't be created. The reliable,
// accounting-complete approach is: record gateway/hash/amount as note_attributes on the
// order (financial_status is set to 'paid' at order-creation time in pushOrderToShopify).
export async function recordShopifyTransaction(env, shopifyOrderId, tx) {
  const gateway = tx.gateway || 'stripe';
  const hash = tx.authorization || tx.hash || '';
  const amount = tx.amount != null ? String(tx.amount) : '';
  const currency = tx.currency || 'AUD';

  // 1. Persist payment details as note_attributes (durable, always works)
  const notes = [
    { name: 'payment_gateway', value: gateway },
    { name: 'transaction_hash', value: hash },
    { name: 'amount_paid', value: amount + ' ' + currency },
    { name: 'paid_at', value: tx.processed_at || new Date().toISOString() },
  ];
  const put = await shopifyFetch(env, `/orders/${shopifyOrderId}.json`, {
    method: 'PUT',
    body: JSON.stringify({ order: { id: Number(shopifyOrderId), note_attributes: notes } }),
  });

  // 2. Best-effort: also try GraphQL orderCapture to create a native 'capture' transaction
  let gql = null;
  try {
    const q = JSON.stringify({
      query: `mutation { orderCapture(input: { id: "gid://shopify/Order/${shopifyOrderId}", amount: "${amount}" }) { transaction { id kind status } userErrors { field message } }`,
    });
    const r = await shopifyFetch(env, '/graphql.json', { method: 'POST', body: q });
    gql = r.body || null;
  } catch {}

  return { ok: put.ok, notes, nativeTransaction: gql, error: put.ok ? null : put.body };
}

// ─── Back-sync: apply a Shopify fulfillment to the BD ledger ─────────────
export async function backsyncFulfillment(env, shopifyOrderId, fulfillment) {
  // find local order by bd_order_id note attribute
  const { body } = await shopifyFetch(env, `/orders/${shopifyOrderId}.json`);
  const shopOrder = body.order || body;
  const bdId = (shopOrder.note_attributes || []).find(a => a.name === 'bd_order_id')?.value || null;
  const tracking = {
    tracking_company: fulfillment.tracking_company || '',
    tracking_number: fulfillment.tracking_number || '',
    tracking_numbers: fulfillment.tracking_numbers || [],
    tracking_urls: fulfillment.tracking_urls || [],
    status: fulfillment.status || 'success',
    shopify_fulfillment_id: fulfillment.id,
    synced_at: new Date().toISOString(),
  };
  if (!bdId) {
    return { error: 'no bd_order_id on Shopify order ' + shopifyOrderId, tracking };
  }
  const updated = await updateOrderStatus(env, bdId, 'fulfilled', { tracking });
  await appendSyncLog(env, { action: 'back-sync-fulfillment', shopifyOrderId, bdId, tracking_number: tracking.tracking_number });
  return { ok: true, bdId, tracking, updated: !!updated };
}

// ─── Back-sync: apply a Shopify inventory change to BD catalog ────────────
// Full inventory access is now available (read_inventory + write_inventory
// scopes granted after app reinstall), so we use the direct, fast path:
//   inventory_items/{id}.json  → sku
//   inventory_levels.json      → available count
// Falls back to scanning products if the direct items endpoint doesn't return a SKU.
export async function backsyncInventory(env, inventoryItemId, availableOverride) {
  let sku = null;
  let available = (availableOverride != null) ? Number(availableOverride) : null;

  // 1. Direct: SKU from inventory item
  try {
    const it = await shopifyFetch(env, `/inventory_items/${inventoryItemId}.json`);
    sku = (it.body && it.body.inventory_item && it.body.inventory_item.sku) || null;
  } catch {}

  // 2. If no explicit available, read live inventory level (needs location_ids)
  if (available == null) {
    try {
      const lv = await shopifyFetch(env, `/inventory_levels.json?inventory_item_ids=${inventoryItemId}`);
      const levels = (lv.body && lv.body.inventory_levels) || [];
      if (levels.length) available = Number(levels[0].available ?? 0);
    } catch {}
  }

  // 3. Fallback: scan products for the variant by inventory_item_id
  if (!sku || available == null) {
    let since_id = 0;
    while (true) {
      const { body } = await shopifyFetch(env, `/products.json?limit=250&fields=id,variants&since_id=${since_id}`);
      const prods = (body && body.products) || [];
      if (!prods.length) break;
      for (const p of prods) {
        for (const v of (p.variants || [])) {
          if (String(v.inventory_item_id) === String(inventoryItemId)) {
            if (!sku) sku = v.sku || null;
            if (available == null) available = Number(v.inventory_quantity ?? 0);
            break;
          }
        }
        if (sku != null && available != null) break;
      }
      if (sku != null && available != null) break;
      since_id = prods[prods.length - 1].id;
      if (prods.length < 250) break;
      await new Promise(r => setTimeout(r, 250));
    }
  }

  if (available == null) available = 0;
  await appendSyncLog(env, { action: 'back-sync-inventory', inventoryItemId, sku, available });

  if (!sku) return { error: 'no sku for inventory item ' + inventoryItemId, available };

  const prods = await ghRead(env, 'all-products.json');
  if (!prods) return { error: 'cannot read all-products.json', sku, available };
  let all;
  try { all = JSON.parse(atob(prods.content.replace(/\n/g, ''))); }
  catch { all = JSON.parse(atob(prods.content)); }

  let hits = 0;
  for (const p of all) {
    for (const vr of (p.variants || [])) {
      if (vr.sku === sku) {
        vr.available = available > 0;
        vr.inventory_quantity = available;
        hits++;
      }
    }
  }
  if (hits) {
    const shaw = (await ghRead(env, 'all-products.json'))?.sha;
    await ghWrite(env, 'all-products.json', JSON.stringify(all, null, 2), `back-sync inventory: ${sku}=${available} (${hits} variant(s))`, shaw);
  }
  return { ok: true, sku, available, hits };
}

// ─── User ledger (GitHub-backed users-seed.json) ─────────────────────────
const USERS_PATH = 'users-seed.json';

export async function listUsers(env) {
  const existing = await ghRead(env, USERS_PATH);
  if (!existing || !existing.content) return [];
  try { return JSON.parse(atob(existing.content)); } catch { return []; }
}

// Find a single user by normalized email (case-insensitive).
export async function findUserByEmail(env, email) {
  const target = String(email || '').trim().toLowerCase();
  if (!target) return null;
  const users = await listUsers(env);
  return users.find(u => String(u.email || '').trim().toLowerCase() === target) || null;
}

// ─── Session helpers (shared across /api handlers) ───────────────────────
// The session is a stateless __session cookie: <userId>.<expiry>.<hmac>,
// signed with SESSION_SECRET. These helpers resolve the *verified* identity
// server-side so no endpoint trusts a client-supplied email/id for scoping
// user-private data (orders, notifications, profile, wallet, etc.).

const SESSION_COOKIE_NAME = '__session';

function sessionSecret(env) { return (env && env.SESSION_SECRET) || 'bargain-drop-session-secret-v1'; }

async function sessionB64url(buf) {
  let bin = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sessionSign(payload, env) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(sessionSecret(env)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return await sessionB64url(sig);
}

export function sessionParseCookies(request) {
  const out = {};
  (request.headers.get('cookie') || '').split(';').forEach(function (p) {
    const i = p.indexOf('='); if (i < 0) return;
    out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  });
  return out;
}

// Verify the __session cookie and return the userId it was minted for, or null.
export async function getSessionUserId(request, env) {
  const cookieVal = sessionParseCookies(request)[SESSION_COOKIE_NAME];
  if (!cookieVal) return null;
  const parts = cookieVal.split('.');
  if (parts.length !== 3) return null;
  const expiry = parseInt(parts[1], 10);
  if (!expiry || Date.now() / 1000 > expiry) return null;
  const expected = await sessionSign(parts[0] + '.' + parts[1], env);
  if (parts[2] !== expected) return null;
  return parts[0];
}

// Resolve the signed-in user object (or null) from the verified session cookie.
export async function getSessionUser(request, env) {
  const userId = await getSessionUserId(request, env);
  if (!userId) return null;
  const users = await listUsers(env);
  return users.find(u => u.id === userId) || null;
}

// Pinned-key CJ webhook registration: webhook topic enablement and product
// subscription are PER-ACCOUNT state, so BOTH calls must hit the SAME CJ key.
// Iterates keys; for each, enables topics then subscribes, both on that key.
// Returns { ok, code, message, data, keyIndex } for the first key that fully
// succeeds (or the last error if none succeed).
const cjThrottle = () => new Promise((res) => setTimeout(res, 1300)); // CJ QPS ~1/s

async function cjWebhookCall(pathname, headers, payload, retries = 4) {
  let lastResp = null;
  for (let a = 0; a <= retries; a++) {
    const r = await fetch('https://developers.cjdropshipping.com/api2.0/v1' + pathname, {
      method: 'POST', headers, body: JSON.stringify(payload),
    });
    let j = null;
    try { j = await r.json(); } catch {}
    // 1600200 = QPS throttled -> back off and retry, do NOT treat as fatal.
    if (j && (j.code === 1600200)) {
      lastResp = j;
      if (a < retries) { await new Promise((s) => setTimeout(s, 1000 * (a + 1))); continue; }
      return { throttled: true, resp: j };
    }
    return { throttled: false, resp: j };
  }
  return { throttled: true, resp: lastResp };
}

export async function cjWebhookRegister(env, { subscribeAll = false, productIds = null, topicNames = null, callbackUrls = null } = {}) {
  const keys = cjKeys(env);
  let last = null;

  // Enable topics once using the first key that authenticates (topics are per-account
  // state; we fire on every authenticating key so all accounts get the callback URLs).
  if (topicNames && topicNames.length) {
    let topicsDone = false;
    for (let k = 0; k < keys.length; k++) {
      const tok = await keyToken(keys[k]);
      if (!tok) { last = { ok: false, code: 'auth', message: 'auth fail for key ' + k, keyIndex: k, step: 'topics' }; continue; }
      await cjThrottle();
      const body = {};
      for (const t of topicNames) body[t] = { type: 'ENABLE', callbackUrls: callbackUrls || [] };
      const { resp: j } = await cjWebhookCall('/webhook/set', { 'CJ-Access-Token': tok, 'Content-Type': 'application/json' }, body);
      if (j?.code === 200 || j?.success === true) topicsDone = true;
      else last = { ok: false, code: j?.code, message: j?.message, keyIndex: k, step: 'topics' };
    }
    if (!topicsDone) return last || { ok: false, code: 'none', message: 'no key could enable topics' };
  }

  // Subscribe (if requested). For per-pid subscriptions, we maintain a working set of
  // still-unsubscribed pids and run them against EVERY key, because a pid is only
  // subscribable by the account that owns it (cross-account = failProductIds).
  if (subscribeAll || (productIds && productIds.length)) {
    const successful = new Set();
    const allFailed = new Set();
    let gotResponse = false;

    if (subscribeAll) {
      for (let k = 0; k < keys.length; k++) {
        const tok = await keyToken(keys[k]);
        if (!tok) continue;
        await cjThrottle();
        const { resp: j } = await cjWebhookCall('/webhook/product/subscribe', { 'CJ-Access-Token': tok, 'Content-Type': 'application/json' }, { subscribeAll: true });
        if (j?.code === 200 || j?.success === true) { gotResponse = true; return { ok: true, code: j.code, message: j.message || 'Success', data: j.data || {}, subscribedIds: null, keyIndex: k }; }
        last = { ok: false, code: j?.code, message: j?.message, data: j?.data, keyIndex: k, step: 'subscribe' };
      }
      return last || { ok: false, code: 'none', message: 'no CJ keys configured' };
    }

    // per-pid: retry failures across keys until no key remains or all succeed.
    let remaining = [...productIds];
    let _rawDebug = {};
    for (let k = 0; k < keys.length && remaining.length; k++) {
      const tok = await keyToken(keys[k]);
      if (!tok) continue;
      await cjThrottle();
      const { resp: j } = await cjWebhookCall('/webhook/product/subscribe', { 'CJ-Access-Token': tok, 'Content-Type': 'application/json' }, { productIds: remaining, subscribeAll: false });
      if (!Object.keys(_rawDebug).length) _rawDebug = j || {};
      if (j?.code === 200 || j?.success === true) {
        gotResponse = true;
        const d = j?.data || {};
        const okIds = d.successProductIds || d.successPids || d.successPidList || [];
        const failIds = d.failProductIds || d.failPids || [];
        okIds.forEach((x) => successful.add(String(x)));
        failIds.forEach((x) => allFailed.add(String(x)));
        remaining = remaining.filter((pid) => !(okIds.some((o) => String(o) === String(pid))));
      } else {
        last = { ok: false, code: j?.code, message: j?.message, data: j?.data, keyIndex: k, step: 'subscribe' };
      }
    }
    return {
      ok: gotResponse,
      code: gotResponse ? 200 : (last?.code || 'none'),
      message: gotResponse ? 'Success' : (last?.message || 'no key could subscribe'),
      data: _rawDebug || {},
      subscribedIds: [...successful],
      failedIds: [...allFailed],
      keyIndex: null,
    };
  }

  // Only topics requested (already succeeded above).
  return { ok: true, code: 200, message: 'Success', keyIndex: null };
}

// Query CJ's current webhook product subscriptions (GET /webhook/product/subscribe/list).
// Returns the first successful page result across keys.
export async function cjWebhookList(env, { pageNum = 1, pageSize = 100, sku = '', shopId = '' } = {}) {
  const keys = cjKeys(env);
  let last = null;
  for (let k = 0; k < keys.length; k++) {
    const apiKey = keys[k];
    const tok = await keyToken(apiKey);
    if (!tok) { last = { ok: false, code: 'auth', message: 'auth fail for key ' + k, keyIndex: k }; continue; }
    await cjThrottle();
    const qs = new URLSearchParams({ pageNum: String(pageNum), pageSize: String(pageSize) });
    if (sku) qs.set('sku', sku);
    if (shopId) qs.set('shopId', shopId);
    const r = await fetch('https://developers.cjdropshipping.com/api2.0/v1/webhook/product/subscribe/list?' + qs.toString(), {
      method: 'GET', headers: { 'CJ-Access-Token': tok, 'Content-Type': 'application/json' },
    });
    let j = null;
    try { j = await r.json(); } catch {}
    if (j && (j.code === 200 || j.success === true)) {
      return { ok: true, code: j?.code, message: j?.message || 'Success', data: j?.data, keyIndex: k };
    }
    last = { ok: false, code: j?.code, message: j?.message, data: j?.data, keyIndex: k };
  }
  return last || { ok: false, code: 'none', message: 'no CJ keys configured' };
}


// ── Shared category mapping (single source of truth) ─────────────────────────
// Maps CJ's full category path (e.g. "Men's Clothing > Bottoms > Man Jeans",
// sometimes "/"- or "-"-delimited) or any raw `product_type` string to a
// canonical top-level storefront slug. Falls back to 'other'.
// This is the SAME logic used by sync-full.js (kept here so every importer —
// CJ webhook, sync, rebuild — produces identical category slugs).
const CANONICAL_CATEGORIES = [
  'womens-clothing', 'mens-clothing', 'bags-shoes', 'jewelry-watches',
  'home-garden-furniture', 'consumer-electronics', 'sports-outdoors',
  'health-beauty-hair', 'phones-accessories', 'pet-supplies',
  'toys-kids-babies', 'home-improvement', 'automobiles-motorcycles', 'computer-office',
];
const CATEGORY_KEYWORDS = [
  ['jewelry', 'jewelry-watches'], ['necklace', 'jewelry-watches'], ['bracelet', 'jewelry-watches'],
  ['earrings', 'jewelry-watches'], ['ring', 'jewelry-watches'], ['keychain', 'jewelry-watches'],
  ['watch', 'jewelry-watches'], ['925-silver', 'jewelry-watches'],
  ['bags', 'bags-shoes'], ['bag', 'bags-shoes'], ['totes', 'bags-shoes'], ['backpack', 'bags-shoes'],
  ['handbag', 'bags-shoes'], ['crossbody', 'bags-shoes'], ['luggage', 'bags-shoes'], ['wallet', 'bags-shoes'],
  ['shoes', 'bags-shoes'], ['boots', 'bags-shoes'], ['slippers', 'bags-shoes'], ['sandals', 'bags-shoes'],
  ['heels', 'bags-shoes'], ['flats', 'bags-shoes'], ['pumps', 'bags-shoes'], ['sneakers', 'bags-shoes'],
  ['loafers', 'bags-shoes'],
  ['womens-clothing', 'womens-clothing'], ['woman-clothing', 'womens-clothing'],
  ['lady-dresses', 'womens-clothing'], ['dresses', 'womens-clothing'], ['blazers', 'womens-clothing'],
  ['skirts', 'womens-clothing'], ['blouses', 'womens-clothing'], ['jumpsuits', 'womens-clothing'],
  ['wide-leg-pants', 'womens-clothing'], ['pants-capris', 'womens-clothing'], ['sweaters', 'womens-clothing'],
  ['woman-jeans', 'womens-clothing'], ['woman-trench', 'womens-clothing'], ['bras', 'womens-clothing'],
  ['bikini', 'womens-clothing'], ['suits-sets', 'womens-clothing'], ['rompers', 'womens-clothing'],
  ['leggings', 'womens-clothing'],
  ['mens-clothing', 'mens-clothing'], ['man-jeans', 'mens-clothing'], ['mens-shirts', 'mens-clothing'],
  ['man-hoodies', 'mens-clothing'], ['mens-jackets', 'mens-clothing'], ['man-trench', 'mens-clothing'],
  ['man-shorts', 'mens-clothing'], ['casual-pants', 'mens-clothing'], ['cargo-pants', 'mens-clothing'],
  ['mens-shoes', 'bags-shoes'], ['man-shoes', 'bags-shoes'], ['men-sandals', 'bags-shoes'],
  ['mens-sweaters', 'mens-clothing'],
  ['home-garden-furniture', 'home-garden-furniture'], ['home-storage', 'home-garden-furniture'],
  ['kitchen', 'home-garden-furniture'], ['home-textiles', 'home-garden-furniture'], ['bedding', 'home-garden-furniture'],
  ['drinkware', 'home-garden-furniture'], ['dinnerware', 'home-garden-furniture'], ['furniture', 'home-garden-furniture'],
  ['cooking-tools', 'home-garden-furniture'], ['bakeware', 'home-garden-furniture'], ['pillows', 'home-garden-furniture'],
  ['stationeries', 'home-garden-furniture'], ['garden', 'home-garden-furniture'],
  ['home-improvement', 'home-improvement'], ['tool-sets', 'home-improvement'], ['tool-set', 'home-improvement'],
  ['tools', 'home-improvement'], ['replacement-part', 'home-improvement'], ['lamp', 'home-improvement'],
  ['lighting', 'home-improvement'], ['bathroom', 'home-improvement'], ['cleaning', 'home-improvement'],
  ['drill', 'home-improvement'], ['screwdriver', 'home-improvement'], ['garden-tools', 'home-improvement'],
  ['health-beauty-hair', 'health-beauty-hair'], ['skin-care', 'health-beauty-hair'], ['facial', 'health-beauty-hair'],
  ['nail', 'health-beauty-hair'], ['makeup', 'health-beauty-hair'], ['beauty', 'health-beauty-hair'],
  ['body-care', 'health-beauty-hair'], ['hair', 'health-beauty-hair'], ['wigs', 'health-beauty-hair'],
  ['lipstick', 'health-beauty-hair'], ['eyeshadow', 'health-beauty-hair'],
  ['consumer-electronics', 'consumer-electronics'], ['smart-electronics', 'consumer-electronics'],
  ['smart-home', 'consumer-electronics'], ['earphones', 'consumer-electronics'], ['headphones', 'consumer-electronics'],
  ['audio', 'consumer-electronics'], ['speaker', 'consumer-electronics'], ['amplifier', 'consumer-electronics'],
  ['camera', 'consumer-electronics'], ['keyboard', 'consumer-electronics'], ['hdd-enclosures', 'consumer-electronics'],
  ['phones-accessories', 'phones-accessories'], ['phone-accessories', 'phones-accessories'],
  ['cases-covers', 'phones-accessories'], ['phone-cases', 'phones-accessories'], ['holders-stands', 'phones-accessories'],
  ['watch-band', 'phones-accessories'], ['charger', 'phones-accessories'], ['cables', 'phones-accessories'],
  ['silicone-cases', 'phones-accessories'], ['gps-trackers', 'phones-accessories'],
  ['sports-outdoors', 'sports-outdoors'], ['sportswear', 'sports-outdoors'], ['fishing', 'sports-outdoors'],
  ['camping', 'sports-outdoors'], ['hiking', 'sports-outdoors'], ['sneakers', 'sports-outdoors'],
  ['swimming', 'sports-outdoors'], ['yoga', 'sports-outdoors'], ['fitness', 'sports-outdoors'], ['gym', 'sports-outdoors'],
  ['bike', 'sports-outdoors'], ['outdoor', 'sports-outdoors'], ['sports-accessories', 'sports-outdoors'],
  ['pet-supplies', 'pet-supplies'], ['pet-', 'pet-supplies'], ['cat', 'pet-supplies'], ['dog', 'pet-supplies'],
  ['bird-feeders', 'pet-supplies'],
  ['toys-kids-babies', 'toys-kids-babies'], ['toys-hobbies', 'toys-kids-babies'], ['toy', 'toys-kids-babies'],
  ['baby', 'toys-kids-babies'], ['kids', 'toys-kids-babies'], ['dolls', 'toys-kids-babies'],
  ['puzzle', 'toys-kids-babies'], ['girl-clothing', 'toys-kids-babies'], ['action-toy', 'toys-kids-babies'],
  ['automobiles-motorcycles', 'automobiles-motorcycles'], ['auto-replacement', 'automobiles-motorcycles'],
  ['motorcycle', 'automobiles-motorcycles'], ['automobile', 'automobiles-motorcycles'], ['car-washer', 'automobiles-motorcycles'],
];
function slugifyCategory(s) {
  return String(s || '').toLowerCase()
    .replace(/ & /g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
function norm0(s) {
  return String(s || '').toLowerCase().replace(/[^a-z]+/g, ' ');
}
export function mapCategory(productType) {
  const raw = String(productType || '').trim();
  if (!raw) return 'other';
  const norm = slugifyCategory(raw);
  if (!norm) return 'other';
  if (CANONICAL_CATEGORIES.includes(norm)) return norm;
  for (const slug of CANONICAL_CATEGORIES) {
    if (norm === slug || norm.startsWith(slug + '-') || norm.startsWith(slug + '--')) return slug;
  }
  const n0 = norm0(raw);
  const HAS_MEN = /\b(men|men's|mens|man|man's|mans|male|boy|boys)\b/.test(n0);
  const HAS_WOMEN = /\b(women|women's|womens|woman|woman's|womans|lady|ladies|female|girl|girls|miss|wmn)\b/.test(n0);
  const IS_FOOTWEAR = /\b(shoes|boots|boot|sneakers|sneaker|loafers|loafer|sandals|sandal|slippers|slipper|heels|heel|flats|flat|pumps|pump|footwear)\b/.test(n0);
  const IS_BAG_ACC = /\b(bag|bags|backpack|backpacks|handbag|handbags|tote|totes|crossbody|wallet|wallets|luggage|purse|purses)\b/.test(n0);
  const IS_JEWELRY = /\b(jewelry|necklace|necklaces|bracelet|bracelets|earrings|earring|ring|rings|keychain|keychains|watch|watches)\b/.test(n0);
  const skipGender = IS_FOOTWEAR || IS_BAG_ACC || IS_JEWELRY;
  if (!skipGender) {
    if (HAS_MEN && !HAS_WOMEN) return 'mens-clothing';
    if (HAS_WOMEN && !HAS_MEN) return 'womens-clothing';
  }
  for (const [kw, slug] of CATEGORY_KEYWORDS) {
    if (norm.includes(kw)) return slug;
  }
  return 'other';
}
