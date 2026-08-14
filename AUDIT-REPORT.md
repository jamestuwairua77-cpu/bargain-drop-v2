# Bargain Drop — Full-Stack E-commerce Architecture Audit

**Auditor role:** Full-Stack E-commerce Architect + Headless Commerce QA
**Scope:** Custom frontend (Cloudflare Pages) → Shopify (Admin/Storefront API) → CJ Dropshipping (App API)
**Date:** 2026-08-15

---

## TL;DR — Architectural Verdict

Your pipeline is **three disconnected layers pretending to be one**. The frontend is polished,
and the data model is mostly intact, but the **money path (checkout → Shopify order → CJ
fulfillment) is broken in multiple places that will silently lose orders**. The product
catalog is a **frozen snapshot**, not a live sync. Treat the store as a **demonstration
of a storefront**, not a functional order pipeline, until the hazards below are fixed.

**Overall score: 2.1 / 5 — "Looks like a store, does not yet reliably sell."**

---

## PILLAR 1 — Data & Variant Syncing

**Status: BROKEN (no live sync).**

### Findings
1. **No storefront API.** The frontend never calls Shopify Storefront. Product data is served
   from **static JSON files** (`all-products.json`, `data/all-products.json`, 131 category files)
   that were generated once from a Shopify export and committed to GitHub.
2. **CJ is not the source of truth at runtime.** `cj-diag` returns `connected:false` (no
   `CJ_ACCESS_TOKEN` deployed). Nothing pulls live CJ variant data.
3. **Variants ARE present in the data** (6853/6854 variants have real CJ SKUs like
   `CJYD299047601AZ`), with `option1` (color) / `option2` (size), `price`, `sku`, `available`.
   So the *shape* is correct — but it is a **snapshot**, not a sync.
4. **Stock is fabricated.** Variant `available` is `false` globally in CJ data, so the PDP
   **derives stock deterministically from the product ID** (`product.html` L378-382:
   `outOfStock = s%4===0`, low-stock = `s%7===0`). This is not real inventory.

### Hazard
A CJ variant that goes out of stock will **never** propagate to your storefront. The
"Inventory Blindspot" failure you flagged is **fully open** — customers can and will buy
items CJ cannot source, because availability is invented client-side.

---

## PILLAR 2 — Checkout Breakage (The "Hand-Off Trap")

**Status: CRITICAL — handoff design is sound, but there is no Shopify handoff at all.**

### Findings
1. The checkout **never redirects to Shopify.** `checkout.html` wires payment to
   **Stripe Checkout** (`/api/create-checkout-session`), PayPal, Apple Pay, and Google Pay —
   **not** Shopify Checkout. Your custom checkout is *replacing* Shopify, not handing off to it.
2. The Stripe/PayPal/GPay paths redirect to `*.stripe.com` / `*.paypal.com` branded hosted
   pages, then back to `order-success.html`. There is **no `//shopify.com` handoff moment**,
   so the "style mismatch" concern is moot — but the *intent* (trusted hosted checkout) is
   partially achieved via Stripe/PayPal instead of Shopify.
3. **Shipping address is discaded at the fulfillment layer.** `syncShopify()` and `syncCJ()`
   hardcode `city:'Perth', state:'WA', zip:'6000'` (order-success.html L115, L150) — the
   customer's real shipping address collected on `checkout.html` is **never passed to Shopify
   or CJ**. Every order would ship to a placeholder Perth address.
4. **Order state lives in `localStorage`.** The order is written to `bd_orders` in the
   browser (checkout.html `saveOrder()`), not to a server ledger. Refresh/other-device =
   order lost from the fulfillment path.

### Hazard
Shipping address data loss → orders created with wrong/placeholder address → CJ fulfillment
sends to wrong location → chargebacks + refunds. This is the single most dangerous bug.

---

## PILLAR 3 — Sourcing & Copywriting (Title / Media / Factory clean-up)

**Status: PARTIAL — titles are inherited, media is on Shopify CDN, copy is largely untouched factory content.**

### Findings
1. **Titles remain CJ-spammy.** Sample real titles in the catalog: *"Lightweight Soft-soled
   Rocking Shoes With A Flyknit Mesh Upper An"*, *"Off-shoulder Slim-fit Asymmetrical Cropped
   Bottoming Top"*, *"Environmentally Friendly Biodegradable..."* — long, SEO-stuffed, and
   **truncated mid-word** (the CJ 80-char import truncation). No rewrite has been applied.
2. **Images are Shopify CDN** (`cdn.shopify.com/s/files/...`), not CJ's watermarked factory
   files — so **watermarks are avoided** (good). But they are still the *same* generic CJ
   product photos, not custom-branded lifestyle shots.
