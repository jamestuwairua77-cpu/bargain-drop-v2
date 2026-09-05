// fix-categories.js — recover broken product_type + persist to Shopify metafield.
//
// Fixes two catalog problems, resumably:
//   1. ~3,000 products whose `product_type` is a numeric ID (CJ leaked a numeric
//      product-type ID instead of a category name). Recover via CJ SKU lookup →
//      `categoryName`.
//   2. ~1,700 products with messy category names (mixed `>`/`/`, typos, unicode).
//      Normalize every category to a canonical top-level + clean `> ` sub-path.
// Then writes the corrected `product_type` back to Shopify (single source of truth).
//
// Progress persists in a Shopify metafield (namespace `fixcats` / key `state`),
// because the GitHub REST API is rate-limited in production. This mirrors the
// proven `cjkeys/health` metafield pattern.
//
// Auth: X-Admin-Pin (or ?pin=) matching ADMIN_PIN.
//   /api/fix-categories?limit=50        one bounded batch
//   /api/fix-categories?status=1        progress
//   /api/fix-categories?reset=1&limit=50  clear + start fresh

import { corsHeaders, isAdmin, adminDenied, shopifyFetch, cjFetchMulti, nextPageCursor } from '../_sync-lib.js';

const SHOP_GID = 'gid://shopify/Shop/73594044547';
const NS = 'fixcats';
const KEY = 'state';
const MAX_PER_RUN = 40;

// Canonical storefront top-level categories: slug -> [display name, prefixes].
const TOP_LEVELS = [
  ['womens-clothing',       "Women's Clothing",          ['women']],
  ['mens-clothing',         "Men's Clothing",            ['men ']],
  ['bags-shoes',            'Bags & Shoes',              ['bags', 'shoes', 'bages']],
  ['jewelry-watches',       'Jewelry & Watches',         ['jewelry', 'jewellery', 'watch']],
  ['home-garden-furniture', 'Home, Garden & Furniture',  ['home ', 'garden', 'furniture']],
  ['home-improvement',      'Home Improvement',          ['home improvement', 'improve']],
  ['health-beauty-hair',    'Health, Beauty & Hair',     ['health', 'beauty', 'hair', 'nail', 'makeup', 'skin ', 'wig', 'lash']],
  ['sports-outdoors',       'Sports & Outdoors',         ['sport', 'outdoor', 'fishing', 'camping', 'hiking', 'gym', 'yoga', 'cycling', 'swimm']],
  ['toys-kids-babies',      'Toys, Kids & Babies',       ['toy', 'kid', 'baby', 'babies', 'doll', 'game', 'puzzle']],
  ['phones-accessories',    'Phones & Accessories',      ['phone', 'mobile ']],
  ['consumer-electronics',  'Consumer Electronics',      ['consumer electronics', 'electronics', 'camera', 'audio', 'video', 'earbud', 'headphone', 'speaker']],
  ['automobiles-motorcycles','Automobiles & Motorcycles',['auto', 'motorcycle', 'car ', 'vehicle']],
  ['pet-supplies',          'Pet Supplies',              ['pet', 'cat', 'dog']],
  ['computer-office',       'Computer & Office',         ['computer', 'office', 'tablet', 'laptop', 'keyboard', 'mouse']],
];

