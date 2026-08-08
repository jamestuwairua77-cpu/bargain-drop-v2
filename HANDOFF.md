# Bargain Drop — Complete Handoff (Cloudflare Edition)
## Updated: 2026-08-08 (v2 — Worker proxy sync)

---

## 🔐 ACCOUNTS & ACCESS

### Shopify Store
| Field | Value |
|---|---|
| **Store name** | Bargain Drop |
| **Domain** | https://bargain-drop.online |
| **Shopify Admin** | https://admin.shopify.com/store/bargain-drop-8194 |
| **Store ID** | 73594044547 |
| **Store domain** | bargain-drop-8194.myshopify.com |
| **Email** | jamestuwairua77@gmail.com |
| **Currency** | AUD (Australia) |
| **Timezone** | Australia/Perth (GMT+08:00) |
| **Plan** | Basic |
| **Access token** | `[REDACTED]` |
| **Client ID** | `9ab0d272cfd0e8d378145a7eee7634ee` |
| **Location ID** | `91452932227` |

### GitHub Repository
| Field | Value |
|---|---|
| **Repo URL** | https://github.com/jamestuwairua77-cpu/bargain-drop-v2 |
| **Owner** | jamestuwairua77-cpu |
| **Branch** | main |
| **GITHUB_TOKEN** | `[REDACTED]` |
| **Token type** | Fine-grained PAT (read+write Contents on bargain-drop-v2) |

### Cloudflare Pages (PRIMARY HOSTING)
| Field | Value |
|---|---|
| **Platform** | Cloudflare Pages |
| **Live URL** | https://bargain-drop.online |
| **Pages project name** | bargain-drop |
| **Wrangler config** | `wrangler.toml` (included in zip) |
| **Compatibility date** | 2025-10-01 |
| **Compatibility flags** | `nodejs_compat` |
| **Build output dir** | `.` (root — static site + Functions) |
| **Functions directory** | `functions/` (46 API endpoints) |
| **Routing** | `_routes.json` → `/api/*` routed to Functions, all other paths served as static |
| **Custom Domains** | `bargain-drop.online` (active), `shop.bargain-drop.online` (pending — needs CNAME) |
| **Sync Method** | Worker `bargaindropv2` proxies `shop.*` → `bargain-drop.online` in real-time |
| **Cloudflare Dashboard** | https://dash.cloudflare.com/ → Pages → bargain-drop |

### Domain Sync: bargain-drop.online ↔ shop.bargain-drop.online
`shop.bargain-drop.online` is proxied via a Cloudflare Worker (`bargaindropv2`) that transparently forwards all traffic to `bargain-drop.online`. Every deploy to `bargain-drop.online` instantly reflects on `shop.` — zero lag, no separate deploy.

**How it works:**
- Worker route: `shop.bargain-drop.online/*` → `bargaindropv2`
- The Worker rewrites the hostname to `bargain-drop.online` and forwards the request
- Response is returned as-is — identical HTML, CSS, JS, API calls on both domains
- No duplicate hosting, no stale content, no sync delays

**Pages custom domain** — `shop.bargain-drop.online` was also added to the Pages project as a pending domain (Cloudflare needs a CNAME DNS record `shop → bargain-drop.pages.dev` to activate). Once the DNS CNAME is added, the Worker can be deprecated since both domains will serve from the same Pages deployment natively.

To add the CNAME (30 seconds):
1. Cloudflare Dashboard → bargain-drop.online → DNS → Records
2. Add: Type=CNAME, Name=shop, Target=bargain-drop.pages.dev, Proxy=On
3. The domain auto-verifies and the Worker proxy becomes unnecessary

### Stripe
| Field | Value |
|---|---|
| **Publishable key** | `pk_live_51TndeRJ3f0xAyevchYmstcKzEeAD27L3ZPBQtHfPqgXxfr00AKqZhfLV` |
| **Secret key** | Set in Cloudflare Pages as `STRIPE_SECRET_KEY` (encrypted) |

