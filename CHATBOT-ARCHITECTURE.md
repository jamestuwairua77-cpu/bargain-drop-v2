# Customer Support AI Chatbot — Design & Integration Spec

**Goal:** Low-token-cost, brand-consistent support widget (bottom-right), with live read-only
access to product catalog + order status + policies.

---

## 1. Architecture (minimize internal logic → lower token cost)

```
[Storefront page] -- embed.js --> [Chat widget UI (static)]
        |                            |
        |  user question             |  (1) intent router (offset match, NO LLM for common intents)
        v                            v
[/api/chat]  Cloudflare Function ----+  (2) LLM called ONLY on fallback/unmatched
        |
        +-- intent: sizing/material/care --> read all-products.json (cached) --> template answer
        +-- intent: inventory ---------> read variant.available (cached) --> template answer
        +-- intent: order/tracking ----> /api/track-order (CJ+Shopify) --> template answer
        +-- intent: policy/returns -----> static policy KB (JSON) --> template answer
        +-- fallback ------------------> LLM with small context (NO catalog dump) --> answer
```

**Key cost-reduction rule:** 80% of customer questions (sizing, materials, "where's my order",
"how do I return") are answered by **deterministic routing + templates**, not the LLM. The LLM
is invoked only for open-ended fallback, and is given a *tiny* retrieved context (the matched
product's spec block, or the single order record) — never the full 2.9MB catalog.

---

## 2. Knowledge Base (read-only)

| Source | Data | Access |
|---|---|---|
| `all-products.json` / `categories-data.json` | title, body_html (materials, specs, care), variants (sizes, colors, available) | static read (cached) |
| Inventory | `variant.available` / `inventory_quantity` | via `/api/product-lookup?id=` |
| Orders | `data/orders.json` ledger + `/api/track-order?number=` (CJ+Shopify) | read-only API |
| Policies | `policy.html`, `returns.html`, FAQ (to be extracted to `faq.json`) | static read |
| Order history DB | `/api/admin-orders` (currently admin-only — MUST gate by email+order# match) | read-only, scoped |

**Security note:** order lookup MUST require **order number + email** pair, matched against the
ledger before returning anything. Never expose `/api/admin-orders` to the public widget.

---

## 3. Functional Capabilities

### 3a. Sizing & Product Assistance
- Query: "what material is X" / "how do I wash X" / "does X come in size M"
- Router matches product by fuzzy title/ID → returns a short spec block (materials, care,
  available sizes/colors) pulled from `body_html` + `variants`.

### 3b. Order & Logistics
- Query: "where is order #BD-CC-ABC / tracking"
- Requires order number + email → `/api/track-order` + `/api/admin-orders?` (scoped) →
  returns status + tracking # + ETA. If mismatch → polite "find your order number here".

### 3c. Tone
- Concise, professional, first-name friendly optional, NO "As an AI…", NO "I'm here to help you
  today!" boilerplate. Brand voice: helpful, direct, slightly warm (AU market).

---

## 4. Embed Script (bottom-right widget)

```html
<!-- Bargain Drop Support Widget -->
<script>
  (function(w,d,s){
    w.BD_CHAT = w.BD_CHAT || { config: { api: "https://bargain-drop.online" } };
    var el=d.createElement("link"); el.rel="preconnect"; el.href="https://bargain-drop.online"; d.head.appendChild(el);
    var c=d.createElement("link"); c.rel="stylesheet"; c.href=w.BD_CHAT.config.api+"/chat-widget/chat.css"; d.head.appendChild(c);
    var j=d.createElement("script"); j.async=true; j.src=w.BD_CHAT.config.api+"/chat-widget/chat.js"; d.body.appendChild(j);
  })(window,document,'script');
</script>
```

**Widget shell (`/chat-widget/chat.js`)** is a static, self-contained bubble that:
- renders the launcher + panel (no framework needed — keep token cost flat),
- POSTs `{message, orderNumber?, email?, session_id}` to `/api/chat`,
- streams/marks the reply.

---

## 5. API Payload Architecture

### Request → `POST /api/chat`
```json
{
  "session_id": "uuid",
  "message": "where is my order #BD-CC-ABC123",
  "context": {
    "order_number": "BD-CC-ABC123",   // extracted client-side if present
    "email": "customer@example.com"    // optional; required for order lookup
  }
}
```

### Response (deterministic route — no LLM)
```json
{
  "type": "order_status",           // intent tag
  "llm_used": false,                // token-cost signal
  "reply": "Order #BD-CC-ABC123 is in transit. Tracking: CJP123456789 · ETA Aug 22–24.",
  "data": { "status": "shipped", "tracking": "CJP123456789", "eta": "Aug 22–24" },
  "suggestions": ["Track another order", "Returns policy"]
}
```

### Response (fallback — LLM called)
```json
{
  "type": "general",
  "llm_used": true,
  "reply": "…",
  "suggestions": ["Shipping times", "Contact us"]
}
```

### Internal routing table (in `/api/chat`, pure JS — no LLM)
| Regex/trigger | Route | Data source |
|---|---|---|
| `order` + number | order_status | `/api/track-order` + scoped ledger |
| `size|sizing|fit` + product | sizing | variants |
| `material|care|wash` + product | product_spec | body_html |
| `stock|available` + product | inventory | variant.available |
| `return|refund|shipping|policy` | policy | policy KB |
| (none matched) | fallback_llm | small retrieved context |

---

## 6. Cost Minimization Checklist
- [ ] Intent router (regex/keyword) handles 80% with **zero LLM tokens**.
- [ ] LLM fallback passes **≤1 product spec block or 1 order record** (never full catalog).
- [ ] Static `chat.js`/`chat.css` cached (`Cache-Control: public, max-age=86400`).
- [ ] Session state in-browser only; no per-message DB writes (or one append to sync-log).

## 7. To Implicitly Gate (security)
- [ ] `/api/chat` order route: enforce `order_number` + `email` match before returning tracking.
- [ ] Rate-limit `/api/chat` (reuse `auth.js` pattern, 20 req/15min/IP).
