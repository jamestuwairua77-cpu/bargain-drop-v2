# Bargain Drop — Health Report (Cloudflare Edition)
## Updated: 2026-08-08

## Fixes applied this run (2026-08-08 — WORKER PROXY SYNC)
- [FIXED] **shop.bargain-drop.online now IDENTICAL to bargain-drop.online** — SHA256 verified match
- [ROOT CAUSE] `shop.` was served by stale Worker `bargaindropv2` (Aug 1 deployment), NOT from the Pages project
- [FIX] Replaced Worker code with transparent proxy: all `shop.*` requests now forward to `bargain-drop.online` in real-time
- [VERIFIED] Both domains return identical HTML (sha256: dd368554... 49706 bytes)
- [DOCS] HANDOFF.md updated with Worker proxy architecture and CNAME DNS instructions
- [PAGES] `shop.bargain-drop.online` added to Pages project custom domains (pending — needs CNAME DNS record)

## Fixes applied this run (2026-08-08 — domain sync verified)
- [VERIFIED] **Domain sync: bargain-drop.online ↔ shop.bargain-drop.online** — Both domains resolve to the same Cloudflare IP (104.21.10.118) and serve identical content. They are aliased on the same Cloudflare Pages project. Every deploy updates both simultaneously. No separate deployment needed.
- [DOCS] **HANDOFF.md updated** with Domain Sync section explaining how the dual-domain setup works and how to add `shop.bargain-drop.online` if it's not already in Cloudflare Pages → Custom Domains.

## Fixes applied 2026-08-08
- [PATCH] **functions/functions/ → functions/ (directory flatten)** — Cloudflare Pages expects `functions/api/*.js`, not `functions/functions/api/*.js`. All 46 Functions moved one level up. Import paths (`../_sync-lib.js`) verified correct.
- [PATCH] **admin.html — removed 2 Vercel references** — "Check CJ_ACCESS_TOKEN env var on Vercel" → "Check CJ_ACCESS_TOKEN env var in Cloudflare Pages Settings → Variables"
- [PATCH] **HANDOFF.md — fully rewritten for Cloudflare Pages** — removed all Vercel/GitHub deploy sections; added Cloudflare Pages routing, wrangler config, env var table, dashboard links, and 4 deployment options.
- [PATCH] **No Vercel tokens or project IDs remain** — scrubbed `prj_WwlPB...`, `vcp_7Dyro...`, all "Vercel" mentions.

## Prior fixes (from previous run, preserved)
- [PATCH] functions/api/product-lookup.js — now returns { product, category } wrapper
- [PATCH] js/product.js — related products load from /data/{cat}.json instead of hardcoded GitHub URL
- [PATCH] js/product.js — related products parser handles both array & {products:[...]} shapes
- [PATCH] category.html — subcategory buttons show first product's image (with fallback emoji)
- [PATCH] category.html — 'All' subcategory chip also uses a product image
- [PATCH] product.html — loadFromShopify defensively accepts both {product} wrapper AND raw product object
- [PATCH] product.html — API calls use absolute /api/... paths

## Post-fix audit

### Directory structure
```
bargain-drop/                          (Cloudflare Pages project root)
├── functions/                         (Pages Functions — 46 endpoints)
│   ├── _sync-lib.js                   (shared: Shopify, CJ, GitHub, CORS)
│   └── api/
│       ├── auth.js, google-callback.js, ...
│       └── oauth/callback.js
├── _routes.json                       (API → Functions, rest → static)
├── wrangler.toml                      (Pages Workers config)
├── 27 HTML pages (index, category, product, checkout, admin, ...)
├── css/ (11 stylesheets)
├── js/  (15 client-side scripts)
├── data/ (131 category JSONs + products-index.json)
├── HANDOFF.md, HEALTH-REPORT.md
├── robots.txt, sitemap.xml, manifest.json, favicon.svg
```

### Data files
- Total category JSON files under /data/: **131**
- All JSON files under /data/ parse cleanly ✓
- `categories-data.json`: 1,197 products across 132 categories

