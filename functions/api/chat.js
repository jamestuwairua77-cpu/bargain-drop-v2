// /api/chat — LLM-powered support assistant (Gemini).
// Full conversational AI with multi-turn memory (history maintained client-side),
// store knowledge, and live order/product lookup (with direct product-page links).
// Falls back deterministically if the LLM is unreachable.

import { corsHeaders, listOrders } from '../_sync-lib.js';

const MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-pro-latest'];
function geminiUrl(model){ return 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent'; }
const MAX_HISTORY = 20;
const SUPPORT_EMAIL = 'Support@bargain-drop.online';

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
  const base = (() => { try { return new URL(requestUrl).origin; } catch { return ''; } })();

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

  // 2. product lookup (best-effort fuzzy match) — pulls real title/price and a direct page link
  if (msg && base) {
    const q = norm(msg).replace(/\b(price|cost|how much|buy|order|ship|size|stock|available|suggest|link|url)\b/g,' ').trim();
    if (q.length >= 3) {
      try {
        const r = await fetch(base + '/slim-products.json');
        if (r.ok) {
          const prods = await r.json();
          const entries = Array.isArray(prods) ? prods : (prods.products || Object.values(prods));
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
          if (best && bestScore >= 40 && best.id) {
            const link = `${base}/product.html?id=${encodeURIComponent(best.id)}`;
            facts.push(`PRODUCT "${best.title}" — price A$${best.price ?? '?'}. Direct page: ${link}`);
          }
        }
      } catch {}
    }
  }

  return facts;
}

// ── Gemini call ─────────────────────────────────────────────────────────────────
async function callGemini(env, messages, facts) {
  const key = env.GEMINI_API_KEY;
  if (!key) throw new Error('no gemini key');

  const system = `You are "Ruby", the friendly, warm, knowledgeable AI shopping assistant for Bargain Drop
Australian e-commerce store. You are the kind of assistant people enjoy chatting with — naturally warm,
genuinely conversational, and quick with a kind word. You greet people like a friend, and you're happy to
chit-chat about everyday things (the weather, their day, a joke, "how are you?") before smoothly steering
back to how you can help them shop.

${STORE_POLICY}

${facts.length ? 'LIVE FACTS (use these when relevant; answer confidently from them):\n' + facts.map(f => '- ' + f).join('\n') : ''}

Guidelines:
- Be conversational, warm, and intellectually capable — answer casual small talk and jokes naturally, then
  guide the conversation toward products, gift ideas, sizing, materials, comparisons, and shopping help.
- When you mention or recommend a specific product, ALWAYS include its direct page link from the LIVE FACTS
  (formatted plainly, e.g. "You can see it here: <link>") so the customer can tap straight through.
- Stay grounded: for store/policy/order/product facts and prices, use ONLY the provided information —
  never invent prices, policies, features, or stock levels.
- If a question is outside what you know about Bargain Drop, or the info isn't provided, be honest: say you
  don't know, don't guess or make anything up, and offer to connect them with support at ${SUPPORT_EMAIL}.
- Keep replies concise (2-5 sentences unless asked for detail). Use line breaks or short bullets when listing options.
- Currency is Australian dollars (A$). Be empathetic if the user is upset; never be rude.
- Remember the conversation context provided, and refer back to it naturally (e.g. "for your sister").`;

  const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] }));

  const body = {
    contents,
    systemInstruction: { parts: [{ text: system }] },
    generationConfig: { temperature: 0.8, maxOutputTokens: 700 },
  };

  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const model of MODELS) {
      try {
        const r = await fetch(geminiUrl(model) + '?key=' + encodeURIComponent(key), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, systemInstruction: body.systemInstruction }),
        });
        if (!r.ok) {
          const t = await r.text().catch(() => '');
          lastErr = new Error('gemini ' + r.status + ' ' + t.slice(0, 160));
          // 4xx is a hard failure (bad request) — don't retry other models on 400.
          if (r.status >= 400 && r.status < 500) continue;
          continue; // 5xx / 429 → try next model
        }
        const d = await r.json();
        const text = d?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
        if (text.trim()) return text.trim();
        lastErr = new Error('gemini empty reply');
      } catch (e) {
        lastErr = e;
      }
    }
    if (attempt < 2) await new Promise(res => setTimeout(res, 500 * (attempt + 1)));
  }
  throw lastErr || new Error('gemini unreachable');
}

// ── deterministic fallback ───────────────────────────────────────────────────────
function fallback(msg) {
  const m = norm(msg);
  if (/^(hi|hello|hey|yo|hiya|good (morning|afternoon|evening))\b/.test(m))
    return { reply: "Hey there! 👋 I'm Ruby — great to chat with you. I can help you find the perfect product, suggest a gift, check sizing or stock, track an order, or sort out shipping and returns. What are you after today?", suggestions: ['Where is my order?', 'Find a gift idea', 'Returns policy', 'Shipping times'] };
  if (!m) return { reply: "How can I help today?", suggestions: ['Where is my order?', 'Returns policy'] };
  return { reply: `Happy to help with products, orders, shipping and returns! If I don't know something, I'll point you to our team at ${SUPPORT_EMAIL}. What would you like to know?`, suggestions: ['Where is my order?', 'Do you have my size?', 'Returns policy'] };
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
