// CJ Auto-Sync Worker (self-running, hourly cron).
//
// Reconciles tracked Shopify products against CJ:
//   1. Hide products that are out-of-stock on CJ (all variants 0).
//   2. Un-hide products whose stock returned.
//   3. Hide products that no longer exist on CJ (code 1600014 / not found).
//
// Operates ONLY on products the user has imported (Shopify is the tracked set),
// never the full 1.5M CJ catalog. Runs invisible in the background.

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
const SHOPIFY_API = 'https://bargain-drop-8194.myshopify.com/admin/api/2025-10';
const OAUTH_URL = 'https://bargain-drop-8194.myshopify.com/admin/oauth/access_token';

// ── Shopify token auto-refresh (client-credentials grant) ──
let _shopifyToken = { token: null, exp: 0 };
async function getShopifyToken(env, force = false) {
  const cid = env.SHOPIFY_OAUTH_CLIENT_ID || env.SHOPIFY_CLIENT_ID || '';
  const cs = env.SHOPIFY_OAUTH_CLIENT_SECRET || env.SHOPIFY_CLIENT_SECRET || '';
  if (cid && cs) {
    if (!force && _shopifyToken.token && Date.now() < _shopifyToken.exp) return _shopifyToken.token;
    const r = await fetch(OAUTH_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: cid, client_secret: cs, grant_type: 'client_credentials' }),
    });
    const j = await r.json();
    if (!j || !j.access_token) throw new Error('Shopify exchange failed');
    _shopifyToken = { token: j.access_token, exp: Date.now() + ((Number(j.expires_in) || 86399) - 600) * 1000 };
    return _shopifyToken.token;
  }
  const staticTok = env.SHOPIFY_ACCESS_TOKEN || env.SHOPIFY_TOKEN || '';
  if (staticTok) return staticTok;
  throw new Error('no Shopify token');
}

export default {
  // ── cron trigger ──
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runReconcile(env));
  },

  // ── manual/debug trigger + HTTP endpoint for testing ──
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/run') {
      const summary = await runReconcile(env);
      return new Response(JSON.stringify(summary), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('CJ auto-sync worker is running.', { headers: { 'Content-Type': 'text/plain' } });
  },
};

// ── Multi-key CJ token + fetch (rotate through accounts 1..6 + MCP) ──
const _tokens = new Map();
async function cjToken(env) {
  const keys = [];
  if (env.CJ_ACCESS_TOKEN) keys.push(env.CJ_ACCESS_TOKEN);
  for (let i = 2; i <= 6; i++) if (env['CJ_ACCESS_TOKEN_' + i]) keys.push(env['CJ_ACCESS_TOKEN_' + i]);
  const apiKey = keys[Math.floor(Math.random() * keys.length)];
  if (!apiKey) throw new Error('no CJ key');
  const c = _tokens.get(apiKey);
  if (c && Date.now() < c.exp) return c.tok;
  const r = await fetch(CJ_BASE + '/authentication/getAccessToken', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  });
  const j = await r.json();
  const tok = j?.data?.accessToken;
  if (!tok) throw new Error('CJ auth failed');
  _tokens.set(apiKey, { tok, exp: Date.now() + 12 * 3600 * 1000 });
  return tok;
}

async function cjVariantQuery(env, pid) {
  const tok = await cjToken(env);
  const r = await fetch(CJ_BASE + '/product/variant/query?pid=' + encodeURIComponent(pid), {
    headers: { 'CJ-Access-Token': tok },
  });
  return r.json();
}

async function cjProductQueryBySku(env, sku) {
  const tok = await cjToken(env);
  const r = await fetch(CJ_BASE + '/product/query?variantSku=' + encodeURIComponent(sku), {
    headers: { 'CJ-Access-Token': tok },
  });
  return r.json();
}

// ── Shopify helpers ──
async function shopifyFetch(env, path, opts = {}) {
  let token;
  try { token = await getShopifyToken(env); }
  catch (e) { token = env.SHOPIFY_ACCESS_TOKEN || env.SHOPIFY_TOKEN || ''; }
  if (!token) throw new Error('no Shopify token');

  let r = await fetch(SHOPIFY_API + path, {
    ...opts,
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });

  // 401 → expired token → re-exchange + retry once.
  if (r.status === 401) {
    try {
      token = await getShopifyToken(env, true);
      r = await fetch(SHOPIFY_API + path, {
        ...opts,
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
          ...(opts.headers || {}),
        },
      });
    } catch {}
  }

  const text = await r.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  return { ok: r.ok, status: r.status, body };
}

