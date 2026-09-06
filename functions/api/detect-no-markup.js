// Cloudflare Pages Function: /api/detect-no-markup
// READ-ONLY scan: find products whose Shopify price is at/below CJ wholesale
// cost (variantSellPrice) => "money-losers" (no markup / negative margin).
//
// Modes (all require X-Admin-Pin):
//   GET ?status=1        → progress counter (metafield `nomarkup`, key `state`)
//   GET ?run=1&limit=N   → scan N products (throttled ~1 CJ lookup/sec), resumable
//   GET ?report=1        → dump the full findings JSON (no new lookups)
//   GET ?reset=1         → clear progress + findings
//
// State = Shopify shop metafield namespace `nomarkup`, key `state`:
//   { cursor, scanned, flagged, findings: [ {id,pid,title,url, variants:[{sku, shopPrice, cjCost}] } ] }

import { corsHeaders, shopifyFetch, isAdmin, adminDenied } from '../_sync-lib.js';

const SHOP_GID = 'gid://shopify/Shop/73594044547';
const STATE_NS = 'nomarkup';
const STATE_KEY = 'state';
const SHOPIFY_GQ = '/graphql.json';
const PAGE_SIZE = 50;
const RUN_BUDGET_MS = 40000; // ~40s of lookups per run (respect 1/sec)

async function gqlRaw(env, query, variables) {
  const body = { query };
  if (variables !== undefined) body.variables = variables;
  const r = await shopifyFetch(env, SHOPIFY_GQ, { method: 'POST', body: JSON.stringify(body), skip429Retry: true });
  return r.body;
}

function emptyState() {
  return { cursor: null, scanned: 0, flagged: 0, findings: [], finished: false };
}
function normalizeState(st) {
  if (!st || typeof st !== 'object') return emptyState();
  if (st.cursor === undefined) st.cursor = null;
  if (typeof st.scanned !== 'number') st.scanned = 0;
  if (typeof st.flagged !== 'number') st.flagged = 0;
  if (!Array.isArray(st.findings)) st.findings = [];
  return st;
}
async function loadState(env) {
  const q = `query { shop { metafields(first: 5, namespace: "${STATE_NS}") { edges { node { id namespace key value } } } } }`;
  try {
    const res = await gqlRaw(env, q);
    const edges = (res && res.data && res.data.shop && res.data.shop.metafields && res.data.shop.metafields.edges) || [];
    for (const e of edges) {
      const n = e.node;
      if (n && n.key === STATE_KEY) {
        try { const p = normalizeState(JSON.parse(n.value)); if (p) return p; } catch {}
      }
    }
  } catch {}
  return emptyState();
}
async function saveState(env, state) {
  const mq = `mutation set($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { metafields { id } userErrors { field message } } }`;
  try {
    const res = await gqlRaw(env, mq, { m: [{ ownerId: SHOP_GID, namespace: STATE_NS, key: STATE_KEY, type: 'json', value: JSON.stringify(state) }] });
    const ue = (res && res.data && res.data.metafieldsSet && res.data.metafieldsSet.userErrors) || [];
    if (ue.length) throw new Error(ue.map(x => x.message).join('; '));
  } catch (e) { /* persist best-effort; do not crash scan */ }
}

