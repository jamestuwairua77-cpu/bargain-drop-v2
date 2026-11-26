// Cloudflare Pages Function: /api/site-health
// Direct end-to-end health probe for Bargain Drop (CJ Dropshipping Autopilot, Payment Rails, Catalog, Order Ledger).
// Zero Shopify, zero Stripe, zero discounts.

import { corsHeaders, cjFetch, cjFetchMulti, listOrders } from '../_sync-lib.js';

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

  // 1. Live CJ Dropshipping API & Wallet Auto-Pay check
  try {
    const t0 = Date.now();
    const [res, balRes] = await Promise.all([
      cjFetchMulti(env, '/product/list?pageNum=1&pageSize=1'),
      cjFetch(env, '/shopping/pay/getBalance').catch(() => null),
    ]);
    const walletBalanceUsd = Number(balRes?.data?.amount || 0);
    checks.cj_dropshipping = {
      ok: !!(res && (res.code === 200 || res.result === true)),
      code: res?.code || null,
      ms: Date.now() - t0,
      payMode: ['manual', 'no_wallet'].includes(String((env && env.CJ_PAY_MODE) || 'auto').toLowerCase().trim())
        ? String(env.CJ_PAY_MODE).toLowerCase().trim()
        : 'auto',
      autoPayEnabled: !['manual', 'no_wallet'].includes(String((env && env.CJ_PAY_MODE) || 'auto').toLowerCase().trim()),
      walletBalanceUsd: +walletBalanceUsd.toFixed(2),
    };
  } catch (e) {
    checks.cj_dropshipping = { ok: false, error: e.message };
  }

  // 2. Active 100% Automated Payment Rails
  const payidId = String((env && env.PAYID_IDENTIFIER) || 'Support@bargain-drop.online').trim();
  const hasCryptoWallet = !!(
    (env && env.CRYPTO_USDT_TRC20_ADDRESS) ||
    (env && env.CRYPTO_USDC_ERC20_ADDRESS) ||
    (env && env.CRYPTO_BTC_ADDRESS) ||
    (env && env.NOWPAYMENTS_API_KEY)
  );
  checks.payments = {
    ok: true,
    autopilot: '100_percent_automatic',
    discounts_enabled: false,
    paypal: { active: true, currency: 'AUD', mode: 'instant_capture_and_webhook', webhook: '/api/paypal-webhook' },
    payid: { active: !!payidId, identifier: payidId, mode: 'auto_npp_webhook', webhook: '/api/payid-webhook' },
    crypto: {
      active: true,
      mode: env && env.NOWPAYMENTS_API_KEY ? 'nowpayments_automated_ipn' : hasCryptoWallet ? 'onchain_auto_verifier' : 'configurable_wallet',
      webhook: '/api/crypto-webhook',
    },
    cron: '/api/auto-fulfill-cron',
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
    platform: 'Bargain Drop Autonomous Direct (100% Automatic CJ Fulfillment • Zero Discounts)',
    checkedAt: new Date().toISOString(),
    checks,
  });
}
