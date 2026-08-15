# Bargain Drop — System Health Audit & Optimization Blueprint

**Role:** Lead Full-Stack E-commerce Developer / QA / Systems Architect
**Mode:** NON-DESTRUCTIVE — no code deployed. Read-only scan of source.
**URL:** https://bargain-drop.online

---

## PHASE 1 — Deep Scan & System Health

### 1. System Functionality

| Area | Finding | Severity |
|---|---|---|
| Checkout | Half-rebuilt: Stripe/PayPal/ApplePay/GPay, but **no Shopify handoff**. Shipping address was hardcoded (fixed), orders were localStorage-only (fixed to ledger). | HIGH |
| Payment loop | Stripe webhook now wired (`/api/stripe-webhook`) but **`STRIPE_WEBHOOK_SECRET` not deployed** → returns "Webhook secret not configured". Payment status not authoritative until secret set. | HIGH |
| User profile | Auth via `/api/auth` (server-side `hashPassword`, rate-limited 5/15min — good). BUT session = plain `token` stored in `localStorage` (`bd_session`), **no server-side session validation** → sessions are client-side trust. | MED |
| Cart stability | `bd_cart` in `localStorage` only (56 refs, 0 server cart). Cart clears on device/incognito; no cross-device merge. | MED |
| Order history | Ledger now persisted to `data/orders.json` (GitHub-backed). Read via `/api/admin-orders`. | OK |

**Functional verdict:** Checkout+ledger improved this session but still blocked on 3 secrets (`SHOPIFY_ACCESS_TOKEN`, `CJ_ACCESS_TOKEN`, `STRIPE_WEBHOOK_SECRET`). Auth and cart are client-side-only and not production-grade.

### 2. Performance & Speed

| Metric | Finding | Severity |
|---|---|---|
| Core Web Vitals (LCP) | Main payload `all-products.json` = **2.9 MB** loaded sync on `index.html`/`products.html` via XHR. This is the dominant LCP/INP killer. | HIGH |
| Images | 7,280 Shopify CDN (good) + **2,639 CJ + 742 CJ-OSS + alicdn** (watermarked, slow, foreign). Only **26/35** imgs `loading="lazy"`. | HIGH |
| Responsive images | **Zero `srcset`** — no responsive/compressed variants. | MED |
| Fonts | **Zero `font-display` / `preload`** → layout shift (CLS) + FOUT. | LOW |
| JS/CSS | `js/` 129K + `css/` 88K, inline per-page (no bundling/code-splitting). | MED |

### 3. Errors & Bugs

- **1 broken link:** `shop.html` referenced but missing.
- **`console.log` leftovers:** `auth.html`, `checkout.html`, `order-success.html`.
- **`debugger;`/`alert(`:** none found (good).
- **Responsive breakpoints:** duplicated inline CSS + a second `<style>`/`<script>` block in `checkout.html` (two navbars/CSS vars) — likely vertical misalignment on mobile.

---

## PHASE 2 — Structured Solution Blueprint (task list; NOT executed)

### T-A. Payments (do first — highest revenue impact)
- [ ] **T-A1** — `functions/api/stripe-webhook.js`: already reads `STRIPE_WEBHOOK_SECRET`; add `env.STRIPE_WEBHOOK_SECRET` to Cloudflare (value from Stripe `whsec_...`). No code change.
- [ ] **T-A2** — `checkout.html` L~258: remove the 2nd inline `<style>` block (duplicate `:root{--nav-h...}`) and merge navbar markup — fixes mobile breakage.
- [ ] **T-A3** — Deploy `SHOPIFY_ACCESS_TOKEN` + `CJ_ACCESS_TOKEN` (unblocks `/api/sync-full`).

### T-B. Data payload (Core Web Vitals)
- [ ] **T-B1** — `index.html` + `products.html`: replace sync `XHR → /data/all-products.json` (2.9MB) with **paginated/filtered** `/api/search-products` queries (24 products.html already has a search path). Load only first N on page, lazy-load rest on scroll.
- [ ] **T-B2** — Split `all-products.json` into per-category chunks (131 category files already exist) — serve category file on category page, not the full 2.9MB.

### T-C. Images (LCP + trust)
- [ ] **T-C1** — `product.html` gallery + `category.html`/`products.html` cards: add `srcset` (List Shopify CDN `?width=400/800/1200`) + `sizes`.
- [ ] **T-C2** — Add `loading="lazy"` to the remaining 9 static `<img>`.
- [ ] **T-C3** — `functions/api/fix-images.js` (exists) or a build step: rewrite CJ/alicdn image URLs → Shopify CDN copies. Target: eliminate all non-Shopify image hosts.

### T-D. Auth & Cart (trust & retention)
- [ ] **T-D1** — `functions/api/auth.js`: persist session token server-side (KV or `data/sessions`) and **validate on protected routes**; don't trust `localStorage.bd_session`.
- [ ] **T-D2** — Add server-side cart (sync `bd_cart` to ledger keyed by email/token) so cart survives device switch.

### T-E. Content (conversion)
- [ ] **T-E1** — `all-products.json`/`data/`: rewrite `title` → clean branded short titles (strip CJ spam + `. . .An` truncation).
- [ ] **T-E2** — Replace raw `body_html` with brand-voice description (2–3 sentences + bullet care/specs).

### T-F. Minor
- [ ] **T-F1** — Fix `shop.html` dead link (add page or update refs).
- [ ] **T-F2** — Remove `console.log` leftovers in `auth.html`/`checkout.html`/`order-success.html`.
- [ ] **T-F3** — Add `font-display: swap` + font `preload` for the brand font.

---

## PRIORITY ORDER
T-A (payments) → T-B (payload) → T-C (images) → T-D (auth/cart) → T-E (content) → T-F (minor)

**Blocker note:** T-A3, and thus full live sync + inventory propagation, cannot be completed without the 3 secrets. Everything else is code I can implement on confirmation.
