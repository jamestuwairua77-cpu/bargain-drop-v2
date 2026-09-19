import imaplib, email, json, re
from email.header import decode_header, make_header

import os, datetime
HOST=os.environ.get("MAIL_HOST","mail.havitomail.com")
USER=os.environ.get("MAIL_USER","support@bargain-drop.online")
PW=os.environ.get("MAIL_PASS","")
if not PW: raise SystemExit("MAIL_PASS env var required")

def dec(v):
    if not v: return ""
    try: return str(make_header(decode_header(v)))
    except Exception: return str(v)

def strip_html(h):
    h = re.sub(r'(?is)<(script|style).*?</\1>', ' ', h)
    h = re.sub(r'(?s)<[^>]+>', ' ', h)
    h = (h.replace('&nbsp;',' ').replace('&amp;','&').replace('&lt;','<')
          .replace('&gt;','>').replace('&quot;','"').replace('&#39;',"'"))
    return re.sub(r'\s+', ' ', h).strip()

M = imaplib.IMAP4_SSL(HOST, 993)
M.login(USER, PW)
M.select("INBOX")
typ, data = M.search(None, "ALL")
uids = data[0].split()
msgs = []
for u in uids:
    typ, d = M.fetch(u, "(RFC822)")
    raw = d[0][1]
    m = email.message_from_bytes(raw)
    text, html = "", ""
    if m.is_multipart():
        for p in m.walk():
            ct = p.get_content_type()
            if p.get('Content-Disposition'): continue
            try: payload = p.get_payload(decode=True)
            except Exception: continue
            if not payload: continue
            body = payload.decode(p.get_content_charset() or 'utf-8', errors='replace')
            if ct == 'text/plain' and not text: text = body
            elif ct == 'text/html' and not html: html = body
    else:
        payload = m.get_payload(decode=True) or b''
        body = payload.decode(m.get_content_charset() or 'utf-8', errors='replace')
        if m.get_content_type() == 'text/html': html = body
        else: text = body
    if not text and html: text = strip_html(html)
    snippet = re.sub(r'\s+', ' ', (text or '')).strip()[:300] or '(empty message)'
    frm = dec(m.get('From'))
    msgs.append({
        "uid": u.decode(),
        "from": frm,
        "to": dec(m.get('To')) or USER,
        "subject": dec(m.get('Subject')) or "(no subject)",
        "date": dec(m.get('Date')),
        "snippet": snippet,
        "text": (text or '')[:20000],
        "html": (html or '')[:60000],
        "status": "unread",
    })
M.logout()
msgs.sort(key=lambda x: int(x['uid']), reverse=True)
stamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
out = {"synced_at": stamp, "count": len(msgs), "messages": msgs}
with open(os.environ.get('OUT','data/inbox.json'),'w') as f:
    json.dump(out, f, indent=1, ensure_ascii=False)
print("MESSAGES:", len(msgs))
for x in msgs: print(" uid", x['uid'], "|", x['from'][:42], "|", x['subject'][:44])
