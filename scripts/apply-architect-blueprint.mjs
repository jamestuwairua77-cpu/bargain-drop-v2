#!/usr/bin/env node
/**
 * Architect Console "Execute via Zaro" — workspace-side bridge.
 *
 * Polls GitHub scripts/blueprints/*.js for NEW blueprint files staged by the
 * edge function (/api/architect/exec), applies the newest one to the engine,
 * and optionally runs the repricer. Durable + resumable: processed IDs are
 * recorded in the state file so a blueprint is never double-applied.
 *
 * Usage:
 *   node apply-blueprint.mjs                 # apply new blueprints, dry-run test only
 *   node apply-blueprint.mjs --live          # also run full Shopify sync (mutates)
 *   node apply-blueprint.mjs --id bp-xxx     # force-process a specific id (re-run)
 *
 * State file: /data/architect-blueprint-state.json (via NEXUS_STATE env or default)
 */

import fs from 'fs';
import path from 'path';

const REPO_API = 'https://api.github.com/repos';
const OWNER = process.env.GITHUB_OWNER || 'jamestuwairua77-cpu';
const REPO = process.env.GITHUB_REPO || 'bargain-drop-v2';
const BRANCH = 'main';
const TOKEN = process.env.GITHUB_TOKEN;
const ENGINE_PATH = '/scripts/catalog-repricer.fixed.js';
const STATE_PATH = process.env.STATE_FILE || '/data/architect-blueprint-state.json';
const LIVE = process.argv.includes('--live');
const FORCE_ID = (process.argv.find(a => a.startsWith('--id=')) || '').split('=')[1] || null;

if (!TOKEN) { console.error('GITHUB_TOKEN not set'); process.exit(1); }

const gh = async (url) => {
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/vnd.github+json', 'User-Agent': 'zaro-architect' },
  });
  const text = await res.text();
  if (!res.ok) throw new Error('GH ' + res.status + ': ' + text.slice(0, 200));
  return JSON.parse(text);
};

const ghRaw = async (url) => {
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/vnd.github.raw+json', 'User-Agent': 'zaro-architect' },
  });
  if (!res.ok) throw new Error('GH ' + res.status + ': ' + (await res.text()).slice(0, 200));
  return res.text();
};

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); }
  catch { return { processed: {} }; }
}
function saveState(s) { fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true }); fs.writeFileSync(STATE_PATH, JSON.stringify(s, null, 2)); }

async function listBlueprints() {
  // Use the git tree API (recursive) to enumerate scripts/blueprints/ cheaply.
  const ref = await gh(`${REPO_API}/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
  const commit = await gh(`${REPO_API}/${OWNER}/${REPO}/git/commits/${ref.object.sha}`);
  const tree = await gh(`${REPO_API}/${OWNER}/${REPO}/git/trees/${commit.tree.sha}?recursive=1`);
  return (tree.tree || [])
    .filter(t => t.type === 'blob' && t.path.startsWith('scripts/blueprints/') && t.path.endsWith('.js'))
    .map(t => t.path);
}

/**
 * Mirror Architect Console media uploads from GitHub -> workspace (via sandbox).
 *
 * The edge stores images/docs as base64 TEXT files under uploads/{images,files}/
 * (suffixed .b64.txt, because ghWrite only accepts UTF-8 text). We decode them
 * back to binary and write them to a SANDBOX-LOCAL mirror dir (this script runs
 * inside the sandbox, which cannot write the Zaro workspace directly). The
 * bridge AGENT then copies that dir back via sandbox_file_transfer to
 * /.nexus/uploads/{images,files}/. Already-mirrored files are tracked in state.
 */
async function mirrorUploads(state) {
  // Sandbox-local mirror root (the agent copies this to /.nexus/uploads after).
  const UPLOAD_MIRROR = process.env.MIRROR_DIR || '/home/user/arch-mirror/uploads';
  try {
    const ref = await gh(`${REPO_API}/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    const commit = await gh(`${REPO_API}/${OWNER}/${REPO}/git/commits/${ref.object.sha}`);
    const tree = await gh(`${REPO_API}/${OWNER}/${REPO}/git/trees/${commit.tree.sha}?recursive=1`);
    const uploads = (tree.tree || []).filter(t =>
      t.type === 'blob' && t.path.startsWith('uploads/') && t.path.endsWith('.b64.txt')
    );

    if (uploads.length === 0) return;
    if (!state.mirrored) state.mirrored = {};
    let mirrored = 0;

    for (const item of uploads) {
      if (state.mirrored[item.path]) continue;
      try {
        const b64Text = await ghRaw(`${REPO_API}/${OWNER}/${REPO}/contents/${item.path}?ref=${BRANCH}`);
        const b64 = b64Text.trim();
        const binary = Buffer.from(b64, 'base64');

        // Map uploads/{images|files}/<id>.<ext>.b64.txt -> <mirror>/{images|files}/<id>.<ext>
        const rel = item.path.replace(/^uploads\//, '').replace(/\.b64\.txt$/, '');
        const dest = path.join(UPLOAD_MIRROR, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, binary);
        state.mirrored[item.path] = { ts: new Date().toISOString(), dest: dest, bytes: binary.length };
        mirrored++;
        console.log('  ⬇️ mirrored upload →', dest, '(' + binary.length + ' bytes)');
      } catch (e) {
        console.warn('  ⚠️ mirror failed', item.path + ':', e.message);
        state.mirrored[item.path] = { ts: new Date().toISOString(), error: e.message };
      }
    }
    if (mirrored) console.log(`Mirrored ${mirrored} media upload(s) to ${UPLOAD_MIRROR}`);
  } catch (e) {
    console.warn('Mirror uploads skipped:', e.message);
  }
}

/**
 * Handle structured ZARO_DELEGATE requests emitted by the repricer runtime.
 *
 * The runtime (running in the sandbox) cannot reach Zaro directly. It writes
 * a delegate-queue.jsonl next to it. This bridge function drains that queue,
 * parses each envelope, and returns a list of ACTIONS the bridge AGENT must
 * carry out on Zaro's behalf (the agent has schedule_task / file-write tools):
 *
 *   - { action: 'log_alert', … }  → agent writes an alert file into the workspace
 *   - { action: 'pause_cron', … } → agent pauses the schedule_task job_id
 *   - { action: 'send_brief', … } → agent produces a human-readable brief
 *
 * This function is READ-ONLY w.r.t. Zaro: it returns the action list to the
 * agent as the final JSON on stdout (the agent then executes them).
 */
async function handleDelegationRequests() {
  const qPath = process.env.DELEGATE_QUEUE || path.join(process.cwd(), 'delegate-queue.jsonl');
  const actions = [];
  try {
    if (!fs.existsSync(qPath)) return actions;
    const lines = fs.readFileSync(qPath, 'utf8').split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      let env;
      try { env = JSON.parse(line); } catch { continue; }
      if (env.kind !== 'ZARO_DELEGATE') continue;
      actions.push(env);
    }
  } catch (e) {
    console.warn('Delegation queue read failed:', e.message);
  }
  return actions;
}

