// Cloudflare Pages Edge Middleware: functions/_middleware.js
// Enforces Zero-Trust private cache isolation, anti-scraper WAF checks, and security headers across all Edge Functions.

const BLOCKED_BOT_SIGNATURES = [
  'sqlmap',
  'nikto',
  'scrapy',
  'masscan',
  'dirbuster',
  'acunetix',
];

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const rawQuery = url.search.toLowerCase();
  const ua = (request.headers.get('user-agent') || '').toLowerCase();

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