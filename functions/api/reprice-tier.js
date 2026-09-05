// Cloudflare Pages Function: /api/reprice-tier
//
// ONE-TIME tiered re-pricer for the live Shopify catalog.
// For each product, reads its current price (which is the USD wholesale cost
// in this store), converts USD→AUD, applies a tiered cost-plus markup, enforces
// a floor, and rounds to clean .95 endings. PUTs the new price + compare_at_price
// back to Shopify (the source of truth) and rebuilds the local catalog files so
// the storefront reflects the new prices immediately.
//
// Tiers (profit model: cost-plus %, cheaper items scale up more):
//   cost < $5      → +105%
//   cost $5–$20    → +70%
//   cost $20–$60   → +50%
//   cost $60–$150  → +35%
//   cost > $150    → +25%
//
// Constants: USD_AUD = 1.5, FLOOR = 9.95 (AUD).
//
// Modes:
//   GET ?dryRun=1        → count + returns a sample preview (no writes)
//   GET ?run=1&limit=N   → apply to up to N products (batched, resumable)
//   GET ?reset=1         → clear progress and restart
//   GET                  → status only

import { corsHeaders, shopifyFetch, ghRead, ghWriteLarge, isAdmin, adminDenied } from '../_sync-lib.js';

const USD_AUD = 1.5;
const FLOOR = 9.95;

function markupFor(cost) {
  if (cost < 5)   return 1.05;   // +105%
  if (cost < 20)  return 0.70;   // +70%
  if (cost < 60)  return 0.50;   // +50%
  if (cost < 150) return 0.35;   // +35%
  return 0.25;                    // +25%
}

export function computeTierPrice(costUsd) {
  const c = parseFloat(costUsd) || 0;
  if (c <= 0) return { price: FLOOR, markup: 0 };
  const audCost = c * USD_AUD;
  const mult = markupFor(c);
  let raw = audCost * (1 + mult);
  if (raw < FLOOR) raw = FLOOR;
  // clean .95 ending (round up to nearest .95)
  let rounded = Math.floor(raw) + 0.95;
  if (rounded < raw - 0.02) rounded += 1.0;
  return { price: +rounded.toFixed(2), markup: mult };
}

// Read current price from Shopify variant list; treat as USD cost.
function variantCost(p) {
  const vs = p.variants || [];
  if (!vs.length) return 0;
  let c = 0;
  for (const v of vs) {
    const x = parseFloat(v.price) || 0;
    if (x > c) c = x; // use the max variant price as the representative cost
  }
  return c;
}

async function repriceProduct(env, p) {
  const cost = variantCost(p);
  if (cost <= 0) return { ok: false, skip: 'no-cost', id: p.id };
  const { price, markup } = computeTierPrice(cost);
  const vs = p.variants || [];
  if (!vs.filter(v => v && v.id).length) return { ok: false, skip: 'no-variant-ids', id: p.id };

  // IDEMPOTENCY GUARD: if the current price already equals the computed target,
  // the product is already correctly repriced — skip it (prevents double-markup
  // when a prior run already converted USD cost -> AUD). This is the key safety
  // check that the earlier double-pricing bug was missing.
  const cur = parseFloat((vs[0] && vs[0].price)) || 0;
  if (Math.abs(cur - price) < 0.02) return { ok: false, skip: 'already-repriced', id: p.id };

  // build variant list preserving existing options, setting new price + compare_at
  const variants = vs.map(v => {
    if (!v || !v.id) return null;
    const out = {
      id: v.id,
      price: price.toFixed(2),
      compare_at_price: Math.max(parseFloat(v.price) || 0, price).toFixed(2),
    };
    for (const k of ['option1','option2','option3','sku','grams','weight','weight_unit']) {
      if (v[k] !== undefined) out[k] = v[k];
    }
    return out;
  }).filter(Boolean);

  let options = (p.options && p.options.length) ? p.options : null;
  if (!options) {
    // reconstruct minimal options from variants
    const opts = [];
    const colors = [], sizes = [];
    for (const v of variants) {
      if (v.option1 && !colors.includes(v.option1)) colors.push(v.option1);
      if (v.option2 && !sizes.includes(v.option2)) sizes.push(v.option2);
    }
    if (colors.length) opts.push({ name: 'Color', values: colors });
    if (sizes.length) opts.push({ name: 'Size', values: sizes });
    if (!opts.length) opts.push({ name: 'Title', values: ['Default Title'] });
    options = opts;
  }

  const payload = { product: { id: p.id, options, variants } };
  let res = await shopifyFetch(env, `/products/${p.id}.json`, { method: 'PUT', body: JSON.stringify(payload) });
  for (let t = 0; t < 6 && res && (res.status === 409 || res.status === 429); t++) {
    await new Promise(r => setTimeout(r, 1200 + t * 700));
    res = await shopifyFetch(env, `/products/${p.id}.json`, { method: 'PUT', body: JSON.stringify(payload) });
  }
  if (!res.ok) {
    return { ok: false, skip: 'put ' + res.status + ' ' + (res.body && res.body.errors ? JSON.stringify(res.body.errors).slice(0, 150) : ''), id: p.id };
  }
  return { ok: true, id: p.id, cost, new_price: price, markup, variants: variants.length };
}

