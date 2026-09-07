// Cloudflare Pages Function: /api/freight
// Live China→destination shipping cost via CJ's freightCalculate endpoint.
// Origin is fixed to CJ's China (CN) warehouse (Jinhua, Zhejiang) — the single
// source where Bargain Drop products ship from (dropshipping).
//
// POST body: { countryCode, products: [{ sku, quantity }], currency }
// Because CJ's freightCalculate needs a *vid* but our catalog stores *sku*,
// we resolve each sku -> vid via /product/query?variantSku, then return the
// cheapest shipping option (logisticPrice USD), name, and delivery window.

import { corsHeaders, cjFetchMulti } from '../_sync-lib.js';

const ORIGIN_COUNTRY = 'CN';

const FALLBACK_USD_RATES = {
  AUD: 1.45, USD: 1.0, GBP: 0.79, EUR: 0.92, CAD: 1.37, NZD: 1.58,
  SGD: 1.34, HKD: 7.82, JPY: 148.0
};

async function json(res, status = 200) {
  return new Response(JSON.stringify(res), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}

async function skuToVid(env, sku) {
  if (!sku) return null;
  const path = '/product/query?variantSku=' + encodeURIComponent(sku);
  const body = await cjFetchMulti(env, path);
  if (body && body.result && body.data) {
    const arr = Array.isArray(body.data) ? body.data : [body.data];
    for (const prod of arr) {
      if (prod && prod.vid) return String(prod.vid);
      if (prod && prod.variantId) return String(prod.variantId);
      const variants = prod && (prod.variants || prod.variantList || []);
      const vs = Array.isArray(variants) ? variants : (variants.list || variants.variants || []);
      for (const v of vs) {
        if (v && (v.vid || v.variantId)) return String(v.vid || v.variantId);
      }
    }
  }
  return null;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });

  let body = {};
  if (request.method === 'POST') body = await request.json().catch(() => ({}));

  const url = new URL(request.url);
  const countryCode = String(body.countryCode || url.searchParams.get('countryCode') || '').toUpperCase();
  const products = Array.isArray(body.products) ? body.products : [];
  const currency = String(body.currency || url.searchParams.get('currency') || 'AUD').toUpperCase();

  if (!countryCode) return json({ error: 'countryCode is required' }, 400);
  if (!products.length) return json({ error: 'products[] is required (each with sku + quantity)' }, 400);

  try {
    const resolved = [];
    const missing = [];
    for (const p of products) {
      const sku = p && p.sku;
      const qty = Number(p && p.quantity) || 1;
      if (!sku) { missing.push(p); continue; }
      const vid = await skuToVid(env, sku);
      if (!vid) { missing.push(p); continue; }
      resolved.push({ vid, quantity: qty });
    }
    if (!resolved.length) return json({ error: 'Could not resolve any product variants for freight', missing }, 400);

    const freight = await cjFetchMulti(env, '/logistic/freightCalculate', {
      method: 'POST',
      body: JSON.stringify({
        startCountryCode: (env && env.CJ_ORIGIN_COUNTRY) || ORIGIN_COUNTRY,
        endCountryCode: countryCode,
        products: resolved
      })
    });

    if (!freight || freight.result === false || freight.code !== 200) {
      return json({ error: 'Freight calculation failed', detail: (freight && freight.message) || 'CJ returned no quote', cjError: (freight && freight.code) || null }, 502);
    }

    const options = Array.isArray(freight.data) ? freight.data : [];
    const sorted = options.filter(o => o && typeof o.logisticPrice === 'number')
      .sort((a, b) => a.logisticPrice - b.logisticPrice);
    const cheapest = sorted[0] || null;

    const rate = FALLBACK_USD_RATES[currency] || 1.0;
    const usd = cheapest ? cheapest.logisticPrice : 0;

    return json({
      success: true,
      originCountry: (env && env.CJ_ORIGIN_COUNTRY) || ORIGIN_COUNTRY,
      destinationCountry: countryCode,
      currency,
      shippingUsd: usd,
      shippingConverted: Math.round(usd * rate * 100) / 100,
      rate,
      selected: cheapest ? { logisticName: cheapest.logisticName || null, logisticPrice: cheapest.logisticPrice, logisticAging: cheapest.logisticAging || null, logisticPriceCn: cheapest.logisticPriceCn || null } : null,
      options: sorted.map(o => ({ logisticName: o.logisticName || null, logisticPrice: o.logisticPrice, logisticAging: o.logisticAging || null })),
      unresolved: missing.length ? missing.map(p => p.sku).filter(Boolean) : null
    });
  } catch (e) {
    return json({ error: e && e.message ? e.message : 'Internal error' }, 500);
  }
}
