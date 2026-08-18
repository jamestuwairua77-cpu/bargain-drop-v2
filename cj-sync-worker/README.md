# CJ Auto-Sync Worker

Self-running background service (Cloudflare Worker + cron) that keeps the Bargain Drop
storefront in sync with CJ Dropshipping — no Zaro task, fully invisible.

## Behavior (hourly)
1. Loads tracked Shopify products (tagged `cj-import` and/or carrying `cj-pid-{pid}`).
2. For each, queries CJ (`product/variant/query` by pid, or `product/query` by sku):
   - Out of stock (all variants 0) → set Shopify status `draft` + catalog `visible:false`.
   - Stock returned → set `active` + `visible:true`.
   - No longer on CJ (code 1600014 / missing) → `draft` + `visible:false` (HIDE, never delete).
3. Respects a per-run quota budget (`CJ_SYNC_MAX`, default 200 products) and CJ QPS (1 req/s).

## Deployment
```bash
cd cj-sync-worker
npx wrangler deploy
```

### Required secrets (set via `wrangler secret put`)
- `CJ_ACCESS_TOKEN` (+ `CJ_ACCESS_TOKEN_2..6` for multi-account)
- `SHOPIFY_ACCESS_TOKEN` (fresh 24h client-credentials token)
- `GITHUB_TOKEN` (for catalog `visible` flag writes)

### Cron
`[triggers] crons = ["0 * * * *"]` — hourly. (Set to `"*/30 * * * *"` for 30-min.)

## Tracking convention (for auto-import)
When the webhook auto-imports a CJ product, it tags the Shopify product with:
- `cj-import`
- `cj-pid-{pid}`

so the worker knows to reconcile it. The storefront filters `visible === false`.
