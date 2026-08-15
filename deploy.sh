#!/usr/bin/env bash
#
# Bargain Drop — one-command deploy with cache busting + CDN purge.
#
#   ./deploy.sh
#
# Steps:
#   1. Cache-bust: content-hash every local asset and rewrite HTML references,
#      then regenerate _headers with the correct Cache-Control rules.
#   2. Deploy to Cloudflare Pages (this also invalidates the Pages edge cache).
#   3. Purge the Cloudflare zone cache (custom domain) — optional, needs a token
#      with the "Zone > Cache Purge" permission.
#
# Required env (or edit the defaults below):
#   CLOUDFLARE_API_TOKEN    - Pages deploy token
#   CLOUDFLARE_ACCOUNT_ID   - Cloudflare account id
# Optional (for step 3):
#   CLOUDFLARE_PURGE_TOKEN  - token WITH Zone>Cache Purge permission
#   CLOUDFLARE_ZONE_ID      - zone id for bargain-drop.online
#
set -euo pipefail
cd "$(dirname "$0")"

: "${CLOUDFLARE_ACCOUNT_ID:?set CLOUDFLARE_ACCOUNT_ID}"
: "${CLOUDFLARE_API_TOKEN:?set CLOUDFLARE_API_TOKEN}"
SITE_URL="${SITE_URL:-https://bargain-drop.online}"
ZONE_ID="${CLOUDFLARE_ZONE_ID:-557180fc0420b27f1e5216df26702e55}"

echo "──────────────────────────────────────────"
echo "1/3  Cache-busting assets + writing _headers"
echo "──────────────────────────────────────────"
python3 scripts/cache_bust.py

echo
echo "──────────────────────────────────────────"
echo "2/3  Deploying to Cloudflare Pages"
echo "──────────────────────────────────────────"
npx --yes wrangler@latest pages deploy . \
  --project-name=bargain-drop \
  --branch=main \
  --commit-dirty=true

echo
echo "──────────────────────────────────────────"
echo "3/3  Purging Cloudflare edge cache"
echo "──────────────────────────────────────────"
# Prefer a dedicated purge token if provided, else try the deploy token.
PURGE_TOKEN="${CLOUDFLARE_PURGE_TOKEN:-$CLOUDFLARE_API_TOKEN}"
if CLOUDFLARE_API_TOKEN="$PURGE_TOKEN" \
   CLOUDFLARE_ZONE_ID="$ZONE_ID" \
   SITE_URL="$SITE_URL" \
   python3 scripts/purge_cache.py; then
  echo "Edge cache purged."
else
  echo "NOTE: zone purge skipped/failed (token likely lacks Zone>Cache Purge)."
  echo "      The Pages deployment itself already invalidated the Pages cache,"
  echo "      and HTML is served no-store, so users still get the new version."
fi

echo
echo "✅ Deploy complete → $SITE_URL"
