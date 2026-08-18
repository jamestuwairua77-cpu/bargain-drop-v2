// Cloudflare Pages Function: /api/site-health
// GET — probes the site's critical dependencies and returns a health summary
//       + any active issues (from data/sync-log.json + data/alerts.json).

import { corsHeaders, shopifyFetch, cjFetch, ghRead } from '../_sync-lib.js';

const ALERTS_PATH = 'data/alerts.json';
const SYNC_LOG_PATH = 'data/sync-log.json';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });

  const checks = [];
  const issues = [];

  // ── 1. Shopify ──
  try {
    const r = await shopifyFetch(env, '/shop.json');
    checks.push({ name: 'Shopify', ok: r.ok, detail: r.body?.shop?.name || (r.status + '') });
    if (!r.ok) issues.push({ level: 'error', source: 'shopify', message: 'Shopify API unreachable (' + r.status + ')', at: new Date().toISOString() });
  } catch (e) {
    checks.push({ name: 'Shopify', ok: false, detail: e.message });
    issues.push({ level: 'error', source: 'shopify', message: 'Shopify API error: ' + e.message, at: new Date().toISOString() });
  }

  // ── 2. CJ Dropshipping ──
  try {
    const r = await cjFetch(env, '/product/list?pageNum=1&pageSize=1');
    checks.push({ name: 'CJ Dropshipping', ok: r?.code === 200 || r?.result === true || r?.success === true, detail: 'connected' });
    if (!(r?.code === 200 || r?.result === true || r?.success === true)) {
      issues.push({ level: 'error', source: 'cj', message: 'CJ API error: ' + (r?.code || r?.message || 'unknown'), at: new Date().toISOString() });
    }
  } catch (e) {
    checks.push({ name: 'CJ Dropshipping', ok: false, detail: e.message });
    issues.push({ level: 'error', source: 'cj', message: 'CJ API error: ' + e.message, at: new Date().toISOString() });
  }

  // ── 3. GitHub (catalog) ──
  try {
    const r = await ghRead(env, 'all-products.json');
    checks.push({ name: 'Catalog (GitHub)', ok: !!r, detail: 'served' });
    if (!r) issues.push({ level: 'warning', source: 'catalog', message: 'Catalog file missing from GitHub', at: new Date().toISOString() });
  } catch (e) {
    checks.push({ name: 'Catalog (GitHub)', ok: false, detail: e.message });
    issues.push({ level: 'warning', source: 'catalog', message: 'Catalog read error: ' + e.message, at: new Date().toISOString() });
  }

  // ── 4. Recent sync errors (from sync-log.json) ──
  let syncErrors = [];
  try {
    const r = await ghRead(env, SYNC_LOG_PATH);
    if (r && r.content) {
      const log = JSON.parse(atob(r.content.replace(/\n/g, '')));
      if (Array.isArray(log)) {
        // last 50 entries, look for errors in the last 24h
        const dayAgo = Date.now() - 24 * 3600 * 1000;
        syncErrors = log.slice(0, 50).filter(e => {
          const ts = e.at ? new Date(e.at).getTime() : 0;
          const isError = /error/i.test(String(e.action || '')) || e.error || e.fatal || /fail|error/i.test(String(e.messageType || ''));
          return isError && ts >= dayAgo;
        });
      }
    }
  } catch {}

  // ── 5. Existing persisted alerts ──
  let alerts = [];
  try {
    const r = await ghRead(env, ALERTS_PATH);
    if (r && r.content) alerts = JSON.parse(atob(r.content.replace(/\n/g, '')));
  } catch {}
  alerts = Array.isArray(alerts) ? alerts : [];

  const unread = alerts.filter(a => !a.read).length;

  return new Response(JSON.stringify({
    ok: issues.length === 0,
    checks,
    issues,
    syncErrorCount: syncErrors.length,
    recentSyncErrors: syncErrors.map(e => ({ action: e.action, message: e.error || e.fatal || '', at: e.at })).slice(0, 10),
    alerts,
    unread,
    generatedAt: new Date().toISOString(),
  }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}
