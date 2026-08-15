// /api/chat — deterministic support router (low token cost).
// ~80% of intents answered WITHOUT an LLM. LLM fallback is out of scope here
// (kept minimal: return a polite escalation + suggestions instead of calling a model).

import { corsHeaders, listOrders } from '../_sync-lib.js';

const SUGGEST_FALLBACK = ['Talk to a human', 'Shipping times', 'Returns policy'];

function norm(s){ return (s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim(); }

// Lightweight product lookup from the (public) catalog via same-origin fetch
async function findProduct(env, query, requestUrl) {
  // Fetch the public/products index entries newer than the big file when possible.
  // Use products-index.json (76K) for a fast fuzzy title/id match, then read the
  // full product from all-products.json is too heavy per-request; instead use the
  // lightweight /api/product-lookup on a matched id.
  try {
    const base = new URL(requestUrl).origin;
    const r = await fetch(base + '/products-index.json');
    if (!r.ok) return null;
    const idx = await r.json();
    const entries = Array.isArray(idx) ? idx : (idx.products || Object.values(idx));
    const q = norm(query);
    for (const e of entries) {
      const t = norm(e.title || e.name || '');
      if (t && q && (t.indexOf(q) >= 0 || q.indexOf(t) >= 0)) return e;
    }
    return null;
  } catch { return null; }
}

async function handleOrder(number, email, env) {
  if (!number) return { reply: "Sure — I can track your order. Could you share your order number? It looks like \"BD-CC-…\", \"BD-AP-…\" etc.", suggestions: ['Shipping times'] };
  const orders = await listOrders(env);
  const o = orders.find(x => String(x.id).toLowerCase() === String(number).toLowerCase());
  if (!o) return { reply: `I couldn't find order \"${number}\". Please double-check the number (it's in your confirmation email).`, suggestions: ['Returns policy', 'Talk to a human'] };
  if (email && o.email && norm(o.email) !== norm(email)) {
    return { reply: "For security, the order number and email need to match. Could you confirm the email used at checkout?", suggestions: ['Talk to a human'] };
  }
  const status = o.status || 'unpaid';
  const statusMap = { unpaid:'We have your order but payment is still processing.', paid:'Payment confirmed — preparing your order for dispatch.', fulfilling:'Your order is being prepared by our supplier.', shipped:'Your order has shipped and is on its way.' };
  let eta = '';
  if (o.fulfillment && o.fulfillment.cj && o.fulfillment.cj.orderNumber) eta = ' Fulfilment ref: ' + o.fulfillment.cj.orderNumber + '.';
  return { reply: `Order #${number}: ${statusMap[status] || 'Status: ' + status}.${eta}`, suggestions: ['Shipping times', 'Returns policy'] };
}

async function handleProduct(q, env, requestUrl) {
  const p = await findProduct(env, q, requestUrl);
  if (!p) return { reply: "I couldn't find that product. Could you tell me the product name or paste its page link?", suggestions: ['Browse products', 'Talk to a human'] };
  const title = p.title || 'this item';
  let price = '';
  if (p.price != null) price = ` · A$${p.price}`;
  return { reply: `${title}${price}. I can help with sizing, materials and stock — what would you like to know?`, suggestions: ['Do you have my size?', 'What material is this?', 'Is it in stock?'] };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders() });

  let body = {};
  try { body = await request.json(); } catch {}
  const msg = norm(body.message || '');
  const ctx = body.context || {};
  const orderNumber = ctx.order_number || (body.message ? (String(body.message).match(/#?\b(BD-[A-Z0-9-]+)\b/i) || [])[1] : '');
  const email = ctx.email || '';

  let out;
  const hasOrder = /\border|track|tracking|shipment|where.{0,10}order|delivery\b/.test(msg) || orderNumber;
  const hasProduct = /\bsize|sizing|material|care|wash|stock|available|fabric|fit|colour|color\b/.test(msg);
  const hasPolicy = /\breturn|refund|policy|shipping|deliver|postage|exchange|warranty\b/.test(msg);

  try {
    if (orderNumber || hasOrder || /\border\b/.test(msg)) {
      out = await handleOrder(orderNumber, email, env);
      out.llm_used = false;
    } else if (hasPolicy && !hasProduct) {
      out = { llm_used: false, reply: "Returns: 45-day free returns on most items. Shipping: free on orders over A$29 (A$8.44 otherwise), typically 7–15 business days to Australia. You can find full details on our Returns & Policy pages.", suggestions: ['Returns policy', 'Do you have my size?'] };
    } else if (hasProduct || msg.length) {
      out = await handleProduct(msg, env, request.url);
      out.llm_used = false;
    } else {
      out = { llm_used: false, reply: "Thanks for your message! How can I help — sizing, materials, stock, or tracking an order?", suggestions: ['Where is my order?', 'Returns policy', 'Shipping times'] };
    }
  } catch (e) {
    out = { llm_used: false, reply: "Sorry, I hit a snag. Please try again or contact us directly.", suggestions: SUGGEST_FALLBACK };
  }

  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json', ...corsHeaders(), 'Cache-Control': 'no-store' } });
}