async function allTrackedProducts(env) {
  const out = [];
  let sinceId = 0;
  for (let page = 0; page < 40; page++) {
    const res = await shopifyFetch(env, `/products.json?limit=250&since_id=${sinceId}&fields=id,title,status,tags,variants`);
    const prods = res.body?.products || [];
    if (!prods.length) break;
    for (const p of prods) {
      const tags = String(p.tags || '');
      // tracked = has a CJ pid/sku tag. Fall back to all products tagged cj-import.
      const pidMatch = tags.match(/cj-pid-([^,\s]+)/);
      const pid = pidMatch ? pidMatch[1] : null;
      const firstSku = (p.variants || []).map(v => v.sku).find(Boolean) || null;
      if (pid || firstSku) out.push({ id: p.id, title: p.title, status: p.status, pid, sku: firstSku, variants: p.variants || [] });
    }
    sinceId = prods[prods.length - 1].id;
    if (prods.length < 250) break;
  }
  return out;
}

async function setStatus(env, id, status) {
  return shopifyFetch(env, `/products/${id}.json`, {
    method: 'PUT',
    body: JSON.stringify({ product: { id: Number(id), status } }),
  });
}

// ── Main reconciliation ──
async function runReconcile(env) {
  const summary = { started: new Date().toISOString(), scanned: 0, hidden: 0, unhidden: 0, removedHidden: 0, noChange: 0, errors: [] };

  let products;
  try {
    products = await allTrackedProducts(env);
  } catch (e) {
    summary.errors.push({ phase: 'load', error: String(e && e.message) });
    return summary;
  }
  summary.scanned = products.length;

  // Budget guard: allow up to maxSync per run to stay under CJ quota.
  const maxSync = parseInt(env.CJ_SYNC_MAX || '200', 10);

  for (const prod of products.slice(0, maxSync)) {
    try {
      // Resolve CJ data: prefer pid; else look up by sku.
      let variants = null;
      if (prod.pid) {
        const v = await cjVariantQuery(env, prod.pid);
        if (v && v.code === 200 && Array.isArray(v.data)) variants = v.data;
        else if (v && v.code === 1600014) { await hide(env, prod, 'removed'); summary.removedHidden++; continue; }
        else if (v && v.code !== 200) { /* fall through to sku lookup */ }
      }
      if (!variants && prod.sku) {
        const q = await cjProductQueryBySku(env, prod.sku);
        if (q && q.code === 200 && q.data && Array.isArray(q.data.variants)) variants = q.data.variants;
        else if (q && (q.code === 1600014 || q.code === 16900202 || q.data == null)) {
          await hide(env, prod, 'removed');
          summary.removedHidden++;
          continue;
        }
      }

      if (!variants) {
        // Can't determine state — assume removed (hide) to avoid showing dead products.
        await hide(env, prod, 'unknown');
        summary.removedHidden++;
        continue;
      }

      // Determine stock: in-stock if any variant has positive inventory.
      const anyInStock = variants.some(v => {
        const n = Number(v.inventoryNum ?? v.availableStock ?? v.stock ?? 0);
        return !Number.isFinite(n) || n > 0;
      });

      const currentlyVisible = prod.status !== 'draft';
      if (!anyInStock && currentlyVisible) {
        await hide(env, prod, 'out-of-stock');
        summary.hidden++;
      } else if (anyInStock && !currentlyVisible) {
        await unhide(env, prod);
        summary.unhidden++;
      } else {
        summary.noChange++;
      }

      // throttle to respect CJ QPS (1 req/sec)
      await new Promise(r => setTimeout(r, 250));
    } catch (e) {
      summary.errors.push({ id: prod.id, error: String(e && e.message) });
    }
  }

  summary.finished = new Date().toISOString();
  return summary;
}

async function hide(env, prod, reason) {
  const r = await setStatus(env, prod.id, 'draft');
  if (r.ok) await recordFlag(env, prod.id, false, reason);
}

async function unhide(env, prod) {
  const r = await setStatus(env, prod.id, 'active');
  if (r.ok) await recordFlag(env, prod.id, true, 'stock-returned');
}

async function recordFlag(env, id, visible, reason) {
  // Update the `visible` flag in the catalog via GitHub. Uses the repo's existing
  // ghWrite mechanism through the GITHUB_TOKEN.
  try {
    const token = env.GITHUB_TOKEN || '';
    if (!token) return;
    const headers = { Authorization: 'Bearer ' + token, 'User-Agent': 'bargain-drop-worker', Accept: 'application/vnd.github+json' };
    const meta = await fetch('https://api.github.com/repos/jamestuwairua77-cpu/bargain-drop-v2/contents/all-products.json', { headers });
    if (!meta.ok) return;
    const m = await meta.json();
    const content = JSON.parse(atob((m.content || '').replace(/\n/g, '')));
    if (!Array.isArray(content)) return;
    let changed = false;
    for (const p of content) {
      if (String(p.id) === String(id) && p.visible !== visible) {
        p.visible = visible;
        changed = true;
        break;
      }
    }
    if (!changed) return;
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));
    await fetch('https://api.github.com/repos/jamestuwairua77-cpu/bargain-drop-v2/contents/all-products.json', {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'cj-sync: visible=' + visible + ' (' + reason + ') for ' + id, content: b64, sha: m.sha, branch: 'main' }),
    });
  } catch {}
}
