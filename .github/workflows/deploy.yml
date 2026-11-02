name: Deploy to Cloudflare Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Assemble clean Cloudflare Pages directory
        run: |
          mkdir -p dist
          for item in *; do
            case "$item" in
              dist|functions|scripts|node_modules|package.json|package-lock.json|README.md|*.backup*|*.bak*)
                continue
                ;;
              *)
                cp -r "$item" dist/
                ;;
            esac
          done
          for dotfile in _headers _redirects _routes.json; do
            if [ -f "$dotfile" ]; then
              cp "$dotfile" dist/
            fi
          done
          if [ -f "functions/cpagrip.js" ]; then
            cp "functions/cpagrip.js" "dist/cpagrip-worker.js"
          fi

      - name: Cache-bust assets (regenerate ?v= hashes + _headers)
        run: |
          if [ -f scripts/cache-bust.mjs ]; then
            node scripts/cache-bust.mjs dist
          fi

      - name: Deploy to Cloudflare Pages
        run: |
          npx wrangler pages deploy dist --project-name=bargain-drop --branch=main --commit-dirty=true
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Purge Cloudflare cache
        run: |
          curl -s -X POST "https://api.cloudflare.com/client/v4/zones/557180fc0420b27f1e5216df26702e55/purge_cache" \
            -H "Authorization: Bearer ${{ secrets.CLOUDFLARE_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            --data '{"purge_everything":true}'