### CJ Dropshipping
| Field | Value |
|---|---|
| **Connected** | ✅ Yes |
| **Products synced** | 10 |
| **Orders** | 44 |
| **Access token** | Set in Cloudflare Pages as `CJ_ACCESS_TOKEN` (encrypted) |

### Google OAuth
| Field | Value |
|---|---|
| **Client ID** | `489382559871-t7hh34fgbr23vkifi1u8kd9s7dolrv20.apps.googleusercontent.com` |
| **Client Secret** | Set in Cloudflare Pages as `SHOPIFY_CLIENT_SECRET` (encrypted) |

### Admin Seed User
| Field | Value |
|---|---|
| **Email** | admin@bargain-drop.online |
| **Name** | Store Admin |
| **Provider** | email |

---

## ☁️ CLOUDFLARE PAGES — HOW IT WORKS

### Directory Structure
```
bargain-drop/
├── index.html              (homepage — 45KB)
├── category.html           (132 categories, 1,197 products)
├── product.html            (product detail)
├── cart.html               (shopping cart)
├── checkout.html           (Stripe checkout)
├── admin.html              (admin dashboard)
├── ... (27 total HTML pages)
├── css/                    (stylesheets)
├── js/                     (client-side JavaScript)
├── data/                   (131 category JSON files + products-index.json)
├── functions/              (Cloudflare Pages Functions — 46 API endpoints)
│   ├── _sync-lib.js        (shared helpers: Shopify, CJ, GitHub, CORS)
│   ├── api/
│   │   ├── auth.js         (register, signin — PBKDF2, rate-limited)
│   │   ├── google-callback.js
│   │   ├── admin-stats.js
│   │   ├── admin-users.js
│   │   ├── admin-orders.js
│   │   ├── admin-cj.js
│   │   ├── product-data.js
│   │   ├── product-lookup.js
│   │   ├── search-products.js
│   │   ├── product-sync-webhook.js
│   │   ├── cj-search.js
│   │   ├── cj-categories.js
│   │   ├── cj-order.js
│   │   ├── cj-import.js
│   │   ├── cj-diag.js
│   │   ├── cj-webhook.js
│   │   ├── cron-sync.js
│   │   ├── cron-sync-cj.js
│   │   ├── sync-full.js
│   │   ├── sync-products.js
│   │   ├── sync-inventory.js
│   │   ├── sync-product-data.js
│   │   ├── sync-cj-orders.js
│   │   ├── shopify-checkout.js
│   │   ├── shopify-order.js
│   │   ├── shopify-webhook.js
│   │   ├── setup-shopify.js
│   │   ├── register-shopify-webhooks.js
│   │   ├── save-order.js
│   │   ├── rebuild-data.js
│   │   ├── create-checkout-session.js
│   │   ├── create-payment-intent.js
│   │   ├── stripe-account.js
│   │   ├── stripe-pk.js
│   │   ├── apple-pay-process.js
│   │   ├── apple-pay-session.js
│   │   ├── gpay-process.js
│   │   ├── gpay-stripe-process.js
│   │   ├── categories-lookup.js
│   │   ├── track-order.js
│   │   ├── debug-env.js
│   │   ├── fix-images.js
│   │   ├── test-token.js
│   │   ├── test-moto.js
│   │   └── oauth/
│   │       └── callback.js
├── _routes.json            (Cloudflare routing: /api/* → Functions, /* → static)
├── wrangler.toml           (Cloudflare Pages Workers config)
├── _headers                (optional — custom HTTP headers per route)
└── HEALTH-REPORT.md        (post-fix audit)
```

### Routing (how Cloudflare Pages decides what hits Functions)
`_routes.json`:
```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": ["/*"]
}
```
- `/api/auth` → `functions/api/auth.js` (exports `onRequest`)
- `/api/admin-stats` → `functions/api/admin-stats.js`
- `/api/product-lookup?id=...` → `functions/api/product-lookup.js`
- `/index.html` → static file (not routed to Functions)
- Any path not matching `/api/*` → served as a static file from root

