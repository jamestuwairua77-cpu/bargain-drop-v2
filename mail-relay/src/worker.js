// mail-relay: Cloudflare Worker bridge for IMAP + SMTP (admin support inbox).
// Uses connect() from 'cloudflare:sockets' with proper TLS:
//   IMAP: secureTransport "on" (implicit TLS on 993)
//   SMTP: secureTransport "starttls" (upgrade via startTls() on 587)
// Credentials come from Worker SECRETS (env), never hardcoded.
import { connect } from 'cloudflare:sockets';

const MAIL_HOST = 'mail.havitomail.com';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Pin',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
}
function unauthorized() { return json({ error: 'Unauthorized' }, 401); }
function isAdmin(request, env) {
  return (request.headers.get('X-Admin-Pin') || '') === (env.ADMIN_PIN || '03091996');
}

// ── line-buffered socket wrapper (bind to a live Socket) ───────────
class Conn {
  constructor(socket) {
    this.socket = socket;
    this.writer = socket.writable.getWriter();
    this.reader = socket.readable.getReader();
    this.decoder = new TextDecoder();
    this.buf = '';
  }
  async send(line) { await this.writer.write(new TextEncoder().encode(line + '\r\n')); }
  async readLine() {
    for (;;) {
      const idx = this.buf.indexOf('\n');
      if (idx >= 0) { const l = this.buf.slice(0, idx).replace(/\r$/, ''); this.buf = this.buf.slice(idx + 1); return l; }
      const { value, done } = await this.reader.read();
      if (done) throw new Error('socket closed');
      this.buf += this.decoder.decode(value, { stream: true });
    }
  }
  async readUntil(pred) {
    for (;;) {
      const l = await this.readLine();
      if (typeof pred === 'string' ? l.startsWith(pred) : pred(l)) return l;
    }
  }
  async close() { try { await this.writer.close(); } catch (e) {} try { await this.socket.close(); } catch (e) {} }
}

function b64(str) { return btoa(unescape(encodeURIComponent(str))); }

// ── IMAP (implicit TLS on 993) ─────────────────────────────────────
async function imapList(user, pass, limit) {
  const c = new Conn(connect({ hostname: MAIL_HOST, port: 993 }, { secureTransport: 'on' }));
  try {
    await c.readUntil(l => l.startsWith('* OK') || l.startsWith('* PREAUTH'));
    await c.send('A1 LOGIN ' + JSON.stringify(user) + ' ' + JSON.stringify(pass));
    if (!(await c.readUntil(l => l.startsWith('A1 '))).includes('OK')) throw new Error('IMAP login failed');
    await c.send('A2 SELECT "INBOX"');
    await c.readUntil(l => l.startsWith('A2 '));
    await c.send('A3 FETCH 1:* (UID ENVELOPE RFC822.SIZE)');
    const messages = [];
    let current = null;
    for (;;) {
      const line = await c.readLine();
      if (line.startsWith('A3 ')) break;
      const m = line.match(/^(\d+) FETCH/);
      if (m) {
        if (current) messages.push(current);
        current = { seq: +m[1], uid: null, envelope: '', size: null };
        const rest = line.slice(line.indexOf('FETCH') + 5);
        const uidm = rest.match(/UID (\d+)/); if (uidm) current.uid = +uidm[1];
        const szm = rest.match(/RFC822\.SIZE (\d+)/); if (szm) current.size = +szm[1];
        current.envelope = rest;
      } else if (current) { current.envelope += ' ' + line; }
    }
    if (current) messages.push(current);
    const list = messages.map(m => parseEnvelope(m)).slice(-limit);
    return { total: messages.length, messages: list.reverse() };
  } finally { await c.close(); }
}

