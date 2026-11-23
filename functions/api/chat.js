// Cloudflare Pages Function: /api/chat
// Ruby · Bargain Drop AI Concierge & Problem-Solving Support Agent
// Uses live catalog search, live order & CJ tracking lookup, and full store knowledge.

import { corsHeaders, listOrders, cjFetch } from '../_sync-lib.js';

const MODEL_SEQUENCE = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-2.5-flash'];
const GEMINI_ENDPOINTS = [
  'https://generativelanguage.googleapis.com/v1beta/models',
  'https://bdgemini-proxy.bargaindrop.workers.dev/v1beta/models',
];

const DEPARTMENTS = [
  { name: 'Women', slug: 'women', url: '/category.html?cat=women' },
  { name: 'Men', slug: 'men', url: '/category.html?cat=men' },
  { name: 'Home & Living', slug: 'home', url: '/category.html?cat=home' },
  { name: 'Electronics & Tech', slug: 'electronics', url: '/category.html?cat=electronics' },
  { name: 'Beauty & Wellness', slug: 'beauty', url: '/category.html?cat=beauty' },
  { name: 'Pets', slug: 'pets', url: '/category.html?cat=pets' },
  { name: 'Shoes & Footwear', slug: 'shoes', url: '/category.html?cat=shoes' },
  { name: 'Bags & Wallets', slug: 'bags', url: '/category.html?cat=bags' },
  { name: 'Jewelry & Watches', slug: 'jewelry', url: '/category.html?cat=jewelry' },
  { name: 'Kids & Baby', slug: 'kids', url: '/category.html?cat=kids' },
  { name: 'Sports & Outdoors', slug: 'sports', url: '/category.html?cat=sports' },
  { name: 'Kitchen & Dining', slug: 'kitchen', url: '/category.html?cat=kitchen' },
  { name: 'Automotive', slug: 'automotive', url: '/category.html?cat=automotive' },
  { name: 'Accessories', slug: 'accessories', url: '/category.html?cat=accessories' },
];