### Cloudflare Pages Environment Variables (REQUIRED)
Set these in **Cloudflare Dashboard → Pages → bargain-drop → Settings → Environment Variables**:

| Variable | Purpose | Example Value |
|---|---|---|
| `SHOPIFY_DOMAIN` | Shopify store domain (defaults to `bargain-drop-8194.myshopify.com`) | `bargain-drop-8194.myshopify.com` |
| `SHOPIFY_ACCESS_TOKEN` | Shopify Admin API token | `shpat_1e82d...` |
| `SHOPIFY_TOKEN` | Alternate name for the Shopify token (code reads both) | (same as above) |
| `CJ_ACCESS_TOKEN` | CJ Dropshipping API key | (from CJ dashboard) |
| `STRIPE_SECRET_KEY` | Stripe secret key (for payment intents) | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (served via `/api/stripe-pk`) | `pk_live_...` |
| `GITHUB_TOKEN` | GitHub PAT for sync/rebuild operations | `github_pat_11CGL...` |
| `SHOPIFY_CLIENT_ID` | Google OAuth client ID | `489382559871-...` |
| `SHOPIFY_CLIENT_SECRET` | Google OAuth client secret | (from Google Cloud Console) |
| `SHOPIFY_WEBHOOK_SECRET` | Shopify webhook signature secret (optional) | (from Shopify webhook settings) |
| `SHOPIFY_LOCATION_ID` | Shopify fulfillment location ID | `91452932227` |
| `ADMIN_PIN` | 4-digit PIN for admin panel access | `1234` |

---

## 🌐 LIVE SITE: 27/27 Pages

| Page | Size | Features |
|---|---|---|
| `index.html` | 45KB | Homepage product showcase |
| `category.html` | 323KB | 132 categories, 1,197 products, chips + pagination + search |
| `product.html` | 15KB | Product detail via API, reviews, variants, gallery |
| `cart.html` | 6KB | Shopping cart with localStorage |
| `checkout.html` | 33KB | Stripe checkout integration |
| `order-success.html` | 7KB | Order confirmation |
| `order-tracking.html` | 11KB | Shipment tracking |
| `orders.html` | 23KB | Order history |
| `wishlist.html` | 8KB | localStorage-based wishlist with remove |
| `sign-in.html` | 6KB | Google OAuth sign-in (4-icon navbar) |
| `sign-up.html` | 2KB | Redirect → register.html |
| `register.html` | 6KB | Google OAuth + email/password registration |
| `forgot-password.html` | 9KB | Password reset flow |
| `auth.html` | 19KB | OAuth callback handler + session management |
| `profile.html` | 8.7KB | Avatar, 13 menu links, sign out |
| `account-info.html` | 10KB | Name/email/phone/birthday/gender form |
| `addresses.html` | 15KB | Address management |
| `payment-methods.html` | 11KB | Payment method management |
| `security.html` | 11KB | Login & security |
| `communication-preferences.html` | 12KB | Notification preferences |
| `customer-service.html` | 15KB | Help & support |
| `policy.html` | 18KB | Privacy policy |
| `wallet.html` | 5KB | Store credit + gift card redeem |
| `gift-cards.html` | 7KB | Gradient preview + A$25/50/100/200 selector |
| `returns.html` | 11KB | Returns & exchanges |
| `admin.html` | 28KB | Dashboard, Orders, Analytics, Settings tabs |
| `404.html` | 2KB | Custom 404 page |
| `500.html` | 2KB | Custom 500 page |
| `signin.html` | 2KB | Redirect → sign-in.html |

---

## 🔧 NAVBAR: 4 Icons Standardized

All pages use the **same navbar**:

```
[BD] BARGAIN DROP    🔍 Search   ❤️ Wishlist   🛒 Cart (badge)   👤 Profile
```

