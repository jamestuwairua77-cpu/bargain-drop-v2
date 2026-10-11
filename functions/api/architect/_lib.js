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
export const UPLOAD_DIR = 'uploads';            // durable media root (GitHub)
export const UPLOAD_IMAGES_DIR = 'uploads/images';   // image binaries
export const UPLOAD_FILES_DIR = 'uploads/files';     // document attachments

// ─── Gemini model list (verified working against this project) ────────────
export const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
export const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

// Maximum size (bytes) for an inline image sent to Gemini as base64.
// Gemini inlineData caps at ~20MB total request; we cap each image at 4MB.
export const MAX_INLINE_IMAGE_BYTES = 4 * 1024 * 1024;
// Maximum size for a document whose *text* we extract server-side.
export const MAX_DOC_CHARS = 120000;

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

// ─── Media type helpers ────────────────────────────────────────────────────
// Normalises MIME types and file extensions so images vs documents are
// classified consistently across the upload path and the Gemini path.
export function mimeKind(mime) {
  const m = String(mime || '').toLowerCase();
  if (m.startsWith('image/')) return 'image';
  return 'document';
}

// Returns a safe file extension from a MIME type or filename.
export function extFor(mime, name) {
  const m = String(mime || '').toLowerCase();
  if (m === 'image/png') return 'png';
  if (m === 'image/jpeg' || m === 'image/jpg') return 'jpg';
  if (m === 'image/gif') return 'gif';
  if (m === 'image/webp') return 'webp';
  if (m === 'image/svg+xml') return 'svg';
  if (m === 'text/csv') return 'csv';
  if (m === 'application/json') return 'json';
  if (m === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'xlsx';
  if (m === 'application/vnd.ms-excel') return 'xls';
  if (m === 'text/plain') return 'txt';
  // fall back to the filename's extension
  const mm = String(name || '').match(/\.([a-zA-Z0-9]{1,8})$/);
  return mm ? mm[1].toLowerCase() : 'bin';
}

// Decodes a base64 string into a Uint8Array (accepts data: URLs too).
export function base64ToBytes(b64) {
  let s = String(b64 || '');
  const dataUrl = s.match(/^data:([^;]*);base64,(.*)$/);
  if (dataUrl) s = dataUrl[2];
  const clean = s.replace(/\s/g, '');
  if (typeof atob === 'function') {
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  return new Uint8Array(0);
}

function bytesToBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

// ─── Document text extraction (server-side) ───────────────────────────────
// Parses the *contents* of an attached document into plain text so it can be
// passed natively into the Gemini context window alongside the message.
// Supported: .txt, .csv (basic), .json (pretty-printed), .xlsx/.xls (first
// sheet only via lightweight heuristics — full XLSX parsing needs a lib).
export function extractDocumentText(bytes, mime, name) {
  const ext = extFor(mime, name);
  let text = new TextDecoder('utf-8').decode(bytes);

  if (ext === 'json') {
    try {
      text = JSON.stringify(JSON.parse(text), null, 2);
    } catch (e) {
      // keep raw on parse failure
    }
  } else if (ext === 'csv') {
    // Light CSV → TSV-ish rendering for readability in the context window.
    const rows = text.split(/\r?\n/).filter(r => r.trim() !== '');
    if (rows.length) {
      const cols = rows[0].split(',').length;
      // Simple tabular alignment: keep as-is but cap columns to keep it sane.
      text = rows.slice(0, 500).join('\n');
    }
  } else if (ext === 'xlsx' || ext === 'xls') {
    // No full XLSX parser on the edge; surface an honest note so the AI
    // knows the binary wasn't fully decoded and can ask the user to re-send
    // as CSV/JSON if exact cell data is required.
    text = `[Binary spreadsheet ${name || ext} attached — ${bytes.length} bytes. ` +
           `The Architect Console extracts text from CSV/JSON/TXT natively; ` +
           `for exact cell data please re-attach as CSV or JSON.]`;
  } else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp' || ext === 'svg') {
    // Images are handled via the multimodal path, not text extraction.
    return null;
  }

  if (text.length > MAX_DOC_CHARS) text = text.slice(0, MAX_DOC_CHARS) + '\n…[truncated]';
  return { ext, bytes: bytes.length, chars: text.length, text };
}

// ─── Gemini proxy (multimodal-capable) ─────────────────────────────────────
// Single call to Gemini with cross-model fallback. The API key is injected
// server-side (env.GEMINI_API_KEY), never exposed to the client.
//
// `attachments` is an optional array of { mime, name, kind, dataB64, text }.
//   - kind === 'image'  → passed as inlineData part (Gemini sees the pixels)
//   - kind === 'document' → text content folded into the prompt as a snippet
export async function callGeminiMultimodal(env, systemPersona, conversation, userText, attachments) {
  const apiKey = env.GEMINI_API_KEY || '';
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured on the Worker');

  const history = (conversation || []).slice(-12)
    .map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));

  // ── Build the prompt. Document text is injected as clearly-delimited
  //    snippets; images are attached as inlineData parts (multimodal). ──
  let promptText = systemPersona + '\n\n' + userText;
  const inlineParts = [];

  for (const att of attachments || []) {
    if (att.kind === 'image' && att.dataB64) {
      inlineParts.push({
        inlineData: { mimeType: att.mime, data: att.dataB64 },
      });
    } else if (att.kind === 'document' && att.text) {
      promptText += `\n\n--- ATTACHED FILE: ${att.name || 'document'} (${att.ext || 'txt'}) ---\n${att.text}\n--- END FILE ---`;
    } else if (att.kind === 'image' && att.text) {
      // Edge case: an "image" that was actually decoded to text (e.g. SVG).
      promptText += `\n\n--- ATTACHED IMAGE TEXT: ${att.name || 'image'} ---\n${att.text}\n--- END ---`;
    }
  }

  // Compose the user turn: a text part (possibly empty) + any image parts.
  const userParts = [{ text: promptText }, ...inlineParts];

  const body = {
    contents: [...history, { role: 'user', parts: userParts }],
  };

  let lastErr = null;
  for (const model of GEMINI_MODELS) {
    const url = `${GEMINI_ENDPOINT}/${model}:generateContent`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text();
        lastErr = new Error(`${model} → ${res.status}: ${t.slice(0, 200)}`);
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

// Convenience wrapper for text-only calls (unchanged behaviour for chat.js).
export async function callGemini(env, systemPersona, conversation, userText) {
  return callGeminiMultimodal(env, systemPersona, conversation, userText, null);
}

// ─── Durable media storage (GitHub-backed, mirrored to Zaro workspace) ────
// ghWrite only accepts UTF-8 text (it base64-encodes the string server-side),
// so raw binaries are stored as a text file whose content IS the base64
// payload (single-encode, no double-encoding). The mirror (blueprint bridge)
// decodes it back to binary when syncing to /.nexus/uploads/{images,files}/.
//
// We also return a `dataUrl` so the browser can render images instantly from
// the history metadata without a fetch+decode round-trip.
export async function storeUpload(env, { kind, mime, name, dataB64, bytes }) {
  const dir = kind === 'image' ? UPLOAD_IMAGES_DIR : UPLOAD_FILES_DIR;
  const id = 'up-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  const ext = extFor(mime, name);
  const path = `${dir}/${id}.${ext}`;

  // dataB64 is already the clean base64 payload (no data: prefix when passed
  // in from processAttachments). Store that verbatim as the file body.
  const payload = dataB64;
  const written = await ghWrite(env, path + '.b64.txt', payload, `architect: upload ${kind} ${name}`, undefined);
  const sha = (written && written.content && written.content.sha) || (written && written.sha) || null;

  return {
    path: path + '.b64.txt',
    id,
    ext,
    sha,
    bytes: bytes ?? byteLengthFromB64(payload),
    mime,
    dataUrl: `data:${mime};base64,${payload}`,
    url: '/' + path + '.b64.txt',
  };
}

function byteLengthFromB64(b64) {
  const s = String(b64 || '').replace(/^data:[^;]*;base64,/, '').replace(/\s/g, '');
  return Math.floor(s.length * 3 / 4);
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

// ─── Attachment processing pipeline ────────────────────────────────────────
// Takes the raw `attachments` array from the client (base64 strings) and
// produces (a) a Gemini-ready attachment list and (b) a durable storage map.
// Returns { geminiAttachments, stored, errors }.
export async function processAttachments(env, attachments) {
  const geminiAttachments = [];
  const stored = [];
  const errors = [];

  for (const raw of attachments || []) {
    try {
      const mime = String(raw.mime || '').toLowerCase();
      const name = String(raw.name || 'attachment');
      const dataB64 = String(raw.data || raw.dataB64 || '');
      const bytes = base64ToBytes(dataB64);
      const kind = mimeKind(mime);

      if (!dataB64) { errors.push({ name, error: 'empty data' }); continue; }

      if (kind === 'image') {
        if (bytes.length > MAX_INLINE_IMAGE_BYTES) {
          errors.push({ name, error: 'image too large to inline (>4MB)' });
          continue;
        }
        // SVG is text, not binary — extract its text for the context window.
        let text = null;
        if (mime === 'image/svg+xml') {
          const t = extractDocumentText(bytes, mime, name);
          text = t ? t.text : null;
        }
        geminiAttachments.push({ mime, name, kind, dataB64: dataB64.replace(/^data:[^;]*;base64,/, ''), text });
        const s = await storeUpload(env, { kind: 'image', mime, name, dataB64: dataB64.replace(/^data:[^;]*;base64,/, ''), bytes: bytes.length });
        stored.push({ name, mime, kind: 'image', path: s.path, url: s.url, dataUrl: s.dataUrl, bytes: bytes.length });
      } else {
        // Document → extract text, wrap for Gemini, store the file.
        const extracted = extractDocumentText(bytes, mime, name);
        if (extracted && extracted.text) {
          geminiAttachments.push({ mime, name, kind: 'document', ext: extracted.ext, text: extracted.text });
        } else {
          geminiAttachments.push({ mime, name, kind: 'document', ext: extFor(mime, name), text: '(binary attachment, text could not be extracted)' });
        }
        const s = await storeUpload(env, { kind: 'document', mime, name, dataB64: dataB64.replace(/^data:[^;]*;base64,/, ''), bytes: bytes.length });
        stored.push({ name, mime, kind: 'document', path: s.path, url: s.url, dataUrl: s.dataUrl, bytes: bytes.length, ext: extracted?.ext });
      }
    } catch (e) {
      errors.push({ name: raw?.name || 'attachment', error: e.message });
    }
  }

  return { geminiAttachments, stored, errors };
}