const STORE_KNOWLEDGE_BASE = `You are Ruby, the official AI Support & Shopping Specialist for Bargain Drop (https://bargain-drop.online), an Australian everyday-bargains online store.

YOUR MISSION:
Give DIRECT, ACCURATE, COMPLETE, and SOLUTION-ORIENTED answers to every customer question. Never give vague runarounds. Always solve the customer's exact problem or give them the exact link, promo code, product, or step-by-step fix immediately.

COMPLETE BARGAIN DROP STORE FACTS (SOURCE OF TRUTH):
1. Currency & Pricing:
   - All prices are in Australian Dollars (AUD, formatted like A$14.95).
   - Bargain Drop uses locked ".95" value pricing (e.g., A$9.95, A$14.95, A$22.95) with everyday deals designed to stay ultra-affordable.
   - GST (10%) is included in Australian retail pricing.

2. Shipping & Delivery (Australia-Wide):
   - FREE Express Tracked Shipping on all orders A$29.00 AUD and over.
   - Orders under A$29.00 AUD have a flat A$4.95 shipping fee (or use promo code FREESHIP / FREESHIP29 when eligible).
   - Processing time: Orders are automatically queued for supplier fulfillment immediately after payment confirmation (typically 1–3 business days handling).
   - Delivery estimate: 7–15 business days across Australia via tracked courier (CJ Packet Tracked Air / Australia Post last-mile).
   - Live Tracking: Customers can track any order anytime at [Track Your Order](/order-tracking.html) using their Order ID (e.g. BD-...) or email address.

3. Active Promo & Discount Codes:
   - \`BARGAIN26\` — 30% OFF storewide (best discount!)
   - \`SAVE10\` or \`WELCOME10\` or \`COMEBACK10\` — 10% OFF
   - \`SAVE5AUD\` — 15% OFF
   - \`FREESHIP\` or \`FREESHIP29\` — Free Shipping
   - How to apply: Go to [Shopping Cart](/cart.html) or [Checkout](/checkout.html), enter the code in the Promo Code box, and click Apply. Only one promo code can be used per order.

4. Payment Methods & Checkout Troubleshooting:
   - Accepted payments at [Checkout](/checkout.html):
     a) **PayPal Checkout (Instant in AUD):** Pay with PayPal Balance, Visa/Mastercard Debit or Credit Card (via PayPal), or PayPal Pay in 4. Verified orders auto-dispatch to fulfillment immediately.
     b) **Australian PayID / Osko Instant Bank Transfer (0% Fees):** Instant bank-to-bank transfer in AUD from any Australian bank app using your unique order reference (\`BD-PID-...\`).
     c) **Crypto Checkout (USDT TRC20 / USDC ERC20 / BTC):** Global blockchain checkout with live AUD conversion rate lock and TxID verification.
   - All transactions are 256-bit SSL encrypted; Bargain Drop never stores raw card numbers or CVVs.
   - If PayPal window doesn't open: Disable popup blockers for bargain-drop.online, or switch directly to PayID / Osko (instant AU transfer) or Crypto right on [Checkout](/checkout.html).
   - If you sent a PayID transfer or Crypto payment: Make sure your exact Order Reference (\`BD-...\`) is included or submit your blockchain TxID on your confirmation page — orders dispatch automatically once confirmed.
   - If charged twice or stuck after payment: Do NOT reorder; check email for confirmation or look up the order at [Order Tracking](/order-tracking.html), or email Support@bargain-drop.online with your email & timestamp for an immediate refund of any duplicate payment.

5. Returns, Refunds, Exchanges & Order Problems (30-Day Guarantee):
   - 30-day hassle-free return & refund guarantee from delivery date.
   - Start a return/exchange at [Returns & Refunds](/returns.html) or email Support@bargain-drop.online with your Order ID.
   - Damaged / Defective / Wrong item received: Send your Order ID + 1 clear photo to Support@bargain-drop.online — we issue an immediate free replacement or full refund without making you pay return postage.
   - Wrong size / change of mind: Submit a request at [Returns & Refunds](/returns.html) within 30 days.
   - Cancel or change shipping address: Contact Support@bargain-drop.online immediately with your Order ID and corrected address. If the parcel hasn't shipped yet, we update or cancel it immediately.
   - Missing parcel / tracking hasn't moved in 5+ days: Check [Order Tracking](/order-tracking.html) first; if stuck over 7 days or marked delivered but not received, contact Support@bargain-drop.online and we will open a carrier investigation and reship/refund if lost.
   - Refund processing: Approved refunds return to your original PayPal account, Australian bank account (PayID), or crypto wallet within 1–5 business days.

6. All 14 Departments & Store Pages:
   - Departments: ${DEPARTMENTS.map(d => `[${d.name}](${d.url})`).join(', ')}
   - Browse All Categories: [All Categories](/categories.html)
   - Browse All Products: [All Products](/products.html)
   - Shopping Cart: [View Cart](/cart.html)
   - Checkout: [Checkout](/checkout.html)
   - Wishlist / Saved Items: [Saved Wishlist](/wishlist.html)
   - Account Sign In: [Sign In](/sign-in.html) | Create Account: [Register](/register.html) | Reset Password: [Forgot Password](/forgot-password.html) | Address Book: [Saved Addresses](/addresses.html)
   - Help Center & Contact: [Customer Service](/customer-service.html) | Privacy Policy: [Privacy Policy](/policy.html)
   - Direct Support Email: Support@bargain-drop.online

RESPONSE RULES:
- Be warm, sharp, Australian-friendly, and concise (typically 2–6 sentences or crisp bullet points).
- Use clickable Markdown links like [Track Your Order](/order-tracking.html) or [Product Name](/product.html?id=123) so the customer can act in 1 tap.
- NEVER invent products, prices, or order statuses that aren't in the LIVE DATA block below.
- If a customer asks about a specific order and no order ID/email was provided yet, tell them they can paste their Order ID (like BD-...) or email right here in chat and you'll check it instantly, AND link [Order Tracking](/order-tracking.html).
- If the customer's cart subtotal is provided and under A$29, proactively tell them the exact dollar gap to unlock Free Shipping (and remind them about promo code \`BARGAIN26\` for 30% off!).
- Never expose admin PINs, internal API tokens, or backend architecture to shoppers.`;

