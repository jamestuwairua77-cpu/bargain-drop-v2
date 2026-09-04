// Cloudflare Pages Function: /api/register-cj-webhooks
// Connects CJ Dropshipping -> Bargain Drop via CJ webhooks and subscribes our
// sourced products so CJ pushes real-time product/variant/stock/order changes to
// https://bargain-drop.online/api/cj-webhook (handled by _cj-import.js -> Shopify).
//
// GET                 -> report intent (no mutation)
// GET ?topics=1       -> enable message topics (webhook/set)
// GET ?subscribe=1&limit=N -> resolve+subscribe our sourced CJ pids (resumable)
// GET ?all=1          -> subscribeAll shortcut (pre-June-2026 accounts)
// GET ?run=1          -> topics + subscribe
// GET ?reset=1        -> clear progress and start resolve phase fresh
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

      // load clean progress (ignore stale pre-phase shapes)
      const prog = reset ? { phase: 'resolve', pids: [], done: 0, subscribed: 0, baseSkus: [], triedSkus: [], cursor: 0 } : await readProgress(env);
      prog.phase = prog.phase || 'resolve';

      // Phase 1: resolve CJ pids from our Shopify SKUs (cursor-resumable)
      if (prog.phase === 'resolve') {
        const r = await resolvePids(env, prog);   // mutates prog.pids/cursor/baseSkus/triedSkus
        if (r.done) { prog.phase = 'subscribe'; }
        await writeProgress(env, prog).catch(() => {});
      }

      // Phase 2: subscribe pids in batches
      if (prog.phase === 'subscribe') {
        const tok = await cjToken(env);

        // Pre-subscribe safety: CJ rejects per-product subscription (1606010) unless the
        // 'product' webhook TOPIC is enabled first. Ensure topics are enabled so the
        // subscription loop can actually succeed instead of silently failing.
        let topicsOk = false;
        try {
          const tbody = {};
          for (const t of TOPICS) tbody[t] = { type: 'ENABLE', callbackUrls: [callbackUrl] };
          const tr = await fetch('https://developers.cjdropshipping.com/api2.0/v1/webhook/set', {
            method: 'POST', headers: { 'CJ-Access-Token': tok, 'Content-Type': 'application/json' }, body: JSON.stringify(tbody),
          });
          const tj = await tr.json();
          topicsOk = (tj?.code === 200 || tj?.success === true);
          if (!result.steps.topics) result.steps.topics = { ok: topicsOk, code: tj?.code, message: tj?.message };
        } catch {}

        const end = Math.min(prog.done + limit * BATCH, prog.pids.length);
        let processed = 0;
        let failed = 0;
        for (let i = prog.done; i < end; i += BATCH) {
          const chunk = prog.pids.slice(i, i + BATCH);
          const r = await fetch('https://developers.cjdropshipping.com/api2.0/v1/webhook/product/subscribe', {
            method: 'POST', headers: { 'CJ-Access-Token': tok, 'Content-Type': 'application/json' },
            body: JSON.stringify({ productIds: chunk, subscribeAll: false }),
          });
          const j = await r.json();
          const ok = (j?.code === 200 || j?.success === true);
          if (ok) {
            const n = Array.isArray(j?.data?.successProductIds) ? j.data.successProductIds.length : chunk.length;
            prog.subscribed += n;
            prog.done += chunk.length;   // only advance on REAL success
            processed += chunk.length;
          } else {
            // Do NOT advance `done` on failure — otherwise the loop falsely reports
            // complete while nothing is actually subscribed. Report the CJ error.
            failed++;
            result.steps.subscribeLastError = { code: j?.code, message: j?.message };
            break;  // stop this call; next finisher run will retry from same cursor
          }
        }
        await writeProgress(env, prog).catch(() => {});
        result.steps.subscribe = {
          phase: prog.phase, total: prog.pids.length, done: prog.done, subscribed: prog.subscribed,
          processedThisCall: processed, failedThisCall: failed, topicsOk,
          complete: prog.done >= prog.pids.length && prog.subscribed >= prog.pids.length,
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

function isFlattenedSku(sku) {
  if (!sku) return false;
  const s = String(sku).trim();
  return /-\d+$/.test(s) || /\d{2}[A-Z]{2}$/.test(s);
}

function parentSku(sku) {
  if (!sku) return null;
  let s = String(sku).trim();
  s = s.replace(/-\d+$/, '');
  s = s.replace(/(\d{2})([A-Z]{2})$/, '');
  return s;
}

// Resolve CJ pids by walking Shopify products via cursor (since_id pagination) and
// querying CJ /product/list?productSku= for each unique base SKU. Bounded pages/call.
// Only NEW base SKUs (not in triedSkus) are resolved each call, so progression is monotonic.
async function resolvePids(env, prog) {
  const pids = [...(prog.pids || [])];
  const baseSkus = prog.baseSkus ? [...prog.baseSkus] : [];
  const triedSkus = prog.triedSkus ? [...prog.triedSkus] : [];
  const triedSet = new Set(triedSkus);
  const pidSet = new Set(pids);
  const baseSet = new Set(baseSkus);

  let sinceId = prog.cursor || 0;
  const MAX_PRODUCTS = 120; // bound per call
  let fetched = 0;
  let page = `/products.json?limit=250&fields=id,variants&since_id=${sinceId}`;
  let guard = 0;
  let eof = false;

  // Walk Shopify products to collect NEW base SKUs.
  while (fetched < MAX_PRODUCTS && guard < 3) {
    const { body } = await shopifyFetch(env, page);
    const products = body?.products || [];
    if (!products.length) { eof = true; break; }
    for (const p of products) {
      sinceId = Math.max(sinceId, Number(p.id));
      for (const v of (p.variants || [])) {
        const base = parentSku(v.sku);
        if (base && !baseSet.has(base)) { baseSet.add(base); baseSkus.push(base); }
      }
      fetched++;
      if (fetched >= MAX_PRODUCTS) break;
    }
    guard++;
    if (products.length < 250) { eof = true; break; }
    if (fetched < MAX_PRODUCTS) page = `/products.json?limit=250&fields=id,variants&since_id=${sinceId}`;
  }

  // Resolve only base SKUs not yet tried.
  let newPids = 0;
  const skuArr = baseSkus.filter(s => !triedSet.has(s));
  for (const sku of skuArr) {
    triedSet.add(sku);
    try {
      const j = await cjFetchMulti(env, '/product/list?productSku=' + encodeURIComponent(sku) + '&pageNum=1&pageSize=10');
      const pid = j?.data?.list?.[0]?.pid;
      if (pid) {
        const ps = String(pid);
        if (!pidSet.has(ps)) { pids.push(ps); pidSet.add(ps); newPids++; }
      }
    } catch { /* keep tried marker, skip */ }
    await new Promise(r => setTimeout(r, 150));
  }

  prog.pids = pids;
  prog.baseSkus = baseSkus;
  prog.triedSkus = [...triedSet];
  prog.cursor = eof ? -1 : sinceId; // -1 = done resolving

  return { done: eof };
}

async function readProgress(env) {
  try {
    const j = await ghRead(env, PROGRESS_PATH);
    if (!j || !j.content) return { phase: 'resolve', pids: [], done: 0, subscribed: 0, baseSkus: [], triedSkus: [], cursor: 0 };
    const p = JSON.parse(decodeBase64(j.content));
    // Ignore stale pre-phase shapes: {done, subscribed, all:[...]} is a marketplace
    // subscribeAll run, NOT our sourced pids. Only accept the new {phase,...} shape.
    if (!p || typeof p !== 'object' || !p.phase) {
      return { phase: 'resolve', pids: [], done: 0, subscribed: 0, baseSkus: [], triedSkus: [], cursor: 0 };
    }
    p.sha = j.sha;
    p.pids = Array.isArray(p.pids) ? p.pids : [];
    p.baseSkus = Array.isArray(p.baseSkus) ? p.baseSkus : [];
    p.triedSkus = Array.isArray(p.triedSkus) ? p.triedSkus : [];
    p.done = p.done || 0;
    p.subscribed = p.subscribed || 0;
    p.cursor = p.cursor || 0;
    return p;
  } catch { return { phase: 'resolve', pids: [], done: 0, subscribed: 0, baseSkus: [], triedSkus: [], cursor: 0 }; }
}

async function writeProgress(env, prog) {
  const { sha, ...body } = prog;
  return ghWrite(env, PROGRESS_PATH, JSON.stringify(body, null, 2), 'cj-subscribe: progress', sha);
}
function decodeBase64(s) { return new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0))); }