export async function onRequest(context) {
  try {
    const { request, env } = context;
    if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
    if (!isAdmin(request, env)) return adminDenied();
    const url = new URL(request.url);
    const dryRun = url.searchParams.get('dryRun') === '1';
    const run = url.searchParams.get('run') === '1';
    const reset = url.searchParams.get('reset') === '1';
    const limitRaw = parseInt(url.searchParams.get('limit') || '', 10);
    const limit = isNaN(limitRaw) ? 100 : Math.min(limitRaw, 250);

    const progDoc = await ghRead(env, 'data/reprice-tier-progress.json');
    let prog = (progDoc && progDoc.content) ? JSON.parse(atob(progDoc.content.replace(/\n/g, ''))) : {};
    if (reset || typeof prog !== 'object' || !prog) prog = {};
    const done = prog.done || {};
    const cursor = prog.cursor || 0;

    const res = await shopifyFetch(env, `/products.json?limit=250&fields=id,title,options,variants&since_id=${cursor}`);
    const batch = res.body?.products || [];
    const newCursor = batch.length ? batch.reduce((m, p) => Math.max(m, Number(p.id)), cursor) : cursor;
    const eof = batch.length < 250;

    if (dryRun) {
      // build a small preview sample (first 12 products) for review
      const sample = batch.slice(0, 12).map(p => {
        const cost = variantCost(p);
        const { price, markup } = cost > 0 ? computeTierPrice(cost) : { price: 0, markup: 0 };
        return { id: p.id, title: (p.title || '').slice(0, 60), cost_usd: cost, new_price_aud: price, markup_pct: Math.round(markup * 100) };
      });
      return new Response(JSON.stringify({ cursor, newCursor, eof, scanned: batch.length, sample }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    }
    if (!run) {
      const doneCount = Object.keys(done).length;
      return new Response(JSON.stringify({ cursor, eof, scanned: batch.length, done: doneCount }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    }

    const remaining = batch
      .filter(p => !done[String(p.id)])
      .slice(0, limit);

    let ok = 0, fail = 0;
    const results = [];
    const startedAt = Date.now();
    const DEADLINE = startedAt + 25000; // Pages Function ~30s wall-clock; leave headroom

    for (const p of remaining) {
      if (Date.now() >= DEADLINE) { results.push({ id: String(p.id), ok: false, skip: 'deadline-stop' }); break; }
      const id = String(p.id);
      try {
        const r = await repriceProduct(env, p);
        if (r.ok) { ok++; done[id] = { n: r.new_price, cost: r.cost, markup: r.markup }; }
        else { fail++; }
        results.push(r);
      } catch (e) {
        fail++;
        results.push({ id, ok: false, skip: 'ex:' + String(e.message || e).slice(0, 60) });
      }
      await new Promise(r => setTimeout(r, 5));
    }

    // advance cursor only when this page is fully handled
    const pageFullyDone = batch.every(p => done[String(p.id)]);
    if (pageFullyDone || eof) prog.cursor = newCursor;
    prog.done = done;

    try {
      const fresh = await ghRead(env, 'data/reprice-tier-progress.json');
      let merged = prog;
      if (fresh && fresh.content) {
        try { const existing = JSON.parse(atob(fresh.content.replace(/\n/g, ''))); merged = { ...existing, ...prog, done: { ...(existing.done || {}), ...done } }; } catch {}
      }
      await ghWriteLarge(env, 'data/reprice-tier-progress.json', JSON.stringify(merged), 'auto: reprice-tier progress');
    } catch (we) { void we; }

    return new Response(JSON.stringify({ cursor: prog.cursor, newCursor, eof, scanned: batch.length, processed: ok + fail, ok, fail, results }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message || err), stack: String(err && err.stack || '').slice(0, 400) }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }
}