async function main() {
  const state = loadState();

  // Mirror any new media uploads (images/files) to the Zaro workspace first.
  await mirrorUploads(state);

  // Drain any inter-agent delegation requests and hand them to the agent.
  const delegations = await handleDelegationRequests();

  const files = await listBlueprints();
  console.log(`Found ${files.length} blueprint(s) on GitHub:`, files.join(', ') || '(none)');

  const toApply = FORCE_ID
    ? files.filter(f => f.includes(FORCE_ID))
    : files.filter(f => !state.processed[f]);

  if (toApply.length === 0) {
    console.log('No new blueprints to process.');
    saveState(state);   // persist any mirroring done this run
    console.log('State saved to', STATE_PATH);
    return;
  }

  // Process chronologically (oldest first); blueprints are bp-<base36ts>-<rand>.js
  toApply.sort();

  for (const file of toApply) {
    console.log('\n=== Processing blueprint:', file, '===');
    try {
      const blueprint = await ghRaw(`${REPO_API}/${OWNER}/${REPO}/contents/${file}?ref=${BRANCH}`);

      // Sanity check: a blueprint must look like JavaScript, not JSON/html.
      if (blueprint.trim().startsWith('{') || blueprint.trim().startsWith('<')) {
        console.warn('  ✗ blueprint does not look like JS — skipping', file);
        state.processed[file] = { ts: new Date().toISOString(), skipped: true, reason: 'not-js' };
        continue;
      }

      // Apply to engine.
      fs.mkdirSync(path.dirname(ENGINE_PATH), { recursive: true });
      fs.writeFileSync(ENGINE_PATH, blueprint, 'utf8');
      console.log('  ✓ Applied blueprint →', ENGINE_PATH, '(' + Buffer.byteLength(blueprint) + ' bytes)');

      state.processed[file] = { ts: new Date().toISOString(), applied: true, bytes: Buffer.byteLength(blueprint) };

      // Dry-run test (safe) unless --live.
      const dryRun = !LIVE;
      console.log('  → Running repricer (' + (dryRun ? 'dry-run' : 'LIVE SYNC') + ')...');
      // NOTE: actual repricer run is performed by the agent via execute_command after this script,
      // because it needs the full workspace context (secrets file, engine imports).
      // Here we only mark intent; the agent reads state.applied and executes `node run-repricer.mjs`.

    } catch (e) {
      console.error('  ✗ FAILED to process', file + ':', e.message);
      state.processed[file] = { ts: new Date().toISOString(), error: e.message };
    }
  }

  saveState(state);
  console.log('\nState saved to', STATE_PATH);
  console.log(JSON.stringify({ applied: toApply.length, live: LIVE, delegations }, null, 2));
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
