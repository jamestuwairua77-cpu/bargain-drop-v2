// Cloudflare Pages Function: /api/cron-sync-cj
// Cron endpoint — syncs CJ prices + stock back to Shopify for cj-import tagged products.

import { corsHeaders, cjFetch, shopifyFetch, appendSyncLog } from '../_sync-lib.js';

const LOCATION_ID = '91452932227';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  const summary = {
    startedAt: new Date().toISOString(),
    triggeredBy: 'manual',
    scanned: 0, priceUpdates: 0, stockUpdates: 0, noChange: 0, errors: [],
  };

  try {
    let sinceId = 0;
    const cjProducts = [];
    for (let pages = 0; pages < 30; pages++) {
      const { body } = await shopifyFetch(env,
        `/products.json?limit=250&since_id=${sinceId}&fields=id,title,tags,variants`
      );
      const prods = body?.products || [];
      if (!prods.length) break;
      for (const p of prods) {
        const tags = String(p.tags || '');
        if (!tags.includes('cj-import')) continue;
        const pidMatch = tags.match(/cj-pid-([^,\s]+)/);
        const pid = pidMatch?.[1];
        if (!pid) continue;
        cjProducts.push({ shopifyId: p.id, pid, title: p.title, variants: p.variants || [] });
      }
      sinceId = prods[prods.length - 1].id;
      if (prods.length < 250) break;
    }
    summary.scanned = cjProducts.length;

    const maxToSync = parseInt(url.searchParams.get('limit') || '200', 10);
    const targets = cjProducts.slice(0, maxToSync);

    for (const item of targets) {
      try {
        const [detailRes, varRes] = await Promise.all([
          cjFetch(env, `/product/query?pid=${encodeURIComponent(item.pid)}`),
          cjFetch(env, `/product/variant/query?pid=${encodeURIComponent(item.pid)}`),
        ]);
        if (detailRes.code !== 200) continue;
        const cjVariants = Array.isArray(varRes.data) ? varRes.data : [];
        const skuMap = new Map();
        for (const v of cjVariants) {
          if (v.variantSku) skuMap.set(v.variantSku, v);
        }

        for (const sv of item.variants) {
          const cjV = skuMap.get(sv.sku);
          if (!cjV) continue;
          const newPrice = ((parseFloat(cjV.variantSellPrice) || 0) * 2.5).toFixed(2);
          const oldPriceStr = String(sv.price);

          if (newPrice !== oldPriceStr && parseFloat(newPrice) > 0) {
            await shopifyFetch(env, `/variants/${sv.id}.json`, {
              method: 'PUT',
              body: JSON.stringify({ variant: { id: sv.id, price: newPrice } }),
            });
            summary.priceUpdates++;
          } else {
            summary.noChange++;
          }
          if (cjV.inventoryNum != null && Number.isFinite(cjV.inventoryNum)) {
            const locId = parseInt(env.SHOPIFY_LOCATION_ID || LOCATION_ID, 10);
            await shopifyFetch(env, '/inventory_levels/set.json', {
              method: 'POST',
              body: JSON.stringify({
                location_id: locId,
                inventory_item_id: sv.inventory_item_id,
                available: cjV.inventoryNum,
              }),
            });
            summary.stockUpdates++;
          }
        }
      } catch (e) {
        summary.errors.push({ pid: item.pid, error: e.message });
      }
      await new Promise(r => setTimeout(r, 200));
    }
  } catch (e) {
    summary.fatal = e.message;
  }

  summary.finishedAt = new Date().toISOString();
  await appendSyncLog(env, { action: 'cron-sync', summary });
  return new Response(JSON.stringify(summary), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
