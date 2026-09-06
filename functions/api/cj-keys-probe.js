import { corsHeaders, cjKeys } from '../_sync-lib.js';

async function keyTokenRaw(apiKey) {
  const r = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  });
  const j = await r.json();
  const tok = j?.data?.accessToken;
  if (!tok) return null;
  const openId = j?.data?.openId != null ? String(j.data.openId) : null;
  return { tok, openId };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  const pin = request.headers.get('X-Admin-Pin') || new URL(request.url).searchParams.get('pin');
  if (pin !== (env.ADMIN_PIN || '03091996')) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }
  const keys = cjKeys(env);
  const results = [];
  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    const prefix = apiKey.slice(0, 12);
    try {
      const auth = await keyTokenRaw(apiKey);
      if (!auth) {
        results.push({ idx: i, prefix, ok: false, error: 'no access token' });
        continue;
      }
      // A cheap points-revealing call: resolve a known SKU (product not found still returns pointsInfo)
      const r = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/query?variantSku=CJFU29407340001', {
        headers: { 'CJ-Access-Token': auth.tok, 'Content-Type': 'application/json' },
      });
      const body = await r.json();
      results.push({
        idx: i,
        prefix,
        openId: auth.openId ? auth.openId.slice(0, 6) + '...' : null,
        code: body?.code,
        success: body?.success,
        pointsInfo: body?.pointsInfo || null,
        message: body?.message || null,
        hasCategory: !!(body?.data && body?.data?.categoryName),
        pid: body?.data?.pid || null,
      });
    } catch (e) {
      results.push({ idx: i, prefix, ok: false, error: e.message });
    }
    // Respect 1 req/sec QPS across keys (shared IP)
    if (i < keys.length - 1) await new Promise(r => setTimeout(r, 1200));
  }
  return new Response(JSON.stringify({ keys: keys.length, results }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}
