#!/usr/bin/env node
/**
 * Bargain Drop — "Assistant to the Assistant" inter-agent delegation layer.
 *
 * The repricer runtime (catalog-repricer.fixed.js / run-repricer.mjs) runs
 * headless inside a sandbox and CANNOT write to the Zaro workspace or call
 * schedule_task directly. Instead, when it detects a system-level anomaly it
 * emits a STRUCTURED DELEGATION REQUEST — a `ZARO_DELEGATE` JSON envelope —
 * which the workspace bridge / agent picks up and executes on Zaro's behalf.
 *
 * This module is:
 *   1. IMPORTED by the repricer runtime (in-process emitter).
 *   2. ALSO runnable standalone to flush a queued request (the bridge calls
 *      `node delegation.mjs --emit <json>` or reads the queue file).
 *
 * Request schema (delegation "types"):
 *   { "type": "delegate", "action": "<action>", ... }
 *
 * Supported `action`s:
 *   - "log_alert"      → write an alert statement into the workspace files
 *   - "pause_cron"     → pause a Zaro scheduled task (by job_id)
 *   - "send_brief"     → produce a human-readable brief explaining the halt
 *   - "signal"         → generic status signal (health ping)
 *
 * The emitter is QUEUE-BASED: every delegate request is appended to a local
 * queue file (JSON lines at DELEGATE_QUEUE, default ./delegate-queue.jsonl)
 * so nothing is lost if the process exits before the bridge drains it.
 */

import fs from 'fs';
import path from 'path';

// Where queued delegation requests are persisted (sandbox-local JSONL).
const QUEUE_PATH = process.env.DELEGATE_QUEUE || path.join(process.cwd(), 'delegate-queue.jsonl');

/** Emit a single delegation request: append to queue + return the envelope. */
export function delegate(action, payload = {}) {
  const env = {
    version: 1,
    kind: 'ZARO_DELEGATE',
    ts: new Date().toISOString(),
    source: 'repricer-runtime',
    action,
    payload,
  };
  try {
    fs.mkdirSync(path.dirname(QUEUE_PATH), { recursive: true });
    fs.appendFileSync(QUEUE_PATH, JSON.stringify(env) + '\n', 'utf8');
  } catch (e) {
    // Queue write is best-effort; emit to stdout as fallback so the harness
    // (bridge agent) can still see the request in the run log.
    console.error('[delegation] queue write failed:', e.message);
    console.log('ZARO_DELEGATE ' + JSON.stringify(env));
  }
  console.log('[delegation] emitted', action, '→', JSON.stringify(payload).slice(0, 200));
  return env;
}

/* ── Convenience emitters (hard-wired to the anomaly criteria) ─────────── */

/** Massive network failure or hard margin-floor violation → halt + brief. */
export function delegateHalt(reason, detail = {}) {
  return delegate('pause_cron', {
    job_id: detail.job_id || CRON_WEEKLY_REPRICER,
    reason,
    cause: detail.cause || 'unclassified',
    detected_at: new Date().toISOString(),
  });
}

export function delegateLogAlert(message, level = 'ERROR', detail = {}) {
  return delegate('log_alert', { message, level, ...detail });
}

export function delegateSendBrief(brief) {
  return delegate('send_brief', { brief });
}

export function delegateSignal(name, detail = {}) {
  return delegate('signal', { name, ...detail });
}

// The weekly background cron that must be paused on anomaly (per spec).
export const CRON_WEEKLY_REPRICER = '168c3bcd-421d-4bed-b9d4-5924bbf2271a';

/** Drain the queue (standalone mode): print each queued request as JSON. */
export function drainQueue() {
  let lines = [];
  try {
    if (fs.existsSync(QUEUE_PATH)) {
      lines = fs.readFileSync(QUEUE_PATH, 'utf8').split(/\r?\n/).filter(Boolean);
    }
  } catch {}
  return lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

/** Clear the queue (called by the bridge after it has acted on all requests). */
export function clearQueue() {
  try { fs.writeFileSync(QUEUE_PATH, '', 'utf8'); } catch {}
}

// ─── Standalone CLI (so the bridge can invoke `node delegation.mjs`) ──────
if (import.meta.url === ('file://' + process.argv[1]) || process.argv[1]?.endsWith('delegation.mjs')) {
  const args = process.argv.slice(2);
  if (args.includes('--drain')) {
    const q = drainQueue();
    console.log(JSON.stringify(q, null, 2));
    if (args.includes('--clear')) clearQueue();
  } else if (args.includes('--emit')) {
    const idx = args.indexOf('--emit');
    const raw = args[idx + 1];
    try {
      const obj = JSON.parse(raw);
      delegate(obj.action, obj.payload || {});
    } catch (e) {
      console.error('--emit requires valid JSON:', e.message);
      process.exit(1);
    }
  } else {
    console.log('usage: node delegation.mjs --drain [--clear] | --emit \'{"action":"...","payload":{...}}\'');
  }
}
