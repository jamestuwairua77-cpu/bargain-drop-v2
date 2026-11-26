// Cloudflare Pages Middleware:
// 1. Protects private JSON data files from public HTTP access.
// 2. Runs a throttled, non-blocking background Autopilot heartbeat (every 3 min via context.waitUntil)
//    so pending crypto confirmations, queued CJ Wallet auto-payments, and CJ tracking emails execute
//    100% automatically with ZERO clicks even on Cloudflare Pages free tier.

import { runFullAutopilotCycle } from './_sync-lib.js';

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

let _lastAutopilotTick = 0;
const AUTOPILOT_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

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

  // Non-blocking background Autopilot heartbeat (only on GET page/API hits, throttled to every 3m)
  const now = Date.now();
  if (
    context.request.method === 'GET' &&
    !path.startsWith('/api/auto-fulfill-cron') &&
    !path.match(/\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?)$/) &&
    now - _lastAutopilotTick > AUTOPILOT_INTERVAL_MS
  ) {
    _lastAutopilotTick = now;
    if (typeof context.waitUntil === 'function') {
      context.waitUntil(
        runFullAutopilotCycle(context.env).catch(() => null)
      );
    }
  }

  return context.next();
}