function normalizeStr(s) {
  return String(s || '').toLowerCase().trim();
}

function getProductPrice(p) {
  if (p == null) return 0;
  if (Array.isArray(p.variants) && p.variants.length && p.variants[0].price != null) {
    return Number(p.variants[0].price) || Number(p.price) || 0;
  }
  return Number(p.price) || 0;
}

function isProductActive(p) {
  if (!p || typeof p !== 'object') return false;
  if (p.visible === false || p.deleted === true || p.hidden === true || p.archived === true) return false;
  if (p.status && String(p.status).toLowerCase() !== 'active') return false;
  if (p.inStock === false || p.outOfStock === true) return false;
  const price = getProductPrice(p);
  return price > 0 && Boolean(p.title || p.name);
}

async function fetchLiveCatalog(origin) {
  const sources = [
    `${origin}/featured.json`,
    `${origin}/products-slim-0.json`,
    `${origin}/slim-products.json`,
  ];
  const byId = new Map();
  for (const url of sources) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const raw = await r.json();
      const list = Array.isArray(raw) ? raw : (raw?.products || raw?.items || []);
      for (const p of list) {
        if (!isProductActive(p)) continue;
        const id = String(p.id || p.handle || p.sku || '');
        if (!id || byId.has(id)) continue;
        byId.set(id, {
          id,
          title: String(p.title || p.name || '').trim(),
          price: getProductPrice(p),
          compareAt: Number(p.compareAt || p.compare_at_price || p.originalPrice || 0) || null,
          category: String(p.category || p.product_type || p.type || '').trim(),
          tags: Array.isArray(p.tags) ? p.tags.join(' ') : String(p.tags || ''),
          url: `/product.html?id=${encodeURIComponent(id)}`,
        });
      }
      if (byId.size >= 400) break;
    } catch (_) {}
  }
  return Array.from(byId.values());
}

