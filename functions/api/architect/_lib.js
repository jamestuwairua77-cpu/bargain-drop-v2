// Shared helpers for the Architect Console Cloudflare Pages Functions.
// These functions provide the SECURE proxy layer between the browser console
// and the external systems (Gemini, GitHub, Shopify). No secret ever reaches
// the browser: GEMINI_API_KEY / GITHUB_TOKEN / SHOPIFY_ACCESS_TOKEN are read
// from the Worker's encrypted environment (bindings), never embedded in HTML.

import { corsHeaders, ghRead, ghWrite } from '../../_sync-lib.js';

// Re-export the shared helpers so sibling functions can import them from this
// module directly (single import surface for the architect feature).
export { corsHeaders, ghRead, ghWrite };

// ─── Repo / path constants ────────────────────────────────────────────────
export const REPO = 'bargain-drop-v2';
export const HISTORY_PATH = 'data/chat-logs.json';
export const REPRICER_PATH = 'scripts/catalog-repricer.fixed.js';
export const BLUEPRINT_DIR = 'scripts/blueprints';

// ─── Gemini model list (verified working against this project) ────────────
export const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
export const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

// ─── CORS + JSON response helpers ──────────────────────────────────────────
export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

export function ok(data) { return json(data, 200); }
export function err(message, status = 500) { return json({ error: message }, status); }

// ─── Admin gate (reuses the site's ADMIN_PIN) ─────────────────────────────
// "Execute via Zaro" mutates production files, so it MUST be gated behind the
// same admin PIN the rest of the admin panel uses.
export function requireAdmin(request, env) {
  const expected = env.ADMIN_PIN || '';
  if (!expected) return false;
  const h = request.headers.get('X-Admin-Pin') || '';
  const auth = request.headers.get('Authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  let pin = '';
  try { pin = new URL(request.url).searchParams.get('pin') || ''; } catch (e) {}
  const candidate = h || bearer || pin;
  const a = String(candidate || ''), b = String(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function adminDenied() { return err('Unauthorized — admin PIN required', 401); }

// ─── Gemini proxy ──────────────────────────────────────────────────────────
// Single call to Gemini with cross-model fallback. The API key is injected
// server-side (env.GEMINI_API_KEY), never exposed to the client.
export async function callGemini(env, systemPersona, conversation, userText) {
  const apiKey = env.GEMINI_API_KEY || '';
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured on the Worker');

  const history = (conversation || []).slice(-12)
    .map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));

  const body = {
    contents: [...history, { role: 'user', parts: [{ text: systemPersona + '\n\n' + userText }] }],
  };

  let lastErr = null;
  for (const model of GEMINI_MODELS) {
    const url = `${GEMINI_ENDPOINT}/${model}:generateContent`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text();
        lastErr = new Error(`${model} → ${res.status}: ${t.slice(0, 160)}`);
        continue;
      }
      const data = await res.json();
      const text = (data?.candidates?.[0]?.content?.parts || [])
        .map(p => p.text || '').join('').trim();
      if (!text) { lastErr = new Error(`${model} returned empty`); continue; }
      return { text, model };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('All Gemini models failed');
}

// ─── Durable history (GitHub-backed chat-logs.json) ──────────────────────
// Replaces browser localStorage with the true workspace target. The canonical
// file lives at data/chat-logs.json in the repo (mirrored to the Zaro
// workspace at /.nexus/history/chat-logs.json). Reads and appends are atomic
// via the shared ghWrite helper (Git tree → commit → ref-update).
export async function readHistory(env) {
  const raw = await ghRead(env, HISTORY_PATH);
  if (!raw || !raw.content) {
    return { version: 1, project: 'Bargain Drop', console: 'Architect Console', messages: [] };
  }
  try {
    const parsed = JSON.parse(atob(raw.content));
    return { version: 1, messages: [], ...parsed };
  } catch (e) {
    return { version: 1, project: 'Bargain Drop', console: 'Architect Console', messages: [] };
  }
}

export async function appendHistory(env, entries) {
  const current = await readHistory(env);
  const add = Array.isArray(entries) ? entries : [entries];
  current.messages = (current.messages || []).concat(add);
  current.updatedAt = new Date().toISOString();
  const content = JSON.stringify(current, null, 2);
  const written = await ghWrite(env, HISTORY_PATH, content, 'architect: append chat history');
  // ghWrite returns the GitHub PUT response: { content: { sha, ... }, commit: {...} }
  const newSha = (written && written.content && written.content.sha) || (written && written.sha) || null;
  return { count: current.messages.length, sha: newSha };
}
