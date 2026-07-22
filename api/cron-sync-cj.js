// Vercel Cron endpoint — runs every 12 hours.
// Scans Shopify for products tagged `cj-import`, fetches the latest CJ prices
// and stock for each variant, and syncs the deltas back to Shopify.
import { cors, cjFetch, shopifyFetch, appendSyncLog } from './_sync-lib.js';

export const config = { maxDuration: 300 };

const LOCATION_ID = process.env.SHOPIFY_LOCATION_ID || '91452932227';

export default async function handler(req, res) {
  cors(res);
  // Vercel cron sends a specific header — but allow manual trigger too.
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const isAuthorized = isVercelCron || (req.query?.key && req.query.key === process.env.CRON_SECRET);

  const summary = {
    startedAt: new Date().toISOString(),
    triggeredBy: isVercelCron ? 'vercel-cron' : 'manual',
    scanned: 0,
    priceUpdates: 0,
    stockUpdates: 0,
    noChange: 0,
    errors: [],
  };

  try {
    // ── 1. Enumerate Shopify products tagged `cj-import` ────────────────
    let sinceId = 0;
    const cjProducts = [];
    for (let pages = 0; pages < 30; pages++) {
      const { body } = await shopifyFetch(
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

    // Optional limit for a partial sync
    const maxToSync = parseInt(req.query?.limit || '200', 10);
    const targets = cjProducts.slice(0, maxToSync);

    // ── 2. For each CJ-tagged product, refresh from CJ ──────────────────
    for (const item of targets) {
      try {
        const [detailRes, varRes] = await Promise.all([
          cjFetch(`/product/query?pid=${encodeURIComponent(item.pid)}`),
          cjFetch(`/product/variant/query?pid=${encodeURIComponent(item.pid)}`),
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
          const newPrice = (parseFloat(cjV.variantSellPrice) || 0) * 2.5; // same markup as import
          const newPriceStr = newPrice.toFixed(2);
          const oldPriceStr = String(sv.price);

          if (newPriceStr !== oldPriceStr && newPrice > 0) {
            await shopifyFetch(`/variants/${sv.id}.json`, {
              method: 'PUT',
              body: JSON.stringify({
                variant: { id: sv.id, price: newPriceStr },
              }),
            });
            summary.priceUpdates++;
          } else {
            summary.noChange++;
          }
          // Stock: if CJ variant has explicit inventoryNum, honour it
          if (cjV.inventoryNum != null && Number.isFinite(cjV.inventoryNum)) {
            await shopifyFetch('/inventory_levels/set.json', {
              method: 'POST',
              body: JSON.stringify({
                location_id: parseInt(LOCATION_ID, 10),
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
      // polite pause
      await new Promise(r => setTimeout(r, 200));
    }
  } catch (e) {
    summary.fatal = e.message;
  }

  summary.finishedAt = new Date().toISOString();
  appendSyncLog({ action: 'cron-sync', summary });
  res.status(200).json(summary);
}
