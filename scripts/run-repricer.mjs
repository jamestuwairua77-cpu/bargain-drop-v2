#!/usr/bin/env node
/**
 * Bargain Drop Catalog Repricer Runner
 * 
 * Usage:
 *   node /scripts/run-repricer.mjs               (runs full pipeline across all 24 shards)
 *   node /scripts/run-repricer.mjs --dry-run     (calculates prices without mutating Shopify/GitHub)
 *   node /scripts/run-repricer.mjs --shard 0     (processes only shard 0 for quick validation)
 *   node /scripts/run-repricer.mjs --start 0 --end 5
 */

import fs from 'fs';
import path from 'path';
import { runRepricerWorkflow } from './catalog-repricer.fixed.js';

const possibleConfigPaths = [
  '/.nexus/secrets/repricer-env.json',
  '/home/user/secrets/repricer-env.json',
  path.resolve('./repricer-env.json'),
  path.resolve('./secrets/repricer-env.json')
];

// Parse simple CLI flags
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  startShard: 0,
  endShard: 23
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--shard' && args[i + 1]) {
    const s = parseInt(args[i + 1], 10);
    options.startShard = s;
    options.endShard = s;
    i++;
  } else if (args[i] === '--start' && args[i + 1]) {
    options.startShard = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--end' && args[i + 1]) {
    options.endShard = parseInt(args[i + 1], 10);
    i++;
  }
}

async function main() {
  try {
    let config = {};
    const foundPath = possibleConfigPaths.find(p => fs.existsSync(p));
    if (foundPath) {
      config = JSON.parse(fs.readFileSync(foundPath, 'utf8'));
      console.log(`✓ Loaded environment credentials from ${foundPath}`);
    } else {
      config = process.env;
      console.log("Using process.env for credentials");
    }

    if (options.dryRun) {
      console.log("⚡ Mode: DRY RUN (no Shopify or GitHub mutations will be executed)");
    }
    console.log(`Target Shard Range: all-products-${options.startShard}.json through all-products-${options.endShard}.json\n`);

    const result = await runRepricerWorkflow(config, options);
    console.log("Workflow finished successfully.", JSON.stringify(result));

    // ── Flush any inter-agent delegation requests queued during the run ──
    // The bridge agent drains ./delegate-queue.jsonl and acts on each
    // ZARO_DELEGATE envelope (log alert / pause cron / send brief).
    await flushDelegationQueue();

    process.exit(0);
  } catch (err) {
    console.error("\n❌ Fatal workflow execution error:", err.message);
    if (err.stack) console.error(err.stack);
    // Best-effort: still flush the queue so a halt is not lost on crash.
    await flushDelegationQueue();
    process.exit(1);
  }
}

/**
 * Print (and leave in place) any queued ZARO_DELEGATE requests so the bridge
 * agent can read them from the run log and act. The queue file is also left
 * for the agent to `--drain --clear` explicitly.
 */
async function flushDelegationQueue() {
  const qPath = process.env.DELEGATE_QUEUE || path.join(process.cwd(), 'delegate-queue.jsonl');
  if (!fs.existsSync(qPath)) { console.log('\n[delegation] no queued requests.'); return; }
  const lines = fs.readFileSync(qPath, 'utf8').split(/\r?\n/).filter(Boolean);
  if (!lines.length) { console.log('\n[delegation] no queued requests.'); return; }
  console.log(`\n[delegation] ${lines.length} queued request(s) — bridge agent should act now:`);
  for (const line of lines) {
    console.log('ZARO_DELEGATE ' + line);
  }
}

main();
