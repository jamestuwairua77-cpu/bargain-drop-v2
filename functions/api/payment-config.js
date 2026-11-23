// Cloudflare Pages Function: /api/payment-config
// Returns public, non-secret checkout payment options:
// 1) PayPal Checkout (AUD — PayPal balance, Debit/Credit Card, Pay in 4)
// 2) Australian PayID / Osko Instant Bank Transfer (Zero processor bans, zero card fees)
// 3) Non-Custodial Crypto Checkout (USDT TRC20, USDC ERC20, BTC — direct wallet OR automated NOWPayments IPN)

import { corsHeaders } from '../_sync-lib.js';

let _rateCache = null;
let _rateCacheAt = 0;

async function fetchLiveAudCryptoRates() {
  const now = Date.now();
  if (_rateCache && now - _rateCacheAt < 5 * 60 * 1000) return _rateCache;
  const fallback = {
    source: 'fallback_aud_estimate',
    audPerUsdt: 1.54,
    audPerUsdc: 1.54,
    audPerBtc: 148000,
    updatedAt: new Date().toISOString(),
  };
  try {
    const r = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=tether,usd-coin,bitcoin&vs_currencies=aud',
      { headers: { Accept: 'application/json', 'User-Agent': 'bargain-drop-checkout' } }
    );
    if (!r.ok) return _rateCache || fallback;
    const d = await r.json();
    const audPerUsdt = Number(d?.tether?.aud) || fallback.audPerUsdt;
    const audPerUsdc = Number(d?.['usd-coin']?.aud) || fallback.audPerUsdc;
    const audPerBtc = Number(d?.bitcoin?.aud) || fallback.audPerBtc;
    _rateCache = {
      source: 'coingecko_live',
      audPerUsdt,
      audPerUsdc,
      audPerBtc,
      updatedAt: new Date().toISOString(),
    };
    _rateCacheAt = now;
    return _rateCache;
  } catch {
    return _rateCache || fallback;
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });

  const rates = await fetchLiveAudCryptoRates();
  const payidIdentifier = String((env && env.PAYID_IDENTIFIER) || 'Support@bargain-drop.online').trim();
  const payidAccountName = String((env && env.PAYID_ACCOUNT_NAME) || 'Bargain Drop Australia').trim();
  const payidBsb = String((env && env.PAYID_BSB) || '').trim();
  const payidAccountNumber = String((env && env.PAYID_ACCOUNT_NUMBER) || '').trim();

  const usdtAddr = String((env && env.CRYPTO_USDT_TRC20_ADDRESS) || '').trim();
  const usdcAddr = String((env && env.CRYPTO_USDC_ERC20_ADDRESS) || '').trim();
  const btcAddr = String((env && env.CRYPTO_BTC_ADDRESS) || '').trim();
  const nowPaymentsEnabled = !!(env && env.NOWPAYMENTS_API_KEY);

  return new Response(
    JSON.stringify({
      ok: true,
      currency: 'AUD',
      methods: {
        paypal: {
          enabled: true,
          label: 'PayPal Checkout',
          sublabel: 'PayPal Balance • Debit/Credit Card • Pay in 4 (AUD)',
          instantFulfillment: true,
        },
        payid: {
          enabled: true,
          label: 'PayID / Osko Bank Transfer (AU)',
          sublabel: 'Instant bank-to-bank in AUD • Zero surcharges',
          identifier: payidIdentifier,
          identifierType: payidIdentifier.includes('@') ? 'Email PayID' : 'Mobile / ABN PayID',
          accountName: payidAccountName,
          bsb: payidBsb || null,
          accountNumber: payidAccountNumber || null,
        },
        crypto: {
          enabled: true,
          label: 'Crypto Checkout (USDT / USDC / BTC)',
          sublabel: nowPaymentsEnabled
            ? 'Automated instant blockchain verification via NOWPayments'
            : 'Direct non-custodial wallet transfer • Zero intermediary fees',
          mode: nowPaymentsEnabled ? 'nowpayments' : 'direct_wallet',
          nowPaymentsEnabled,
          walletsConfigured: !!(usdtAddr || usdcAddr || btcAddr || nowPaymentsEnabled),
          coins: [
            {
              code: 'USDT',
              network: 'TRC20 (Tron)',
              audRate: rates.audPerUsdt,
              addressConfigured: !!usdtAddr || nowPaymentsEnabled,
              address: usdtAddr || null,
            },
            {
              code: 'USDC',
              network: 'ERC20 / Polygon',
              audRate: rates.audPerUsdc,
              addressConfigured: !!usdcAddr || nowPaymentsEnabled,
              address: usdcAddr || null,
            },
            {
              code: 'BTC',
              network: 'Bitcoin Mainnet',
              audRate: rates.audPerBtc,
              addressConfigured: !!btcAddr || nowPaymentsEnabled,
              address: btcAddr || null,
            },
          ],
          rates,
        },
      },
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        ...corsHeaders(),
      },
    }
  );
}
