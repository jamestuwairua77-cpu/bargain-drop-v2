// functions/api/cj-category-import.js — Cloudflare Pages Function
//
// Discovers products across 5 CJ top-level categories, pulls full detail
// (variants + images + description) for each, and bulk-creates them in Shopify
// as published products at tiered markup on real cost (clean .95 retail). Progress is persisted
// to GitHub so overlapping/repeated runs are safe and it self-continues.
//
// Triggered by GitHub Actions cron with ADMIN_PIN, so it runs fully in the
// background with zero local machine dependencies.

import { corsHeaders, isAdmin, adminDenied, shopifyFetch, cjFetchMulti, ghRead, ghWrite, appendSyncLog } from '../_sync-lib.js';

const STATE_PATH = 'data/cj-category-import-state.json';
const MAX_PER_RUN = 12; // products per cron fire (keep well within Cloudflare ~50s subrequest limit)
const LIST_PAGE_SIZE = 40;

// The 5 CJ top-level categories to import from (2nd/3rd level IDs mapped in store).
const CATEGORY_MAP = {
  "Women's Clothing": ["1543788771146", "1543788771147", "1543788771148", "1543788771149", "1543788771150", "1543788771151", "1543788771152", "1543788771153"],
  "Men's Clothing": ["1543788771154", "1543788771155", "1543788771156", "1543788771157", "1543788771158"],
  "Home, Garden & Furniture": ["1543788771159", "1543788771160", "1543788771161", "1543788771162", "1543788771163", "1543788771164", "1543788771165"],
  "Sports & Outdoors": ["1543788771166", "1543788771167", "1543788771168", "1543788771169", "1543788771170"],
  "Computer & Office": ["2252588B-72E3-4397-8C92-7D9967161084", "2502190343061609600", "874B7C94-D225-43FE-AB79-FFAF1B800651", "C7365895-913A-4078-9946-681EFD45D2B8", "D8BBE038-9ECD-4698-8CB1-DE63E27F33C7", "E33443F7-144C-4CBE-8D34-C1B6256A6325", "F8024D10-AB96-4558-AC79-C49625F768DA", "0598E853-9BF7-4939-A571-2407E819C91E", "0ACCE01C-2C83-4767-B9E8-736B7E0CC38D", "0B50EC4B-F78C-4D2D-839C-4767D6B4B7C7", "28F0E5A1-0A9A-43C5-8197-F1420A9BD10B", "BB57B72C-A8C6-40FF-BCBB-EAE0251273C6", "4D3B9582-E92E-46BF-B00E-715E70FB4742", "591E8920-019B-42FA-AE0B-420052E6C4F0", "76B88FB8-9B37-4B55-AA09-082C5627DFE8", "7E65A403-CF6E-4B55-96FF-B7C3C376A47A", "C62BC6BF-BA2B-41ED-AB12-599A6D7FCAA5", "24FAA1AB-BF10-41ED-8405-A9FA53031B3A", "3F3EFC96-82B8-44C1-BF7A-2E3E7083A875", "74B144C9-321D-4E78-986C-757BA551DD8C", "87A618B5-7CB0-4AF7-BCF8-9E9455F06B7E", "EDC3EDAF-1ED7-4776-8416-E9F8F0A5B4C6", "1E9A3E86-7E5A-439E-9B33-CBD495421F0B", "25E64DFD-1ED3-4171-86CD-0C2F40052F3B", "7D962F30-E20E-4DE9-8911-EB8AB078FB23", "D190FBF9-A352-48BD-9F4B-B6AB432988E5", "E3963C40-89BE-46AC-985D-A86FA417F6B8", "4F7EE88B-4209-42E8-A501-5F634B58BB35", "76CD1BD4-2A0A-4D72-913C-6DAADD7E9EDB", "9A33970D-F4BC-48EC-BEAB-FEC19C130963", "A77A4E59-D931-4BBE-9D48-FF995C481B66", "C019C59C-C274-44F9-B04B-5520F1EBE5FA"],
};

