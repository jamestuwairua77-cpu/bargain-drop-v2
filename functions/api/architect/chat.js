// Cloudflare Pages Function: /api/architect/chat
// POST — secure Gemini proxy for the Architect Console.
//
// The browser sends ONLY the user's message (no API key). This function:
//   1. Injects the AI Architect persona (server-side).
//   2. Calls Gemini via env.GEMINI_API_KEY (encrypted Worker binding).
//   3. Persists both turns to the durable GitHub-backed chat-logs.json.
//
// This removes GEMINI_API_KEY from the front-end entirely — closing the
// secret-exposure caveat from the v1 client-side console.

import { corsHeaders, json, err, callGemini, readHistory, appendHistory } from './_lib.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return err('Method not allowed — use POST', 405);
  }

  let body;
  try { body = await request.json(); } catch (e) { return err('Invalid JSON body', 400); }

  const userText = String((body && body.message) || '').trim();
  if (!userText) return err('message is required', 400);

  const systemPersona = String((body && body.persona) || '');

  // Build recent conversation from durable history (so the AI has context).
  let history = { messages: [] };
  try { history = await readHistory(env); } catch (e) {}

  const conversation = (history.messages || [])
    .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content)
    .slice(-12)
    .map(m => ({ role: m.role, content: m.content }));

  // Call Gemini (server-side key).
  let reply, model;
  try {
    const result = await callGemini(env, systemPersona, conversation, userText);
    reply = result.text;
    model = result.model;
  } catch (e) {
    return err('Gemini call failed: ' + e.message, 502);
  }

  const ts = new Date().toISOString();
  const entries = [
    { role: 'user', content: userText, ts },
    { role: 'assistant', content: reply, model, ts },
  ];

  // Persist both turns durably (best-effort — chat still returns on failure).
  let persisted = false, historyCount = 0;
  try {
    const r = await appendHistory(env, entries);
    persisted = true;
    historyCount = r.count;
  } catch (e) {
    console.error('history persist failed:', e.message);
  }

  return json({ reply, model, persisted, historyCount });
}
