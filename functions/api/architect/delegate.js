// Cloudflare Pages Function: /api/architect/delegate
// POST — Gemini (Architect Console) hands a structured WORK ORDER to Zaro.
//
// This is the "assistant to the assistant" handoff seam: Gemini figures out
// WHAT to build (the plan + exact code), and Zaro — who has the real access
// (GitHub, Shopify, Cloudflare, workspace FS) — actually BUILDS it.
//
// The work order is written durably to GitHub `delegations/pending/<id>.json`.
// The Zaro-side bridge (scheduled task) polls that path every few minutes,
// executes each task, and writes a completion report to
// `delegations/done/<id>.json`. The console polls /api/architect/delegation-status
// to surface "Zaro done ✅".
//
// Work order schema:
//   { id, from, summary, tasks: [{ action, ... }] }
//     action: "write_file"  → { path, content, message }
//             "shell"       → { command }  (executed by Zaro bridge in sandbox)
//             "shopify"     → { note }     (Zaro runs via its Shopify integration)
//             "deploy"      → { note }     (Zaro triggers the Pages deploy via GH Actions)

import { json, err, corsHeaders, requireSession, sessionDenied } from './_lib.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return err('Method not allowed — use POST', 405);
  }
  if (!(await requireSession(request, env))) return sessionDenied();

  let body;
  try { body = await request.json(); } catch (e) { return err('Invalid JSON body', 400); }

  const summary = String((body && body.summary) || '').trim();
  const tasks = Array.isArray(body && body.tasks) ? body.tasks : [];
  if (!summary && tasks.length === 0) return err('summary or tasks required', 400);

  const { ghWrite } = await import('./_lib.js');

  const id = 'wo-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  const envelope = {
    id,
    ts: new Date().toISOString(),
    from: 'gemini-architect',
    summary,
    tasks: tasks.slice(0, 50),   // safety cap
    status: 'pending',
  };

  const path = 'delegations/pending/' + id + '.json';
  await ghWrite(env, path, JSON.stringify(envelope, null, 2), 'architect(delegate): ' + id);

  return json({ ok: true, id, path });
}
