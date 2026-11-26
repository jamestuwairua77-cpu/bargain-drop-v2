// Cloudflare Pages Function: /api/auto-fulfill-cron
// 100% Autonomous End-to-End Autopilot Engine:
//   1. Auto-verifies pending crypto orders on-chain (Tronscan TRC20 / Blockstream BTC / Public RPC USDC)
//   2. Auto-pushes any paid order missing a CJ Order ID to CJ Dropshipping
//   3. Auto-pays queued CJ orders via /shopping/pay/payBalance the instant CJ Wallet has funds (zero clicks!)
//   4. Auto-syncs live CJ courier tracking numbers & fires shipped tracking emails to customers

import { corsHeaders, isAdmin, adminDenied, runFullAutopilotCycle, cjFetch } from '../_sync-lib.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders() },
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });

  const url = new URL(request.url);
  const cronKey = url.searchParams.get('key') || request.headers.get('x-cron-key') || '';
  const expectedCronKey = String((env && env.AUTOPILOT_CRON_SECRET) || '').trim();
  const isCronAuthorized =
    (expectedCronKey ? cronKey === expectedCronKey : url.searchParams.get('cron') === '1') ||
    isAdmin(request, env);

  if (!isCronAuthorized) return adminDenied();

  try {
    const [cycleReport, balRes] = await Promise.all([
      runFullAutopilotCycle(env),
      cjFetch(env, '/shopping/pay/getBalance').catch(() => null),
    ]);
    const cjWalletBalanceUsd = Number(balRes?.data?.amount || 0);
    const rawPayMode = String((env && env.CJ_PAY_MODE) || 'auto').toLowerCase().trim();
    const normalizedPayMode = rawPayMode === 'manual' || rawPayMode === 'no_wallet' ? rawPayMode : 'auto';
    return json({
      ok: true,
      mode: '100_percent_automatic',
      cjPayMode: normalizedPayMode,
      cjWalletBalanceUsd: +cjWalletBalanceUsd.toFixed(2),
      cycle: cycleReport,
    });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
