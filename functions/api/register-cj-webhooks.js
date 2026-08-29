// Cloudflare Pages Function: /api/register-cj-webhooks
// Subscribes CJ Dropshipping webhooks (product/stock/order/logistics) to our receiver
// (/api/cj-webhook) and subscribes product IDs so CJ pushes real-time change events.
//
// GET                -> report current intent (no mutation)
// GET ?run=1         -> enable topics + subscribe products (performs mutation)
// GET ?topics=1      -> enable message topics only (webhook/set)
// GET ?subscribe=1   -> subscribe product IDs only (webhook/product/subscribe)
//
// CJ API contract (see docs /api/api2/api/webhook.html):
//   webhook/set:  { product/stock/order/logistics/makeup/privateOrder: { type:"ENABLE", callbackUrls:[url] } }
//   subscribe:    { productIds:[...], subscribeAll:false } (max 100/req)
//   callbacks must be public HTTPS and return 200 within 3s (our receiver acks first).

import { corsHeaders, cjToken, isAdmin, adminDenied, shopifyFetch } from '../_sync-lib.js';

const TOPICS = ['product', 'stock', 'order', 'logistics', 'makeup', 'privateOrder'];

export async function onRequest(context) {
  const { request, env } = context;
  const H = { 'Content-Type': 'application/json', ...corsHeaders() };
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();

  const url = new URL(request.url);
  const run = url.searchParams.get('run') === '1';
  const topicsOnly = url.searchParams.get('topics') === '1';
  const subscribeOnly = url.searchParams.get('subscribe') === '1';
  const callbackUrl = url.origin + '/api/cj-webhook';

  try {
    const result = {
      callbackUrl,
      intent: { topics: TOPICS, productSubscription: 'list of Shopify SKU-derived CJ pids' },
      steps: {},
    };

    if (!run && !topicsOnly && !subscribeOnly) {
      return new Response(JSON.stringify(result), { headers: H });
    }

    const tok = await cjToken(env);
    const cj = async (path, body, method = 'POST') => {
      const r = await fetch(`https://developers.cjdropshipping.com/api2.0/v1${path}`, {
        method,
        headers: { 'CJ-Access-Token': tok, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      return r.json();
    };

    // ── 1. Enable message topics ──────────────────────────────────────────
    if (run || topicsOnly) {
      const topicBody = {};
      for (const t of TOPICS) topicBody[t] = { type: 'ENABLE', callbackUrls: [callbackUrl] };
      const res = await cj('/webhook/set', topicBody);
      result.steps.topics = { ok: res?.result === true || res?.success === true, code: res?.code, message: res?.message };
    }

    // ── 2. Subscribe product IDs ──────────────────────────────────────────
    if (run || subscribeOnly) {
      // Build the list of CJ product ids from Shopify variants' SKUs.
      // SKU shape: 'CJQC255986401AZ' -> CJ product base 'CJQC2559864' (strip trailing NN{2letters}).
      // We resolve each base SKU to its CJ `pid` via /product/list, then subscribe in batches of 100.
      const pids = await collectPids(env);
      result.steps.subscribe = { candidates: pids.length };
      const batches = [];
      for (let i = 0; i < pids.length; i += 100) batches.push(pids.slice(i, i + 100));
      const subRes = [];
      for (const b of batches) {
        const res = await cj('/webhook/product/subscribe', { productIds: b, subscribeAll: false });
        subRes.push({
          ok: res?.success === true, code: res?.code, message: res?.message,
          success: res?.data?.successProductIds?.length || 0,
          fail: res?.data?.failProductIds?.length || 0,
        });
      }
      result.steps.subscribe.batches = subRes;
    }

    return new Response(JSON.stringify(result), { headers: H });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e && e.message) }), { status: 500, headers: H });
  }
}

// Collect CJ product ids from the Shopify catalog (SKU -> CJ pid).
async function collectPids(env) {
  const baseSkus = new Set();
  let page = '/products.json?limit=250&fields=id,variants';
  let guard = 0;
  while (page && guard < 20) {
    const { body, headers } = await shopifyFetch(env, page);
    for (const p of (body.products || [])) {
      for (const v of (p.variants || [])) {
        const sku = v.sku;
        if (!sku) continue;
        // strip trailing NN{2letters} variant marker and -N suffix -> base SKU
        let base = String(sku).replace(/-\d+$/, '').replace(/\d{2}[A-Z]{2}$/, '');
        if (base) baseSkus.add(base);
      }
    }
    const link = headers?.get?.('Link') || '';
    const m = link.split(',').find(s => s.includes('rel="next"'));
    if (!m) break;
    const u = (m.match(/<([^>]+)>/) || [])[1];
    page = u ? new URL(u).pathname + new URL(u).search : null;
    guard++;
  }

  // Resolve base SKUs -> CJ pids via /product/list (pageSize up to 50).
  const pids = [];
  const arr = [...baseSkus];
  for (let i = 0; i < arr.length; i += 50) {
    const chunk = arr.slice(i, i + 50);
    for (const sku of chunk) {
      try {
        const tok = await cjToken(env);
        const r = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/list?productSku=${encodeURIComponent(sku)}&pageNum=1&pageSize=5`, {
          headers: { 'CJ-Access-Token': tok, 'Content-Type': 'application/json' },
        });
        const j = await r.json();
        const list = j?.data?.list || [];
        if (list.length) pids.push(String(list[0].pid));
      } catch {}
    }
  }
  return [...new Set(pids)];
}