// ── CJ price: tiered markup on real cost (clean .95 retail) ────────────
function computePrice(baseCost) {
  const c = parseFloat(baseCost) || 0;
  if (c <= 0) return null;
  let mult;
  if (c < 5)        mult = 3.2;
  else if (c < 8)   mult = 3.0;
  else if (c < 15)  mult = 2.6;
  else if (c < 30)  mult = 2.5;
  else if (c < 60)  mult = 2.1;
  else if (c < 120) mult = 1.9;
  else              mult = 1.7;
  const raw = c * mult;
  let price = Math.ceil(raw) - 0.05;
  if (price <= 0) price = raw;
  return +price.toFixed(2);
}

function extractImages(p) {
  const urls = [];
  const add = (u) => { if (u && typeof u === 'string' && !urls.includes(u)) urls.push(u); };
  add(p.bigImage);
  add(p.productImage);
  if (Array.isArray(p.productImageSet)) p.productImageSet.forEach(add);
  return urls.map(src => ({ src }));
}

function buildShopifyProduct(pid, d) {
  const variants = d.variants || [];
  if (!variants.length) return null;

  // Options: default to Title if no variantKey split
  const keyParts = variants.map(v => String(v.variantKey || '').split('-').length);
  const maxParts = Math.max(...keyParts, 1);
  const optionNames = maxParts === 1 ? ['Title'] : (maxParts === 2 ? ['Color', 'Size'] : ['Option 1', 'Option 2', 'Option 3'].slice(0, maxParts));

  const shopVariants = variants.map(v => {
    const parts = String(v.variantKey || '').split('-');
    const ov = {};
    optionNames.forEach((_, i) => { ov['option' + (i + 1)] = parts[i] != null ? String(parts[i]) : (i === 0 ? 'Default Title' : ''); });
    const price = computePrice(v.variantSellPrice);
    return {
      ...ov,
      price: price != null ? String(price) : '0',
      sku: v.variantSku != null ? String(v.variantSku) : undefined,
      grams: v.variantWeight != null ? Math.round(Number(v.variantWeight) * 1000) : 0,
      inventory_management: 'shopify',
      inventory_policy: 'deny',
      fulfillment_service: 'manual',
      requires_shipping: true,
      taxable: true,
    };
  });

  const title = (d.productNameEn || d.productName || 'Imported CJ Product').slice(0, 255);
  const images = extractImages(d);

  return {
    title,
    body_html: d.description || '',
    vendor: 'Bargain Drop',
    product_type: d.categoryName || 'General',
    tags: `cj-import, cj-pid-${pid}`,
    status: 'active',
    options: optionNames.map(name => ({ name })),
    variants: shopVariants,
    images: images.length ? images : undefined,
  };
}

// ── State helpers (GitHub-backed, resumable) ──────────────────────────────
async function loadState(env) {
  const r = await ghRead(env, STATE_PATH).catch(() => null);
  if (r && r.content) {
    try { return JSON.parse(atob(r.content.replace(/\n/g, ''))); } catch {}
  }
  return { donePids: {}, fetchedPids: {}, catCursor: {}, imported: 0 };
}

async function saveState(env, state) {
  const r = await ghRead(env, STATE_PATH).catch(() => null);
  const sha = r && r.sha ? r.sha : null;
  await ghWrite(env, STATE_PATH, JSON.stringify(state, null, 2), 'cj-category-import progress', sha);
}

