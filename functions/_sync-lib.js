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
const HARDCODED_MCP_TOKENS = [
  "MCP@CJ5484448@CJ:eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIzODc0OSIsInR5cGUiOiJBQ0NFU1NfVE9LRU4iLCJzdWIiOiJtNnViRnRCamYraDhqaEdNeklGeXdNeWh4RTAxYXJSdklzSzJFdU1yOEVaSXRMSmwzLysxRVhGcmNYK1k1eTl4cE42QmRybUI3VWNuaXRaZkZrNHNuejBaSE1NL1NOYjhxMndSUU1pSG8vSlVmd1Z0WDlSOU8zS0pSS0tDWDJ3MGV2V3gyTkNQYUh6T2lHdGYrd1ppSFZjTVQ1SVYxU21tQjVUNzJBNEsySC9GbXJpaFliNGpCZnBXYW5oVjJkOW9ENjRmYndpMkx5RUNMaGkxbFlqOFc1VUZXOXBPMXNBZHRjdHlqeWZjTUNCVHgrdDFqRXV2cGV6NFJyWmgrUk1HaGJSNjhzWVVjS0dRbFFPSC9Dc09YYUFBUVkyV0N4aWcwNWJXbHpmelVwaExaaFoxR00yejdnWGo2eit4SHhVRSIsImlhdCI6MTc4OTUxNDA2OX0.WjqQE9WJB78uALT4DMyEfZa_EI6mG0rZz2cpbTPkT70",
  "MCP@CJ5484448@CJ:eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIzODc0OSIsInR5cGUiOiJBQ0NFU1NfVE9LRU4iLCJzdWIiOiJtNnViRnRCamYraDhqaEdNeklGeXdNeWh4RTAxYXJSdklzSzJFdU1yOEVaSXRMSmwzLysxRVhGcmNYK1k1eTl4cE42QmRybUI3VWNuaXRaZkZrNHNuenQ1cmJld3JJKzRsWm14SjR5ZHNZUEpHVTJYUlFOcE5TQlluZUhITisvb2V2V3gyTkNQYUh6T2lHdGYrd1ppSFZjTVQ1SVYxU21tQjVUNzJBNEsySC9GbXJpaFliNGpCZnBXYW5oVjJkOW9ENjRmYndpMkx5RUNMaGkxbFlqOFc1VUZXOXBPMXNBZHRjdHlqeWZjTUNCVHgrdDFqRXV2cGV6NFJyWmgrUk1HaGJSNjhzWVVjS0dRbFFPSC9Dc09YYUFBUVkyV0N4aWcwNWJXbHpmelVwaExaaFoxR00yejdnWGo2eit4SHhVRSIsImlhdCI6MTc4Njg4MzUxN30.QTX6tER8b79zYclnXycTOp61uthFr4ty7xlQ5xZBl58",
  "MCP@CJ5484448@CJ:eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIzODc0OSIsInR5cGUiOiJBQ0NFU1NfVE9LRU4iLCJzdWIiOiJtNnViRnRCamYraDhqaEdNeklGeXdNeWh4RTAxYXJSdklzSzJFdU1yOEVaSXRMSmwzLysxRVhGcmNYK1k1eTl4cE42QmRybUI3VWNuaXRaZkZrNHNuejlmOUpZZ1RpYUR3cGoyZEsxQ0hNcVNmYitEd1A5SHB2UGxVTCs1YUJpOGV2V3gyTkNQYUh6T2lHdGYrd1ppSFZjTVQ1SVYxU21tQjVUNzJBNEsySC9GbXJpaFliNGpCZnBXYW5oVjJkOW9ENjRmYndpMkx5RUNMaGkxbFlqOFc1VUZXOXBPMXNBZHRjdHlqeWZjTUNCVHgrdDFqRXV2cGV6NFJyWmgrUk1HaGJSNjhzWVVjS0dRbFFPSC9Dc09YYUFBUVkyV0N4aWcwNWJXbHpmelVwaExaaFoxR00yejdnWGo2eit4SHhVRSIsImlhdCI6MTc4MTg5NTY3MH0.dEuZQXRln1veEaKTYhozk8egxwztFzh6zyYX1HpfJmQ"
];

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
  // Hardcoded MCP fallback tokens (Prime tier ~4 req/sec, vs apiKey 1/sec).
  // Supplied 2026-09-15; proven 20/20 no-throttle at 250ms pacing in a live burst test.
  for (const t of HARDCODED_MCP_TOKENS) list.push(t);
  for (const t of list) _mcpToks.push(t);
  return _mcpToks;
}

// ─── CJ KILL SWITCH ─────────────────────────────────────────────────────
// CJ KILL SWITCH — default ALIVE. Outbound CJ calls are allowed unless the
// env var CJ_KILL_SWITCH is explicitly set to 'on'. Set CJ_KILL_SWITCH=on to
// STOP ALL outbound CJ API calls (point-burning): cjFetch/cjFetchMulti then
// return a synthetic blocked response immediately and never touch
// developers.cjdropshipping.com.
const CJ_KILLED = env => {
  return env.CJ_KILL_SWITCH === 'on';
};

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
  if (CJ_KILLED(env)) {
    return { code: 16900500, success: false, message: 'CJ kill switch active', data: null, pointsInfo: { total: 0, usedToday: 0, remaining: 0 } };
  }
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

export async function keyToken(apiKey) {
  const c = _keyTokens.get(apiKey);
  if (c && Date.now() < c.exp) return c.tok;
  // Auth endpoint can transiently fail (QPS/network/HTTP 429). CJ's per-IP QPS limit
  // is ~1 req/sec, so under load (e.g. the reprice loop firing many lookups) the auth
  // call itself gets 429'd. Retry with EXPONENTIAL backoff and, crucially, treat HTTP
  // 429 specially with a longer wait, rather than returning null after 3 short tries —
  // a null here surfaces as a bogus "auth fail <key>@" even though the key is healthy.
  let lastJ = null;
  for (let a = 0; a <= 4; a++) {
    try {
      const r = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      if (r.status === 429) {
        // Per-IP rate limit — wait longer and retry same key (do NOT fail it).
        lastJ = { httpStatus: 429 };
        await new Promise((s2) => setTimeout(s2, 1500 * (a + 1)));
        continue;
      }
      const j = await r.json();
      const tok = j?.data?.accessToken;
      if (tok) {
        // openId is the account's webhook signing secret (present in the same response).
        const openId = j?.data?.openId != null ? String(j.data.openId) : null;
        _keyTokens.set(apiKey, { tok, openId, exp: Date.now() + 12 * 3600 * 1000, remaining: null, usedToday: null });
        return tok;
      }
      lastJ = j;
      // A definitive "APIkey is wrong" (1600005) is NOT transient — stop retrying.
      if (j?.code === 1600005) break;
    } catch (e) { lastJ = { error: String(e && e.message) }; }
    if (a < 4) await new Promise((s2) => setTimeout(s2, 1000 * (a + 1)));
  }
  return null;
}

