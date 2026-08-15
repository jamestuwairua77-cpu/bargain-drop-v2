// /api/chat — LLM-powered support assistant (Gemini).
// Full conversational AI with multi-turn memory (history maintained client-side),
// store knowledge, and live order/product lookup. Falls back deterministically if
// the LLM is unreachable.

import { corsHeaders, listOrders } from '../_sync-lib.js';

const MODEL = 'gemini-flash-latest';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent';
const MAX_HISTORY = 20;

function norm(s){ return (s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim(); }

// ── store context ────────────────────────────────────────────────────────────────
const STORE_POLICY = `Bargain Drop is an Australian e-commerce store selling bargain-priced fashion,
home, beauty, electronics, jewellery, and more. Prices are in Australian dollars (A$).
Returns: 45-day free returns on most items.
Shipping: free on orders over A$29, otherwise A$8.44; typically 7–15 business days to Australia.
Payment: secure card and Stripe checkout. Orders are fulfilled by our dropship supplier.`;

// ── dynamic tool results (order + product) injected as live facts ────────────────
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

  // 2. product lookup (best-effort fuzzy match)
  if (msg) {
    try {
      const base = new URL(requestUrl).origin;
      const r = await fetch(base + '/products-index.json');
      if (r.ok) {
        const idx = await r.json();
        const entries = Array.isArray(idx) ? idx : (idx.products || Object.values(idx));
        const q = norm(msg).replace(/\b(price|cost|how much|buy|order|ship|size|stock|available|suggest)\b/g,' ').trim();
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
Australian e-commerce store. You are warm, helpful, concise, and genuinely intelligent — you can hold a real
conversation the way a smart retail expert would.

${STORE_POLICY}

${facts.length ? 'LIVE FACTS (use these when relevant; answer confidently from them):\n' + facts.map(f => '- ' + f).join('\n') : ''}

Guidelines:
- Be conversational and intellectually capable — discuss products, shopping, sizing, materials, gift ideas,
  comparisons, and general questions like a smart assistant.
- Stay grounded: for store/policy/order/product facts, use the provided information; don't invent prices or policies.
- Keep replies concise (2-5 sentences unless asked for detail). Use line breaks or short bullets when listing options.
- Currency is Australian dollars (A$). Be honest when unsure. Be empathetic if the user is upset; never be rude.
- Remember the conversation context provided, and refer back to it naturally (e.g. "for your sister").`;

  const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] }));

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
    throw new Error('gemini ' + r.status + ' ' + t.slice(0, 200));
  }
  const d = await r.json();
  const text = d?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  if (!text.trim()) throw new Error('gemini empty reply');
  return text.trim();
}

// ── deterministic fallback ────────────────────────────────────────────────────────
function fallback(msg) {
  const m = norm(msg);
  if (/^(hi|hello|hey|yo|hiya|good (morning|afternoon|evening))\b/.test(m))
    return { reply: "Hi! I'm Bargain Drop Support — ask me about products, sizing, shipping, returns, or track an order.", suggestions: ['Where is my order?', 'Returns policy', 'Shipping times'] };
  if (!m) return { reply: "How can I help?", suggestions: ['Where is my order?', 'Returns policy'] };
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

  // Build conversation: prefer client-provided history, else single turn.
  let history = [];
  if (Array.isArray(body.history)) {
    history = body.history
      .filter(h => h && h.text)
      .map(h => ({ role: h.role, text: String(h.text) }))
      .slice(-MAX_HISTORY);
  }
  if (!history.length || history[history.length - 1].text !== msg) {
    history.push({ role: 'user', text: msg });
  }

  // Resolve live tool facts
  let facts = [];
  try { facts = await resolveTools(env, msg, request.url, ctx); } catch {}

  let reply, suggestions = ['Where is my order?', 'Returns policy', 'Shipping times'];
  let llm_used = false;

  try {
    reply = await callGemini(env, history, facts);
    llm_used = true;
    suggestions = ['Track my order', 'Shipping times', 'Returns policy', 'Browse products'];
  } catch (e) {
    const f = fallback(msg);
    reply = f.reply;
    if (f.suggestions) suggestions = f.suggestions;
  }

  return new Response(JSON.stringify({ reply, suggestions, llm_used }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders(), 'Cache-Control': 'no-store' },
  });
}
