// Cloudflare Pages Function: /api/architect/upload
// POST — routes media uploads to dedicated durable sub-folders.
//
//   kind === 'image'    → uploads/images/<id>.<ext>   (binary, base64 payload)
//   kind === 'document' → uploads/files/<id>.<ext>    (CSV/JSON/TXT/XLSX)
//
// This is the "compact infrastructure routing" layer: images and documents are
// cleanly separated and returned with the URL the UI uses to render them.
// The canonical durable store is GitHub; the Zaro workspace mirror is kept in
// sync at /.nexus/uploads/{images,files}/ by the blueprint bridge agent.

import { corsHeaders, json, ok, err, storeUpload, mimeKind, base64ToBytes, extractDocumentText, requireSession, sessionDenied } from './_lib.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return err('Method not allowed — use POST', 405);
  }

  // Gate behind the Architect Console session cookie (PIN-authenticated).
  if (!(await requireSession(request, env))) return sessionDenied();

  let body;
  try { body = await request.json(); } catch (e) { return err('Invalid JSON body', 400); }

  const mime = String((body && body.mime) || '').toLowerCase();
  const name = String((body && body.name) || 'upload');
  const dataB64 = String((body && body.data) || (body && body.dataB64) || '');

  if (!mime) return err('mime is required', 400);
  if (!dataB64) return err('data (base64) is required', 400);

  let kind = body && body.kind ? String(body.kind) : null;
  if (!kind) kind = mimeKind(mime);

  if (kind !== 'image' && kind !== 'document') {
    return err('kind must be "image" or "document"', 400);
  }

  const bytes = base64ToBytes(dataB64);
  if (bytes.length === 0) return err('could not decode attachment data', 400);

  let result;
  try {
    result = await storeUpload(env, { kind, mime, name, dataB64: dataB64.replace(/^data:[^;]*;base64,/, ''), bytes: bytes.length });
  } catch (e) {
    return err('Upload failed: ' + e.message, 500);
  }

  const out = { ok: true, kind, ...result };

  // For documents, also return the extracted text (client may preview it).
  if (kind === 'document') {
    const extracted = extractDocumentText(bytes, mime, name);
    out.extracted = extracted ? { ext: extracted.ext, chars: extracted.chars, preview: extracted.text.slice(0, 2000) } : null;
  }

  return ok(out);
}
