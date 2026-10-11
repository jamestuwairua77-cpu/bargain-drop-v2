// Cloudflare Pages Function: /api/architect/delegation-status
// GET — poll for Zaro's completion report on a work order.
//   ?id=wo-xxx   → { id, status, report }  (from delegations/done/<id>.json)
//   ?index       → { items: [...] }        (from delegations/index.json)
//
// The Zaro-side bridge writes the report to delegations/done/<id>.json and
// appends a summary to delegations/index.json; this endpoint just reads those
// via the shared ghRead helper (no secrets reach the browser).

import { json, corsHeaders, requireSession, sessionDenied } from './_lib.js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed — use GET' }, 405);
  }
  if (!(await requireSession(request, env))) return sessionDenied();

  const { ghRead } = await import('./_lib.js');
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  // Index listing.
  if (url.searchParams.has('index') || !id) {
    try {
      const raw = await ghRead(env, 'delegations/index.json');
      if (!raw || !raw.content) return json({ items: [] });
      const idx = JSON.parse(atob(raw.content));
      return json({ items: (idx.items || []).slice(0, 50) });
    } catch (e) {
      return json({ items: [] });
    }
  }

  // Single-report lookup by id.
  try {
    const raw = await ghRead(env, 'delegations/done/' + id + '.json');
    if (!raw || !raw.content) return json({ id, status: 'pending' });
    const report = JSON.parse(atob(raw.content));
    return json({ id, status: report.status || 'unknown', report });
  } catch (e) {
    return json({ id, status: 'pending' });
  }
}
