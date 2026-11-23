// Cloudflare Pages Middleware: protects private JSON data files from public HTTP access.
// Static assets in /data/*.json (like orders.json, sessions.json, auth-tokens.json) and root
// /users-seed.json contain customer PII and must NEVER be readable directly via GET.
// Public catalog & category files (all-products*.json, categories-data*.json, etc.) remain accessible.

const BLOCKED_EXACT = new Set([
  '/users-seed.json',
  '/data/orders.json',
  '/data/sessions.json',
  '/data/auth-tokens.json',
  '/data/inbox.json',
  '/data/user-addresses.json',
  '/data/users.json',
  '/data/users-seed.json',
  '/data/enterprise-auth-db.json',
  '/data/sync-log.json',
  '/data/cj-webhook-processed.json',
  '/data/daemon-heartbeat.json',
]);

const BLOCKED_PREFIXES = [
  '/data/chat-',
  '/data/inbox-',
  '/data/order',
  '/data/user',
  '/data/session',
  '/data/auth',
  '/data/admin',
  '/data/enterprise-',
];

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname.toLowerCase();

  // Never block /api/* functions — they enforce their own auth/PIN checks.
  if (!path.startsWith('/api/')) {
    const isBlockedExact = BLOCKED_EXACT.has(path);
    const isBlockedPrefix = BLOCKED_PREFIXES.some((p) => path.startsWith(p));
    if (isBlockedExact || isBlockedPrefix) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: private store data cannot be accessed publicly.' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'X-Robots-Tag': 'noindex, nofollow',
          },
        }
      );
    }
  }

  return context.next();
}
