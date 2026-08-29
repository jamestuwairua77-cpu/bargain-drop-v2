// Cloudflare Pages Function: /api/register-cj-webhooks
// Subscribes CJ Dropshipping webhooks (product/stock/order/logistics) to our receiver
// (/api/cj-webhook) and subscribes product IDs so CJ pushes real-time change events.
//
// GET                -> report current intent (no mutation)
// GET ?topics=1      -> enable message topics only (webhook/set)
// GET ?subscribe=1&limit=N -> subscribe product IDs (batched, resumable via progress file)
// GET ?run=1         -> topics + subscribe
//
// Subscription is batched in groups of 100 (CJ max) and resumable via data/cj-subscribe-progress.json.

import { corsHeaders, cjToken, isAdmin, adminDenied, ghRead, ghWrite } from '../_sync-lib.js';

const TOPICS = ['product', 'stock', 'order', 'logistics', 'makeup', 'privateOrder'];
const PROGRESS_PATH = 'data/cj-subscribe-progress.json';
const BATCH = 100; // CJ max productIds per subscribe call

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
  const limit = parseInt(url.searchParams.get('limit') || '8', 10); // batches per call
  const callbackUrl = url.origin + '/api/cj-webhook';

  try {
    const result = { callbackUrl, topics: TOPICS, steps: {} };
    if (!run && !topicsOnly && !subscribeOnly) {
      return new Response(JSON.stringify(result), { headers: H });
    }

    // ── 1. Enable message topics ──────────────────────────────────────────
    if (run || topicsOnly) {
      const tok = await cjToken(env);
      const body = {};
      for (const t of TOPICS) body[t] = { type: 'ENABLE', callbackUrls: [callbackUrl] };
      const r = await fetch('https://developers.cjdropshipping.com/api2.0/v1/webhook/set', {
        method: 'POST',
        headers: { 'CJ-Access-Token': tok, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      result.steps.topics = { ok: j?.code === 200 || j?.success === true, code: j?.code, message: j?.message };
    }

    // ── 2. Subscribe product IDs (resumable, batched) ──────────────────────
    if (subscribeOnly) {
      const prog = reset ? { done: 0, subscribed: 0, startedAt: Date.now() }
                        : await readProgress(env);

      // Resolve all CJ pids (paginated) — cached in progress between calls.
      const all = (reset || !Array.isArray(prog.all)) ? await getPids(env, prog.all) : prog.all;
      prog.all = all;

      const tok = await cjToken(env);
      let processed = 0;
      const end = Math.min(prog.done + limit * BATCH, all.length);
      for (let i = prog.done; i < end; i += BATCH) {
        const chunk = all.slice(i, i + BATCH);
        const r = await fetch('https://developers.cjdropshipping.com/api2.0/v1/webhook/product/subscribe', {
          method: 'POST',
          headers: { 'CJ-Access-Token': tok, 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: chunk, subscribeAll: false }),
        });
        const j = await r.json();
        const okCount = (j?.code === 200 || j?.success === true) ? (j?.data?.successProductIds?.length || chunk.length) : 0;
        prog.subscribed += okCount;
        prog.done += chunk.length;
        processed += chunk.length;
        await writeProgress(env, prog).catch(() => {});
      }

      result.steps.subscribe = {
        total: all.length,
        done: prog.done,
        subscribed: prog.subscribed,
        processedThisCall: processed,
        complete: prog.done >= all.length,
        resumeHint: prog.done < all.length ? ('call again with ?subscribe=1&limit=' + limit) : 'done',
      };
    }

    return new Response(JSON.stringify(result), { headers: H });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e && e.message) }), { status: 500, headers: H });
  }
}

// Fetch all CJ product ids via paginated /product/list (bulk).
async function getPids(env, cached) {
  if (Array.isArray(cached) && cached.length) return cached;
  const tok = await cjToken(env);
  const pids = [];
  let pageNum = 1;
  for (let guard = 0; guard < 400; guard++) {
    const r = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/list?pageNum=${pageNum}&pageSize=50`, {
      headers: { 'CJ-Access-Token': tok, 'Content-Type': 'application/json' },
    });
    const j = await r.json();
    const list = j?.data?.list || [];
    if (!list.length) break;
    for (const p of list) if (p.pid) pids.push(String(p.pid));
    const total = j?.data?.total || 0;
    if (pids.length >= total || list.length < 50) break;
    pageNum++;
  }
  return [...new Set(pids)];
}

async function readProgress(env) {
  try {
    const j = await ghRead(env, PROGRESS_PATH); // GitHub contents API response
    if (!j || !j.content) return { done: 0, subscribed: 0, startedAt: Date.now() };
    const txt = decodeBase64(j.content);
    const p = JSON.parse(txt);
    p.sha = j.sha;
    return p;
  } catch { return { done: 0, subscribed: 0, startedAt: Date.now() }; }
}
async function writeProgress(env, prog) {
  const { sha, ...body } = prog;
  return ghWrite(env, PROGRESS_PATH, JSON.stringify(body, null, 2), 'cj-subscribe: progress', sha);
}
function decodeBase64(s) {
  try { return new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0))); }
  catch { return atob(s.replace(/\s/g, '')); }
}