Consistent across: index, category, product, profile, wallet, gift-cards, wishlist, sign-in, register, forgot-password, auth, checkout, orders, admin.

---

## 📡 API ENDPOINTS (46 Cloudflare Pages Functions)

### Auth
| Endpoint | Method | Description |
|---|---|---|
| `/api/auth` | POST | `register`, `signin` — PBKDF2 password hashing, rate-limited (5/15min) |
| `/api/google-callback` | GET | Google OAuth callback handler |
| `/api/oauth/callback` | GET | OAuth redirect handler |

### Admin
| Endpoint | Method | Description |
|---|---|---|
| `/api/admin-stats` | GET | Shopify + CJ aggregated stats |
| `/api/admin-users` | GET | Registered users list |
| `/api/admin-orders` | GET | Order listing |
| `/api/admin-cj` | GET | CJ Dropshipping status |

### Products
| Endpoint | Method | Description |
|---|---|---|
| `/api/product-data` | GET | Product details by ID |
| `/api/product-lookup` | GET | Product search/lookup |
| `/api/search-products` | GET | Full-text product search |
| `/api/product-sync-webhook` | POST | Shopify webhook receiver |

### CJ Dropshipping
| Endpoint | Method | Description |
|---|---|---|
| `/api/cj-search` | GET | Search CJ products |
| `/api/cj-categories` | GET | CJ category list |
| `/api/cj-order` | POST | Place CJ order |
| `/api/cj-webhook` | POST | CJ order webhook |
| `/api/cj-diag` | GET | CJ diagnostics |
| `/api/cj-import` | POST | Import CJ products |
| `/api/cron-sync-cj` | GET | Cron-triggered CJ sync |
| `/api/sync-cj-orders` | GET | Sync CJ order status |

### Payment
| Endpoint | Method | Description |
|---|---|---|
| `/api/create-payment-intent` | POST | Stripe payment intent |
| `/api/create-checkout-session` | POST | Stripe checkout session |
| `/api/stripe-account` | GET | Stripe account info |
| `/api/stripe-pk` | GET | Stripe publishable key |

### Shopify
| Endpoint | Method | Description |
|---|---|---|
| `/api/shopify-webhook` | POST | Shopify webhook handler |
| `/api/shopify-checkout` | POST | Shopify checkout |
| `/api/shopify-order` | POST | Order placement |
| `/api/save-order` | POST | Save order to DB |
| `/api/setup-shopify` | POST | Shopify setup |

### Sync
| Endpoint | Method | Description |
|---|---|---|
| `/api/rebuild-data` | GET | `?action=status\|sync` — syncs products from Shopify to GitHub |
| `/api/cron-sync` | GET | Cron-based full sync |
| `/api/sync-full` | GET | Full data sync |
| `/api/sync-products` | GET | Products-only sync |
| `/api/sync-inventory` | GET | Inventory sync |
| `/api/sync-product-data` | GET | Product data refresh |

### Other
| Endpoint | Method | Description |
|---|---|---|
| `/api/debug-env` | GET | Environment variable debug |
| `/api/fix-images` | GET | Image URL fixer |
| `/api/categories-lookup` | GET | Category lookup |
| `/api/track-order` | GET | Order tracking |
| `/api/test-token` | GET | Token validation test |
| `/api/test-moto` | GET | MOTO test endpoint |

---

## 🔄 SYNC PIPELINE (Cloudflare Edition)

```
Shopify Product Change (webhook)
  → POST /api/product-sync-webhook (Cloudflare Pages Function)
    → Pulls ALL products from Shopify Admin API
    → Writes data/categories-data.json to GitHub via GITHUB_TOKEN
    → Deploy latest zip to Cloudflare Pages
```

```
GitHub Push
  → Cloudflare Pages detects new commit on main branch
  → Auto-deploys static assets + Functions
```

