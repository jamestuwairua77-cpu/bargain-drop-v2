// Shared helpers for CJ↔Shopify sync — Cloudflare Workers edition.
// All Node.js built-ins (fs, crypto, Buffer) replaced with Web APIs.

// ─── Environment ─────────────────────────────────────────────────────────
// In Cloudflare Pages Functions, env vars are accessed via context.env
// This module receives env when called from the handler.

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
let _cjToken = null, _cjExp = 0;

export async function cjToken(env) {
  if (_cjToken && Date.now() < _cjExp) return _cjToken;
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

export async function shopifyFetch(env, path, opts = {}) {
  const SHOPIFY_TOKEN = env.SHOPIFY_ACCESS_TOKEN || env.SHOPIFY_TOKEN || '';
  const SHOPIFY_DOMAIN = env.SHOPIFY_DOMAIN || 'bargain-drop-8194.myshopify.com';
  if (!SHOPIFY_TOKEN) throw new Error('SHOPIFY_ACCESS_TOKEN not configured');
  const r = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2025-10${path}`, {
    ...opts,
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_TOKEN,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const text = await r.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  return { ok: r.ok, status: r.status, body };
}

// ─── CORS headers helper ─────────────────────────────────────────────────
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Shopify-Hmac-Sha256, X-Shopify-Topic',
  };
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

export async function ghWrite(env, path, content, msg, existingSha) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const base64 = btoa(String.fromCharCode(...data));
  const body = {
    message: msg,
    content: base64,
    branch: 'main',
  };
  if (existingSha) body.sha = existingSha;
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

export async function appendSyncLog(env, entry) {
  try {
    const existing = await ghRead(env, SYNC_LOG_PATH);
    let log = [];
    if (existing && existing.content) {
      const decoded = atob(existing.content);
      log = JSON.parse(decoded);
    }
    log.unshift({ ...entry, at: new Date().toISOString() });
    await ghWrite(env, SYNC_LOG_PATH, JSON.stringify(log.slice(0, 200), null, 2),
      'sync: append log entry', existing?.sha);
  } catch (e) {
    console.error('appendSyncLog failed:', e.message);
  }
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
    platform: 'custom',
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