// ── Discovery: page listV2 for a category, return new (unfetched) pids ───
async function discoverPids(env, catName, subcats, state, budget) {
  const found = [];
  const startPage = state.catCursor[catName] || 1;
  let page = startPage;
  while (found.length < budget && page - startPage < 60) {
    const cid = subcats[(page - 1) % subcats.length];
    const res = await cjFetchMulti(env, `/product/listV2?pageNum=${page}&pageSize=${LIST_PAGE_SIZE}&categoryId=${cid}`);
    const content = (res && res.data && res.data.content) || [];
    let n = 0;
    for (const grp of content) {
      for (const pl of (grp.productList || [])) {
        const pid = String(pl.id || '');
        if (pid && !state.fetchedPids[pid] && !state.donePids[pid]) { found.push(pid); n++; }
      }
    }
    page++;
    state.catCursor[catName] = page;
    if (n < LIST_PAGE_SIZE) break;
    await new Promise(r => setTimeout(r, 300));
  }
  return found;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();

  const url = new URL(request.url);
  const wantReset = url.searchParams.get('reset') === '1';
  const limit = Math.max(1, Math.min(MAX_PER_RUN, parseInt(url.searchParams.get('limit') || String(MAX_PER_RUN), 10)));

  const state = await loadState(env);
  if (wantReset) {
    Object.assign(state, { donePids: {}, fetchedPids: {}, catCursor: {}, imported: 0 });
  }

  const summary = { run: new Date().toISOString(), discovered: 0, fetched: 0, created: 0, skipped: 0, totalImported: state.imported || 0, errors: [] };

  // 1. Discover pids across categories until quota met or exhausted.
  const catNames = Object.keys(CATEGORY_MAP);
  const discovered = [];
  let exhausted = 0;
  while (discovered.length < limit && exhausted < catNames.length) {
    let progressed = false;
    for (const cat of catNames) {
      if (discovered.length >= limit) break;
      const fresh = await discoverPids(env, cat, CATEGORY_MAP[cat], state, limit - discovered.length);
      if (fresh.length) { discovered.push(...fresh); progressed = true; }
      else exhausted++;
    }
    if (!progressed) break;
  }
  summary.discovered = discovered.length;

  // 2. Fetch full detail for each pid, build Shopify products.
  const toCreate = [];
  for (const pid of discovered) {
    if (toCreate.length >= limit) break;
    try {
      const d = await cjFetchMulti(env, `/product/query?pid=${pid}`);
      if (!d || d.code !== 200 || !d.data) { state.fetchedPids[pid] = true; state.donePids[pid] = 'nodata'; summary.skipped++; continue; }
      const prod = buildShopifyProduct(pid, d.data);
      if (!prod) { state.fetchedPids[pid] = true; state.donePids[pid] = 'novariants'; summary.skipped++; continue; }
      toCreate.push(prod);
      state.fetchedPids[pid] = true;
      summary.fetched++;
      await new Promise(r => setTimeout(r, 220));
    } catch (e) {
      summary.errors.push({ pid, error: String(e && e.message) });
    }
  }

  // 3. Create in Shopify one product per request (REST `{"product": {...}}`).
  for (const product of toCreate) {
    const m = String(product.tags || '').match(/cj-pid-([^,\s]+)/);
    const pid = m ? m[1] : null;
    const r = await shopifyFetch(env, `/products.json`, {
      method: 'POST',
      body: JSON.stringify({ product }),
    });
    if (r.ok) {
      summary.created += 1;
      if (pid) state.donePids[pid] = true;
    } else {
      let _e = (r.body && (r.body.errors || r.body.error || r.body.message)) || r.status;
      const msg = (typeof _e === 'string') ? _e : JSON.stringify(_e);
      summary.errors.push({ pid, error: 'shopify create: ' + msg });
      if (pid) delete state.fetchedPids[pid];
    }
    await new Promise(r => setTimeout(r, 750)); // Shopify ~2 calls/sec limit
  }
  state.imported = (state.imported || 0) + summary.created;
  summary.totalImported = state.imported;

  await saveState(env, state).catch(e => summary.errors.push({ phase: 'save', error: String(e && e.message) }));
  summary.finished = new Date().toISOString();
  try { await appendSyncLog(env, { type: 'cj-category-import', ...summary }); } catch {}

  return new Response(JSON.stringify(summary), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
