#!/usr/bin/env python3
"""
Bargain Drop — Cloudflare cache purge (call after successful deployment).

Purges the Cloudflare zone + Pages cache so edge users see the newest files
immediately. Requires env vars:
  CLOUDFLARE_API_TOKEN
  CLOUDFLARE_ZONE_ID      (e.g. 557180fc0420b27f1e5216df26702e55)
  SITE_URL                (e.g. https://bargain-drop.online)

Usage:
  CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ZONE_ID=... python3 scripts/purge_cache.py
"""
import os, sys, json, urllib.request, urllib.parse

TOKEN = os.environ.get('CLOUDFLARE_API_TOKEN', '')
ZONE = os.environ.get('CLOUDFLARE_ZONE_ID', '')
SITE = os.environ.get('SITE_URL', 'https://bargain-drop.online').rstrip('/')

def cf(method, path, payload=None):
    url = f'https://api.cloudflare.com/client/v4/zones/{ZONE}{path}'
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method,
        headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
    try:
        r = urllib.request.urlopen(req, timeout=30)
        return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode())

def main():
    if not TOKEN or not ZONE:
        print('ERROR: set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID', file=sys.stderr)
        sys.exit(1)

    print('Purging Cloudflare cache for zone', ZONE)
    # Purge specific key HTML entry points + the whole asset tree prefix
    files = [
        f'{SITE}/', f'{SITE}/index.html', f'{SITE}/product.html',
        f'{SITE}/checkout.html', f'{SITE}/cart.html', f'{SITE}/category.html',
        f'{SITE}/products.html', f'{SITE}/categories.html',
    ]
    res = cf('POST', '/purge_cache', {'files': files})
    ok1 = res.get('success', False)
    print('purge (files):', 'OK' if ok1 else res.get('errors'))

    # Also purge by prefix (all assets + html) — belt and suspenders
    res2 = cf('POST', '/purge_cache', {'prefixes': [f'{SITE}/']})
    ok2 = res2.get('success', False)
    print('purge (prefix):', 'OK' if ok2 else res2.get('errors'))

    print('Cache purge', 'SUCCESS' if (ok1 or ok2) else 'FAILED')

if __name__ == '__main__':
    main()