async function lookupOrderEverywhere(env, orderIdQuery, emailQuery) {
  const matches = [];
  const seen = new Set();

  const pushIfMatch = (o) => {
    if (!o || typeof o !== 'object') return;
    const oid = String(o.id || o.orderId || o.orderNumber || o.order_number || '').trim();
    if (!oid || seen.has(oid)) return;
    const oEmail = normalizeStr(o.customer?.email || o.customerEmail || o.email);
    const idHit = orderIdQuery && oid.toUpperCase() === orderIdQuery.toUpperCase();
    const emailHit = emailQuery && oEmail && oEmail === emailQuery.toLowerCase();
    if (idHit || emailHit) {
      seen.add(oid);
      matches.push(o);
    }
  };

  // 1. Primary orders list helper
  try {
    const orders = await listOrders(env);
    for (const o of orders || []) pushIfMatch(o);
  } catch (_) {}

  // 2. Cloudflare KV PRODUCT_DATA fallback
  if (env && env.PRODUCT_DATA) {
    try {
      const masterRaw = await env.PRODUCT_DATA.get('bargain_drop_master_orders');
      if (masterRaw) {
        const arr = JSON.parse(masterRaw);
        if (Array.isArray(arr)) arr.forEach(pushIfMatch);
      }
    } catch (_) {}
    if (orderIdQuery) {
      try {
        const direct = await env.PRODUCT_DATA.get(`order:${orderIdQuery}`);
        if (direct) pushIfMatch(JSON.parse(direct));
      } catch (_) {}
    }
  }

  // 3. Enrich first matched order with live CJ tracking if cjOrderId exists
  const enriched = [];
  for (const o of matches.slice(0, 3)) {
    const oid = String(o.id || o.orderId || o.orderNumber || '');
    const cjId = o.cjOrder?.orderId || o.cjOrderId || o.cj_order_id || '';
    let liveTracking = o.cjOrder?.trackingNumber || o.trackingNumber || '';
    let liveCarrier = o.cjOrder?.carrier || o.carrier || '';
    let liveCjStatus = o.cjOrder?.status || '';

    if (cjId && !String(cjId).startsWith('CJ-DISPATCH') && !liveTracking) {
      try {
        const cjRes = await cjFetch(env, `/shopping/order/getOrderDetail?orderId=${encodeURIComponent(cjId)}`);
        const d = cjRes?.data || cjRes;
        if (d) {
          if (d.trackNumber) liveTracking = d.trackNumber;
          if (d.logisticName) liveCarrier = d.logisticName;
          if (d.orderStatus) liveCjStatus = d.orderStatus;
        }
      } catch (_) {}
    }

    enriched.push({
      orderId: oid,
      status: o.status || liveCjStatus || 'processing',
      totalAud: Number(o.total ?? o.totalAmount ?? o.grandTotalAud ?? 0).toFixed(2),
      placedAt: o.date || o.createdAt || o.placedAt || '',
      items: (o.items || []).slice(0, 5).map(i => `${i.quantity || i.qty || 1}x ${i.title || 'Item'}`),
      trackingNumber: liveTracking || 'Pending dispatch scan',
      carrier: liveCarrier || 'CJ Packet Tracked Air',
      trackingUrl: `/order-tracking.html?order=${encodeURIComponent(oid)}${liveTracking ? `&tracking=${encodeURIComponent(liveTracking)}` : ''}`,
    });
  }
  return enriched;
}

function searchCatalog(catalog, queryText) {
  const q = normalizeStr(queryText);
  if (!catalog.length || !q) return [];

  // Detect budget cap like "under $15", "under 20", "cheap", "below A$12"
  let maxBudget = null;
  const budgetMatch = q.match(/(?:under|below|less than|cheaper than|max|<=?)\s*(?:a?\$)?(\d+(?:\.\d+)?)/i);
  if (budgetMatch) maxBudget = Number(budgetMatch[1]);
  else if (/\b(cheap|cheapest|budget|affordable|bargain|lowest price)\b/i.test(q)) maxBudget = 15;

  const stopWords = new Set([
    'a','an','the','is','are','was','were','do','does','did','can','could','would','should',
    'i','me','my','we','you','your','have','has','had','got','get','want','need','looking',
    'look','find','show','give','tell','about','for','with','in','on','at','to','of','and',
    'or','under','below','over','above','less','more','than','price','cost','how','much',
    'any','some','best','good','nice','product','products','item','items','buy','shop','store',
    'bargain','drop','aud','dollars','dollar','please','help','cheap','cheapest'
  ]);

  const keywords = q
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopWords.has(w));

  const scored = [];
  for (const p of catalog) {
    if (maxBudget !== null && p.price > maxBudget) continue;
    const titleL = p.title.toLowerCase();
    const catL = p.category.toLowerCase();
    const tagsL = p.tags.toLowerCase();

    let score = 0;
    if (keywords.length === 0 && maxBudget !== null) {
      score = 10 + (maxBudget - p.price) * 0.2;
    } else {
      for (const kw of keywords) {
        const stem = kw.endsWith('s') && kw.length > 3 ? kw.slice(0, -1) : kw;
        if (titleL.includes(kw)) score += 6;
        else if (titleL.includes(stem)) score += 4;
        if (catL.includes(kw) || catL.includes(stem)) score += 4;
        if (tagsL.includes(kw) || tagsL.includes(stem)) score += 2;
      }
    }
    if (score > 0) scored.push({ ...p, score });
  }

  scored.sort((a, b) => b.score - a.score || a.price - b.price);
  return scored.slice(0, 5);
}

