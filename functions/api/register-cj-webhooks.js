// Cloudflare Pages Function: /api/register-cj-webhooks
// Connects CJ Dropshipping -> Bargain Drop via CJ webhooks and subscribes our
// sourced products so CJ pushes real-time product/variant/stock/order changes to
// https://bargain-drop.online/api/cj-webhook (handled by _cj-import.js -> Shopify).
//
// GET                 -> report intent (no mutation)
// GET ?topics=1       -> enable message topics (webhook/set)
// GET ?subscribe=1&limit=N -> resolve+subscribe our sourced CJ pids (resumable)
// GET ?run=1          -> topics + subscribe
//
// Persists state to data/cj-subscribe-progress.json (GitHub-backed store).

import { corsHeaders, cjToken, isAdmin, adminDenied, ghRead, ghWrite, shopifyFetch, cjFetchMulti } from '../_sync-lib.js';

const TOPICS = ['product', 'stock', 'order', 'logistics', 'makeup', 'privateOrder'];
const PROGRESS_PATH = 'data/cj-subscribe-progress.json';
const BATCH = 100;

export async function onRequest(context) {
  const { request, env } = context;
  const H = { 'Content-Type': 'application/json', ...corsHeaders() };
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();

  const url = new URL(request.url);
  const run = url.searchParams.get('run') === '1';
  const topicsOnly = url.searchParams.get('topics') === '1';
  const subscribeOnly = url.searchParams.get('subscribe') === '1' || run;
  const reset = url.searchParams.get('reset') === '1';
  const limit = parseInt(url.searchParams.get('limit') || '6', 10);
  const subscribeAll = url.searchParams.get('all') === '1';
  const callbackUrl = url.origin + '/api/cj-webhook';

  try {
    const result = { callbackUrl, topics: TOPICS, steps: {} };
    if (!run && !topicsOnly && !subscribeOnly) {
      return new Response(JSON.stringify(result), { headers: H });
    }

    if (run || topicsOnly) {
      const tok = await cjToken(env);
      const body = {};
      for (const t of TOPICS) body[t] = { type: 'ENABLE', callbackUrls: [callbackUrl] };
      const r = await fetch('https://developers.cjdropshipping.com/api2.0/v1/webhook/set', {
        method: 'POST', headers: { 'CJ-Access-Token': tok, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const j = await r.json();
      result.steps.topics = { ok: j?.code === 200 || j?.success === true, code: j?.code, message: j?.message };
    }

    if (subscribeOnly) {
      if (subscribeAll) {
        const tok = await cjToken(env);
        const r = await fetch('https://developers.cjdropshipping.com/api2.0/v1/webhook/product/subscribe', {
          method: 'POST', headers: { 'CJ-Access-Token': tok, 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscribeAll: true }),
        });
        const j = await r.json();
        result.steps.subscribe = { mode: 'subscribeAll', ok: j?.code === 200 || j?.success === true, code: j?.code, message: j?.message, data: j?.data };
        return new Response(JSON.stringify(result), { headers: H });
      }
      const prog = reset ? { phase: 'resolve', pids: [], done: 0, subscribed: 0 } : await readProgress(env);
      prog.phase = prog.phase || 'resolve';

      // Phase 1: resolve CJ pids from our Shopify SKUs (cursor-resumable)
      if (prog.phase === 'resolve') {
        const r = await resolvePids(env, prog);   // mutates prog.pids + prog.cursor, returns {done}
        if (r.done) { prog.phase = 'subscribe'; }
        await writeProgress(env, prog).catch(() => {});
      }

      // Phase 2: subscribe pids in batches
      if (prog.phase === 'subscribe') {
        const tok = await cjToken(env);
        const end = Math.min(prog.done + limit * BATCH, prog.pids.length);
        let processed = 0;
        for (let i = prog.done; i < end; i += BATCH) {
          const chunk = prog.pids.slice(i, i + BATCH);
          const r = await fetch('https://developers.cjdropshipping.com/api2.0/v1/webhook/product/subscribe', {
            method: 'POST', headers: { 'CJ-Access-Token': tok, 'Content-Type': 'application/json' },
            body: JSON.stringify({ productIds: chunk, subscribeAll: false }),
          });
          const j = await r.json();
          prog.subscribed += (j?.code === 200 || j?.success === true) ? (j?.data?.successProductIds?.length || chunk.length) : 0;
          prog.done += chunk.length;
          processed += chunk.length;
        }
        await writeProgress(env, prog).catch(() => {});
        result.steps.subscribe = {
          phase: prog.phase, total: prog.pids.length, done: prog.done, subscribed: prog.subscribed,
          processedThisCall: processed, complete: prog.done >= prog.pids.length,
          resumeHint: prog.done < prog.pids.length ? ('call again ?subscribe=1&limit=' + limit) : 'done',
        };
      } else {
        result.steps.subscribe = { phase: 'resolve', resolvedSoFar: prog.pids.length, cursor: prog.cursor || 0, resumeHint: 'call again ?subscribe=1' };
      }
    }

    return new Response(JSON.stringify(result), { headers: H });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e && e.message) }), { status: 500, headers: H });
  }
}

