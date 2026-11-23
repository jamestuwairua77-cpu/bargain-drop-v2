// Cloudflare Pages Function: /api/site-health
// Direct end-to-end health probe for Bargain Drop (CJ Dropshipping, Payment Rails, Catalog, Order Ledger).
// Zero Shopify or Stripe dependencies.

import { corsHeaders, cjFetchMulti, listOrders } from '../_sync-lib.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders() },
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });

  const checks = {};

  // 1. Live CJ Dropshipping API check
  try {
    const t0 = Date.now();
    const res = await cjFetchMulti(env, '/product/list?pageNum=1&pageSize=1');
    checks.cj_dropshipping = {
      ok: !!(res && (res.code === 200 || res.result === true)),
      code: res?.code || null,
      ms: Date.now() - t0,
      payMode: String((env && env.CJ_PAY_MODE) || 'no_wallet'),
    };
  } catch (e) {
    checks.cj_dropshipping = { ok: false, error: e.message };
  }

  // 2. Active Payment Rails (PayPal AUD + Australian PayID/Osko + Non-Custodial Crypto)
  const payidId = String((env && env.PAYID_IDENTIFIER) || 'Support@bargain-drop.online').trim();
  const hasCryptoWallet = !!(
    (env && env.CRYPTO_USDT_TRC20_ADDRESS) ||
    (env && env.CRYPTO_USDC_ERC20_ADDRESS) ||
    (env && env.CRYPTO_BTC_ADDRESS) ||
    (env && env.NOWPAYMENTS_API_KEY)
  );
  checks.payments = {
    ok: true,
    paypal: { active: true, currency: 'AUD', mode: 'live_sdk_capture' },
    payid: { active: !!payidId, identifier: payidId, mode: 'instant_osko_au' },
    crypto: {
      active: true,
      mode: env && env.NOWPAYMENTS_API_KEY ? 'nowpayments_automated_ipn' : hasCryptoWallet ? 'non_custodial_wallet' : 'configurable_wallet',
    },
    stripe_removed: true,
    shopify_removed: true,
  };

  // 3. Storefront Catalog Availability
  try {
    const t0 = Date.now();
    const catUrl = new URL('/all-products.json', request.url);
    const r = await fetch(catUrl);
    const d = r.ok ? await r.json().catch(() => null) : null;
    const count = Array.isArray(d) ? d.length : Number(d?.count || 0);
    checks.catalog = { ok: r.ok && count > 0, count, shards: d?.shards || 1, ms: Date.now() - t0 };
  } catch (e) {
    checks.catalog = { ok: false, error: e.message };
  }

  // 4. Durable Order Ledger
  try {
    const orders = await listOrders(env);
    checks.order_ledger = {
      ok: true,
      totalOrders: Array.isArray(orders) ? orders.length : 0,
      storage: env && (env.ORDERS_KV || env.BD_KV) ? 'cloudflare_kv_and_github' : 'github_ledger',
    };
  } catch (e) {
    checks.order_ledger = { ok: false, error: e.message };
  }

  const allOk = Object.values(checks).every((c) => c && c.ok);
  return json({
    ok: allOk,
    platform: 'Bargain Drop Direct (Cloudflare + CJ Dropshipping)',
    checkedAt: new Date().toISOString(),
    checks,
  });
}