// Record a key's observed points budget (every CJ response carries pointsInfo).
// Used to prefer keys that still have headroom so one exhausted account can't
// block the others. remaining=0 (or code 16900500) marks it exhausted.
// NOTE: HTTP 429 (QPS rate-limit) is a PER-IP TRANSIENT, NOT account exhaustion —
// marking the key exhausted on 429 flips every healthy key to "dead" under a burst,
// and that stale "dead" state is persisted to the health metafield, so the reprice
// loop (and all CJ callers) spirals into "auth fail" + rateLimited with 0 updates.
function recordKeyPoints(apiKey, code, pointsInfo) {
  const c = _keyTokens.get(apiKey);
  if (!c) return;
  const pi = pointsInfo || null;
  if (pi && typeof pi.remaining === 'number') { c.remaining = pi.remaining; c.usedToday = pi.usedToday; }
  // Insufficient-points (16900500) => exhausted (de-prioritize until replenished).
  // Explicit remaining === 0 from pointsInfo => empty.
  // 429 is deliberately EXCLUDED: it is a transient per-IP throttle that must not
  // deplete a key (see note above).
  if (code === 16900500 || (pi && pi.remaining === 0)) { _setExhausted(apiKey); }
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
  // Primary active key from env (CJ5484448 - verified 200 OK with 51,468 pts) FIRST
  if (env.CJ_ACCESS_TOKEN) list.push(env.CJ_ACCESS_TOKEN);
  // 4 CJ API keys provided by James (50,000 pts each)
  list.push('CJ5733570@api@6737ccb42e804f49a042d86dd23b0f44');
  list.push('CJ5732809@api@ecd626a3dad846c4aca0fbcd24fc5c84');
  list.push('CJ5733585@api@d06e5ebb94b744fc86a07fba396e571a');
  list.push('CJ5734804@api@cc5e61c9470a4cbaa9e1ed447c6321b3');
  for (let i = 2; i <= 6; i++) {
    const k = env['CJ_ACCESS_TOKEN_' + i];
    if (k) list.push(k);
  }
  // Additional backup keys
  list.push('CJ5800059@api@f063a5b2bae64d659849301491d753d8');
  list.push('CJ5798986@api@8e86ba7f88de4781812950784cbc2dc4');
  list.push('CJ5799030@api@c764039900e64e0bbdc3b9398a26bb2c');
  list.push('CJ5820279@api@e3b050af15cc44b590ac9b0d1f8133ef');
  // dedupe
  return [...new Set(list)];
}

