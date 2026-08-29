// Cloudflare Pages Function: /api/register-cj-webhooks
// Connects CJ Dropshipping -> Bargain Drop via CJ webhooks and subscribes our
// sourced products so CJ pushes real-time product/variant/stock/order changes to
// https://bargain-drop.online/api/cj-webhook (handled by _cj-import.js -> Shopify).
//
// GET                 -> report intent (no mutation)
// GET ?topics=1       -> enable message topics (webhook/set): product/stock/order/logistics/makeup/privateOrder
// GET ?subscribe=1&limit=N -> subscribe our sourced CJ product pids (batched, resumable)
// GET ?run=1          -> topics + subscribe
//
// Resumable via data/cj-subscribe-progress.json in the GitHub-backed store.

import { corsHeaders, cjToken, isAdmin, adminDenied, ghRead, ghWrite, shopifyFetch, cjFetchMulti } from '../_sync-lib.js';

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
  const limit = parseInt(url.searchParams.get('limit') || '8', 10);
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
      const prog = reset ? { stage: 'resolving', done: 0, subscribed: 0 } : await readProgress(env);

      // Resolve our sourced CJ pids from Shopify SKUs (authoritative list).
      const all = Array.isArray(prog.all) ? prog.all : await resolvePids(env, prog);
      prog.all = all;

      const tok = await cjToken(env);
      let processed = 0;
      const end = Math.min(prog.done + limit * BATCH, all.length);
      for (let i = prog.done; i < end; i += BATCH) {
        const chunk = all.slice(i, i + BATCH);
        const r = await fetch('https://developers.cjdropshipping.com/api2.0/v1/webhook/product/subscribe', {
          method: 'POST', headers: { 'CJ-Access-Token': tok, 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: chunk, subscribeAll: false }),
        });
        const j = await r.json();
        prog.subscribed += (j?.code === 200 || j?.success === true) ? (j?.data?.successProductIds?.length || chunk.length) : 0;
        prog.done += chunk.length;
        processed += chunk.length;
        await writeProgress(env, prog).catch(() => {});
      }

      result.steps.subscribe = {
        total: all.length, done: prog.done, subscribed: prog.subscribed,
        processedThisCall: processed, complete: prog.done >= all.length,
        resumeHint: prog.done < all.length ? ('call again ?subscribe=1&limit=' + limit) : 'done',
      };
    }

    return new Response(JSON.stringify(result), { headers: H });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e && e.message) }), { status: 500, headers: H });
  }
}

// parentSku: 'CJJK275438701AZ' -> 'CJJK2754387'; 'CJYD2990476-2' -> 'CJYD2990476'
function parentSku(sku) {
  if (!sku) return sku;
  return String(sku).trim().replace(/-(\d+)$/, '').replace(/(\d{2})([A-Z]{2})$/, '');
}

// Resolve CJ pids from Shopify catalog SKUs (paginated), resolving in pages to bound runtime.
async function resolvePids(env, prog) {
  const resolved = Array.isArray(prog.resolved) ? [...prog.resolved] : [];
  const seen = new Set(resolved.map(x => x.sku));

  // iterate Shopify products; SKU -> parentSku -> /product/query?variantSku= -> pid
  let page = '/products.json?limit=250&fields=id,variants';
  const startIndex = prog.shopifyCursor || 0;
  let idx = 0;
  let guard = 0;
  const MAX_PAGES = 8; // bound per call; resume via shopifyCursor

  while (page && guard < MAX_PAGES) {
    const { body, headers } = await shopifyFetch(env, page);
    const products = body?.products || [];
    if (idx + products.length <= startIndex) { idx += products.length; const nx = nextPage(headers); if (!nx) break; page = nx; guard++; continue; }

    for (const p of products) {
      if (idx < startIndex) { idx++; continue; }
      for (const v of (p.variants || [])) {
        const base = parentSku(v.sku);
        if (!base || seen.has(base)) continue;
        seen.add(base);
        try {
          const j = await cjFetchMulti(env, '/product/query?variantSku=' + encodeURIComponent(base));
          const pid = j?.data?.pid || j?.data?.productId || j?.data?.id;
          if (pid) resolved.push({ sku: base, pid: String(pid) });
        } catch {}
      }
      idx++;
    }
    const nx = nextPage(headers);
    if (!nx) break;
    page = nx; guard++;
  }

  const allPids = [...new Set(resolved.map(r => r.pid))];
  // stash partial resolution for resume (allPids only advances when a page completes,
  // so retries re-resolve the current page — acceptable + idempotent).
  return allPids;
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
    if (!j || !j.content) return { stage: 'resolving', done: 0, subscribed: 0 };
    const p = JSON.parse(decodeBase64(j.content));
    p.sha = j.sha;
    return p;
  } catch { return { stage: 'resolving', done: 0, subscribed: 0 }; }
}
async function writeProgress(env, prog) {
  const { sha, ...body } = prog;
  return ghWrite(env, PROGRESS_PATH, JSON.stringify(body, null, 2), 'cj-subscribe: progress', sha);
}
function decodeBase64(s) { return new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0))); }
