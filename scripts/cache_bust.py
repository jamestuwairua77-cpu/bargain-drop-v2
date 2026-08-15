#!/usr/bin/env python3
"""
Bargain Drop — asset cache-busting build step.

For every local static asset referenced by an HTML file, inject a content-hash
version query string so clients fetch the new file after any change:
    js/account.js?v=00667019ba

Also writes _headers (Cloudflare Pages) with correct cache rules. Order matters:
Cloudflare matches the FIRST rule that matches, so specific (immutable) rules
must come before the catch-all HTML (no-cache) rule.

Usage: python3 scripts/cache_bust.py
"""
import os, re, hashlib, glob, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ASSET_DIRS = ['js', 'css', 'images', 'fonts']
EXT_RE = re.compile(r'\.(js|css|png|jpe?g|svg|webp|gif|woff2?|ttf|otf|ico)$', re.I)

def hash_file(path, n=10):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()[:n]

def collect_assets():
    assets = {}
    for d in ASSET_DIRS:
        for f in glob.glob(os.path.join(ROOT, d, '**', '*'), recursive=True):
            if not os.path.isfile(f) or not EXT_RE.search(f):
                continue
            rel = os.path.relpath(f, ROOT).replace(os.sep, '/')
            assets[rel] = hash_file(f)
    return assets

def main():
    assets = collect_assets()
    html_files = glob.glob(os.path.join(ROOT, '*.html'))
    changed_files = []

    # 1. Inject version query strings into HTML references
    for hf in html_files:
        with open(hf, 'r', encoding='utf-8') as f:
            src = f.read()
        orig = src
        def repl(m):
            attr = m.group(1)
            path = m.group(2)
            clean = path.lstrip('./').lstrip('/')
            clean = clean.split('?')[0]
            if clean in assets:
                return f'{attr}="/{clean}?v={assets[clean]}"'
            return m.group(0)
        src = re.sub(r'(src|href)="([^"]+\.(?:js|css|png|jpe?g|svg|webp|gif|woff2?|ttf|otf|ico)[^"]*)"', repl, src, flags=re.I)
        if src != orig:
            with open(hf, 'w', encoding='utf-8') as f:
                f.write(src)
            changed_files.append(os.path.relpath(hf, ROOT))

    # 2. Write _headers
    #
    # IMPORTANT: Cloudflare Pages MERGES headers from every matching rule, it does
    # NOT stop at the first match. A broad "/*  Cache-Control: no-store" rule would
    # therefore leak no-store onto /js/* and /css/* and defeat immutable caching.
    # So we enumerate the HTML routes explicitly instead of using a catch-all.
    lines = []
    lines.append("/*\n  X-Content-Type-Options: nosniff")
    lines.append("")
    # immutable static assets
    for d in ASSET_DIRS:
        lines.append(f"/{d}/*\n  Cache-Control: public, max-age=31536000, immutable")
    lines.append("/favicon.svg\n  Cache-Control: public, max-age=31536000, immutable")
    lines.append("/manifest.json\n  Cache-Control: public, max-age=3600")
    # data JSON — short cache (changes independently of HTML; CDN purge on deploy)
    lines.append("/*.json\n  Cache-Control: public, max-age=300")
    lines.append("")
    # HTML — always revalidate. Both "/page.html" and the extensionless "/page"
    # route are listed because Cloudflare Pages serves both.
    routes = sorted(
        os.path.splitext(os.path.basename(p))[0]
        for p in glob.glob(os.path.join(ROOT, '*.html'))
    )
    for r in routes:
        lines.append(f"/{r}.html\n  Cache-Control: no-cache, no-store, must-revalidate")
        lines.append(f"/{r}\n  Cache-Control: no-cache, no-store, must-revalidate")
    lines.append("/\n  Cache-Control: no-cache, no-store, must-revalidate")
    lines.append("")

    with open(os.path.join(ROOT, '_headers'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    changed_files.append('_headers')

    with open(os.path.join(ROOT, '.asset-hashes.json'), 'w') as f:
        json.dump(assets, f, indent=2)

    print(f'Cache-busting complete. Versioned {len(assets)} assets, updated {len(changed_files)} files.')
    print('Updated:', ', '.join(changed_files))

if __name__ == '__main__':
    main()