function cleanupUnicode(s) {
  return String(s == null ? '' : s)
    .replace(/[\uFF01-\uFF5E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/\u3000/g, ' ')
    .replace(/[\u2018\u2019\u02BC\u0060\u00B4]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\uFF0C\u3001]/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCategory(raw) {
  let s = cleanupUnicode(raw);
  if (!s) return null;
  const parts = s.split(/\s*(?:>|\/)\s*/).map(p => p.trim()).filter(Boolean);
  if (!parts.length) return null;

  let top = null;
  const rest = parts.slice(1);
  const first = parts[0].toLowerCase();
  const norm = (x) => x.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

  for (const [slug, name] of TOP_LEVELS) {
    const n = norm(name);
    const f = norm(first);
    if (f === n) { top = name; break; }
    if (n.startsWith(f) && f.length >= 4) { top = name; break; }
    if (f.startsWith(n) && n.length >= 4) { top = name; break; }
  }
  if (!top) {
    for (const [slug, name, prefixes] of TOP_LEVELS) {
      if (prefixes.some((p) => first.startsWith(p))) { top = name; break; }
    }
  }
  if (!top) top = 'Other';

  const out = [top];
  for (const p of rest) {
    if (!p) continue;
    if (norm(p) === norm(top)) continue;
    out.push(p);
  }
  return out.join(' > ');
}

function isBrokenType(pt) {
  const s = String(pt == null ? '' : pt).trim();
  if (!s) return true;
  if (/^\d+$/.test(s)) return true;
  if (/^[<>\/\s]+$/.test(s)) return true;
  return false;
}

async function recoverFromCj(env, product) {
  const variants = product.variants || [];
  let sku = null;
  for (const v of variants) { if (v && v.sku) { sku = v.sku; break; } }
  if (!sku) return null;
  try {
    const body = await cjFetchMulti(env, '/product/query?variantSku=' + encodeURIComponent(sku));
    const d = body && body.data;
    if (body && body.code === 200 && d) {
      return { category: d.categoryName || null, pid: d.pid != null ? String(d.pid) : null, sku, ok: true };
    }
    return { category: null, pid: null, sku, ok: false, code: body && body.code, msg: body && body.message };
  } catch (e) {
    return { category: null, pid: null, sku, ok: false, error: String(e && e.message) };
  }
}

async function loadState(env) {
  try {
    const q = `query { shop { metafields(first:1, keys: ["${NS}.${KEY}"]) { edges { node { value } } } } }`;
    const { body } = await shopifyFetch(env, '/graphql.json', { method: 'POST', body: JSON.stringify({ query: q }) });
    const edges = body?.data?.shop?.metafields?.edges || [];
    if (edges.length) return JSON.parse(edges[0].node.value || '{}');
  } catch {}
  return { done: [], fixed: 0, recovered: 0, normalized: 0 };
}
async function saveState(env, state) {
  try {
    const mq = `mutation set($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { metafields { id } userErrors { field message } } }`;
    await shopifyFetch(env, '/graphql.json', {
      method: 'POST',
      body: JSON.stringify({ query: mq, variables: { m: [{ ownerId: SHOP_GID, namespace: NS, key: KEY, type: 'json', value: JSON.stringify(state) }] } }),
    });
  } catch {}
}

async function fetchAllActiveProducts(env) {
  const base = '/products.json?limit=250&fields=id,title,product_type,variants,status';
  let prods = [], cursor = null, guard = 0;
  while (true) {
    const url = base + (cursor ? '&page_info=' + encodeURIComponent(cursor) : '');
    const { body, headers } = await shopifyFetch(env, url);
    for (const p of (body.products || [])) if (p.status === 'active' && p.title) prods.push(p);
    cursor = nextPageCursor(headers);
    if (!cursor) break;
    if (++guard > 1000) throw new Error('pagination runaway');
    await new Promise(r => setTimeout(r, 300));
  }
  return prods;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();
  const url = new URL(request.url);
  const isStatus = url.searchParams.get('status') === '1';
  const limit = Math.max(1, Math.min(MAX_PER_RUN, parseInt(url.searchParams.get('limit') || String(MAX_PER_RUN), 10)));
  const reset = url.searchParams.get('reset') === '1';

  const state = await loadState(env);
  if (reset) Object.assign(state, { done: [], fixed: 0, recovered: 0, normalized: 0 });
  const doneSet = new Set(state.done || []);
  if (isStatus) {
    return new Response(JSON.stringify({ ok: true, doneCount: doneSet.size, fixed: state.fixed, recovered: state.recovered, normalized: state.normalized }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  const summary = { run: new Date().toISOString(), scanned: 0, broken: 0, recovered: 0, normalized: 0, written: 0, skipped: 0, errors: [] };
  const products = await fetchAllActiveProducts(env);
  summary.scanned = products.length;

  let processed = 0;
  for (const p of products) {
    if (processed >= limit) break;
    const id = String(p.id);
    const current = p.product_type;
    const broken = isBrokenType(current);
    if (doneSet.has(id) && !broken) { summary.skipped++; continue; }

    let newType = null;
    if (broken) {
      summary.broken++;
      const rec = await recoverFromCj(env, p);
      if (rec && rec.ok && rec.category) {
        newType = rec.category;
        summary.recovered++;
        state.recovered = (state.recovered || 0) + 1;
      } else {
        summary.errors.push({ id, sku: rec && rec.sku, reason: rec ? (rec.msg || rec.code || rec.error || 'no-cj-data') : 'no-sku' });
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
    } else {
      newType = current;
    }

    const normalized = normalizeCategory(newType);
    if (!normalized) { summary.errors.push({ id, reason: 'unmappable' }); continue; }

    if (normalized !== current) {
      const r = await shopifyFetch(env, '/products/' + id + '.json', { method: 'PUT', body: JSON.stringify({ product: { id: p.id, product_type: normalized } }) });
      if (r.ok) { summary.written++; state.fixed = (state.fixed || 0) + 1; }
      else { summary.errors.push({ id, reason: 'shopify put ' + r.status }); continue; }
    } else {
      summary.normalized++;
      state.normalized = (state.normalized || 0) + 1;
    }
    doneSet.add(id);
    processed++;
    await new Promise(r => setTimeout(r, 400));
  }

  state.done = Array.from(doneSet);
  await saveState(env, state);
  summary.doneCount = doneSet.size;
  return new Response(JSON.stringify(summary), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}