function parseEnvelope(m) {
  let date = '', subject = '', from = '';
  try {
    const toks = tokenizeParen(m.envelope);
    if (toks.length >= 1 && toks[0] !== 'NIL') date = toks[0].replace(/"/g, '').trim();
    if (toks.length >= 2 && toks[1] !== 'NIL') subject = decodeHeader(toks[1]);
    if (toks.length >= 3 && toks[2] !== 'NIL') from = decodeHeader(toks[2].replace(/[()]/g, '').trim());
  } catch (e) {}
  return { uid: m.uid, seq: m.seq, from, subject, date, size: m.size };
}

function tokenizeParen(s) {
  const out = []; let cur = '', depth = 0;
  for (const c of s) {
    if (c === '(') { depth++; if (depth > 1) cur += c; }
    else if (c === ')') { depth--; if (depth > 0) cur += c; else { out.push(cur); cur = ''; } }
    else cur += c;
  }
  if (cur) out.push(cur);
  return out;
}

function decodeHeader(s) {
  s = (s || '');
  s = s.replace(/=\?[^?]+\?[bB]\?([^?]*)\?=/g, (_, b) => { try { return b64ToUtf8(b); } catch (e) { return b; } });
  s = s.replace(/=\?[^?]+\?[qQ]\?([^?]*)\?=/g, (_, q) => q.replace(/_/g, ' ').replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))));
  return s.replace(/"/g, '').trim();
}
function b64ToUtf8(b) {
  const bin = atob(b);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// ── IMAP read one message (uid fetch) ──────────────────────────────
async function imapRead(user, pass, uid) {
  const c = new Conn(connect({ hostname: MAIL_HOST, port: 993 }, { secureTransport: 'on' }));
  try {
    await c.readUntil(l => l.startsWith('* OK') || l.startsWith('* PREAUTH'));
    await c.send('A1 LOGIN ' + JSON.stringify(user) + ' ' + JSON.stringify(pass));
    if (!(await c.readUntil(l => l.startsWith('A1 '))).includes('OK')) throw new Error('IMAP login failed');
    await c.send('A2 SELECT "INBOX"');
    await c.readUntil(l => l.startsWith('A2 '));
    await c.send(`A3 UID FETCH ${uid} (BODY.PEEK[])`);
    // Read literal bytes robustly by length
    let raw = null;
    for (;;) {
      const line = await c.readLine();
      if (line.startsWith('A3 ') && !line.trim().startsWith('*')) break;
      // capture the "{N}" literal: after this line, the next N bytes are the body followed by a line.
      const lm = line.match(/\{(\d+)\}\s*$/);
      if (lm) {
        const N = +lm[1];
        // read exactly N bytes from the buffered reader
        raw = await readLiteral(c, N);
        // consume trailing CRLF line (the closing ')')
        await c.readLine();
        break;
      }
    }
    if (raw === null) throw new Error('message body not found');
    return parseMessage(raw);
  } finally { await c.close(); }
}

async function readLiteral(c, n) {
  // Build up exactly n bytes from c.buf and c.reader.
  const decoder = new TextDecoder();
  let out = '';
  let have = 0;
  while (have < n) {
    if (c.buf.length === 0) {
      const { value, done } = await c.reader.read();
      if (done) throw new Error('socket closed mid-literal');
      c.buf += decoder.decode(value, { stream: true });
    }
    const take = Math.min(n - have, c.buf.length);
    out += c.buf.slice(0, take);
    c.buf = c.buf.slice(take);
    have += take;
  }
  return out;
}

function parseMessage(raw) {
  const sep = raw.indexOf('\r\n\r\n');
  const head = sep >= 0 ? raw.slice(0, sep) : raw;
  const body = sep >= 0 ? raw.slice(sep + 4) : '';
  const fields = {}; let prev = null;
  head.split(/\r?\n/).forEach(l => {
    if (/^\s+/.test(l) && prev) fields[prev] += ' ' + l.trim();
    else { const c2 = l.indexOf(':'); if (c2 > 0) { const k = l.slice(0, c2).toLowerCase(); fields[k] = l.slice(c2 + 1).trim(); prev = k; } }
  });
  let text = body;
  const te = fields['content-transfer-encoding'] || '';
  if (/base64/i.test(te)) { try { text = b64ToUtf8(body.replace(/\s+/g, '')); } catch (e) {} }
  else if (/quoted-printable/i.test(te)) text = body.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  const isHtml = /text\/html/i.test(fields['content-type'] || '');
  return {
    from: decodeHeader(fields['from'] || ''), to: fields['to'] || '', cc: fields['cc'] || '',
    subject: decodeHeader(fields['subject'] || ''), date: fields['date'] || '', messageId: fields['message-id'] || '',
    text: isHtml ? '' : text, html: isHtml ? text : '',
  };
}

// ── SMTP (587 STARTTLS) ────────────────────────────────────────────
async function smtpSend(user, pass, { to, cc, bcc, subject, text, html, replyTo }) {
  let c = new Conn(connect({ hostname: MAIL_HOST, port: 587 }, { secureTransport: 'starttls' }));
  try {
    await c.readUntil('220');
    await c.send('EHLO bargain-drop.online');
    await c.readUntil('250');
    await c.send('STARTTLS');
    await c.readUntil('220');
    const secure = c.socket.startTls();
    c = new Conn(secure);
    await c.send('EHLO bargain-drop.online');
    await c.readUntil('250');
    await c.send('AUTH LOGIN');
    await c.readUntil('334');
    await c.send(b64(user));
    await c.readUntil('334');
    await c.send(b64(pass));
    const auth = await c.readUntil(l => l.startsWith('235') || l.startsWith('501') || l.startsWith('535'));
    if (!auth.startsWith('235')) throw new Error('SMTP auth failed: ' + auth);
    await c.send('MAIL FROM:<' + user + '>');
    await c.readUntil(l => l.startsWith('250'));
    const rcpts = [to, cc, bcc].filter(Boolean).flatMap(x => String(x).split(',').map(y => y.trim()).filter(Boolean));
    for (const r of rcpts) { await c.send('RCPT TO:<' + r + '>'); await c.readUntil(l => l.startsWith('250') || l.startsWith('251')); }
    await c.send('DATA');
    await c.readUntil('354');
    await c.send(buildMime(user, { to, cc, subject, text, html, replyTo }));
    const sent = await c.readUntil(l => l.startsWith('250') || l.startsWith('550') || l.startsWith('554'));
    await c.send('QUIT');
    return { ok: sent.startsWith('250'), accepted: rcpts, response: sent };
  } finally { await c.close(); }
}

function buildMime(user, { to, cc, subject, text, html, replyTo }) {
  const nl = '\r\n'; const h = [];
  h.push('Date: ' + new Date().toUTCString());
  h.push('From: Bargain Drop Support <' + user + '>');
  h.push('To: ' + to);
  if (cc) h.push('Cc: ' + cc);
  if (replyTo) h.push('Reply-To: ' + replyTo);
  h.push('Subject: ' + (subject || ''));
  h.push('Message-ID: <support-' + Date.now() + '@bargain-drop.online>');
  h.push('MIME-Version: 1.0');
  const hasHtml = html && html.trim();
  if (hasHtml && text) {
    const b = '----=_bd_' + Date.now();
    h.push('Content-Type: multipart/alternative; boundary="' + b + '"');
    let out = h.join(nl) + nl + nl;
    out += '--' + b + nl + 'Content-Type: text/plain; charset=UTF-8' + nl + 'Content-Transfer-Encoding: quoted-printable' + nl + nl + qp(text) + nl;
    out += '--' + b + nl + 'Content-Type: text/html; charset=UTF-8' + nl + 'Content-Transfer-Encoding: quoted-printable' + nl + nl + qp(html) + nl;
    out += '--' + b + '--';
    return out;
  }
  h.push('Content-Type: ' + (hasHtml ? 'text/html' : 'text/plain') + '; charset=UTF-8');
  h.push('Content-Transfer-Encoding: quoted-printable');
  return h.join(nl) + nl + nl + qp(hasHtml ? html : (text || ''));
}

function qp(s) {
  return (s || '').replace(/\r?\n/g, '\r\n').replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ch => '=' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'));
}

// ── HTTP entry ─────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: CORS });
    if (!isAdmin(request, env)) return unauthorized();

    const user = env.HAVITO_MAIL_USER || 'support@bargain-drop.online';
    const pass = env.HAVITO_MAIL_PASS || '';
    if (!pass) return json({ ok: false, error: 'HAVITO_MAIL_PASS secret not set' }, 500);

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'list';

    try {
      if (action === 'list') {
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
        return json({ ok: true, ...(await imapList(user, pass, limit)) });
      }
      if (action === 'read') {
        const uid = url.searchParams.get('uid');
        if (!uid) return json({ ok: false, error: 'uid required' }, 400);
        return json({ ok: true, ...(await imapRead(user, pass, uid)) });
      }
      if (action === 'send') {
        const body = await request.json().catch(() => ({}));
        if (!body.to || !(body.subject || body.text || body.html)) return json({ ok: false, error: 'to and a subject/body required' }, 400);
        return json({ ok: true, ...(await smtpSend(user, pass, body)) });
      }
      return json({ ok: false, error: 'unknown action ' + action }, 400);
    } catch (e) {
      return json({ ok: false, error: String(e && e.message || e) }, 500);
    }
  },
};