**Status**: ✅ `GITHUB_TOKEN` set and verified (read+write access)

---

## 🚀 DEPLOYMENT WORKFLOW

### Option A: Deploy via Cloudflare Dashboard (Drag & Drop)
1. Download the latest zip from this handoff.
2. Go to https://dash.cloudflare.com/ → Pages → bargain-drop
3. Upload the zip via the "Upload assets" flow.
4. Cloudflare Pages auto-deploys — static files + Functions go live in ~30 seconds.

### Option B: Deploy via Wrangler CLI
```bash
# Install Wrangler if needed
npm install -g wrangler

# Log in
wrangler login

# Deploy from the extracted directory
wrangler pages deploy ./ --project-name=bargain-drop

# Or deploy the zip directly
wrangler pages deploy bargain-drop-cf-drop-FIXED.zip --project-name=bargain-drop
```

### Option C: Deploy via Cloudflare API
```bash
# Create a deployment
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/bargain-drop/deployments" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
  -F "file=@bargain-drop-cf-drop-FIXED.zip"
```

### Option D: Push to GitHub → Auto-Deploy
If the GitHub repo is connected to Cloudflare Pages:
1. Clone: `git clone https://github.com/jamestuwairua77-cpu/bargain-drop-v2.git`
2. Replace all files with the contents of this zip.
3. Commit + push: `git add -A && git commit -m "Cloudflare sync" && git push`
4. Cloudflare Pages auto-deploys from the connected branch.

### Post-Deploy — Set Environment Variables
After deploying, go to **Cloudflare Dashboard → Pages → bargain-drop → Settings → Environment Variables** and add all variables from the table above. Missing variables will cause Functions to return errors (the `/api/debug-env` endpoint lists which are set).

---

## ⚠️ KNOWN ISSUES

1. **Shopify PCD blocks order details** — Fix at: https://admin.shopify.com/store/bargain-drop-8194/settings/apps/development → API Credentials → Configure PCD → grant `read_orders`

2. **`rebuild-data.js` repo typo** — Line references `tuairua` / `preview` — verify the GitHub repo path matches `jamestuwairua77-cpu/bargain-drop-v2`.

3. **Cloudflare Pages CPU limits** — Functions have 50ms CPU time on free tier, 30s on paid. The full `rebuild-data?action=sync` may timeout on free tier. The per-product webhook works fine and is the recommended sync method.

4. **Category renderer must persist** — Shopify webhook can overwrite `category.html` with an older version from GitHub. The fixed version is included and should be the source of truth in the repo.

5. **Environment variables are NOT in source control** — Ensure ALL env vars from the table above are set in the Cloudflare Pages dashboard. The Functions read them from `context.env` at runtime, not from any config file.

---

## 📝 QUICK REFERENCE

| What | Where |
|---|---|
| Live site (main) | https://bargain-drop.online |
| Live site (shop) | https://shop.bargain-drop.online |
| Admin dashboard | https://bargain-drop.online/admin.html |
| Shopify admin | https://admin.shopify.com/store/bargain-drop-8194 |
| GitHub repo | https://github.com/jamestuwairua77-cpu/bargain-drop-v2 |
| Cloudflare dashboard | https://dash.cloudflare.com/ → Pages → bargain-drop |
| Product data | Shopify → `data/categories-data.json` on GitHub |
| Auth method | Google OAuth + email/password (PBKDF2) |
| Password hashing | PBKDF2 (100k rounds, sha512) |
| Payment processor | Stripe (live keys) |
| Dropshipping | CJ Dropshipping |
| Ecommerce platform | Shopify Basic plan |
| Hosting | **Cloudflare Pages** (not Vercel) |
| Serverless runtime | Cloudflare Pages Functions (46 endpoints, `onRequest` export) |
| Routing config | `_routes.json` (API paths → Functions, everything else → static) |
| Font-end framework | Vanilla HTML/CSS/JS (no React/Vue/Next.js) |
