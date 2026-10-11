// Cloudflare Pages Function: /api/architect/chat
// POST — secure multimodal Gemini proxy for the Architect Console.
//
// The browser sends ONLY the user's message + optional attachments (base64) —
// no API key. This function:
//   1. Injects the AI Architect persona (server-side).
//   2. Processes attachments: images → inlineData (Gemini sees pixels),
//      documents (CSV/JSON/TXT/XLSX) → extracted text folded into context.
//   3. Stores uploaded media durably (GitHub uploads/..., mirrored to the
//      Zaro workspace by the blueprint bridge).
//   4. Calls Gemini via env.GEMINI_API_KEY (encrypted Worker binding).
//   5. Persists both turns (incl. attachment metadata) to chat-logs.json.

import { corsHeaders, json, err, callGeminiMultimodal, readHistory, appendHistory, processAttachments } from './_lib.js';

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
  const rawAttachments = Array.isArray(body && body.attachments) ? body.attachments : [];
  if (!userText && rawAttachments.length === 0) return err('message or attachment is required', 400);

  const systemPersona = String((body && body.persona) || '');

  // Build recent conversation from durable history (so the AI has context).
  let history = { messages: [] };
  try { history = await readHistory(env); } catch (e) {}

  const conversation = (history.messages || [])
    .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content)
    .slice(-12)
    .map(m => ({ role: m.role, content: m.content }));

  // Process attachments → Gemini-ready list + durable storage.
  let attachmentsResult = { geminiAttachments: [], stored: [], errors: [] };
  if (rawAttachments.length) {
    try {
      attachmentsResult = await processAttachments(env, rawAttachments);
    } catch (e) {
      return err('Attachment processing failed: ' + e.message, 500);
    }
  }

  // Call Gemini (server-side key) with multimodal support.
  let reply, model;
  try {
    const result = await callGeminiMultimodal(
      env, systemPersona, conversation, userText, attachmentsResult.geminiAttachments
    );
    reply = result.text;
    model = result.model;
  } catch (e) {
    return err('Gemini call failed: ' + e.message, 502);
  }

  const ts = new Date().toISOString();

  // Attach upload metadata to the user message so the UI can render images
  // (and lists of files) in the timeline on reload.
  const userEntry = { role: 'user', content: userText || '(attachment)', ts };
  if (attachmentsResult.stored.length) {
    userEntry.attachments = attachmentsResult.stored.map(s => ({
      kind: s.kind, mime: s.mime, name: s.name, url: s.url, dataUrl: s.dataUrl, path: s.path, bytes: s.bytes,
    }));
  }
  const entries = [userEntry, { role: 'assistant', content: reply, model, ts }];

  // Persist both turns durably (best-effort — chat still returns on failure).
  let persisted = false, historyCount = 0;
  try {
    const r = await appendHistory(env, entries);
    persisted = true;
    historyCount = r.count;
  } catch (e) {
    console.error('history persist failed:', e.message);
  }

  return json({
    reply,
    model,
    persisted,
    historyCount,
    attachments: attachmentsResult.stored,
    attachmentErrors: attachmentsResult.errors,
  });
}