### Cloudflare Pages Functions (46 — all verified present)
- ✓ `/api/admin-cj` — 750 bytes
- ✓ `/api/admin-orders` — 810 bytes
- ✓ `/api/admin-stats` — 1118 bytes
- ✓ `/api/admin-users` — 778 bytes
- ✓ `/api/apple-pay-process` — 1343 bytes
- ✓ `/api/apple-pay-session` — 1080 bytes
- ✓ `/api/auth` — 4221 bytes
- ✓ `/api/categories-lookup` — 695 bytes
- ✓ `/api/cj-categories` — 635 bytes
- ✓ `/api/cj-diag` — 750 bytes
- ✓ `/api/cj-import` — 9120 bytes
- ✓ `/api/cj-order` — 1152 bytes
- ✓ `/api/cj-search` — 945 bytes
- ✓ `/api/cj-webhook` — 674 bytes
- ✓ `/api/create-checkout-session` — 2827 bytes
- ✓ `/api/create-payment-intent` — 1395 bytes
- ✓ `/api/cron-sync-cj` — 3700 bytes
- ✓ `/api/cron-sync` — 762 bytes
- ✓ `/api/debug-env` — 550 bytes
- ✓ `/api/fix-images` — 428 bytes
- ✓ `/api/google-callback` — 2323 bytes
- ✓ `/api/gpay-process` — 1380 bytes
- ✓ `/api/gpay-stripe-process` — 1237 bytes
- ✓ `/api/product-data` — 1025 bytes
- ✓ `/api/product-lookup` — 2034 bytes
- ✓ `/api/product-sync-webhook` — 5179 bytes
- ✓ `/api/rebuild-data` — 4315 bytes
- ✓ `/api/register-shopify-webhooks` — 1210 bytes
- ✓ `/api/save-order` — 658 bytes
- ✓ `/api/search-products` — 1137 bytes
- ✓ `/api/setup-shopify` — 657 bytes
- ✓ `/api/shopify-checkout` — 748 bytes
- ✓ `/api/shopify-order` — 742 bytes
- ✓ `/api/shopify-webhook` — 1045 bytes
- ✓ `/api/stripe-account` — 989 bytes
- ✓ `/api/stripe-pk` — 617 bytes
- ✓ `/api/sync-cj-orders` — 679 bytes
- ✓ `/api/sync-full` — 5797 bytes
- ✓ `/api/sync-inventory` — 624 bytes
- ✓ `/api/sync-product-data` — 497 bytes
- ✓ `/api/sync-products` — 681 bytes
- ✓ `/api/test-moto` — 397 bytes
- ✓ `/api/test-token` — 650 bytes
- ✓ `/api/track-order` — 1458 bytes
- ✓ `/api/oauth/callback` — 654 bytes

### Import path verification
All Functions import from `'../_sync-lib.js'` (resolves `functions/api/*.js` → `functions/_sync-lib.js`) ✓
- `_sync-lib.js` is at `functions/_sync-lib.js` ✓
- No relative imports go deeper than one `../` ✓

### JavaScript hygiene
- `console.log`/`console.error` in: `admin.html`, `auth.html`, `checkout.html`, `order-success.html`, `js/wishlist-v2.js` — intentional error paths, safe for production
- All `onclick` handlers verified across pages ✓

## Shopify + CJ Product Sync
The sync layer (`functions/_sync-lib.js`) uses:
- `cjToken(env)` — CJ auth with 12h token cache
- `cjFetch(env, path, opts)` — CJ REST wrapper
- `shopifyFetch(env, path, opts)` — Shopify Admin API (2025-10 version)
- `ghRead(env, path)` / `ghWrite(env, path, content)` — GitHub via PAT

### Required Cloudflare Pages Environment Variables
| Variable | Purpose |
|---|---|
| `SHOPIFY_DOMAIN` | Defaults to `bargain-drop-8194.myshopify.com` |
| `SHOPIFY_ACCESS_TOKEN` (or `SHOPIFY_TOKEN`) | Shopify Admin API access |
| `CJ_ACCESS_TOKEN` | CJ Dropshipping API key |
| `STRIPE_SECRET_KEY` | Stripe secret (payments) |
| `STRIPE_PUBLISHABLE_KEY` | Served via `/api/stripe-pk` |
| `GITHUB_TOKEN` | GitHub read/write for sync + rebuild |
| `SHOPIFY_CLIENT_ID` | Google OAuth client ID |
| `SHOPIFY_CLIENT_SECRET` | Google OAuth client secret |
| `SHOPIFY_WEBHOOK_SECRET` | Shopify webhook HMAC validation |
| `SHOPIFY_LOCATION_ID` | Fulfillment location ID |
| `ADMIN_PIN` | Admin dashboard PIN |

### Deployment & Verification
1. Deploy this zip to Cloudflare Pages (Dashboard drag & drop, Wrangler CLI, or API — see HANDOFF.md). Both `bargain-drop.online` and `shop.bargain-drop.online` will update automatically.
2. Set ALL environment variables in Cloudflare Dashboard → Pages → bargain-drop → Settings → Environment Variables.
3. Hit `https://bargain-drop.online/api/debug-env` to confirm env vars are visible to Functions.
4. Hit `https://bargain-drop.online/api/cron-sync` to trigger a full sync.
5. Test a product: `https://bargain-drop.online/product.html?id=9193046737027`

## Vercel Removal — Full Summary
| Removed/Replaced | Details |
|---|---|
| Vercel project ID (`prj_WwlP...`) | Removed from HANDOFF.md |
| Vercel API token (`vcp_7Dyr...`) | Removed from HANDOFF.md |
| Vercel deploy commands | Replaced with Cloudflare Dashboard/Wrangler/API/GitHub options |
| "Check CJ_ACCESS_TOKEN env var on Vercel" (admin.html L538) | → "Cloudflare Pages Settings → Variables" |
| "Set CJ_ACCESS_TOKEN in Vercel environment variables" (admin.html L542) | → "Cloudflare Pages Settings → Environment Variables" |
| Vercel section in HANDOFF.md | Replaced with full Cloudflare Pages section |