async function resolveLiveContext(env, origin, userText, clientCtx = {}) {
  const chunks = [];
  const text = String(userText || '');

  // 1. Page & Cart Context from widget
  const ctxLines = [];
  if (clientCtx.page) ctxLines.push(`Customer current page: ${clientCtx.page}`);
  if (clientCtx.cartCount > 0) {
    const sub = Number(clientCtx.cartSubtotal || 0);
    const gap = Math.max(0, 29 - sub).toFixed(2);
    ctxLines.push(
      `Customer cart: ${clientCtx.cartCount} item(s), subtotal A$${sub.toFixed(2)}` +
      (sub < 29 ? ` (needs A$${gap} more to unlock FREE Express Shipping!)` : ' (qualifies for FREE Express Shipping!)')
    );
  }
  if (clientCtx.userEmail) ctxLines.push(`Signed-in email: ${clientCtx.userEmail}`);
  if (ctxLines.length) chunks.push(`[SESSION CONTEXT]\n${ctxLines.join('\n')}`);

  // 2. Order / Tracking lookup
  const orderIdMatch = text.match(/\b(BD-[A-Z0-9-]{4,}|ORD-[A-Z0-9-]{4,})\b/i);
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const wantsOrder = Boolean(orderIdMatch) || /\b(order|track|tracking|parcel|package|where is my|shipped|delivery status|dispatch)\b/i.test(text);

  if (wantsOrder && (orderIdMatch || emailMatch || clientCtx.userEmail)) {
    const foundOrders = await lookupOrderEverywhere(
      env,
      orderIdMatch ? orderIdMatch[1].toUpperCase() : '',
      emailMatch ? emailMatch[0] : (clientCtx.userEmail || '')
    );
    if (foundOrders.length) {
      const formatted = foundOrders.map(o =>
        `- Order ${o.orderId} | Status: ${o.status} | Total: A$${o.totalAud} | Items: ${o.items.join(', ') || 'N/A'} | Carrier: ${o.carrier} | Tracking: ${o.trackingNumber} | Direct Link: ${o.trackingUrl}`
      ).join('\n');
      chunks.push(`[LIVE ORDER LOOKUP RESULTS]\n${formatted}`);
    } else if (orderIdMatch || emailMatch) {
      chunks.push(
        `[LIVE ORDER LOOKUP RESULTS]\nNo order matched "${orderIdMatch?.[1] || emailMatch?.[0]}" yet. Advise the customer to double-check the Order ID (starts with BD-...) or confirmation email, check /order-tracking.html, or email Support@bargain-drop.online with their payment receipt.`
      );
    }
  }

  // 3. Current Product Page Lookup OR Catalog Search
  const wantsProduct = Boolean(clientCtx.productId) ||
    /\b(find|search|looking for|show me|recommend|suggest|have any|sell|buy|cheap|under \$?\d+|shoes|dress|jacket|bag|watch|jewelry|pet|dog|cat|kitchen|home|tech|earbuds|charger|beauty|makeup|kids|baby|sports|car|shirt|pants|hoodie|boots|sandals|necklace|ring)\b/i.test(text);

  if (wantsProduct) {
    const catalog = await fetchLiveCatalog(origin);
    if (clientCtx.productId) {
      const cur = catalog.find(p => String(p.id) === String(clientCtx.productId));
      if (cur) {
        chunks.push(
          `[CURRENT PRODUCT VIEWED]\nTitle: ${cur.title} | Price: A$${cur.price.toFixed(2)}` +
          (cur.compareAt ? ` (Was A$${cur.compareAt.toFixed(2)})` : '') +
          ` | Category: ${cur.category || 'Bargain Drop'} | Link: ${cur.url}`
        );
      }
    }
    const matches = searchCatalog(catalog, text);
    if (matches.length) {
      const list = matches.map(p =>
        `- [${p.title}](${p.url}) — A$${p.price.toFixed(2)}${p.compareAt && p.compareAt > p.price ? ` (was A$${p.compareAt.toFixed(2)})` : ''} [${p.category || 'Deal'}]`
      ).join('\n');
      chunks.push(`[LIVE IN-STOCK PRODUCT MATCHES]\n${list}`);
    }
  }

  return chunks.join('\n\n');
}

