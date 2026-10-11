// Cloudflare Pages Function: /api/architect/exec
// POST — the "Execute via Zaro" backend (edge half of a two-layer bridge).
//
// Important architectural truth: this Worker runs on Cloudflare's edge and
// CANNOT write to the Zaro workspace filesystem (/scripts/catalog-repricer.fixed.js).
// The repricer engine is a workspace-side tool run via `node run-repricer.mjs`.
//
// So this function performs the edge-side responsibilities it CAN do, and
// leaves the workspace-side apply to the Zaro agent (which watches GitHub):
//
//   1. Gates behind the admin PIN (X-Admin-Pin / Bearer / ?pin).
//   2. Stages the blueprint durably to scripts/blueprints/<id>.js on GitHub —
//      this is the source-of-truth handoff the Zaro agent consumes.
//   3. Overwrites the repo copy at scripts/catalog-repricer.fixed.js so the
//      blueprint is version-controlled alongside the deploy.
//   4. Runs a LIVE, read-only test loop over the 24 sharded catalog served
//      from the app origin, recomputes the locked .95 tiered price, and
//      reports mismatches — real validation, not a fake.
//
// The Zaro agent then applies the same blueprint to the workspace engine and
// runs the Shopify variant sync (the actual production mutation path).

import { corsHeaders, json, err, requireAdmin, adminDenied, ghRead, ghWrite } from './_lib.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return err('Method not allowed — use POST', 405);
  }

  // ── 1. Auth gate ────────────────────────────────────────────────────────
  if (!requireAdmin(request, env)) return adminDenied();

  let body;
  try { body = await request.json(); } catch (e) { return err('Invalid JSON body', 400); }

  const blueprint = String((body && body.blueprint) || (body && body.code) || '').trim();
  const target = String((body && body.target) || 'scripts/catalog-repricer.fixed.js');
  if (!blueprint) return err('blueprint is required', 400);

  const runTestLoop = !(body && body.dryRun === true);

  const id = 'bp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  const results = { id, target, staged: false, repoApplied: false, testLoop: runTestLoop };

  // ── 2. Stage the blueprint durably (source-of-truth handoff to Zaro) ────
  try {
    const stagePath = 'scripts/blueprints/' + id + '.js';
    await ghWrite(env, stagePath, blueprint, 'architect: stage blueprint ' + id);
    results.staged = true;
    results.stagePath = stagePath;
  } catch (e) {
    return err('Failed to stage blueprint: ' + e.message, 500);
  }

  // ── 3. Overwrite the repo copy of the repricer engine ───────────────────
  try {
    const existing = await ghRead(env, target);
    const existingSha = existing && existing.sha;
    const applied = await ghWrite(env, target, blueprint, 'architect: apply blueprint ' + id + ' → ' + target, existingSha);
    results.repoApplied = true;
    results.repoSha = (applied && applied.content && applied.content.sha) || null;
    if (applied && applied.commit && applied.commit.sha) results.commitSha = applied.commit.sha;
  } catch (e) {
    // Non-fatal: staging succeeded; repo copy apply is best-effort.
    results.repoApplyError = e.message;
  }

  // ── 4. Live read-only test loop over the 24-shard catalog ───────────────
  if (runTestLoop) {
    try {
      const test = await runCatalogTest(request);
      results.testResults = test;
    } catch (e) {
      results.testError = e.message;
    }
  }

  return json({ ok: true, ...results });
}

// ─── Locked .95 tiered pricing matrix (must match engine exactly) ─────────
const FX = 1.4234;

function multiplierFor(usdCost) {
  if (usdCost < 10) return 3.2;
  if (usdCost <= 15) return 2.8;
  if (usdCost <= 22) return 2.5;
  if (usdCost <= 30) return 2.2;
  if (usdCost <= 60) return 1.9;
  return 1.7;
}

function targetPrice(usdCost) {
  const m = multiplierFor(usdCost);
  const raw = Math.ceil(usdCost * m * FX) - 0.05;
  return Math.max(0, raw);
}

function endsIn95(p) {
  return Math.abs(p - Math.round(p)) === 0 && Math.abs((p * 100) % 100 - 95) < 0.001;
}

function estUsdCost(p) {
  // Reverse the baseline when COGS is missing: price = ceil(cost*2.2*FX)-0.05
  const aud = Number(p) || 0;
  if (aud <= 0) return 1.5;
  return Math.max(1.5, (aud + 0.05) / (2.2 * FX));
}

// ─── Test loop over the sharded catalog served from the app origin ────────
async function runCatalogTest(request) {
  const base = new URL(request.url).origin;

  // 1. Manifest
  let manifest;
  const mRes = await fetch(base + '/all-products.json', { cf: { cacheTtl: 0 } });
  if (mRes.ok) manifest = await mRes.json();
  else throw new Error('Manifest not available: ' + mRes.status);

  const shardCount = Array.isArray(manifest) ? 0 : (manifest.shards || 0);
  const shardFiles = [];
  if (shardCount > 0) {
    for (let i = 0; i < shardCount; i++) shardFiles.push('all-products-' + i + '.json');
  } else {
    shardFiles.push('all-products.json');
  }

  // 2. Load every product across all shards
  const all = [];
  for (const f of shardFiles) {
    const r = await fetch(base + '/' + f, { cf: { cacheTtl: 0 } });
    if (!r.ok) continue;
    let data;
    try { data = await r.json(); } catch { continue; }
    if (Array.isArray(data)) all.push(...data);
  }

  // 3. Evaluate each product against the locked formula
  let mismatch = 0, total = 0, zeroPrice = 0, noImage = 0, non95 = 0;
  const samples = [];

  for (const p of all) {
    if (p && p.visible === false) continue;
    total++;
    // Price field: prefer variants array over a flat price
    let price = null;
    const variants = p.variants || p.variant || p.variants_info;
    if (Array.isArray(variants) && variants.length) {
      const v0 = variants[0];
      price = v0.price != null ? v0.price : v0.compare_at_price;
    }
    if (price == null) price = p.price;
    if (price == null || Number(price) <= 0) { zeroPrice++; continue; }

    const usdCost = p.cost != null ? p.cost : (p.usd_cost != null ? p.usd_cost : estUsdCost(price));
    const want = targetPrice(Number(usdCost));
    const have = Number(price);

    if (!endsIn95(have)) non95++;
    if (Math.abs(have - want) > 0.004) {
      mismatch++;
      if (samples.length < 20) {
        samples.push({ title: (p.title || '').slice(0, 60), have, want });
      }
    }
    if (!p.image && !p.images && !(Array.isArray(p.images) && p.images.length)) noImage++;
  }

  return {
    shardsScanned: shardFiles.length,
    productsEvaluated: total,
    mismatches: mismatch,
    non95Endings: non95,
    zeroPrice: zeroPrice,
    noImage: noImage,
    formula: 'ceil(USD_cost × multiplier × 1.4234) − 0.05',
    sampleMismatches: samples,
  };
}
