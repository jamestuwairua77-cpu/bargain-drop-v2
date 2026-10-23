name: Deploy to Cloudflare Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch: {}

permissions:
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    concurrency:
      group: pages-deploy
      cancel-in-progress: false
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Assemble clean Cloudflare Pages directory
        run: |
          mkdir -p /tmp/cf-site
          git fetch origin 0453165a63e6addee190639d0acd64f0c6a7b13b --depth=1 || true
          git archive 0453165a63e6addee190639d0acd64f0c6a7b13b | tar -x -C /tmp/cf-site
          # Sync live catalog shards if updated on CDN
          curl -fsSL https://bargain-drop.online/all-products.json -o /tmp/cf-site/all-products.json || true
          curl -fsSL https://bargain-drop.online/all-products-0.json -o /tmp/cf-site/all-products-0.json || true
          curl -fsSL https://bargain-drop.online/all-products-1.json -o /tmp/cf-site/all-products-1.json || true
          # Overlay public/store if present
          if [ -d public/store ]; then
            cp -r public/store/* /tmp/cf-site/ || true
          fi
          # Overlay HEAD root storefront files & functions
          cp -f *.html /tmp/cf-site/ 2>/dev/null || true
          cp -f _headers _redirects _routes.json wrangler.toml users-seed.json /tmp/cf-site/ 2>/dev/null || true
          if [ -d css ]; then cp -r css/* /tmp/cf-site/css/ || true; fi
          if [ -d js ]; then cp -r js/* /tmp/cf-site/js/ || true; fi
          if [ -d functions ]; then cp -r functions/* /tmp/cf-site/functions/ || true; fi
          if [ -d data ]; then mkdir -p /tmp/cf-site/data && cp -r data/* /tmp/cf-site/data/ || true; fi
          if [ -d scripts ]; then mkdir -p /tmp/cf-site/scripts && cp -r scripts/* /tmp/cf-site/scripts/ || true; fi
          rm -rf /tmp/cf-site/.github

      - name: Cache-bust assets (regenerate ?v= hashes + _headers)
        working-directory: /tmp/cf-site
        run: python3 scripts/cache_bust.py

      - name: Deploy to Cloudflare Pages
        working-directory: /tmp/cf-site
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: npx --yes wrangler@latest pages deploy . --project-name=bargain-drop --branch=main --commit-dirty=true

      - name: Purge Cloudflare cache
        working-directory: /tmp/cf-site
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ZONE_ID: ${{ secrets.CLOUDFLARE_ZONE_ID }}
          SITE_URL: https://bargain-drop.online
        run: python3 scripts/purge_cache.py || true