function buildDirectFallbackAnswer(userText, liveContext) {
  const q = normalizeStr(userText);
  const parts = [];

  if (liveContext && liveContext.includes('[LIVE ORDER LOOKUP RESULTS]')) {
    const orderBlock = liveContext.split('[LIVE ORDER LOOKUP RESULTS]\n')[1]?.split('\n\n')[0];
    if (orderBlock) {
      parts.push(`**Your Order Status:**\n${orderBlock}\nView live courier updates anytime at [Order Tracking](/order-tracking.html).`);
    }
  }

  if (/\b(return|refund|exchange|damaged|broken|cracked|wrong item|defective|missing|cancel)\b/i.test(q)) {
    parts.push(`**30-Day Return, Replacement & Refund Guarantee:**\n- **Damaged, cracked, or wrong item?** Email **Support@bargain-drop.online** with your Order ID + 1 clear photo for an **immediate free replacement or full refund** (no return postage needed).\n- **Returns / Exchanges:** Submit a 1-minute request at [Returns & Refunds](/returns.html).\n- **Cancel or edit address:** Email **Support@bargain-drop.online** right away with your Order ID before dispatch.\n- Approved refunds return to your original PayPal account, PayID bank account, or crypto wallet within **1–5 business days**.`);
  }

  if (/\b(pay|payment|paypal|payid|osko|bank|crypto|usdt|usdc|btc|bitcoin|card|decline|checkout)\b/i.test(q)) {
    parts.push(`**Checkout & Payment Options at [Checkout](/checkout.html):**\n- **PayPal (Instant AUD):** Pay with PayPal Balance, Visa/Mastercard Debit or Credit Card, or Pay in 4.\n- **Australian PayID / Osko Bank Transfer:** 0% card surcharges — instant bank transfer with your unique Order Reference.\n- **Crypto (USDT TRC20 / USDC ERC20 / BTC):** Direct global blockchain payment.\n- If PayPal doesn't open, allow popups for bargain-drop.online or switch to PayID / Osko or Crypto right on the checkout page.`);
  }

  if (/\b(promo|coupon|discount|code|voucher|sale|off|bargain26|save10|welcome10|freeship)\b/i.test(q)) {
    parts.push(`**Active Bargain Drop Promo Codes** (apply in [Cart](/cart.html) or [Checkout](/checkout.html)):\n- \`BARGAIN26\` — **30% OFF** storewide (works on any order!)\n- \`SAVE5AUD\` — **15% OFF**\n- \`WELCOME10\` / \`SAVE10\` — **10% OFF**\n- \`FREESHIP\` — **Free Shipping**`);
  }

  if (/\b(ship|shipping|deliver|delivery|how long|days|postage|freight|australia)\b/i.test(q)) {
    parts.push(`**Australia-Wide Shipping:**\n- **FREE Express Tracked Shipping** on orders **A$29.00+ AUD**\n- Flat **A$4.95 AUD** under A$29 (7–15 business days with full tracking at [Order Tracking](/order-tracking.html)).`);
  }

  if (parts.length === 0 && liveContext && liveContext.includes('[LIVE IN-STOCK PRODUCT MATCHES]')) {
    const prodBlock = liveContext.split('[LIVE IN-STOCK PRODUCT MATCHES]\n')[1]?.split('\n\n')[0];
    if (prodBlock) {
      parts.push(`Here are the best in-stock Bargain Drop matches I found for you:\n\n${prodBlock}\n\n💡 Apply \`BARGAIN26\` at [Checkout](/checkout.html) for **30% OFF**, plus **FREE Express Shipping** on orders A$29+!`);
    }
  }

  if (parts.length > 0) return parts.join('\n\n');

  if (/\b(track|order|where is|parcel|package)\b/i.test(q)) {
    return `You can track your parcel live at [Order Tracking](/order-tracking.html) using your Order ID (e.g. \`BD-...\`) or email — OR paste your Order ID right here in this chat and I'll look it up for you instantly!`;
  }

  if (/\b(password|login|sign in|account|register|address)\b/i.test(q)) {
    return `Here are direct links to manage your Bargain Drop account:\n- [Sign In](/sign-in.html) | [Create Account](/register.html)\n- [Reset Forgotten Password](/forgot-password.html)\n- [Saved Shipping Addresses](/addresses.html) | [Saved Wishlist](/wishlist.html)`;
  }

  return `I can help you with anything on Bargain Drop! Here are the fastest shortcuts:\n- **30% OFF Promo:** Use \`BARGAIN26\` at [Checkout](/checkout.html) (Free Shipping A$29+)\n- **Track an Order:** Paste your \`BD-...\` order number here or open [Order Tracking](/order-tracking.html)\n- **Browse Deals:** [All Categories](/categories.html) or [All Products](/products.html)\n- **Returns / Refunds:** [Returns Portal](/returns.html) or **Support@bargain-drop.online**\n\nTell me what you're looking for or what issue you've hit and I'll sort it out right away!`;
}