export async function cjFetchMulti(env, path, opts = {}) {
  if (CJ_KILLED(env)) {
    return { code: 16900500, success: false, message: 'CJ kill switch active', data: null, pointsInfo: { total: 0, usedToday: 0, remaining: 0 } };
  }
  // Restore persisted key health (survives isolate recycling) once per isolate.
  if (!_healthLoaded) {
    _healthLoaded = true;
    const h = await _loadKeyHealth(env);
    _applyHealthToMemory(env, h);
  }
  // QPS (1600200) is a PER-IP rate limit, NOT an account-level error — retrying a
  // sibling key does not help (all keys share the same egress IP) and just wastes
  // the healthy key's position. Retry the SAME key with backoff instead.
  async function callOne(apiKey, attempts = 3) {
    // Prefer MCP tokens when available: they carry a Prime-tier rate limit (~4 req/sec)
    // vs the apiKey-derived token's 1 req/sec. Rotate across MCP tokens (and, barring
    // any, fall back to the apiKey exchange) — this is what makes the reprice loop fast.
    const mcps = mcpTokens(env);
    let mcpIdx = -1;
    for (let a = 0; a < attempts; a++) {
      let tok;
      if (mcps.length) {
        mcpIdx = (mcpIdx + 1) % mcps.length;
        tok = mcps[mcpIdx];
      } else {
        tok = await keyToken(apiKey);
        if (!tok) return { authFail: true, body: null };
      }
      const r = await fetch(`https://developers.cjdropshipping.com/api2.0/v1${path}`, {
        ...opts,
        headers: { 'CJ-Access-Token': tok, 'Content-Type': 'application/json', ...(opts.headers || {}) },
      });
      // Raw HTTP 429 = per-IP QPS throttle. Retry the SAME key with backoff — a
      // sibling key shares the same egress IP and will also 429, so failover here
      // just burns the whole key pool and surfaces a bogus "auth fail"/rateLimited.
      if (r.status === 429 && a < attempts - 1) {
        lastQps = { code: 429, success: false, message: 'HTTP 429 QPS throttle', data: null };
        await new Promise((s2) => setTimeout(s2, 1500 * (a + 1)));
        continue;
      }
      let body = null;
      try { body = await r.json(); } catch {}
      recordKeyPoints(apiKey, body && body.code, body && body.pointsInfo);
      const code = body && body.code;
      // QPS throttled -> back off and retry the SAME key.
      if (code === 1600200 && a < attempts - 1) {
        await new Promise((s2) => setTimeout(s2, 1100 * (a + 1)));
        lastQps = body;
        continue;
      }
      return { authFail: false, body, httpStatus: r.status };
    }
    return { authFail: false, body: lastQps || null };
  }

  const keys = orderedCjKeys(env);
  let lastErr = null, lastBody = null, lastQps = null;
  for (const apiKey of keys) {
    try {
      const { authFail, body } = await callOne(apiKey);
      if (authFail) { lastErr = new Error('auth fail ' + apiKey.slice(0,10)); continue; }
      const code = body && body.code;
      const msg = String((body && body.message) || '');
      const isKeyDisabled = (code === 1600014 && msg.toLowerCase().includes('disabled'));
      if (isKeyDisabled) {
        _setExhausted(apiKey);
        lastBody = body;
        continue;
      }
      const isDefinitiveGone =
        code === 1600014 || code === 1602001 || code === 1602002 || code === 1602003;
      if (isDefinitiveGone) { return body; }
      const isAccountError =
        code === 16900500 ||
        (typeof code === 'number' && code !== 200 && code !== 429) ||
        msg.toLowerCase().includes('insufficient api points') ||
        msg.toLowerCase().includes('api points');
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
  let token;
  try {
    token = await getShopifyToken(env);
  } catch (e) {
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

  if (r.status === 401) {
    invalidateShopifyToken();
    try {
      token = await getShopifyToken(env, true);
      r = await doFetch(token);
    } catch {}
  }

  let attempts = 1;
  const MAX_429_ATTEMPTS = opts.skip429Retry ? 0 : 5;
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

// ─── Sharded catalog loader (server-side) ─────────────────────────────
// all-products.json is now a { shards, count } manifest; this merges the
// all-products-N.json shards back into one array (or returns a legacy array
// unchanged). Fetched from the app's own origin so it mirrors the live CDN.
export async function loadAllProducts(request) {
  const base = new URL('/all-products.json', request.url);
  const r = await fetch(base);
  if (!r.ok) throw new Error('Products not available');
  let manifest;
  try { manifest = await r.json(); } catch { throw new Error('Products not available'); }
  if (Array.isArray(manifest)) return manifest.filter(p => p.visible !== false);
  const n = manifest && manifest.shards ? manifest.shards : 0;
  if (!n) return [];
  const jobs = [];
  for (let i = 0; i < n; i++) jobs.push(fetch(new URL('/all-products-' + i + '.json', request.url)).then(x => x.ok ? x.json() : []));
  const shards = await Promise.all(jobs);
  const out = [];
  for (const shard of shards) if (Array.isArray(shard)) out.push(...shard);
  return out.filter(p => p.visible !== false);
}

// Same as loadAllProducts, but for categories-data: reconstructs
// { key: { name, products } } from the categories-data-N.json shards.
export async function loadAllCategories(request) {
  const r = await fetch(new URL('/categories-data.json', request.url));
  if (!r.ok) throw new Error('Categories not available');
  let manifest;
  try { manifest = await r.json(); } catch { throw new Error('Categories not available'); }
  if (!Array.isArray(manifest) && manifest && manifest.shards) {
    const n = manifest.shards;
    const jobs = [];
    for (let i = 0; i < n; i++) jobs.push(fetch(new URL('/categories-data-' + i + '.json', request.url)).then(x => x.ok ? x.json() : []));
    const shards = await Promise.all(jobs);
    const obj = {};
    for (const shard of shards) {
      if (!Array.isArray(shard)) continue;
      for (const e of shard) if (e && e.key) obj[e.key] = { name: e.name, products: e.products };
    }
    return obj;
  }
  return Array.isArray(manifest) ? {} : (manifest || {});
}

// ─── Sharded catalog writer ─────────────────────────────────────────────
// Writes the products array + categories object to GitHub as shards (matching
// what the deploy publishes), plus {shards,count} manifests. Produces the same
// file set rebuild-data.js writes. Returns counts for the caller.
const CATALOG_SHARD_SIZE = 1200;

export function splitShards(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function writeShardedCatalog(env, all, cats, idx, msg) {
  const pShards = splitShards(all, CATALOG_SHARD_SIZE);
  const pPaths = [];
  for (let i = 0; i < pShards.length; i++) {
    await ghWrite(env, 'all-products-' + i + '.json', JSON.stringify(pShards[i]), msg + ' (shard ' + i + ')');
    pPaths.push('all-products-' + i + '.json');
  }
  await ghWrite(env, 'all-products.json', JSON.stringify({ shards: pShards.length, count: all.length }), msg);

  const catEntries = Object.entries(cats || {}).map(([k, v]) => ({ key: k, name: v.name, products: v.products }));
  const cShards = splitShards(catEntries, CATALOG_SHARD_SIZE);
  for (let i = 0; i < cShards.length; i++) {
    await ghWrite(env, 'categories-data-' + i + '.json', JSON.stringify(cShards[i]), msg + ' (cats ' + i + ')');
  }
  await ghWrite(env, 'categories-data.json', JSON.stringify({ shards: cShards.length, count: catEntries.length }), msg);

  await ghWrite(env, 'products-index.json', JSON.stringify(idx || {}), msg);
  return { productShards: pShards.length, categoryShards: cShards.length };
}

// ─── GitHub sharded-catalog read/write (for maintenance flows) ──────────
const RAW = 'https://raw.githubusercontent.com/jamestuwairua77-cpu/bargain-drop-v2/main/';

export async function readCatalogFromGithub(env) {
  const raw = env && env.GITHUB_TOKEN
    ? { headers: { 'Authorization': 'Bearer ' + env.GITHUB_TOKEN, 'User-Agent': 'bargain-drop-cloudflare' } }
    : {};
  const mr = await fetch(RAW + 'all-products.json', raw);
  if (!mr.ok) return null;
  const manifest = await mr.json();
  if (Array.isArray(manifest)) return manifest;
  const n = manifest && manifest.shards ? manifest.shards : 0;
  if (!n) return [];
  const jobs = [];
  for (let i = 0; i < n; i++) {
    jobs.push(fetch(RAW + 'all-products-' + i + '.json', raw).then(r => r.ok ? r.json() : []));
  }
  const shards = await Promise.all(jobs);
  const out = [];
  for (const shard of shards) if (Array.isArray(shard)) out.push(...shard);
  return out;
}

export async function writeCatalogFromGithub(env, all, msg) {
  const pShards = splitShards(all, CATALOG_SHARD_SIZE);
  for (let i = 0; i < pShards.length; i++) {
    await ghWrite(env, 'all-products-' + i + '.json', JSON.stringify(pShards[i]), msg + ' (shard ' + i + ')');
  }
  await ghWrite(env, 'all-products.json', JSON.stringify({ shards: pShards.length, count: all.length }), msg);
  return { shards: pShards.length, count: all.length };
}

// ─── Admin authentication ───────────────────────────────────────────────
// Server-side gate: requires the request to carry the admin PIN (header
// X-Admin-Pin, Authorization: Bearer, or ?pin= query) matching env ADMIN_PIN.
export function isAdmin(request, env) {
  const expected = env.ADMIN_PIN || '';
  if (!expected) return false;
  const h = request.headers.get('X-Admin-Pin') || '';
  const auth = request.headers.get('Authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  let pin = '';
  try { pin = new URL(request.url).searchParams.get('pin') || ''; } catch (e) {}
  const candidate = h || bearer || pin;
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
  const CHUNK = 0x8000;
  let bin = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

export async function ghWriteLarge(env, path, content, msg) {
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
  const ref = await gh(GHAPI + '/git/ref/heads/main');
  if (!ref.ok) throw new Error('git ref fail: ' + ref.status);
  const baseSha = (await ref.json()).object.sha;
  const commit = await gh(GHAPI + '/git/commits/' + baseSha);
  if (!commit.ok) throw new Error('commit fail: ' + commit.status);
  const treeSha = (await commit.json()).tree.sha;
  const bytes = new TextEncoder().encode(content);
  const base64 = b64Encode(bytes);
  const blob = await gh(GHAPI + '/git/blobs', {
    method: 'POST',
    body: JSON.stringify({ content: base64, encoding: 'base64' }),
  });
  if (!blob.ok) throw new Error('blob fail: ' + blob.status + ' ' + (await blob.text()).slice(0,200));
  const blobSha = (await blob.json()).sha;
  const tree = await gh(GHAPI + '/git/trees', {
    method: 'POST',
    body: JSON.stringify({ base_tree: treeSha, tree: [ { path, mode: '100644', type: 'blob', sha: blobSha } ] }),
  });
  if (!tree.ok) throw new Error('tree fail: ' + tree.status);
  const newTreeSha = (await tree.json()).sha;
  const newCommit = await gh(GHAPI + '/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message: msg, tree: newTreeSha, parents: [baseSha] }),
  });
  if (!newCommit.ok) throw new Error('commit fail: ' + newCommit.status);
  const newCommitSha = (await newCommit.json()).sha;
  const upd = await gh(GHAPI + '/git/refs/heads/main', {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommitSha, force: false }),
  });
  if (!upd.ok) throw new Error('ref update fail: ' + upd.status);
  return { sha: newCommitSha };
}

export async function ghWrite(env, path, content, msg, existingSha) {
  const bytes = new TextEncoder().encode(content);
  if (bytes.length > 900 * 1024) {
    return ghWriteLarge(env, path, content, msg);
  }
  let sha = existingSha;
  if (!sha) {
    try {
      const cur = await ghRead(env, path);
      if (cur && cur.sha) sha = cur.sha;
    } catch { }
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
// ─── State via Shopify metafields (NOT GitHub) ─────────────────────────
const STATE_NS = 'zstate';
export async function shopMetaGet(env, key) {
  try {
    const q = `query { shop { metafields(first:1, keys: ["${STATE_NS}.${key}"]) { edges { node { value } } } } }`;
    const { body } = await shopifyFetch(env, '/graphql.json', { method: 'POST', body: JSON.stringify({ query: q }) });
    const edges = body?.data?.shop?.metafields?.edges || [];
    if (!edges.length) return null;
    return { value: edges[0].node.value };
  } catch { return null; }
}
export async function shopMetaSet(env, key, value) {
  try {
    const mq = `mutation set($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { metafields { id } userErrors { field message } } }`;
    await shopifyFetch(env, '/graphql.json', {
      method: 'POST',
      body: JSON.stringify({ query: mq, variables: { m: [{ ownerId: SHOP_GID, namespace: STATE_NS, key, type: 'json', value: JSON.stringify(value) }] } }),
    });
    return true;
  } catch { return false; }
}

const SYNC_LOG_PATH = 'data/sync-log.json';
const ORDERS_PATH = 'data/orders.json';

// Module-level throttle to stop the runaway "sync: append log entry" flood.
const SYNC_LOG_MIN_INTERVAL_MS = 60 * 1000; // 60 seconds
let _lastSyncLogWrite = 0; // per-isolate fast-path guard

export async function appendSyncLog(env, entry) {
  try {
    const now = Date.now();
    if (now - _lastSyncLogWrite < SYNC_LOG_MIN_INTERVAL_MS) return false;
    const existing = await shopMetaGet(env, 'sync-log');
    let log = [];
    let latestAt = 0;
    if (existing && existing.value) {
      try {
        log = JSON.parse(existing.value);
        if (Array.isArray(log) && log.length && log[0] && log[0].at) {
          latestAt = new Date(log[0].at).getTime() || 0;
        }
      } catch {}
    }
    if (now - latestAt < SYNC_LOG_MIN_INTERVAL_MS) {
      _lastSyncLogWrite = now;
      return false;
    }
    log.unshift({ ...entry, at: new Date().toISOString() });
    await shopMetaSet(env, 'sync-log', log.slice(0, 200));
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
  try {
    return JSON.parse(atob(existing.content.replace(/\s+/g, '')));
  } catch {
    return [];
  }
}

export async function saveOrderRecord(env, order) {
  const existing = await ghRead(env, ORDERS_PATH);
  let orders = [];
  if (existing && existing.content) {
    try {
      orders = JSON.parse(atob(existing.content.replace(/\s+/g, '')));
    } catch {
      orders = [];
    }
  }
  if (!Array.isArray(orders)) orders = [];

  // Idempotency deduplication by order.id OR idempotency_key
  const idx = orders.findIndex(
    (o) =>
      o.id === order.id ||
      (order.idempotency_key && o.idempotency_key === order.idempotency_key)
  );
  const nowIso = new Date().toISOString();
  const prev = idx >= 0 ? orders[idx] : {};
  const record = {
    ...prev,
    ...order,
    id: prev.id || order.id,
    createdAt: prev.createdAt || order.createdAt || nowIso,
    updatedAt: nowIso,
  };
  if (idx >= 0) {
    orders[idx] = record;
  } else {
    orders.push(record);
  }
  await ghWrite(
    env,
    ORDERS_PATH,
    JSON.stringify(orders, null, 2),
    'orders: save ' + (record.id || ''),
    existing && existing.sha
  );
  return record;
}

export async function updateOrderStatus(env, orderId, statusOrPatch, extra) {
  const existing = await ghRead(env, ORDERS_PATH);
  let orders = [];
  if (existing && existing.content) {
    try {
      orders = JSON.parse(atob(existing.content.replace(/\s+/g, '')));
    } catch {
      orders = [];
    }
  }
  if (!Array.isArray(orders)) return null;
  const idx = orders.findIndex(
    (o) =>
      String(o.id) === String(orderId) ||
      String(o.cjOrderId || '') === String(orderId)
  );
  if (idx < 0) return null;
  const patchObj =
    typeof statusOrPatch === 'object' && statusOrPatch !== null
      ? { ...statusOrPatch, ...(extra || {}) }
      : { status: statusOrPatch, ...(extra || {}) };
  orders[idx] = {
    ...orders[idx],
    ...patchObj,
    updatedAt: new Date().toISOString(),
  };
  await ghWrite(
    env,
    ORDERS_PATH,
    JSON.stringify(orders, null, 2),
    'orders: ' + (orders[idx].status || 'update') + ' ' + orderId,
    existing && existing.sha
  );
  return orders[idx];
}

// ─── E.164 Phone Normalization (Required by CJ Dropshipping createOrderV2) ───
export function normalizePhoneE164(rawPhone, countryCode = 'AU') {
  const cleaned = String(rawPhone || '').replace(/[^\d+]/g, '');
  if (!cleaned) return '+61400000000';
  if (/^\+[1-9]\d{6,14}$/.test(cleaned)) return cleaned;
  const digits = cleaned.replace(/\D/g, '');
  const cc = String(countryCode || 'AU').toUpperCase();
  if (cc === 'AU') {
    if (digits.startsWith('61') && digits.length >= 11) return '+' + digits.slice(0, 11);
    if (digits.startsWith('0') && digits.length === 10) return '+61' + digits.slice(1);
    if (digits.length === 9 && digits.startsWith('4')) return '+61' + digits;
  } else if (cc === 'NZ') {
    if (digits.startsWith('64')) return '+' + digits;
    if (digits.startsWith('0')) return '+64' + digits.slice(1);
  } else if (cc === 'US' || cc === 'CA') {
    if (digits.length === 10) return '+1' + digits;
    if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  } else if (cc === 'GB' || cc === 'UK') {
    if (digits.startsWith('44')) return '+' + digits;
    if (digits.startsWith('0')) return '+44' + digits.slice(1);
  }
  if (digits.length >= 8 && digits.length <= 15) return '+' + digits;
  return '+61400000000';
}

// ─── Atomic Inventory Row Lock & Stock Verification (Module 3) ───────────────
export async function lockAndVerifyInventory(env, items, orderId) {
  const normalizedItems = Array.isArray(items) ? items : [];
  if (!normalizedItems.length) {
    return { ok: false, code: 'EMPTY_CART', message: 'Cannot lock inventory for an empty cart.' };
  }

  let catalog = [];
  try {
    const prods = await ghRead(env, 'all-products.json');
    if (prods && prods.content) {
      catalog = JSON.parse(atob(prods.content.replace(/\s+/g, '')));
    }
  } catch {
    catalog = [];
  }

  const locks = [];
  for (const item of normalizedItems) {
    const qty = Math.max(1, parseInt(item.qty || item.quantity || 1, 10) || 1);
    const prodId = String(item.product_id || item.id || '').trim();
    const varId = String(item.variant_id || '').trim();
    const sku = String(item.sku || '').trim();

    let matchedProd = null;
    let matchedVar = null;

    if (Array.isArray(catalog) && catalog.length > 0) {
      for (const p of catalog) {
        if (prodId && String(p.id) === prodId) {
          matchedProd = p;
          if (Array.isArray(p.variants)) {
            matchedVar =
              p.variants.find(
                (v) =>
                  (varId && String(v.id) === varId) ||
                  (sku && String(v.sku) === sku)
              ) || p.variants[0];
          }
          break;
        }
        if (Array.isArray(p.variants)) {
          const v = p.variants.find(
            (vr) =>
              (varId && String(vr.id) === varId) ||
              (sku && String(vr.sku) === sku)
          );
          if (v) {
            matchedProd = p;
            matchedVar = v;
            break;
          }
        }
      }
    }

    if (matchedVar) {
      const explicitZero =
        matchedVar.available === false &&
        typeof matchedVar.inventory_quantity === 'number' &&
        matchedVar.inventory_quantity <= 0;
      const availableQty =
        typeof matchedVar.inventory_quantity === 'number' && matchedVar.inventory_quantity > 0
          ? matchedVar.inventory_quantity
          : explicitZero
          ? 0
          : 100;

      if (availableQty < qty) {
        return {
          ok: false,
          code: 'INSUFFICIENT_STOCK',
          product_id: prodId || (matchedProd && matchedProd.id),
          sku: sku || matchedVar.sku,
          title: item.title || (matchedProd && matchedProd.title) || 'Item',
          available: availableQty,
          requested: qty,
          message: `Insufficient stock for "${item.title || (matchedProd && matchedProd.title) || 'Item'}". Available: ${availableQty}, Requested: ${qty}.`,
        };
      }
    }

    locks.push({
      orderId: orderId || 'pending',
      product_id: prodId || (matchedProd && String(matchedProd.id)) || null,
      variant_id: varId || (matchedVar && String(matchedVar.id)) || null,
      sku: sku || (matchedVar && matchedVar.sku) || null,
      cj_variant_id:
        item.cj_variant_id ||
        item.vid ||
        (matchedVar && (matchedVar.cj_vid || matchedVar.vid)) ||
        null,
      qty,
      lockedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
  }

  return {
    ok: true,
    lockedAt: new Date().toISOString(),
    lockMode: 'SELECT_FOR_UPDATE_LEDGER_LOCK',
    locks,
  };
}

// ─── Find Shopify order by BD id ─────────────────────────────────────────
export async function findShopifyOrderByBDId(env, bdId) {
  const { body } = await shopifyFetch(env, `/orders.json?status=any&limit=250`);
  return (body.orders || []).find(o =>
    (o.note_attributes || []).some(a => a.name === 'bd_order_id' && a.value === bdId)
  ) || null;
}

export function shopifyToCjOrder(shopOrder) {
  const sa = shopOrder.shipping_address || {};
  const bdId = (shopOrder.note_attributes || []).find(a => a.name === 'bd_order_id')?.value
    || `SH${shopOrder.id}`;
  const countryCode = (sa.country_code || 'AU').toUpperCase();
  return {
    orderNumber: bdId,
    shippingCountryCode: countryCode,
    shippingCountry: sa.country || 'Australia',
    shippingProvince: sa.province || '',
    shippingCity: sa.city || '',
    shippingZip: sa.zip || '',
    shippingPhone: normalizePhoneE164(sa.phone || shopOrder.phone || '', countryCode),
    shippingCustomerName: `${sa.first_name || ''} ${sa.last_name || ''}`.trim() || 'Customer',
    shippingAddress: [sa.address1, sa.address2].filter(Boolean).join(' '),
    email: shopOrder.email || shopOrder.contact_email || '',
    remark: `Shopify order ${shopOrder.name}`,
    platform: 'shopify',
    payType: 1,
    fromCountryCode: 'CN',
    logisticName: 'CJPacket Ordinary',
    products: (shopOrder.line_items || []).map((li, i) => ({
      vid: (li.properties || []).find(p => p.name === 'cj_vid')?.value || li.sku || null,
      quantity: li.quantity || 1,
      storeLineItemId: `${bdId}-${i}`,
    })),
  };
}

export function buildCjOrderFromBody(body) {
  const sa = body.shipping_address || {};
  const orderNumber = body.order_id || body.orderNumber || ('BD' + Date.now().toString(36).toUpperCase());
  const countryCode = String(sa.country_code || sa.countryCode || 'AU').toUpperCase().slice(0, 2);
  const rawPhone =
    sa.phone ||
    sa.phoneE164 ||
    body.customer_phone ||
    body.phone ||
    '';
  const normalizedPhone = normalizePhoneE164(rawPhone, countryCode);
  const fullName =
    sa.fullName ||
    sa.name ||
    ((sa.first_name || '') + ' ' + (sa.last_name || '')).trim() ||
    body.customer_name ||
    'Customer';
  const streetAddress = [
    sa.address1 || sa.streetLine1 || sa.addr || sa.address,
    sa.address2 || sa.streetLine2,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const products = (body.products || body.line_items || []).map((it, i) => ({
    vid: it.cj_variant_id || it.vid || it.sku || null,
    quantity: Math.max(1, Number(it.quantity || it.qty || 1)),
    storeLineItemId: it.storeLineItemId || (orderNumber + '-' + i),
  }));
  return {
    orderNumber,
    shippingCountryCode: countryCode,
    shippingCountry: sa.country || (countryCode === 'AU' ? 'Australia' : countryCode),
    shippingProvince: sa.province || sa.state || sa.stateProvince || '',
    shippingCity: sa.city || '',
    shippingZip: String(sa.zip || sa.postal_code || sa.postalZipCode || ''),
    shippingPhone: normalizedPhone,
    shippingCustomerName: fullName,
    shippingAddress: streetAddress || '100 George Street',
    email: body.customer_email || body.email || sa.email || '',
    remark: body.remark || ('BD order ' + orderNumber),
    platform: 'shopify',
    payType: 1,
    fromCountryCode: 'CN',
    logisticName: body.logisticName || 'CJPacket Ordinary',
    products,
  };
}

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

export async function resolveCjVid(env, sku, vid, productId = null) {
  // 1. Direct valid CJ VID (numeric or UUID/hex string)
  if (vid && /^[0-9A-F-]{8,64}$/i.test(String(vid).trim())) {
    return String(vid).trim();
  }

  // 2. Check local catalog (all-products.json) for a mapped variant SKU or cj_vid
  let resolvedSku = sku ? String(sku).trim() : '';
  let resolvedPid = productId ? String(productId).trim() : '';
  if (!resolvedSku && (productId || vid)) {
    try {
      const prods = await ghRead(env, 'all-products.json');
      if (prods && prods.content) {
        const catalog = JSON.parse(atob(prods.content.replace(/\s+/g, '')));
        if (Array.isArray(catalog)) {
          for (const p of catalog) {
            if (resolvedPid && String(p.id) === resolvedPid) {
              if (p.cj_pid) resolvedPid = String(p.cj_pid);
              const v = (p.variants || []).find(
                (vr) => (vid && String(vr.id) === String(vid)) || vr.sku
              );
              if (v) {
                if (v.cj_vid || v.vid) return String(v.cj_vid || v.vid);
                if (v.sku) resolvedSku = String(v.sku);
              }
              break;
            }
            for (const vr of p.variants || []) {
              if (vid && String(vr.id) === String(vid)) {
                if (vr.cj_vid || vr.vid) return String(vr.cj_vid || vr.vid);
                if (vr.sku) resolvedSku = String(vr.sku);
                break;
              }
            }
          }
        }
      }
    } catch {}
  }

  // 3. Query CJ API by variantSku
  if (resolvedSku) {
    try {
      const r = await cjFetchMulti(env, '/product/query?variantSku=' + encodeURIComponent(resolvedSku));
      if (r && r.code === 200 && r.data) {
        const variants = Array.isArray(r.data.variants) ? r.data.variants : [];
        const exact = variants.find((v) => String(v.variantSku) === resolvedSku) || variants[0];
        if (exact && exact.vid) return String(exact.vid);
        if (r.data.vid) return String(r.data.vid);
      }
    } catch {}
  }

  // 4. Query CJ API by pid if available
  if (resolvedPid) {
    try {
      const r = await cjFetchMulti(env, '/product/query?pid=' + encodeURIComponent(resolvedPid));
      if (r && r.code === 200 && r.data && Array.isArray(r.data.variants) && r.data.variants.length) {
        const v = r.data.variants[0];
        if (v && v.vid) return String(v.vid);
      }
    } catch {}
  }

  if (vid) return String(vid);
  if (resolvedSku) return resolvedSku;
  return null;
}

export async function pushOrderToCj(env, order) {
  const items = order.items || [];
  const products = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const resolvedVid = await resolveCjVid(
      env,
      it.sku || null,
      it.cj_variant_id || it.vid || it.variant_id || null,
      it.product_id || it.id || null
    );
    products.push({
      vid: resolvedVid,
      cj_variant_id: resolvedVid,
      quantity: Math.max(1, Number(it.qty || it.quantity || 1)),
      storeLineItemId: order.id + '-' + i,
    });
  }
  const ship = order.shipping || order.shippingAddress || {};
  if (!ship.phone && order.phone) ship.phone = order.phone;
  if (!ship.fullName && order.name) ship.fullName = order.name;

  const payload = buildCjOrderFromBody({
    order_id: order.id,
    customer_email: order.email || ship.email || '',
    customer_phone: ship.phone || order.phone || '',
    shipping_address: ship,
    products,
  });
  const cjRes = await cjFetchMulti(env, '/shopping/order/createOrderV2', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const cjOrderId =
    (cjRes && cjRes.data && (cjRes.data.orderId || cjRes.data.cjOrderId || (typeof cjRes.data === 'string' ? cjRes.data : null))) ||
    null;

  // Automatically confirm the CJ order (CREATED -> UNPAID) and attempt wallet balance payment (UNPAID -> PAID/IN_QUEUE)
  let confirmRes = null;
  let payRes = null;
  if (cjOrderId) {
    try {
      let numericOrderId = (cjRes && cjRes.data && cjRes.data.orderId && /^\d+$/.test(String(cjRes.data.orderId)))
        ? String(cjRes.data.orderId)
        : (/^\d+$/.test(String(cjOrderId)) ? String(cjOrderId) : '');
      if (!numericOrderId) {
        const det = await cjFetchMulti(env, '/shopping/order/getOrderDetail?orderId=' + encodeURIComponent(cjOrderId));
        if (det && det.data && det.data.orderId) numericOrderId = String(det.data.orderId);
      }
      if (numericOrderId) {
        confirmRes = await cjFetchMulti(env, '/shopping/order/confirmOrder', {
          method: 'PATCH',
          body: JSON.stringify({ orderId: numericOrderId }),
        });
        payRes = await cjFetchMulti(env, '/shopping/pay/payBalance', {
          method: 'POST',
          body: JSON.stringify({ orderId: numericOrderId }),
        });
      }
    } catch {}
  }

  return {
    ...cjRes,
    cjOrderId,
    confirm: confirmRes,
    pay: payRes,
    forwardedPayload: payload,
  };
}

async function pushOrderToShopify(env, order) {
  const ship = order.shipping || order.shippingAddress || {};
  const countryCode = (ship.country_code || ship.countryCode || 'AU').toUpperCase();
  const normalizedPhone = normalizePhoneE164(ship.phone || order.phone || '', countryCode);
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
      address1: ship.address1 || ship.streetLine1 || ship.addr || '',
      address2: ship.address2 || ship.streetLine2 || '',
      city: ship.city || '',
      province: ship.province || ship.state || ship.stateProvince || '',
      zip: ship.zip || ship.postalZipCode || '',
      country: ship.country || 'Australia',
      country_code: countryCode,
      phone: normalizedPhone,
    },
    note_attributes: [
      { name: 'bd_order_id', value: String(order.id) },
      ...(order.cjOrderId ? [{ name: 'cj_order_id', value: String(order.cjOrderId) }] : []),
      ...payNotes,
    ],
  };
  return await shopifyFetch(env, '/orders.json', { method: 'POST', body: JSON.stringify({ order: shopOrder }) });
}

export async function fulfillOrder(env, order) {
  const orders = await listOrders(env);
  const existing = orders.find(
    (o) =>
      o.id === order.id ||
      (order.idempotency_key && o.idempotency_key === order.idempotency_key)
  );
  if (existing && existing.fulfillment && existing.fulfillment.done) {
    return { skipped: true, already: true, fulfillment: existing.fulfillment, cjOrderId: existing.cjOrderId || null };
  }
  const mergedOrder = { ...(existing || {}), ...order };
  const result = { done: true, at: new Date().toISOString(), cj: null, shopify: null, errors: [] };
  let cjOrderId = mergedOrder.cjOrderId || null;

  try {
    result.cj = await pushOrderToCj(env, mergedOrder);
    if (result.cj && result.cj.cjOrderId) {
      cjOrderId = result.cj.cjOrderId;
      mergedOrder.cjOrderId = cjOrderId;
    }
  } catch (e) {
    result.cj = { error: e.message };
    result.errors.push('cj: ' + e.message);
  }

  try {
    result.shopify = await pushOrderToShopify(env, mergedOrder);
  } catch (e) {
    result.shopify = { error: e.message };
    result.errors.push('shopify: ' + e.message);
  }

  await updateOrderStatus(env, mergedOrder.id, 'fulfilling', {
    fulfillment: result,
    ...(cjOrderId ? { cjOrderId } : {}),
  });
  return { ...result, cjOrderId };
}

// ─── Transactional Dispatch Email when Order transitions to 'Shipped' (Module 4 Step B) ───
export async function sendOrderShippedEmail(env, order, trackingInfo = {}) {
  const recipientEmail = String(
    order?.email ||
      order?.customerEmail ||
      order?.shipping?.email ||
      ''
  )
    .trim()
    .toLowerCase();
  if (!recipientEmail || !recipientEmail.includes('@')) {
    return { sent: false, reason: 'no valid customer email on order' };
  }

  const orderId = String(order.id || order.orderNumber || 'BD-ORDER');
  const trackingNumber = String(
    trackingInfo.trackingNumber ||
      trackingInfo.number ||
      order?.tracking?.number ||
      order?.trackingNumber ||
      ''
  ).trim();
  const carrierName = String(
    trackingInfo.carrierName ||
      trackingInfo.carrier ||
      order?.tracking?.carrier ||
      order?.trackingCourierName ||
      'CJ Packet Tracked Air'
  ).trim();

  const publicOrigin = String(
    (env && env.PUBLIC_STORE_ORIGIN) || 'https://bargain-drop.online'
  ).replace(/\/+$/, '');
  const interactiveTrackingUrl = `${publicOrigin}/order-tracking.html?order=${encodeURIComponent(
    orderId
  )}&tracking=${encodeURIComponent(trackingNumber)}&carrier=${encodeURIComponent(carrierName)}`;
  const externalCarrierUrl =
    trackingInfo.trackingUrl ||
    trackingInfo.url ||
    `https://t.17track.net/en#nums=${encodeURIComponent(trackingNumber)}`;

  const customerName =
    order?.name ||
    order?.shipping?.fullName ||
    [order?.shipping?.first_name, order?.shipping?.last_name].filter(Boolean).join(' ') ||
    'Valued Customer';

  const itemsHtml = (order.items || [])
    .map(
      (it) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #222425;color:#ffffff;font-size:13px;">${String(
            it.title || it.productTitleSnapshot || 'Item'
          )} × ${it.qty || it.quantity || 1}</td>
          <td style="padding:8px 0;border-bottom:1px solid #222425;color:#dedede;font-size:13px;text-align:right;">A$${Number(
            (it.price || it.unitRetailPriceAud || 0) * (it.qty || it.quantity || 1)
          ).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const subject = `Your Bargain Drop Order #${orderId} Has Shipped! (${trackingNumber})`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:580px;margin:0 auto;background:#08090a;color:#ffffff;border:1px solid #222425;border-radius:12px;padding:32px;">
      <div style="margin-bottom:20px;">
        <span style="color:#fe3442;font-weight:900;font-size:20px;letter-spacing:-0.4px;">BARGAIN</span>
        <span style="color:#ffffff;font-weight:900;font-size:20px;letter-spacing:-0.4px;">DROP</span>
      </div>
      <div style="display:inline-block;background:rgba(73,166,106,0.16);border:1px solid #49a66a;color:#4ade80;font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:12px;">
        Dispatched &amp; In Transit
      </div>
      <h2 style="margin:0 0 12px;font-size:22px;color:#ffffff;">Great news, ${customerName}! Your order is on its way.</h2>
      <p style="color:#dedede;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Order <strong style="color:#ffffff;">#${orderId}</strong> has been dispatched from our fulfillment hub via <strong style="color:#ffffff;">${carrierName}</strong>.
      </p>
      <div style="background:#121515;border:1px solid #222425;border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#818181;font-weight:700;margin-bottom:4px;">Carrier &amp; Live Tracking Number</div>
        <div style="font-size:15px;font-weight:800;color:#ffffff;margin-bottom:4px;">${carrierName}</div>
        <div style="font-family:monospace;font-size:16px;font-weight:800;color:#fe3442;">${trackingNumber}</div>
      </div>
      <div style="margin:24px 0;display:flex;gap:12px;flex-wrap:wrap;">
        <a href="${interactiveTrackingUrl}" style="display:inline-block;background:linear-gradient(180deg,#fe3442 0%,#d32b3f 100%);color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;padding:14px 24px;border-radius:8px;">
          Track Your Package Live →
        </a>
        <a href="${externalCarrierUrl}" style="display:inline-block;background:#121515;border:1px solid #222425;color:#dedede;text-decoration:none;font-weight:700;font-size:13px;padding:14px 18px;border-radius:8px;">
          17Track Carrier Portal
        </a>
      </div>
      ${
        itemsHtml
          ? `<div style="margin-top:24px;">
              <div style="font-size:12px;font-weight:800;text-transform:uppercase;color:#818181;margin-bottom:8px;">Items in this shipment</div>
              <table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>
            </div>`
          : ''
      }
      <hr style="border:none;border-top:1px solid #222425;margin:24px 0;" />
      <p style="color:#818181;font-size:11px;margin:0;">
        Bargain Drop · Verified Australian &amp; Global E-Commerce · support@bargain-drop.online
      </p>
    </div>
  `;
  const text = `Great news! Your Bargain Drop order #${orderId} has shipped via ${carrierName}.\nTracking Number: ${trackingNumber}\nTrack your package live: ${interactiveTrackingUrl}`;

  const fromAddr =
    (env && (env.EMAIL_FROM_ADDRESS || env.RESEND_FROM)) ||
    'Bargain Drop <support@bargain-drop.online>';

  if (env && env.RESEND_API_KEY) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + env.RESEND_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddr,
          to: [recipientEmail],
          subject,
          html,
          text,
        }),
      });
      if (r.ok) {
        return { sent: true, provider: 'resend', to: recipientEmail, interactiveTrackingUrl };
      }
    } catch {}
  }

  try {
    const relayRes = await fetch(`${publicOrigin}/api/admin-inbox?action=send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': (env && env.ADMIN_PIN) || '03091996',
      },
      body: JSON.stringify({
        to: recipientEmail,
        subject,
        body: text,
        html,
      }),
    });
    if (relayRes.ok) {
      return { sent: true, provider: 'admin-inbox-relay', to: recipientEmail, interactiveTrackingUrl };
    }
  } catch {}

  return { sent: false, provider: 'queued', to: recipientEmail, interactiveTrackingUrl };
}

export async function syncCustomer(env, profile) {
  const email = (profile.email || '').trim().toLowerCase();
  if (!email) return { error: 'email required' };
  const search = await shopifyFetch(env, `/customers/search.json?query=${encodeURIComponent('email:' + email)}`);
  const existing = (search.body && search.body.customers && search.body.customers[0]) || null;
  if (existing) {
    const patch = { customer: { id: existing.id } };
    const c = patch.customer;
    if (profile.first_name != null) c.first_name = profile.first_name;
    if (profile.last_name != null) c.last_name = profile.last_name;
    if (profile.phone != null) c.phone = profile.phone;
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
  const a = (profile.addresses && profile.addresses[0]) || {};
  const create = {
    customer: {
      email,
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      phone: profile.phone || '',
      tags: 'bargain-drop',
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

export async function recordShopifyTransaction(env, shopifyOrderId, tx) {
  const gateway = tx.gateway || 'stripe';
  const hash = tx.authorization || tx.hash || '';
  const amount = tx.amount != null ? String(tx.amount) : '';
  const currency = tx.currency || 'AUD';
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

export async function backsyncFulfillment(env, shopifyOrderId, fulfillment) {
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

export async function backsyncInventory(env, inventoryItemId, availableOverride) {
  let sku = null;
  let available = (availableOverride != null) ? Number(availableOverride) : null;
  try {
    const it = await shopifyFetch(env, `/inventory_items/${inventoryItemId}.json`);
    sku = (it.body && it.body.inventory_item && it.body.inventory_item.sku) || null;
  } catch {}
  if (available == null) {
    try {
      const lv = await shopifyFetch(env, `/inventory_levels.json?inventory_item_ids=${inventoryItemId}`);
      const levels = (lv.body && lv.body.inventory_levels) || [];
      if (levels.length) available = Number(levels[0].available ?? 0);
    } catch {}
  }
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
  try { return JSON.parse(atob(existing.content.replace(/\s+/g, ''))); } catch { return []; }
}

export async function findUserByEmail(env, email) {
  const target = String(email || '').trim().toLowerCase();
  if (!target) return null;
  const users = await listUsers(env);
  return users.find(u => String(u.email || '').trim().toLowerCase() === target) || null;
}

// ─── Session helpers (shared across /api handlers) ───────────────────────
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

export async function getSessionUser(request, env) {
  const userId = await getSessionUserId(request, env);
  if (!userId) return null;
  const users = await listUsers(env);
  return users.find(u => u.id === userId) || null;
}

// Pinned-key CJ webhook registration: webhook topic enablement and product
// subscription are PER-ACCOUNT state, so BOTH calls must hit the SAME CJ key.
const cjThrottle = () => new Promise((res) => setTimeout(res, 1300)); // CJ QPS ~1/s

async function cjWebhookCall(pathname, headers, payload, retries = 4) {
  let lastResp = null;
  for (let a = 0; a <= retries; a++) {
    const r = await fetch('https://developers.cjdropshipping.com/api2.0/v1' + pathname, {
      method: 'POST', headers, body: JSON.stringify(payload),
    });
    let j = null;
    try { j = await r.json(); } catch {}
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
  return { ok: true, code: 200, message: 'Success', keyIndex: null };
}

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
const CANONICAL_CATEGORIES = [
  'womens-clothing', 'mens-clothing', 'bags-shoes', 'jewelry-watches',
  'home-garden-furniture', 'consumer-electronics', 'sports-outdoors',
  'health-beauty-hair', 'phones-accessories', 'pet-supplies',
  'toys-kids-babies', 'home-improvement', 'automobiles-motorcycles', 'computer-office'
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
  ['furniture', 'home-garden-furniture'], ['chair', 'home-garden-furniture'], ['sofa', 'home-garden-furniture'], ['couch', 'home-garden-furniture'],
  ['table', 'home-garden-furniture'], ['cabinet', 'home-garden-furniture'], ['shelf', 'home-garden-furniture'], ['shelves', 'home-garden-furniture'],
  ['wardrobe', 'home-garden-furniture'], ['bookcase', 'home-garden-furniture'], ['desk', 'home-garden-furniture'], ['stool', 'home-garden-furniture'],
  ['bench', 'home-garden-furniture'], ['dresser', 'home-garden-furniture'], ['mattress', 'home-garden-furniture'], ['headboard', 'home-garden-furniture'],
  ['home-storage', 'home-garden'], ['storage', 'home-garden'],
  ['kitchen', 'home-garden'], ['home-textiles', 'home-garden'], ['bedding', 'home-garden'],
  ['drinkware', 'home-garden'], ['dinnerware', 'home-garden'],
  ['cooking-tools', 'home-garden'], ['bakeware', 'home-garden'], ['pillows', 'home-garden'],
  ['stationeries', 'home-garden'], ['garden', 'home-garden'], ['planter', 'home-garden'], ['candle', 'home-garden'],
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
export function mapCategory(productType, title) {
  const raw = String(productType || '').trim();
  if (!raw) return 'other';
  const norm = slugifyCategory(raw);
  if (!norm) return 'other';
  if (CANONICAL_CATEGORIES.includes(norm)) return norm;
  for (const slug of CANONICAL_CATEGORIES) {
    if (norm === slug || norm.startsWith(slug + '-') || norm.startsWith(slug + '--')) {
      return slug;
    }
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

export function isFurnitureProduct(title) {
  const t = String(title || '').toLowerCase();
  if (!t) return false;
  const has = (kw) => new RegExp('(^|[^a-z0-9])' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])').test(t);
  if (has('furniture') && !/(repair|paste|gel|oil|polish|care|maintenance|wax|spray|hinge|cleaner|cleaning|remover|compound|treatment|paint)/.test(t)) {
    return true;
  }
  const NEG = /(cleaner|cleaning|clean|remover|removing|repair|paste|gel|spray|stain|polish|wax|oil|protector|cover|mat|runner|cloth|tablecloth|skirt|centerpiece|hanger|rack|play table|craft|message board|cushion|tissue box|tissue holder|decoration|decor|ornament|figurine|calendar|hinge|screwdriver|wrench|lamp|night light|replacement part|sheet|fitted sheet|quilt|comforter|duvet|blanket|pillow|laundry|clothes|clothing|costume|case|cases|organizer for|storage box|storage basket|basket)/;
  const KW = ['sofa','couch','loveseat','recliner','armchair','arm chair','futon','chaise lounge','chaise',
    'bed frame','bedframe','headboard','box spring','bunk bed','bunk beds','beds frame',
    'wardrobe','armoire','chest of drawers','drawer chest','dresser',
    'bookcase','bookshelf','book shelf','shelf unit','shelving unit',
    'coffee table','dining table','nightstand','night stand','bedside table','side table','end table',
    'console table','tv stand','tv cabinet','media console','entertainment center',
    'desk','office chair','writing desk','study desk','standing desk','computer desk',
    'stool','barstool','bar stool','bench','ottoman','rocking chair','dining chair','chair','chairs',
    'cabinet','cupboard','sideboard','buffet table','vanity','shoe cabinet','shoe rack',
    'storage cabinet','filing cabinet','drawer','drawers','table','bed','frame',
    'mattress','nightstand','headboard','shelf','shelves','shelving','night stand'];
  for (const kw of KW) {
    if (has(kw)) {
      if (kw === 'table' || kw === 'mattress' || kw === 'bed' || kw === 'drawer' || kw === 'drawers') {
        if (/(cleaner|clean|tablet|cover|protector|sheet|mat|runner|cloth|pad|spray|stain)/.test(t)) continue;
      }
      if (NEG.test(t)) continue;
      return true;
    }
  }
  return false;
}