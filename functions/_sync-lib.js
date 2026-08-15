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

  const base64 = b64Encode(bytes);
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
const ORDERS_PATH = 'data/orders.json';

// ─── Durable order ledger (GitHub-backed, same mechanism as sync log) ────
export async function listOrders(env) {
  const existing = await ghRead(env, ORDERS_PATH);
  if (!existing || !existing.content) return [];
  try { return JSON.parse(atob(existing.content)); } catch { return []; }
}

export async function saveOrderRecord(env, order) {
  const orders = await listOrders(env);
  const idx = orders.findIndex(o => o.id === order.id);
  const record = { ...order, updatedAt: new Date().toISOString() };
  if (idx >= 0) { orders[idx] = record; } else { orders.push(record); }
  await ghWrite(env, ORDERS_PATH, JSON.stringify(orders, null, 2), 'orders: save ' + (order.id || ''));
  return record;
}

export async function updateOrderStatus(env, orderId, status, extra) {
  const orders = await listOrders(env);
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx < 0) return null;
  orders[idx] = { ...orders[idx], status, ...(extra || {}), updatedAt: new Date().toISOString() };
  await ghWrite(env, ORDERS_PATH, JSON.stringify(orders, null, 2), 'orders: ' + status + ' ' + orderId);
  return orders[idx];
}

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

// ─── Server-side fulfillment: push a paid order to CJ + Shopify (idempotent) ──
async function pushOrderToCj(env, order) {
  const payload = buildCjOrderFromBody({
    order_id: order.id,
    customer_email: order.email || (order.shipping && order.shipping.email) || '',
    shipping_address: order.shipping || {},
    products: (order.items || []).map((it, i) => ({
      vid: it.sku || it.vid || null,
      quantity: it.qty || it.quantity || 1,
      storeLineItemId: order.id + '-' + i,
    })),
  });
  return await cjFetch(env, '/order/createOrderV2', { method: 'POST', body: JSON.stringify(payload) });
}

async function pushOrderToShopify(env, order) {
  const ship = order.shipping || {};
  const shopOrder = {
    email: order.email || ship.email || '',
    financial_status: 'pending',
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
    note_attributes: [{ name: 'bd_order_id', value: String(order.id) }],
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

// ─── Mark a Shopify order as paid via a transaction, with gateway details ─
export async function recordShopifyTransaction(env, shopifyOrderId, tx) {
  // tx: { amount, currency, gateway, kind, status, authorization, source? }
  const payload = {
    transaction: {
      amount: tx.amount ?? 0,
      currency: tx.currency || 'AUD',
      gateway: tx.gateway || 'stripe',
      kind: tx.kind || 'sale',
      status: tx.status || 'success',
      authorization: tx.authorization || null,   // transaction hash from gateway
      test: false,
      source_name: 'bargain-drop',
      processed_at: tx.processed_at || new Date().toISOString(),
    },
  };
  return await shopifyFetch(env, `/orders/${shopifyOrderId}/transactions.json`, { method: 'POST', body: JSON.stringify(payload) });
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
export async function backsyncInventory(env, inventoryItemId, available) {
  // Map inventory_item_id → variant SKU via Shopify product/variant lookup is non-trivial
  // while the webhook payload itself carries inventory_item_id only.
  // We follow Shopify's recommended flow: use inventory_levels/connect or read the item.
  const il = await shopifyFetch(env, `/inventory_levels.json?inventory_item_ids=${inventoryItemId}`);
  const levels = (il.body && il.body.inventory_levels) || [];
  // levels carry location + available but not SKU directly; SKU lives on the variant.
  // Fall back to fetching the item to get variant_id.
  const item = await shopifyFetch(env, `/inventory_items/${inventoryItemId}.json`);
  const variantId = (item.body && item.body.inventory_item && item.body.inventory_item.variant_id) || null;
  if (!variantId) return { error: 'no variant_id for inventory item ' + inventoryItemId };

  const v = await shopifyFetch(env, `/variants/${variantId}.json`);
  const variant = (v.body && v.body.variant) || {};
  const sku = variant.sku || null;
  const inventory_quantity = available;

  await appendSyncLog(env, { action: 'back-sync-inventory', inventoryItemId, variantId, sku, available });

  if (!sku) return { error: 'no sku for variant ' + variantId, available };

  // Update the BD catalog file (all-products.json) `available` flag for this SKU
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
        // also update inventory_quantity if present
        vr.inventory_quantity = available;
        if (available <= 0) {
          if (p.inventory_quantity != null) p.inventory_quantity = Math.max(0, (p.inventory_quantity || 0) - 1);
        }
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