3. **Product descriptions are raw CJ `body_html`** (e.g. "Product information: Overview: This
   modern minimalist photo frame…"). Not rewritten to a brand voice.
4. **Reviews are fabricated client-side** (seeded PRNG) — not real. This is a conversion and
   **compliance/authenticity** risk (consumer-law deception in Australia under the ACL).

### Hazard
Generic CJ titles/descriptions undermine the "high-end marketplace" intent and hurt SEO +
conversion. Truncated titles (". . .An", "Off-shoulder") look broken to customers.

---

## PILLAR 4 — Estimated Shipping Transparency

**Status: PARTIAL — fixed formula, not dynamic CJ-aware ETAs.**

### Findings
1. Shipping price is a **flat formula**: `subtotal > $41 ? FREE : $8.44` (checkout.html).
   Not derived from CJ's per-SKU shipping.
2. The PDP shows an "Estimated delivery" date range (product.html L424) **computed from the
   product ID seed** — not from CJ's actual ship-from / logistics data.
3. `shopifyToCjOrder` hardcodes `logisticName: 'CJPacket Ordinary'` and `fromCountryCode:'CN'`
   — a single shipping method regardless of the actual CJ warehouse/line.

### Hazard
CJ uses multiple suppliers with widely different lead times (7–40 days). Flat "shipping $8.44,
free over $41" + a fake ETA will produce cart abandonment when orders take weeks, and
"item not as described / not delivered" disputes when ETAs are wrong.

---

## PILLAR 5 — Automation & Order Loops

**Status: CRITICAL — the order loop is broken at every hop.**

### Findings (the "smoking gun")
1. **Cart items carry no `sku`/`cid`.** `addToCart` (product.html L656) pushes
   `{_key, variant_id, product_id, title, price, qty, image, size, color}` — **no `sku`**
   and **no CJ `vid`**. But the variant data HAS skus (`CJYD...`). The sku is dropped at
   add-to-cart time.
2. **CJ `createOrderV2` requires a `vid`** (CJ variant id) per product line. The `cj-order.js`
   generic path POSTs `body` straight through with `line_items[]` that have **no vid/sku**.
   The `shopifyToCjOrder` path maps `vid = li.sku || properties.cj_vid` — but since the cart
   never captured `sku`, that resolves to `null`. **CJ will reject the order.**
3. **Shopify order creation is also broken.** `syncShopify()` POSTs to `/api/shopify-order`
   with a `{order, customer, line_items, shipping_address}` blob that the `shopify-order.js`
   forwards as `{ order: body }` — but `line_items` inside the cart use `{title, price, qty}`,
   not Shopify `variant_id`, so Shopify would reject or create line-item-less orders.
4. **Double fulfillment risk.** `order-success.html` fires **both** `syncCJ()` and
   `syncShopify()` (L111-113) — two independent paths with no idempotency guard. If both
   partially succeed you get duplicate orders or orphaned payments.
5. **Metadata handoff mismatch.** Stripe session metadata records `order_id` + `source:
   'bargain-drop-v10'`, but there is **no Stripe webhook** storing payment status back to the
   server. `order-success.html?id=` is trust-the-URL — a user could visit it without paying.

### Hazard
**The order a customer pays for will not reach CJ for fulfillment.** The `vid`/`sku` gap alone
ensures `createOrderV2` fails. This is a total automation disconnect.

---

## THE 3 BIGGEST ARCHITECTURE HAZARDS (ranked)

1. **🚨 Shipping address loss + no server order ledger.** Orders are browser-`localStorage`
   objects with hardcoded Perth addresses. Customers' real shipping details are discarded →
   orders ship to nowhere. **Fix first.**

2. **🚨 The CJ order loop is missing the `vid`/`sku` linkage.** Cart → CJ has no product
   identifier CJ understands. No order can fulfill. **Fix second.**

3. **🚨 No live sync anywhere.** Shopify + CJ tokens are not deployed (`not configured`);
   the catalog is a static snapshot; stock/discounts are seeded PRNG. The store cannot
   reflect reality. **Fix third (unblocked by token deployment).**

---

## VERIFICATION CHECKLIST (do in order)

### A. Order integrity (highest priority)
- [ ] Capture **`sku`** in `addToCart` (product.html L656) — add `sku: variant.sku` and carry it into line items.
- [ ] Pass the **real shipping address** from `checkout.html` → `save-order` → `shopify-order`/`cj-order` (replace hardcoded Perth).
- [ ] Persist the order **server-side** (a `data/orders.table` or KV), not `localStorage`.
- [ ] Add a **Stripe webhook** (`checkout.session.completed`) that marks the order `paid` — stop trusting `?id=` URLs.
- [ ] Add an **idempotency key** so `syncCJ`/`syncShopify` can't double-create.

### B. CJ fulfillment linkage
- [ ] Confirm `cj-order.js` maps `vid` correctly: cart item `sku` → CJ variant `vid` (or fetch CJ `vid` from SKU via `/product/query`).
- [ ] Test a **single real order** end-to-end: add → Stripe → `/api/cj-order` → verify a CJ order number returns.

### C. Live sync
- [ ] Deploy `SHOPIFY_ACCESS_TOKEN`, `CJ_ACCESS_TOKEN`, `SHOPIFY_DOMAIN` to Cloudflare Pages (or grant an Edit token).
- [ ] Run `/api/sync-full?action=sync` and confirm product count matches Shopify.
- [ ] Schedule `cron-sync` / `cron-sync-cj` (via Cloudflare cron trigger) for inventory.

### D. Inventory propagation
- [ ] Replace seeded `available`/`low-stock` derivation (product.html L378-382) with real variant `available` + `inventory_quantity`.
- [ ] On OOS, disable the variant + show real "sold out" — block add-to-cart.

### E. Content / conversion
- [ ] Rewrite titles (strip CJ spam + truncation). Derive clean short titles.
- [ ] Replace raw `body_html` with brand-voice descriptions.
- [ ] Implement real shipping ETAs (draw from CJ shipping endpoint), replace flat `$8.44`.

---

## Summary table

| Pillar | Verdict |
|---|---|
| 1. Data & Variant Syncing | BROKEN (snapshot, no live sync) |
| 2. Checkout Handoff | MISDIRECTED (Stripe, not Shopify; address loss) |
| 3. Sourcing & Copy | PARTIAL (titles/media inherited, not cleaned) |
| 4. Shipping Transparency | PARTIAL (flat formula, fake ETA) |
| 5. Automation & Order Loop | CRITICAL (vid/sku gap — orders can't fulfill) |
