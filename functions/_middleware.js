// Cloudflare Pages Edge Middleware: functions/_middleware.js
// Enforces Zero-Trust private cache isolation, anti-scraper WAF checks, 404 blocks for removed pages, and security headers.

const BLOCKED_BOT_SIGNATURES = [
  'sqlmap',
  'nikto',
  'scrapy',
  'masscan',
  'dirbuster',
  'acunetix',
];

const DELETED_PAGE_PREFIXES = [
  '/architect',
  '/architect2',
  '/architect-chat',
  '/bargaindrop-ai',
  '/bdgemini',
  '/adpulse',
  '/adstudio',
  '/ollama',
  '/importer',
  '/sync',
  '/logos',
  '/logo-previews',
];

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathLower = url.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const rawQuery = url.search.toLowerCase();
  const ua = (request.headers.get('user-agent') || '').toLowerCase();

  // 0. Block removed pages with 404 Not Found (whilst keeping /api/* functional)
  if (!pathLower.startsWith('/api/')) {
    const isDeleted = DELETED_PAGE_PREFIXES.some(
      (prefix) =>
        pathLower === prefix ||
        pathLower === `${prefix}.html` ||
        pathLower.startsWith(`${prefix}/`)
    );
    if (isDeleted) {
      return new Response(
        '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>404 — Page Not Found | Bargain Drop</title><style>body{margin:0;background:#09090b;color:#fff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px}.box{max-width:420px;background:#121515;border:1px solid #222425;border-radius:12px;padding:32px}.code{font-size:3rem;font-weight:900;color:#DC2626;margin-bottom:8px}h1{font-size:1.25rem;margin:0 0 10px}p{color:#9ca3af;font-size:.9rem;margin:0 0 20px}a{display:inline-block;background:#DC2626;color:#fff;text-decoration:none;font-weight:700;padding:10px 20px;border-radius:8px}</style></head><body><div class="box"><div class="code">404</div><h1>Page Not Found</h1><p>This page has been permanently removed from Bargain Drop.</p><a href="/">Return to Storefront</a></div></body></html>',
        {
          status: 404,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store, must-revalidate',
          },
        }
      );
    }
  }

  // 1. Edge WAF: Block malicious path traversal, SQLi probes, and aggressive vulnerability scanners
  if (
    rawQuery.includes('../') ||
    rawQuery.includes('union%20select') ||
    rawQuery.includes('union+select') ||
    BLOCKED_BOT_SIGNATURES.some((sig) => ua.includes(sig))
  ) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Blocked by Bargain Drop Edge WAF.' }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, no-store',
        },
      }
    );
  }

  // 2. Execute downstream Edge Function / route handler
  const response = await next();

  // 3. Enforce Zero-Trust Cache-Poisoning Prevention & Security Headers on API/Auth responses
  const secured = new Response(response.body, response);
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/oauth/') ||
    url.pathname.startsWith('/admin')
  ) {
    secured.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');
    secured.headers.set('Pragma', 'no-cache');
    secured.headers.set('Vary', 'Cookie, Authorization');
  }
  secured.headers.set('X-Content-Type-Options', 'nosniff');
  secured.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return secured;
}