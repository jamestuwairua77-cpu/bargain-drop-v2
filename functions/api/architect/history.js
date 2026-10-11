// Cloudflare Pages Function: /api/architect/history
// GET  — returns the durable chat history (data/chat-logs.json via GitHub).
// POST — appends one or more entries (used for client-side "staged" messages,
//        EXEC_REQUEST records, or manual imports/clears).
//
// This is the durable replacement for browser localStorage. The canonical
// file is mirrored between the GitHub repo (data/chat-logs.json) and the
// Zaro workspace (/.nexus/history/chat-logs.json).

import { corsHeaders, json, err, readHistory, appendHistory } from './_lib.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method === 'GET') {
    try {
      const history = await readHistory(env);
      return json({ history, count: (history.messages || []).length });
    } catch (e) {
      return err('Failed to read history: ' + e.message, 500);
    }
  }

  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch (e) { return err('Invalid JSON body', 400); }

    const entries = body && (body.entries || body.messages || body.entry);
    if (!entries) return err('entries is required', 400);

    try {
      const r = await appendHistory(env, entries);
      return json({ ok: true, count: r.count, sha: r.sha });
    } catch (e) {
      return err('Failed to append history: ' + e.message, 500);
    }
  }

  return err('Method not allowed', 405);
}
