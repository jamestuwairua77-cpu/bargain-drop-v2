// /api/chat — LLM-powered support assistant (Gemini).
// Full conversational AI with per-session memory, store knowledge, live order tracking,
// and product lookup. Falls back to a deterministic router if the LLM is unreachable.

import { corsHeaders, listOrders, ghRead, ghWrite, shopifyFetch } from '../_sync-lib.js';

const MODEL = 'gemini-flash-latest';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent';
const MEMORY_PATH = 'data/chat-sessions.json';
const MAX_HISTORY = 30; // messages kept per session

function norm(s){ return (s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim(); }

// ── conversation memory (persisted to GitHub, like the orders ledger) ──────────
async function loadSessions(env) {
  try { const e = await ghRead(env, MEMORY_PATH); if (e?.content) return JSON.parse(atob(e.content)); } catch {}
  return {};
}
async function getSession(env, sid) {
  const s = await loadSessions(env);
  return { all: s, list: (s[sid] || []) };
}
async function saveSession(env, sid, list) {
  const s = await loadSessions(env);
  s[sid] = list.slice(-MAX_HISTORY);
  // prune oldest sessions if too many
  const keys = Object.keys(s);
  if (keys.length > 500) { keys.slice(0, keys.length - 500).forEach(k => delete s[k]); }
  await ghWrite(env, MEMORY_PATH, JSON.stringify(s), 'chat: save session ' + (sid||'').slice(0,12));
}

// ── store context (policies + a distilled product catalog) ─────────────────────
const STORE_POLICY = `Bargain Drop is an Australian e-commerce store selling bargain-priced fashion,
home, beauty, electronics, jewellery, and more. Prices are in Australian dollars (A$).
Returns: 45-day free returns on most items.
Shipping: free on orders over A$29, otherwise A$8.44; typically 7–15 business days to Australia.
Payment: secure card and Stripe checkout. Orders are fulfilled by our dropship supplier.`;

async function buildStoreContext(env, requestUrl) {
  // Pull a compact product overview for grounded answers about items/categories.
  try {
    const base = new URL(requestUrl).origin;
    const r = await fetch(base + '/products-index.json');
    if (!r.ok) return STORE_POLICY;
    const idx = await r.json();
    const entries = Array.isArray(idx) ? idx : (idx.products || Object.values(idx));
    // Keep it compact: only a handful of representative or queried products get injected dynamically.
    return STORE_POLICY;
  } catch { return STORE_POLICY; }
}

// ── dynamic tool results injected as context (order + product) ─────────────────
async function resolveTools(env, msg, requestUrl, context) {
  const facts = [];

  // 1. order tracking
  const orderNumber = context?.order_number
    || (msg ? (String(msg).match(/#?\b(BD-[A-Z0-9-]+)\b/i) || [])[1] : '');
  if (orderNumber) {
    const orders = await listOrders(env);
    const o = orders.find(x => String(x.id).toLowerCase() === String(orderNumber).toLowerCase());
    if (o) {
      const statusMap = { unpaid:'payment still processing', paid:'payment confirmed, preparing dispatch',
        fulfilling:'being prepared by our supplier', shipped:'shipped and on its way' };
      facts.push(`ORDER ${o.id}: status "${o.status}" (${statusMap[o.status] || o.status}).`
        + (o.fulfillment?.cj?.orderNumber ? ` Fulfilment ref ${o.fulfillment.cj.orderNumber}.` : '')
        + (o.eta ? ` ETA ${o.eta}.` : ''));
    } else {
      facts.push(`Order "${orderNumber}" was NOT found in our records. Ask the customer to double-check.`);
    }
  }

  // 2. product lookup (if the message mentions a specific product-like phrase)
  if (msg) {
    try {
      const base = new URL(requestUrl).origin;
      const r = await fetch(base + '/products-index.json');
      if (r.ok) {
        const idx = await r.json();
        const entries = Array.isArray(idx) ? idx : (idx.products || Object.values(idx));
        const q = norm(msg).replace(/\b(price|cost|how much|buy|order|ship|size|stock|available)\b/g,' ').trim();
        if (q.length >= 3) {
          let best = null, bestScore = 0;
          for (const e of entries) {
            const t = norm(e.title || e.name || '');
            if (!t) continue;
            let score = 0;
            if (t === q) score = 100;
            else if (t.includes(q)) score = 60 + q.length;
            else if (q.includes(t)) score = 40;
            if (score > bestScore) { bestScore = score; best = e; }
          }
          if (best && bestScore >= 40) {
            facts.push(`PRODUCT "${best.title}" — price A$${best.price ?? '?'} (vendor ${best.vendor || 'unknown'}).`
              + (best.category ? ` Category: ${best.category}.` : ''));
          }
        }
      }
    } catch {}
  }

  return facts;
}

// ── Gemini call ─────────────────────────────────────────────────────────────────
async function callGemini(env, messages, facts) {
  const key = env.GEMINI_API_KEY;
  if (!key) throw new Error('no gemini key');
  const system = `You are "Bargain Drop Support", a friendly, knowledgeable AI assistant for the Bargain Drop
Australian e-commerce store. You are helpful, concise, warm, and you have real expertise.

${STORE_POLICY}

${facts.length ? 'LIVE FACTS (use these when relevant, and answer confidently from them):\n' + facts.map(f => '- ' + f).join('\n') : ''}

Guidelines:
- Be conversational and intellectually capable — you can discuss products, shopping, sizing, materials, gift ideas,
  comparisons, and general questions the way a smart retail assistant would.
- Stay grounded: for store/policy/order/product facts, use the provided information and don't invent prices or policies.
- Keep replies reasonably concise (2-5 sentences unless the user asks for detail). Use line breaks when listing options.
- Currency is Australian dollars (A$). Be honest when you don't know something.
- If the user is upset, be empathetic. Never be rude. Suggest concrete next steps with short "suggestions".`;

  const contents = [];
  for (const m of messages) {
    contents.push({ role: m.role, parts: [{ text: m.text }] });
  }

  const body = {
    contents,
    systemInstruction: { parts: [{ text: system }] },
    generationConfig: { temperature: 0.7, maxOutputTokens: 700 },
  };

  const r = await fetch(GEMINI_URL + '?key=' + encodeURIComponent(key), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error('gemini ' + r.status + ' ' + t.slice(0,200));
  }
  const d = await r.json();
  const text = d?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  if (!text.trim()) throw new Error('gemini empty reply');
  return text.trim();
}

// ── deterministic fallback (if LLM unavailable) ────────────────────────────────
function fallback(msg, facts) {
  const joined = facts.length ? facts[0] : '';
  const isGreeting = /^(hi|hello|hey|yo|hiya|good (morning|afternoon|evening))\b/.test(norm(msg));
  if (isGreeting) return { reply: "Hi! I'm Bargain Drop Support — ask me about products, sizing, shipping, returns, or track an order.", suggestions: ['Where is my order?', 'Returns policy', 'Shipping times'] };
  if (joined && joined.includes('ORDER')) return { reply: `Here's what I found: ${joined}`, suggestions: ['Shipping times', 'Returns policy'] };
  if (!norm(msg)) return { reply: "How can I help?", suggestions: ['Where is my order?', 'Returns policy'] };
  return { reply: "I can help with products, orders, shipping and returns — what would you like to know?", suggestions: ['Where is my order?', 'Do you have my size?', 'Returns policy'] };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders() });

  let body = {};
  try { body = await request.json(); } catch {}
  const msg = String(body.message || '');
  const ctx = body.context || {};
  const sid = String(body.session_id || ctx.session_id || 'anon');

  // Resolve live tool facts (order/product) before the LLM call
  let facts = [];
  try { facts = await resolveTools(env, msg, request.url, ctx); } catch {}

  // Load + append this turn to session memory
  let history = [];
  try {
    const s = await getSession(env, sid);
    history = s.list;
    history = history.filter(m => m && m.text);
    history.push({ role: 'user', text: msg });
    history = history.slice(-MAX_HISTORY);
  } catch {}

  let reply, suggestions = ['Where is my order?', 'Returns policy', 'Shipping times'], details = null;
  let llm_used = false;

  try {
    reply = await callGemini(env, history, facts);
    llm_used = true;
    // persist memory (append assistant turn)
    try { await saveSession(env, sid, [...history, { role: 'model', text: reply }]); } catch {}
    suggestions = ['Track my order', 'Shipping times', 'Returns policy', 'Browse products'];
  } catch (e) {
    const f = fallback(msg, facts);
    reply = f.reply;
    if (f.suggestions) suggestions = f.suggestions;
    // DEBUG: expose error
    details = String(e && e.message || e);
  }

  return new Response(JSON.stringify({ reply, suggestions, llm_used, _err: details || null }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders(), 'Cache-Control': 'no-store' },
  });
}
