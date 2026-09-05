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

import { corsHeaders, cjToken, isAdmin, adminDenied, ghRead, ghWrite, shopifyFetch, cjFetchMulti, cjWebhookRegister, cjWebhookList } from '../_sync-lib.js';

const TOPICS = ['product', 'stock', 'order', 'logistics', 'makeup', 'privateOrder'];
const BATCH = 100;
const SHOP_GID = 'gid://shopify/Shop/73594044547';
const PROG_NS = 'cjsub';
const PROG_KEY = 'progress';

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
  const listOnly = url.searchParams.get('list') === '1';
  const callbackUrl = url.origin + '/api/cj-webhook';

  try {
    const result = { callbackUrl, topics: TOPICS, steps: {} };
    if (listOnly) {
      const L = await cjWebhookList(env, { pageNum: parseInt(url.searchParams.get('page') || '1', 10), pageSize: parseInt(url.searchParams.get('size') || '100', 10) });
      return new Response(JSON.stringify({ ok: L.ok, code: L.code, message: L.message, data: L.data, keyIndex: L.keyIndex }), { headers: H });
    }
    if (!run && !topicsOnly && !subscribeOnly) {
      return new Response(JSON.stringify(result), { headers: H });
    }

    if (run || topicsOnly) {
      const topRes = await cjWebhookRegister(env, { topicNames: TOPICS, callbackUrls: [callbackUrl] });
      result.steps.topics = { ok: topRes.ok, code: topRes.code, message: topRes.message, keyIndex: topRes.keyIndex };
    }

    if (subscribeOnly) {
      if (subscribeAll) {
        const sub = await cjWebhookRegister(env, { subscribeAll: true, topicNames: TOPICS, callbackUrls: [callbackUrl] });
        result.steps.subscribe = { mode: 'subscribeAll', ok: sub.ok, code: sub.code, message: sub.message, data: sub.data, keyIndex: sub.keyIndex, step: sub.step };
        return new Response(JSON.stringify(result), { headers: H });
      }

      // load clean progress (ignore stale pre-phase shapes)
      // Progress is persisted in a Shopify metafield (namespace cjsub), not GitHub.
      const _prev = await readProgress(env);
      const prog = reset ? { phase: 'resolve', pids: [], done: 0, subscribed: 0, cursor: 0 } : _prev;
      prog.phase = prog.phase || 'resolve';

      // Phase 1: resolve CJ pids from the `cj-pid-*` tags on our products.
      if (prog.phase === 'resolve') {
        const r = await resolvePids(env, prog);   // mutates prog.pids/cursor
        if (r.done) { prog.phase = 'subscribe'; }
        await writeProgress(env, prog).catch(() => {});
      }

      // Phase 2: subscribe pids in batches
      if (prog.phase === 'subscribe') {
        // Pre-subscribe safety: CJ rejects per-product subscription (1606010) unless the
        // 'product' webhook TOPIC is enabled first. Ensure topics are enabled so the
        // subscription loop can actually succeed instead of silently failing.
        let topicsOk = false;
        try {
          const tRes = await cjWebhookRegister(env, { topicNames: TOPICS, callbackUrls: [callbackUrl] });
          topicsOk = tRes.ok;
          if (!result.steps.topics) result.steps.topics = { ok: topicsOk, code: tRes.code, message: tRes.message };
        } catch {}

        const end = Math.min(prog.done + limit * BATCH, prog.pids.length);
        let processed = 0;
        let failed = 0;
        const okSet = new Set(prog.subscribedPids || []);   // pids already confirmed subscribed
        const failSet = new Set(prog.failedPids || []);      // pids CJ reported as failing
        for (let i = prog.done; i < end; i += BATCH) {
          const chunk = prog.pids.slice(i, i + BATCH)
            .filter((pid) => !okSet.has(pid) && !failSet.has(pid));
          if (!chunk.length) { prog.done = i + BATCH; processed += BATCH; continue; }
          const subRes = await cjWebhookRegister(env, { productIds: chunk, topicNames: TOPICS, callbackUrls: [callbackUrl] });
          const j = subRes;
          if (!result.steps.subscribeRaw) result.steps.subscribeRaw = subRes.data;
          const ok = subRes.ok;
          if (ok) {
            const succ = (j?.subscribedIds || []).map(String);
            const fails = (j?.failedIds || []).map(String);
            result.steps._lastData = j?.data;
            succ.forEach((p) => okSet.add(p));
            fails.forEach((p) => failSet.add(p));
            processed += chunk.length;
            prog.done += chunk.length;   // this chunk has been fully attempted across all keys
          } else {
            failed++;
            result.steps.subscribeLastError = { code: j?.code, message: j?.message };
            break;  // hard error (auth/QPS exhausted) -> retry next run
          }
        }
        prog.subscribed = okSet.size;
        prog.subscribedPids = [...okSet];
        prog.failedPids = [...failSet];
        await writeProgress(env, prog).catch(() => {});
        const doneAll = prog.done >= prog.pids.length;
        result.steps.subscribe = {
          phase: prog.phase, total: prog.pids.length, done: prog.done, subscribed: prog.subscribed,
          failed: failSet.size, processedThisCall: processed, failedThisCall: failed, topicsOk,
          lastData: result.steps._lastData,
          complete: doneAll,
          resumeHint: doneAll ? 'done' : ('call again ?subscribe=1&limit=' + limit),
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

// Resolve CJ pids by walking Shopify products via cursor (since_id pagination) and
// querying CJ /product/list?productSku= for each unique base SKU. Bounded pages/call.
// PIDs are accumulated cumulatively (Set), so progression is monotonic across calls.
// Resolve CJ pids by walking Shopify products and extracting the `cj-pid-<pid>`
// tag that the importer stamps on every imported product. This is fast (no CJ API
// calls) and picks up ALL sourced pids directly from the catalog.
async function resolvePids(env, prog) {
  const pidSet = new Set(prog.pids || []);
  let sinceId = prog.cursor || 0;
  const MAX_PRODUCTS = 500; // bound per call (2 pages of 250)
  let fetched = 0;
  let eof = false;
  let page = `/products.json?limit=250&fields=id,tags&since_id=${sinceId}`;

  while (fetched < MAX_PRODUCTS) {
    const { body } = await shopifyFetch(env, page);
    const products = body?.products || [];
    if (!products.length) { eof = true; break; }
    for (const p of products) {
      sinceId = Math.max(sinceId, Number(p.id));
      const tags = String(p.tags || '');
      const m = tags.match(/cj-pid-(\d+)/);
      if (m && m[1]) pidSet.add(m[1]);
      fetched++;
      if (fetched >= MAX_PRODUCTS) break;
    }
    if (products.length < 250) { eof = true; break; }
    page = `/products.json?limit=250&fields=id,tags&since_id=${sinceId}`;
  }

  prog.pids = [...pidSet];
  prog.cursor = eof ? -1 : sinceId; // -1 = done resolving

  return { done: eof, totalPids: prog.pids.length };
}

const EMPTY_PROG = () => ({ phase: 'resolve', pids: [], done: 0, subscribed: 0, cursor: 0 });

// Persist subscribe progress in a Shopify shop metafield (reliable KV via GraphQL,
// NOT the GitHub contents API which can 401 / exhaust its hourly rate limit).
async function readProgress(env) {
  try {
    const q = `query { shop { metafields(first:1, keys: ["${PROG_NS}.${PROG_KEY}"]) { edges { node { value } } } } }`;
    const { body } = await shopifyFetch(env, '/graphql.json', { method: 'POST', body: JSON.stringify({ query: q }) });
    const edges = body?.data?.shop?.metafields?.edges || [];
    if (!edges.length) return EMPTY_PROG();
    const p = JSON.parse(edges[0].node.value);
    if (!p || typeof p !== 'object' || !p.phase) return EMPTY_PROG();
    p.pids = Array.isArray(p.pids) ? p.pids : [];
    p.done = p.done || 0;
    p.subscribed = p.subscribed || 0;
    p.cursor = p.cursor || 0;
    return p;
  } catch { return EMPTY_PROG(); }
}

async function writeProgress(env, prog) {
  const mq = `mutation set($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { metafields { id } userErrors { field message } } }`;
  const { body } = await shopifyFetch(env, '/graphql.json', {
    method: 'POST',
    body: JSON.stringify({
      query: mq,
      variables: { m: [{ ownerId: SHOP_GID, namespace: PROG_NS, key: PROG_KEY, type: 'json', value: JSON.stringify(prog) }] },
    }),
  });
  const ue = (body?.data?.metafieldsSet?.userErrors) || [];
  if (ue.length) throw new Error('metafield write failed: ' + JSON.stringify(ue));
  return body;
}
