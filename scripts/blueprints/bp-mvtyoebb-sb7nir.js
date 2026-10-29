import { corsHeaders } from '../../_sync-lib.js';

const EXPECTED_PIN = '03091996';
const MASTER_ORDERS_KEY = 'bargain_drop_master_orders';
const RATE_LIMIT_PREFIX = 'bd_admin_pin_rl:';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const memoryRateMap = new Map();

function getClientIp(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    (request.headers.get('X-Forwarded-For') || '').split(',')[0].trim() ||
    'unknown'
  );
}

async function getRateState(env, ip) {
  const now = Date.now();
  if (env && env.PRODUCT_DATA) {
    try {
      const raw = await env.PRODUCT_DATA.get(RATE_LIMIT_PREFIX + ip);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.lockedUntil && parsed.lockedUntil > now) return parsed;
        if (parsed.lockedUntil && parsed.lockedUntil <= now) {
          return { attempts: 0, lockedUntil: 0 };
        }
        return parsed;
      }
    } catch {}
  }
  const mem = memoryRateMap.get(ip);
  if (mem) {
    if (mem.lockedUntil && mem.lockedUntil <= now) {
      memoryRateMap.delete(ip);
      return { attempts: 0, lockedUntil: 0 };
    }
    return mem;
  }
  return { attempts: 0, lockedUntil: 0 };
}

async function saveRateState(env, ip, state) {
  memoryRateMap.set(ip, state);
  if (env && env.PRODUCT_DATA) {
    try {
      await env.PRODUCT_DATA.put(RATE_LIMIT_PREFIX + ip, JSON.stringify(state), {
        expirationTtl: 1800,
      });
    } catch {}
  }
}

async function fetchAllCustomerOrders(env) {
  const byId = new Map();

  function addOrder(raw, fallbackEmail = '') {
    if (!raw || typeof raw !== 'object') return;
    const id = String(raw.id || raw.orderId || raw.order_number || '').trim();
    if (!id) return;
    const cust = raw.customer || {};
    const customerName =
      raw.customerName ||
      cust.name ||
      [cust.first_name, cust.last_name].filter(Boolean).join(' ') ||
      raw.name ||
      'Store Customer';
    const customerEmail =
      raw.customerEmail || cust.email || raw.email || fallbackEmail || 'customer@bargain-drop.online';
    const totalAmount = Number(
      raw.totalAmount != null ? raw.totalAmount : raw.total != null ? raw.total : raw.total_price || 0
    );
    const status = String(raw.status || raw.fulfillment_status || 'Processing');
    const createdAt = raw.createdAt || raw.placedAt || raw.date || raw.created_at || new Date().toISOString();
    const items = Array.isArray(raw.items || raw.line_items) ? raw.items || raw.line_items : [];
    const shippingAddress =
      raw.shippingAddress ||
      cust.address ||
      (raw.shipping_address
        ? [raw.shipping_address.address1, raw.shipping_address.city, raw.shipping_address.zip]
            .filter(Boolean)
            .join(', ')
        : '');

    byId.set(id, {
      orderId: id,
      customerName,
      customerEmail,
      totalAmount: Number(totalAmount.toFixed(2)),
      status,
      createdAt,
      shippingAddress,
      itemsCount: items.reduce((s, it) => s + Number(it.quantity || it.qty || 1), 0) || 1,
      items: items.map((it) => ({
        title: it.title || (it.product && it.product.title) || 'Order Item',
        quantity: Number(it.quantity || it.qty || 1),
        price: Number(it.price || (it.product && it.product.price) || 0),
      })),
    });
  }

  if (env && env.PRODUCT_DATA) {
    try {
      const masterRaw = await env.PRODUCT_DATA.get(MASTER_ORDERS_KEY);
      if (masterRaw) {
        const arr = JSON.parse(masterRaw);
        if (Array.isArray(arr)) arr.forEach((o) => addOrder(o));
      }
    } catch {}

    try {
      const listRes = await env.PRODUCT_DATA.list({ prefix: 'order:' });
      for (const k of (listRes && listRes.keys) || []) {
        try {
          const val = await env.PRODUCT_DATA.get(k.name);
          if (val) addOrder(JSON.parse(val));
        } catch {}
      }
    } catch {}
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function onRequest(context) {
  const { request, env } = context;
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    ...corsHeaders(),
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  const ip = getClientIp(request);
  const rateState = await getRateState(env, ip);
  const now = Date.now();

  if (rateState.lockedUntil && rateState.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((rateState.lockedUntil - now) / 1000);
    return new Response(
      JSON.stringify({
        ok: false,
        locked: true,
        retryAfterSeconds,
        error: `Too many failed PIN attempts. Locked out for ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
      }),
      { status: 429, headers }
    );
  }

  let body = {};
  if (request.method === 'POST') {
    try {
      body = await request.json();
    } catch {}
  }

  const url = new URL(request.url);
  const submittedPin = String(
    body.pin ||
      request.headers.get('X-Admin-Pin') ||
      url.searchParams.get('pin') ||
      ''
  ).trim();

  const expectedPin = String((env && env.ADMIN_PIN) || EXPECTED_PIN).trim();

  if (!submittedPin || submittedPin !== expectedPin) {
    const attempts = (rateState.attempts || 0) + 1;
    const lockedUntil = attempts >= MAX_ATTEMPTS ? now + LOCKOUT_MS : 0;
    await saveRateState(env, ip, { attempts, lockedUntil });

    if (lockedUntil) {
      return new Response(
        JSON.stringify({
          ok: false,
          locked: true,
          attemptsRemaining: 0,
          retryAfterSeconds: 900,
          error: 'Maximum PIN attempts exceeded (5/5). IP locked for 15 minutes.',
        }),
        { status: 429, headers }
      );
    }

    return new Response(
      JSON.stringify({
        ok: false,
        locked: false,
        attemptsRemaining: Math.max(0, MAX_ATTEMPTS - attempts),
        error: `Invalid PIN. ${Math.max(0, MAX_ATTEMPTS - attempts)} attempt(s) remaining before 15-minute lockout.`,
      }),
      { status: 401, headers }
    );
  }

  await saveRateState(env, ip, { attempts: 0, lockedUntil: 0 });

  if (body.action === 'update_status' && body.orderId && body.status) {
    const orders = await fetchAllCustomerOrders(env);
    const updated = orders.map((o) =>
      o.orderId === body.orderId ? { ...o, status: String(body.status) } : o
    );
    if (env && env.PRODUCT_DATA) {
      try {
        await env.PRODUCT_DATA.put(MASTER_ORDERS_KEY, JSON.stringify(updated));
      } catch {}
    }
    return new Response(
      JSON.stringify({ ok: true, orders: updated, totalOrders: updated.length }),
      { status: 200, headers }
    );
  }

  const orders = await fetchAllCustomerOrders(env);
  return new Response(
    JSON.stringify({
      ok: true,
      stack: {
        runtime: 'Cloudflare Pages Functions + Node.js/Express Hybrid',
        database: 'Cloudflare KV (PRODUCT_DATA) + JSON Ledger Store',
        rateLimiter: '5 attempts / 15-minute IP lockout',
      },
      totalOrders: orders.length,
      orders,
    }),
    { status: 200, headers }
  );
}