export async function onRequest(context) {
  const { request, env } = context;
  const headers = { 'Content-Type': 'application/json', ...corsHeaders() };

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST required' }), { status: 405, headers });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) {
    return new Response(JSON.stringify({ error: 'messages required' }), { status: 400, headers });
  }

  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  const userText = String(lastUserMsg?.content || '').trim();
  const clientCtx = body.context && typeof body.context === 'object' ? body.context : {};
  const origin = new URL(request.url).origin;

  const liveContext = await resolveLiveContext(env, origin, userText, clientCtx);

  const apiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY || '';
  if (!apiKey) {
    return new Response(
      JSON.stringify({ reply: buildDirectFallbackAnswer(userText, liveContext), model: 'direct-knowledge-engine' }),
      { status: 200, headers }
    );
  }

  const systemText = STORE_KNOWLEDGE_BASE + (liveContext ? `\n\n--- LIVE STORE DATA FOR THIS CONVERSATION ---\n${liveContext}` : '');
  const recent = messages.slice(-14).map(m => ({
    role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
    parts: [{ text: String(m.content || '').slice(0, 3000) }],
  }));

  for (const model of MODEL_SEQUENCE) {
    for (const baseEndpoint of GEMINI_ENDPOINTS) {
      const payload = {
        systemInstruction: { parts: [{ text: systemText }] },
        contents: recent,
        generationConfig: model === 'gemini-4-hydrogen'
          ? { maxOutputTokens: 700 }
          : { maxOutputTokens: 700, temperature: 0.5 },
      };

      try {
        const url = baseEndpoint.includes('bdgemini-proxy')
          ? `${baseEndpoint}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
          : `${baseEndpoint}/${model}:generateContent`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) continue;
        const data = await res.json();
        const reply = (data?.candidates?.[0]?.content?.parts || [])
          .map(p => p.text || '')
          .join('')
          .trim();
        if (reply) {
          return new Response(JSON.stringify({ reply, model }), { status: 200, headers });
        }
      } catch (_) {}
    }
  }

  return new Response(
    JSON.stringify({ reply: buildDirectFallbackAnswer(userText, liveContext), model: 'direct-knowledge-fallback' }),
    { status: 200, headers }
  );
}