function variantCostUsd(v) {
  const p = parseFloat(v && v.price);
  if (!isFinite(p) || p <= 0) return 0;
  return p; // shop price (already marked-up AUD in most; but we compare raw CJ cost below)
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (url.searchParams.get('report') === '1') {
    const st = await loadState(env);
    return new Response(JSON.stringify({ ok: true, scanned: st.scanned, flagged: st.flagged, finished: !!st.finished, findings: st.findings }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }
  if (!isAdmin(request)) return adminDenied();
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });

  if (url.searchParams.get('status') === '1') {
    const st = await loadState(env);
    return new Response(JSON.stringify({ ok: true, scanned: st.scanned, flagged: st.flagged, finished: !!st.finished, findingsCount: st.findings.length }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }
  if (url.searchParams.get('reset') === '1') {
    await saveState(env, emptyState());
    return new Response(JSON.stringify({ ok: true, reset: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  // run mode
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
  const st = await loadState(env);
  if (st.finished) {
    return new Response(JSON.stringify({ ok: true, done: true, scanned: st.scanned, flagged: st.flagged }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  const startedAt = Date.now();
  let processed = 0;
  let cursor = st.cursor;

  // Pull products one page at a time (GraphQL cursor pagination) — only CJ-imported.
  while (processed < limit && (Date.now() - startedAt) < RUN_BUDGET_MS) {
    const q = `query($c: String, $n: Int, $qry: String) {
      products(first: $n, after: $c, query: $qry) {
        edges { cursor node { id title tags productType variants(first: 100) { edges { node { id sku price compareAtPrice } } } } }
        pageInfo { hasNextPage }
      }
    }`;
    let res;
    try { res = await gqlRaw(env, q, { c: cursor, n: PAGE_SIZE, qry: 'tag:cj-import' }); }
    catch (e) {
      // Shopify 429s mid-scan: save state and yield.
      await saveState(env, st);
      return new Response(JSON.stringify({ ok: true, yielding: true, reason: 'shopify-throttled', scanned: st.scanned, flagged: st.flagged, remainingCursor: cursor }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    }
    const conn = (res && res.data && res.data.products) || {};
    const edges = conn.edges || [];
    if (!edges.length) { st.finished = true; break; }

    for (const e of edges) {
      if (processed >= limit || (Date.now() - startedAt) >= RUN_BUDGET_MS) break;
      const p = e.node;
      const pid = (p.tags || []).map(t => { const m = String(t).match(/^cj-pid-(.+)$/); return m ? m[1] : null; }).find(Boolean);

      let cjCosts = null;
      if (pid) {
        // CJ variant query by pid (one lookup per product, cheaper than per-SKU).
        try {
          const j = await cjVariantCosts(env, pid);
          cjCosts = j;
        } catch {}
      }
      // If no pid or CJ fetch failed, try first variant SKU.
      if (!cjCosts || !Object.keys(cjCosts).length) {
        const firstV = (p.variants && p.variants.edges && p.variants.edges[0] && p.variants.edges[0].node) || {};
        if (firstV.sku) {
          try { cjCosts = await cjVariantCostsBySku(env, firstV.sku); } catch {}
        }
      }

      // Compare per-variant
      const badVariants = [];
      if (cjCosts && (p.variants && p.variants.edges)) {
        for (const ve of p.variants.edges) {
          const v = ve.node;
          if (!v) continue;
          const cj = v.sku && cjCosts[v.sku] != null ? cjCosts[v.sku] : null;
          if (cj == null || cj <= 0) continue;
          const shopAud = parseFloat(v.price);
          if (!isFinite(shopAud)) continue;
          // Normalize shop AUD price back to USD (@1.5) so we compare like-for-like
          // against CJ wholesale variantSellPrice (USD). A "money-loser" = the USD
          // equivalent of the shop price is at/below wholesale — i.e. no markup/margin.
          const shopUsd = shopAud / 1.5;
          if (shopUsd <= cj + 0.001) {
            badVariants.push({ sku: v.sku, shopPriceAUD: shopAud, cjCostUSD: cj, shopPriceUSD: +shopUsd.toFixed(2) });
          }
        }
      }

      if (badVariants.length) {
        st.flagged++;
        st.findings.push({
          id: p.id,
          pid: pid || null,
          title: p.title,
          url: 'https://bargain-drop.online/product/' + (p.id || ''),
          variants: badVariants,
        });
      }
      st.scanned++;
      processed++;

      // throttle ~1 CJ call / sec
      if (processed < limit && (Date.now() - startedAt) < RUN_BUDGET_MS) {
        await new Promise(r => setTimeout(r, 350));
      }
    }

    cursor = edges[edges.length - 1].cursor;
    st.cursor = cursor;
    if (!(conn.pageInfo && conn.pageInfo.hasNextPage)) { st.finished = true; break; }
    await saveState(env, st); // checkpoint each page
  }

  await saveState(env, st);
  return new Response(JSON.stringify({ ok: true, scanned: st.scanned, flagged: st.flagged, finished: !!st.finished, processedThisRun: processed }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}

// CJ variant costs via deployed proxy (uses cjFetchMulti => rotates keys, 1/sec QPS handling)
async function cjVariantCosts(env, pid) {
  const r = await fetch(`https://bargain-drop.online/api/cj-product-query?pid=${encodeURIComponent(pid)}`, { headers: { 'X-Admin-Pin': '03091996', 'User-Agent': 'bargain-drop/reprice/1.0' } });
  const j = await r.json();
  if (!j || j.code !== 200) return {};
  const arr = Array.isArray(j.data) ? j.data : (j.data && j.data.variants) || [];
  const map = {};
  for (const v of arr) if (v && v.variantSku) map[v.variantSku] = parseFloat(v.variantSellPrice) || 0;
  return map;
}
async function cjVariantCostsBySku(env, sku) {
  const r = await fetch(`https://bargain-drop.online/api/cj-product-query?variantSku=${encodeURIComponent(sku)}`, { headers: { 'X-Admin-Pin': '03091996', 'User-Agent': 'bargain-drop/reprice/1.0' } });
  const j = await r.json();
  if (!j || j.code !== 200 || !j.data) return {};
  const map = {};
  const arr = (j.data.variants) || [];
  for (const v of arr) if (v && v.variantSku) map[v.variantSku] = parseFloat(v.variantSellPrice) || 0;
  // single-product query sometimes returns product with variants nested under `variants`; map all
  const sel = !!j.data.variantSellPrice;
  // (handled above via j.data.variants)
  return map;
}
