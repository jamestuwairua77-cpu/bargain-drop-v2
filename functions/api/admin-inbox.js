// Admin inbox API — Pages Function (free-plan safe: no raw TCP, HTTPS only).
// GET  /api/admin-inbox?action=list          -> inbox feed (data/inbox.json)
// GET  /api/admin-inbox?action=read&uid=N    -> single message
// POST /api/admin-inbox?action=send          -> send reply via Resend HTTPS API
const PIN = '03091996';
const J = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});

async function feed(env, request) {
  const url = new URL('/data/inbox.json', new URL(request.url).origin);
  const res = await fetch(url.toString(), { cf: { cacheTtl: 0 } });
  if (!res.ok) return { messages: [], synced_at: null };
  try { return await res.json(); } catch (e) { return { messages: [], synced_at: null }; }
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'list';

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Pin',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    }});
  }

  if (request.headers.get('X-Admin-Pin') !== PIN) {
    return J({ ok: false, error: 'Unauthorized' }, 401);
  }

  try {
    const data = await feed(env, request);
    const messages = Array.isArray(data.messages) ? data.messages : [];

    if (action === 'list') {
      return J({
        ok: true,
        synced_at: data.synced_at || null,
        messages: messages.map(m => ({
          uid: m.uid, from: m.from, subject: m.subject,
          date: m.date, snippet: m.snippet, status: m.status
        }))
      });
    }

    if (action === 'read') {
      const uid = url.searchParams.get('uid');
      const m = messages.find(x => String(x.uid) === String(uid));
      if (!m) return J({ ok: false, error: 'Message not found' }, 404);
      return J({
        ok: true, uid: m.uid, from: m.from, to: m.to || 'support@bargain-drop.online',
        subject: m.subject, date: m.date, text: m.text || '', html: m.html || ''
      });
    }

    if (action === 'send') {
      if (request.method !== 'POST') return J({ ok: false, error: 'POST required' }, 405);
      const body = await request.json().catch(() => ({}));
      const to = body.to, subject = body.subject || '(no subject)';
      const text = body.text || body.body || '';
      if (!to) return J({ ok: false, error: 'Missing "to" address' }, 400);

      const key = env.RESEND_API_KEY;
      if (!key) return J({ ok: false, error: 'RESEND_API_KEY not configured in Cloudflare Pages env' }, 500);
      const from = env.RESEND_FROM_EMAIL || 'Bargain Drop <no-reply@bargain-drop.online>';

      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, text, reply_to: 'support@bargain-drop.online' })
      });
      const out = await r.json().catch(() => ({}));
      if (!r.ok) return J({ ok: false, error: (out && out.message) || ('Resend error ' + r.status) }, 502);
      return J({ ok: true, id: out.id || null });
    }

    return J({ ok: false, error: 'Unknown action: ' + action }, 400);
  } catch (e) {
    return J({ ok: false, error: String(e && e.message || e) }, 500);
  }
}
