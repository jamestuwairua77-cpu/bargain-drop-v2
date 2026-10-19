const fs = require('fs');

const chatScript = `// /api/chat — Ruby, the all-knowing AI Shopping Assistant for Bargain Drop
// Full conversational AI with multi-turn memory, complete site knowledge top-to-bottom,
// live product search, order lookup, and intelligent resilient fallback engine.

import { corsHeaders, listOrders } from '../_sync-lib.js';

const MODELS = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-pro-latest'];
function geminiUrl(model){ return 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent'; }
const MAX_HISTORY = 20;
const SUPPORT_EMAIL = 'Support@bargain-drop.online';
const PROMO_CODE = 'BARGAIN26'; // 30% OFF

function norm(s){ return (s||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\\s+/g,' ').trim(); }

// ==============================================================================
// 14 OFFICIAL CJ DROPSHIPPING CATEGORIES & DIRECT PATHS
// ==============================================================================
const CJ_CATEGORIES = [
  { name: "Women's Clothing", slug: "womens-clothing", path: "/category.html?cat=womens-clothing", subcats: ["Tops & Sets", "Lady Dresses", "Blouses & Shirts", "Bottoms", "Skirts", "Woman Shorts", "Outerwear & Jackets", "Blazers", "Women's Sweaters", "Sweatshirts & Hoodies", "Weddings & Events", "Women's Denim", "Accessories"] },
  { name: "Men's Clothing", slug: "mens-clothing", path: "/category.html?cat=mens-clothing", subcats: ["T-Shirts", "Polos", "Hoodies & Sweatshirts", "Jackets & Outerwear", "Casual Pants", "Shorts", "Sweatpants", "Underwear & Loungewear", "Accessories"] },
  { name: "Bags & Shoes", slug: "bags-shoes", path: "/category.html?cat=bags-shoes", subcats: ["Women's Luggage & Bags", "Handbags", "Shoulder Bags", "Crossbody Bags", "Totes", "Wallets", "Women's Shoes", "Boots", "Flats", "Sandals", "Pumps", "Men's Bags & Shoes"] },
  { name: "Jewelry & Watches", slug: "jewelry-watches", path: "/category.html?cat=jewelry-watches", subcats: ["Fashion Jewelry", "Necklaces & Pendants", "Bracelets & Bangles", "Earrings", "Rings", "Fine Jewelry", "925 Silver", "Men's Watches", "Women's Watches"] },
  { name: "Health, Beauty & Hair", slug: "health-beauty-hair", path: "/category.html?cat=health-beauty-hair", subcats: ["Skin Care", "Facial Care", "Makeup", "Makeup Brushes", "Hair Care & Styling", "Wigs & Extensions", "Nail Art & Tools", "Beauty Tools"] },
  { name: "Home, Garden & Furniture", slug: "home-garden-furniture", path: "/category.html?cat=home-garden-furniture", subcats: ["Furniture", "Sofas", "Tables", "Chairs", "Cabinets", "Beds", "Desks", "Home Textiles", "Bedding Sets", "Curtains", "Rugs", "Kitchen, Dining & Bar", "Cookware", "Drinkware", "Dinnerware", "Festive & Party Supplies", "Arts, Crafts & Sewing"] },
  { name: "Home Improvement", slug: "home-improvement", path: "/category.html?cat=home-improvement", subcats: ["Home Appliances", "Kitchen Appliances", "Air Purifiers", "Fans", "Heaters", "Vacuums", "Indoor Lighting", "Chandeliers", "Wall Lamps", "Ceiling Lights", "Outdoor Lighting", "Tools & Hardware"] },
  { name: "Pet Supplies", slug: "pet-supplies", path: "/category.html?cat=pet-supplies", subcats: ["Pet Beds", "Pet Furniture", "Cat Trees & Scratchers", "Pet Drinking & Feeding", "Collars, Harnesses & Leashes", "Pet Grooming", "Pet Toys", "Aquatics & Fish", "Bird Supplies"] },
  { name: "Sports & Outdoors", slug: "sports-outdoors", path: "/category.html?cat=sports-outdoors", subcats: ["Fitness & Bodybuilding", "Yoga Mats", "Dumbbells", "Resistance Bands", "Camping & Hiking", "Tents", "Sleeping Bags", "Cycling", "Bicycles", "Helmets", "Fishing", "Swimming & Beachwear"] },
  { name: "Toys, Kids & Babies", slug: "toys-kids-babies", path: "/category.html?cat=toys-kids-babies", subcats: ["Toys & Hobbies", "Action Figures", "Building Blocks", "Plush Toys", "RC Cars", "Baby & Mother", "Strollers", "Kids Clothing", "Baby Essentials"] },
  { name: "Consumer Electronics", slug: "consumer-electronics", path: "/category.html?cat=consumer-electronics", subcats: ["Portable Audio & Video", "Wireless Bluetooth Speakers", "Headphones & Earbuds", "Action Cameras", "Home Projectors", "Smart Electronics", "Accessories & Parts"] },
  { name: "Automobiles & Motorcycles", slug: "automobiles-motorcycles", path: "/category.html?cat=automobiles-motorcycles", subcats: ["Interior Accessories", "Seat Covers", "Organizers", "Car Electronics", "Jump Starters", "Tire Inflators", "Motorcycle Helmets & Accessories", "Auto Replacement Parts"] },
  { name: "Phones & Accessories", slug: "phones-accessories", path: "/category.html?cat=phones-accessories", subcats: ["Phone Cases & Covers", "Patterned Cases", "Screen Protectors", "Holders & Stands", "Chargers & Cables", "Wireless Chargers"] },
  { name: "Computer & Office", slug: "computer-office", path: "/category.html?cat=computer-office", subcats: ["Laptop Stands", "Tablet Accessories", "Mechanical Keyboards", "Gaming Mice", "Mouse Pads", "Office Electronics", "Security & Networking"] }
];

// ==============================================================================
// COMPREHENSIVE STORE KNOWLEDGE BASE (TOP TO BOTTOM)
// ==============================================================================
const STORE_KNOWLEDGE = \`
You are "Ruby", the friendly, warm, witty, and deeply knowledgeable AI shopping assistant for Bargain Drop (bargain-drop.online).
You know EVERY aspect of the store from top to bottom. You speak naturally with an upbeat, helpful tone.

=== STORE IDENTITY & DETAILS ===
- Name: Bargain Drop
- Website: https://bargain-drop.online
- Currency: Australian Dollars (A$)
- Business Model: Curated high-quality wholesale dropshipping directly from verified CJ Dropshipping global supply centers.
- Support Email: \${SUPPORT_EMAIL}

=== PROMOTIONS & DISCOUNTS ===
- Current sitewide promo code: "\${PROMO_CODE}" gives 30% OFF sitewide at checkout!
- How to apply: Enter \${PROMO_CODE} into the promo/coupon code field during checkout.

=== SHIPPING & DELIVERY ===
- Free Shipping: FREE on all orders over A$29.00!
- Standard Shipping: A$8.44 flat rate for orders under A$29.00.
- Dispatch Time: 2–4 business days (includes supplier quality verification and barcode scanning).
- Delivery Time: Typically 7–15 business days to Australia, New Zealand, United States, UK, and worldwide.
- Tracking: Every order includes full door-to-door tracking. Customers can track packages on the [Order Tracking](/order-tracking.html) page.

=== RETURNS, REFUNDS & REPLACEMENTS ===
- Returns Policy: 30-Day Risk-Free Returns (extended up to 45 days).
- Damaged, Defective or Incorrect Items: 100% full refund or immediate free replacement at no extra charge.
- Self-Service Returns Portal: Customers can initiate a return at [Returns & Refunds](/returns.html).
- Support Contact: If assistance is needed, email \${SUPPORT_EMAIL}.

=== PAYMENT METHODS & SECURITY ===
- Accepted Payments: Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay, and Stripe.
- Security: 256-bit bank-grade SSL encryption on all transactions. Customer card details are never saved on our servers.
- Checkout Page: [Secure Checkout](/checkout.html)

=== SITE NAVIGATION (KEY PAGES) ===
- Homepage: [/](/)
- All 14 Categories: [/categories.html](/categories.html)
- Category Explorer: [/category.html](/category.html)
- Full Product Catalog: [/products.html](/products.html)
- Shopping Cart: [/cart.html](/cart.html)
- Wishlist: [/wishlist.html](/wishlist.html)
- My Orders: [/orders.html](/orders.html)
- Order Tracking: [/order-tracking.html](/order-tracking.html)
- Returns & Exchanges: [/returns.html](/returns.html)
- Wallet & Store Credit: [/wallet.html](/wallet.html)
- Gift Cards: [/gift-cards.html](/gift-cards.html)
- Customer Service & Help: [/customer-service.html](/customer-service.html)
- Privacy & Store Policy: [/policy.html](/policy.html)
- Account Profile: [/profile.html](/profile.html)

=== SIZING & PRODUCT TIPS ===
- Sizing charts are visible directly on every apparel and footwear product page.
- Because our fashion items come from verified international suppliers, sizes may run slightly smaller than standard Australian/US sizing. We recommend checking the size table and sizing up 1 size if between sizes.

=== ALL 14 OFFICIAL CJ DROPSHIPPING CATEGORIES ===
1. Women's Clothing (/category.html?cat=womens-clothing) - Dresses, Tops, Sweaters, Outerwear, Skirts, Denim, Activewear.
2. Men's Clothing (/category.html?cat=mens-clothing) - T-Shirts, Polos, Hoodies, Jackets, Pants, Shorts.
3. Bags & Shoes (/category.html?cat=bags-shoes) - Handbags, Backpacks, Totes, Boots, Sneakers, Sandals, Flats.
4. Jewelry & Watches (/category.html?cat=jewelry-watches) - Necklaces, Bracelets, Earrings, Rings, 925 Silver, Quartz Watches.
5. Health, Beauty & Hair (/category.html?cat=health-beauty-hair) - Skincare, Face Masks, Makeup, Brushes, Hair Extensions, Nail Art.
6. Home, Garden & Furniture (/category.html?cat=home-garden-furniture) - Sofas, Tables, Chairs, Beds, Bedding, Cookware, Kitchen Knives, Party Decor.
7. Home Improvement (/category.html?cat=home-improvement) - Kitchen Appliances, Fans, Heaters, Vacuums, Chandeliers, Ceiling Lights, Tools.
8. Pet Supplies (/category.html?cat=pet-supplies) - Dog Beds, Cat Trees, Bowls, Automatic Feeders, Harnesses, Grooming Tools.
9. Sports & Outdoors (/category.html?cat=sports-outdoors) - Tents, Camping Gear, Yoga Mats, Dumbbells, Bicycles, Fishing Rods, Swimwear.
10. Toys, Kids & Babies (/category.html?cat=toys-kids-babies) - Building Blocks, Plush Toys, RC Cars, Strollers, Baby Care.
11. Consumer Electronics (/category.html?cat=consumer-electronics) - Bluetooth Speakers, Wireless Headphones, Action Cameras, Projectors.
12. Automobiles & Motorcycles (/category.html?cat=automobiles-motorcycles) - Seat Covers, Jump Starters, Helmets, Dash Cams, Accessories.
13. Phones & Accessories (/category.html?cat=phones-accessories) - Protective Cases, Screen Protectors, Phone Mounts, Wireless Chargers.
14. Computer & Office (/category.html?cat=computer-office) - Laptop Stands, Mechanical Keyboards, Gaming Mice, Mouse Pads, Office Supplies.
\`;

// Stopwords for search
const STOPWORDS = new Set([
  'a','an','the','is','are','was','were','do','does','did','have','has','had','can','could','would','should',
  'i','you','me','my','we','our','your','it','its','they','them','that','this','these','those','for','and','or',
  'of','in','on','at','to','with','about','how','what','where','when','why','which','much','many','price','prices',
  'cost','costs','buy','order','ship','shipping','size','sizes','stock','available','suggest','suggestion','link',
  'url','tell','show','find','get','give','looking','look','want','need','please','there','any','some','one','box',
  'can','you','recommend','show','me','have'
]);

// ==============================================================================
// DYNAMIC TOOL RESOLVER (Orders, Products & Categories)
// ==============================================================================
async function resolveTools(env, msg, requestUrl, context) {
  const facts = [];
  const base = (() => { try { return new URL(requestUrl).origin; } catch { return ''; } })();

  // 1. Order tracking
  const orderNumber = context?.order_number
    || (msg ? (String(msg).match(/#?\\b(BD-[A-Z0-9-]+)\\b/i) || [])[1] : '');
  if (orderNumber) {
    try {
      const orders = await listOrders(env);
      const o = orders.find(x => String(x.id).toLowerCase() === String(orderNumber).toLowerCase());
      if (o) {
        const statusMap = {
          unpaid: 'payment processing',
          paid: 'payment confirmed, preparing dispatch at our supplier warehouse',
          fulfilling: 'packaged and undergoing quality inspection',
          shipped: 'dispatched and in transit with tracking active'
        };
        facts.push(\`ORDER \${o.id}: status is "\${o.status}" (\${statusMap[o.status] || o.status}).\`
          + (o.fulfillment?.cj?.orderNumber ? \` CJ fulfillment ref: \${o.fulfillment.cj.orderNumber}.\` : '')
          + (o.eta ? \` Estimated delivery: \${o.eta}.\` : '')
          + \` Track status directly at: \${base}/order-tracking.html?order=\${encodeURIComponent(o.id)}\`);
      } else {
        facts.push(\`Order "\${orderNumber}" was not found in the live database. Ask customer to verify their order number (formatted like BD-XXXXX) or track at \${base}/order-tracking.html\`);
      }
    } catch (e) {
      facts.push(\`Order tracking portal is online at \${base}/order-tracking.html\`);
    }
  }

  // 2. Category matching
  const msgNorm = norm(msg);
  const matchedCats = [];
  for (const c of CJ_CATEGORIES) {
    if (msgNorm.includes(c.slug.replace(/-/g, ' ')) || msgNorm.includes(c.name.toLowerCase())) {
      matchedCats.push(c);
    } else {
      for (const s of c.subcats) {
        if (msgNorm.includes(s.toLowerCase())) {
          matchedCats.push(c);
          break;
        }
      }
    }
  }
  if (matchedCats.length > 0) {
    for (const mc of matchedCats.slice(0, 2)) {
      facts.push(\`CATEGORY "\${mc.name}": browse all items at \${base}\${mc.path} (Includes subcategories: \${mc.subcats.slice(0, 5).join(', ')}).\`);
    }
  }

  // 3. Product search from featured / slim catalog
  if (msg && base) {
    const tokens = msgNorm.split(' ').filter(w => w.length >= 3 && !STOPWORDS.has(w));
    if (tokens.length >= 1) {
      try {
        let prods = [];
        // Try featured.json first (fastest, curated)
        const r = await fetch(base + '/featured.json');
        if (r.ok) {
          prods = await r.json();
        }
        if (!Array.isArray(prods) || prods.length === 0) {
          const r2 = await fetch(base + '/products-slim-0.json');
          if (r2.ok) prods = await r2.json();
        }

        if (Array.isArray(prods) && prods.length > 0) {
          const scored = [];
          for (const p of prods) {
            const t = norm(p.title || '');
            const cat = norm(p.product_type || p.category || '');
            if (!t) continue;
            let score = 0;
            for (const tok of tokens) {
              if (t.includes(tok)) score += 5;
              if (cat.includes(tok)) score += 3;
            }
            const phrase = tokens.join(' ');
            if (tokens.length >= 2 && t.includes(phrase)) score += 15;
            if (score >= 4) {
              scored.push({ p, score });
            }
          }
          scored.sort((a, b) => b.score - a.score);
          for (const item of scored.slice(0, 3)) {
            const prod = item.p;
            facts.push(\`PRODUCT: "\${prod.title}" — Price: A$\${Number(prod.price || 0).toFixed(2)}. Link: \${base}/product.html?id=\${encodeURIComponent(prod.id)}\`);
          }
        }
      } catch (e) {
        // Fallback silently
      }
    }
  }

  return facts;
}

// ==============================================================================
// CALL GEMINI (AI ENGINE)
// ==============================================================================
async function callGemini(env, messages, facts) {
  const key = env.GEMINI_API_KEY;
  if (!key) throw new Error('no gemini key');

  const system = \`\${STORE_KNOWLEDGE}
\${facts.length ? 'LIVE FACTS (Use these verified facts in your answer):\n' + facts.map(f => '- ' + f).join('\\n') : ''}

CRITICAL INSTRUCTIONS:
- You are Ruby: warm, upbeat, friendly, and 100% knowledgeable about Bargain Drop.
- ALWAYS use Australian Dollars (A$).
- When suggesting products or categories, ALWAYS provide direct links so the customer can tap through immediately.
- For discount inquiries, mention code "\${PROMO_CODE}" for 30% off sitewide!
- For shipping inquiries, remind them shipping is FREE over A$29 (otherwise A$8.44) and takes 7–15 business days.
- For returns, remind them of our 30-day risk-free return guarantee with full refunds or replacements.
- Keep responses friendly, helpful, and concise (2-4 sentences unless detailed recommendations are requested).
\`;

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.text }]
  }));

  const body = {
    contents,
    systemInstruction: { parts: [{ text: system }] },
    generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
  };

  let lastErr = null;
  for (const model of MODELS) {
    try {
      const r = await fetch(geminiUrl(model) + '?key=' + encodeURIComponent(key), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (r.ok) {
        const d = await r.json();
        const text = d?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
        if (text.trim()) return text.trim();
      } else {
        const errText = await r.text();
        lastErr = new Error(\`\${model} returned \${r.status}: \${errText.slice(0, 100)}\`);
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('All Gemini models unavailable');
}

// ==============================================================================
// COMPREHENSIVE INTELLIGENT RULE ENGINE (OFFLINE & BACKUP ENGINE)
// Answers ANY store question accurately even if Gemini is rate-limited or busy.
// ==============================================================================
function intelligentResponse(msg, facts = [], base = '') {
  const m = norm(msg);

  // 1. Greetings & Identity
  if (/^(hi|hello|hey|gday|g day|howdy|good (morning|afternoon|evening)|yo|hiya)\\b/.test(m) || m === 'hi' || m === 'hello') {
    return {
      reply: "Hey there! 👋 I'm **Ruby**, your Bargain Drop shopping assistant. How can I help you today? I can help you find products, check categories, give you our 30% discount code, track orders, or answer shipping & return questions!",
      suggestions: ['Use discount code', 'Browse 14 categories', 'Shipping times & rates', 'Returns policy', 'Track an order']
    };
  }

  if (m.includes('who are you') || m.includes('what are you') || m.includes('your name')) {
    return {
      reply: "I'm **Ruby**! 🌟 I'm Bargain Drop's official AI assistant. I know every product, category, policy, and deal on the site from top to bottom. Whether you're hunting for a bargain, checking sizing, or tracking an order, I'm here to help!",
      suggestions: ['Browse categories', 'Discount code', 'Shipping information']
    };
  }

  // 2. Discount & Coupon Codes
  if (m.includes('discount') || m.includes('coupon') || m.includes('promo') || m.includes('code') || m.includes('voucher') || m.includes('deal') || m.includes('sale')) {
    return {
      reply: \`You're in luck! 🎉 Use code **\${PROMO_CODE}** at checkout for **30% OFF sitewide**! Plus, remember you get **FREE shipping** on all orders over A$29.00.\`,
      suggestions: ['Browse All Products', 'Shipping costs', 'Returns policy']
    };
  }

  // 3. Shipping & Delivery
  if (m.includes('shipping') || m.includes('delivery') || m.includes('deliver') || m.includes('ship to') || m.includes('postage') || m.includes('how long')) {
    return {
      reply: "📦 **Shipping Details:**\\n• **FREE shipping** on all orders over **A$29.00**!\\n• Orders under A$29 have a flat rate of **A$8.44**.\\n• **Dispatch:** 2–4 business days with quality checks.\\n• **Delivery:** Typically **7–15 business days** to Australia and worldwide with door-to-door tracking.\\n\\nYou can track your shipment anytime on our [Order Tracking](/order-tracking.html) page!",
      suggestions: ['Track my order', 'What is the return policy?', 'Discount code']
    };
  }

  // 4. Returns & Refunds
  if (m.includes('return') || m.includes('refund') || m.includes('exchange') || m.includes('damaged') || m.includes('broken') || m.includes('faulty') || m.includes('warranty')) {
    return {
      reply: "🛡️ **30-Day Risk-Free Returns:**\\nWe offer a hassle-free 30-day return policy (extended up to 45 days)! If your order arrives damaged, defective, or not quite right, we provide a full refund or free replacement.\\n\\nYou can submit a return request directly through our [Returns Portal](/returns.html) or email our support team at [Support@bargain-drop.online](mailto:Support@bargain-drop.online).",
      suggestions: ['Start a return', 'Customer service', 'Shipping times']
    };
  }

  // 5. Order Tracking & Status
  if (m.includes('track') || m.includes('where is my order') || m.includes('order status') || m.includes('order number') || /bd-[a-z0-9-]+/i.test(m)) {
    if (facts.some(f => f.startsWith('ORDER'))) {
      const orderFact = facts.find(f => f.startsWith('ORDER'));
      return {
        reply: \`📋 **Order Update:**\\n\${orderFact}\`,
        suggestions: ['Track another order', 'Shipping times', 'Returns policy']
      };
    }
    return {
      reply: "🔍 You can track any order live on our [Order Tracking](/order-tracking.html) page! Just enter your order number (e.g. **BD-XXXXX**) or check your active orders in [My Orders](/orders.html). If you give me your order number right now, I can look it up for you!",
      suggestions: ['Go to Order Tracking', 'Go to My Orders', 'Contact Support']
    };
  }

  // 6. Categories & Department Exploration
  if (m.includes('categor') || m.includes('department') || m.includes('what do you sell') || m.includes('what products')) {
    return {
      reply: "🛍️ Bargain Drop features **14 official CJ Dropshipping categories**:\\n" +
        "1. [Women's Clothing](/category.html?cat=womens-clothing) · 2. [Men's Clothing](/category.html?cat=mens-clothing)\\n" +
        "3. [Bags & Shoes](/category.html?cat=bags-shoes) · 4. [Jewelry & Watches](/category.html?cat=jewelry-watches)\\n" +
        "5. [Health, Beauty & Hair](/category.html?cat=health-beauty-hair) · 6. [Home, Garden & Furniture](/category.html?cat=home-garden-furniture)\\n" +
        "7. [Home Improvement](/category.html?cat=home-improvement) · 8. [Pet Supplies](/category.html?cat=pet-supplies)\\n" +
        "9. [Sports & Outdoors](/category.html?cat=sports-outdoors) · 10. [Toys, Kids & Babies](/category.html?cat=toys-kids-babies)\\n" +
        "11. [Consumer Electronics](/category.html?cat=consumer-electronics) · 12. [Automobiles & Motorcycles](/category.html?cat=automobiles-motorcycles)\\n" +
        "13. [Phones & Accessories](/category.html?cat=phones-accessories) · 14. [Computer & Office](/category.html?cat=computer-office)\\n\\n" +
        "Explore all subcategories on our [All Categories](/categories.html) page!",
      suggestions: ["Women's Clothing", "Home, Garden & Furniture", "Pet Supplies", "Consumer Electronics"]
    };
  }

  // 7. Payment Methods & Checkout
  if (m.includes('payment') || m.includes('pay') || m.includes('card') || m.includes('paypal') || m.includes('apple pay') || m.includes('stripe') || m.includes('secure')) {
    return {
      reply: "💳 **Payment & Security:**\\nWe accept Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay, and Stripe. All payments are protected by 256-bit bank-grade SSL encryption for 100% secure checkout.\\n\\nReady to order? Visit your [Shopping Cart](/cart.html) or [Checkout](/checkout.html).",
      suggestions: ['Go to Cart', 'Discount code', 'Shipping costs']
    };
  }

  // 8. Contact & Customer Support
  if (m.includes('contact') || m.includes('support') || m.includes('email') || m.includes('human') || m.includes('help desk') || m.includes('phone') || m.includes('talk to')) {
    return {
      reply: \`💬 **We're here for you 24/7!**\\n• Email support: [Support@bargain-drop.online](mailto:\${SUPPORT_EMAIL})\\n• Help Center & FAQs: [Customer Service](/customer-service.html)\\n• Self-Service Returns: [Returns Portal](/returns.html)\\n\\nI'm also right here in this chat to answer any questions about products, orders, and deals!\`,
      suggestions: ['Returns portal', 'Track my order', 'Discount code']
    };
  }

  // 9. Sizing & Fit
  if (m.includes('size') || m.includes('sizing') || m.includes('fit') || m.includes('measurement') || m.includes('chart')) {
    return {
      reply: "👗 **Sizing Guide:**\\nDetailed size tables with chest, waist, length, and shoe size conversions are displayed on each product page! Because items come from verified international CJ manufacturers, we recommend taking your measurements and sizing up 1 size if you're between sizes.",
      suggestions: ["Women's Clothing", "Men's Clothing", "Bags & Shoes"]
    };
  }

  // 10. Product or Category Specific Matches from Facts
  const productFacts = facts.filter(f => f.startsWith('PRODUCT:'));
  const categoryFacts = facts.filter(f => f.startsWith('CATEGORY'));

  if (productFacts.length > 0 || categoryFacts.length > 0) {
    let reply = "Here's what I found for you! ✨\\n\\n";
    if (categoryFacts.length > 0) {
      reply += categoryFacts.map(f => '• ' + f.replace('CATEGORY ', '')).join('\\n') + '\\n\\n';
    }
    if (productFacts.length > 0) {
      reply += "**Recommended Items:**\\n" + productFacts.map(f => '• ' + f.replace('PRODUCT: ', '')).join('\\n') + '\\n\\n';
    }
    reply += \`Don't forget to use code **\${PROMO_CODE}** for 30% off! Let me know if you want to see more options.\`;
    return {
      reply,
      suggestions: ['Browse all products', 'Discount code', 'Shipping times']
    };
  }

  // 11. General Catch-All
  return {
    reply: "I'd love to help you with that! 😊 You can explore our [14 Product Categories](/categories.html), browse [All Products](/products.html), check [Shipping & Returns](/policy.html), or track an order at [Order Tracking](/order-tracking.html).\\n\\nPlus, don't forget code **BARGAIN26** for 30% off your order! What specific item or question can I help you with?",
    suggestions: ['Browse Categories', 'Discount code', 'Shipping information', 'Returns policy', 'Track an order']
  };
}

// ==============================================================================
// MAIN REQUEST HANDLER
// ==============================================================================
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders()
    });
  }

  let body = {};
  try { body = await request.json(); } catch {}

  const msg = String(body.message || '').trim();
  const ctx = body.context || {};
  const base = (() => { try { return new URL(request.url).origin; } catch { return ''; } })();

  // Conversation history
  let history = [];
  if (Array.isArray(body.history)) {
    history = body.history
      .filter(h => h && h.text)
      .map(h => ({ role: h.role === 'assistant' ? 'assistant' : 'user', text: String(h.text) }))
      .slice(-MAX_HISTORY);
  }
  if (!history.length || history[history.length - 1].text !== msg) {
    history.push({ role: 'user', text: msg });
  }

  // Resolve tool facts (Order tracking, categories, real products)
  let facts = [];
  try {
    facts = await resolveTools(env, msg, request.url, ctx);
  } catch (e) {
    console.error('resolveTools error:', e);
  }

  let reply = '';
  let suggestions = ['Use discount code', 'Browse categories', 'Shipping times', 'Returns policy'];
  let llm_used = false;

  // Try Gemini AI first if API key is present
  if (env.GEMINI_API_KEY) {
    try {
      reply = await callGemini(env, history, facts);
      llm_used = true;
      suggestions = ['Track an order', '30% Off code', 'All 14 categories', 'Returns policy'];
    } catch (err) {
      console.warn('Gemini call failed or rate-limited, switching to Ruby intelligent knowledge engine:', err.message);
    }
  }

  // If Gemini was offline, rate-limited (503/429), or unavailable, use Ruby's complete knowledge engine
  if (!reply) {
    const res = intelligentResponse(msg, facts, base);
    reply = res.reply;
    if (res.suggestions) suggestions = res.suggestions;
  }

  return new Response(JSON.stringify({ reply, suggestions, llm_used }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
      'Cache-Control': 'no-store'
    }
  });
}
`;

fs.writeFileSync('/bargain-drop-repo/functions/api/chat.js', chatScript);
console.log('Successfully wrote upgraded all-knowing functions/api/chat.js');