function parentSku(sku) {
  if (!sku) return null;
  return String(sku).trim().replace(/-(\d+)$/, '').replace(/(\d{2})([A-Z]{2})$/, '');
}

// Resolve CJ pids by walking Shopify products via cursor (since_id pagination) and
// querying CJ /product/query?variantSku= for each unique base SKU. Bounded pages/call.
async function resolvePids(env, prog) {
  const pids = [...(prog.pids || [])];
  const seen = new Set(pids);
  // cursors: track last Shopify product id (since_id) for resume
  let sinceId = prog.cursor || 0;
  const baseSkus = prog.baseSkus ? new Set(prog.baseSkus) : new Set();

  const MAX_PRODUCTS = 120; // bound per call
  let fetched = 0;
  let page = `/products.json?limit=250&fields=id,variants&since_id=${sinceId}`;
  let guard = 0;
  let eof = false;

  while (fetched < MAX_PRODUCTS && guard < 3) {
    const { body } = await shopifyFetch(env, page);
    const products = body?.products || [];
    if (!products.length) { eof = true; break; }
    for (const p of products) {
      sinceId = Math.max(sinceId, Number(p.id));
      for (const v of (p.variants || [])) {
        const base = parentSku(v.sku);
        if (base) baseSkus.add(base);
      }
      fetched++;
      if (fetched >= MAX_PRODUCTS) break;
    }
    // after collecting baseSkus in this batch, resolve them to pids
    guard++;
    if (products.length < 250) { eof = true; break; }
    if (fetched < MAX_PRODUCTS) page = `/products.json?limit=250&fields=id,variants&since_id=${sinceId}`;
  }

  // Resolve newly-collected baseSkus -> pids
  let newPids = 0;
  const skuArr = [...baseSkus];
  for (const sku of skuArr) {
    if (seen.has(sku)) continue;
    try {
      const j = await cjFetchMulti(env, '/product/list?productSku=' + encodeURIComponent(sku) + '&pageNum=1&pageSize=10');
      const pid = j?.data?.list?.[0]?.pid;
      if (pid) { const ps = String(pid); if (!pids.includes(ps)) { pids.push(ps); seen.add(ps); newPids++; } }
      else seen.add(sku);
    } catch { /* skip, will not retry */ }
  }

  prog.pids = pids;
  prog.baseSkus = [...baseSkus];
  prog.cursor = eof ? -1 : sinceId; // -1 = done resolving

  return { done: eof };
}

function nextPage(headers) {
  const link = headers?.get?.('Link') || '';
  const m = link.split(',').find(s => s.includes('rel="next"'));
  if (!m) return null;
  const u = (m.match(/<([^>]+)>/) || [])[1];
  return u ? new URL(u).pathname + new URL(u).search : null;
}

async function readProgress(env) {
  try {
    const j = await ghRead(env, PROGRESS_PATH);
    if (!j || !j.content) return { phase: 'resolve', pids: [], done: 0, subscribed: 0 };
    const p = JSON.parse(decodeBase64(j.content));
    p.sha = j.sha;
    return p;
  } catch { return { phase: 'resolve', pids: [], done: 0, subscribed: 0 }; }
}
async function writeProgress(env, prog) {
  const { sha, ...body } = prog;
  return ghWrite(env, PROGRESS_PATH, JSON.stringify(body, null, 2), 'cj-subscribe: progress', sha);
}
function decodeBase64(s) { return new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0))); }
