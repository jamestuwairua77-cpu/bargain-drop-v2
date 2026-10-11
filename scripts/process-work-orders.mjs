#!/usr/bin/env node
/**
 * Zaro-side work-order processor.
 *
 * The Architect Console (Gemini) hands build requests to Zaro by writing a
 * structured work order to GitHub `delegations/pending/<id>.json`. This script
 * — run by the scheduled bridge agent — polls that path and, for each NEW work
 * order, emits it to STDOUT as a JSON envelope the bridge AGENT then executes
 * with its real tools (file writes, GitHub commits, deploys).
 *
 * After the AGENT reports success/failure, it calls this same script with
 *   --resolve <id> "<status>" "<summary>" "<commit,list>"
 * to write the completion report to `delegations/done/<id>.json` and update
 * `delegations/index.json`. The console then surfaces the result.
 *
 * State (resumable): /data/work-order-state.json  → { processed: { id: ts } }
 *
 * Usage:
 *   node process-work-orders.mjs              # list new pending work orders → stdout
 *   node process-work-orders.mjs --resolve <id> <status> "<summary>" "<commits>"
 *   node process-work-orders.mjs --list-done
 */

import fs from 'fs';
import path from 'path';

const REPO_API = 'https://api.github.com/repos';
const OWNER = process.env.GITHUB_OWNER || 'jamestuwairua77-cpu';
const REPO = process.env.GITHUB_REPO || 'bargain-drop-v2';
const BRANCH = 'main';
const TOKEN = process.env.GITHUB_TOKEN;
const STATE_PATH = process.env.STATE_FILE || '/data/work-order-state.json';

if (!TOKEN) { console.error('GITHUB_TOKEN not set'); process.exit(1); }

const gh = async (url, opts = {}) => {
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: {
      Authorization: 'Bearer ' + TOKEN,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'zaro-architect',
      ...(opts.headers || {}),
    },
    ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error('GH ' + res.status + ': ' + text.slice(0, 200));
  return text ? JSON.parse(text) : null;
};
const ghRaw = async (url) => {
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/vnd.github.raw+json', 'User-Agent': 'zaro-architect' },
  });
  if (!res.ok) throw new Error('GH ' + res.status + ': ' + (await res.text()).slice(0, 200));
  return res.text();
};

function loadState() { try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); } catch { return { processed: {} }; } }
function saveState(s) { fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true }); fs.writeFileSync(STATE_PATH, JSON.stringify(s, null, 2)); }

async function treePaths(prefix) {
  const ref = await gh(`${REPO_API}/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
  const commit = await gh(`${REPO_API}/${OWNER}/${REPO}/git/commits/${ref.object.sha}`);
  const tree = await gh(`${REPO_API}/${OWNER}/${REPO}/git/trees/${commit.tree.sha}?recursive=1`);
  return (tree.tree || []).filter(t => t.type === 'blob' && t.path.startsWith(prefix) && t.path.endsWith('.json')).map(t => t.path);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--resolve')) {
    const i = args.indexOf('--resolve');
    const id = args[i + 1];
    const status = args[i + 2] || 'done';
    const summary = args[i + 3] || '';
    const commitsRaw = args[i + 4] || '';
    const commits = commitsRaw ? commitsRaw.split(',') : [];
    const report = {
      id, status, completedAt: new Date().toISOString(), summary,
      commits: commits.map(c => c.trim()).filter(Boolean),
    };
    // Write report.
    await gh(`${REPO_API}/${OWNER}/${REPO}/contents/delegations/done/${id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'zaro(bridge): resolve ' + id, content: Buffer.from(JSON.stringify(report, null, 2)).toString('base64'), branch: BRANCH },
    });
    // Update index.
    let index = { items: [] };
    try {
      const cur = await ghRaw(`${REPO_API}/${OWNER}/${REPO}/contents/delegations/index.json?ref=${BRANCH}`);
      index = JSON.parse(cur);
    } catch {}
    index.items = [ { id, status, summary, completedAt: report.completedAt, commits }, ...(index.items || []) ].slice(0, 100);
    if (index.items.length === 0) index.items = [{ id, status, summary, commits, completedAt: report.completedAt }];
    await gh(`${REPO_API}/${OWNER}/${REPO}/contents/delegations/index.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'zaro(bridge): update delegation index', content: Buffer.from(JSON.stringify(index, null, 2)).toString('base64'), branch: BRANCH },
    });
    // Mark processed + optionally move pending → archive.
    const state = loadState();
    state.processed[id] = new Date().toISOString();
    saveState(state);
    console.log(JSON.stringify({ resolved: id, status }));
    return;
  }

  if (args.includes('--list-done')) {
    const paths = await treePaths('delegations/done/');
    console.log(JSON.stringify({ items: paths.sort().reverse() }));
    return;
  }

  // Default: list new pending work orders.
  const paths = await treePaths('delegations/pending/');
  const state = loadState();
  const fresh = paths.filter(p => !state.processed[p] && !state.processed['delegations/pending/' + p.replace('delegations/pending/', '')]);
  const out = [];
  for (const p of paths) {
    const id = p.replace('delegations/pending/', '').replace(/\.json$/, '');
    if (state.processed[p] || state.processed[id]) continue;
    try {
      const raw = await ghRaw(`${REPO_API}/${OWNER}/${REPO}/contents/${p}?ref=${BRANCH}`);
      const wo = JSON.parse(raw);
      out.push({ path: p, id: wo.id || id, summary: wo.summary, plan: wo.plan, tasks: wo.tasks || [] });
    } catch (e) {
      out.push({ path: p, id, error: e.message });
    }
  }
  console.log(JSON.stringify({ pending: out }));
}

main().catch(e => { console.error('FATAL', e.message); process.exit(1); });
