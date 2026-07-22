// Search CJ products by category IDs, then filter out products whose SKUs
// already exist in Shopify. Returns the first `limit` unique candidates ready to import.
import { cors, cjFetch, shopifyFetch } from './_sync-lib.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.method === 'POST' ? (req.body || {}) : req.query;
    const categoryIds = Array.isArray(body.categoryIds)
      ? body.categoryIds
      : (body.categoryIds ? String(body.categoryIds).split(',') : []);
    const limit = Math.max(1, Math.min(500, parseInt(body.limit || '20', 10)));

    if (!categoryIds.length) {
      return res.status(400).json({ error: 'categoryIds required (array or CSV)' });
    }

    // ── Step 1: build Shopify SKU set (pre-scan) ───────────────────────
    const shopifySkus = new Set();
    let sinceId = 0;
    let pages = 0;
    while (pages < 30) {
      const { body: pbody } = await shopifyFetch(
        `/products.json?limit=250&fields=id,variants&since_id=${sinceId}`
      );
      const prods = pbody?.products || [];
      if (!prods.length) break;
      for (const p of prods) {
        for (const v of (p.variants || [])) {
          if (v.sku) shopifySkus.add(String(v.sku).trim());
        }
      }
      sinceId = prods[prods.length - 1].id;
      pages++;
      if (prods.length < 250) break;
    }

    // ── Step 2: pull candidates from CJ across selected categories ─────
    const candidates = [];
    const seenPids = new Set();
    let cjPagesFetched = 0;

    // Round-robin across categories so results are balanced
    outer: for (let page = 1; page <= 20; page++) {
      let allEmpty = true;
      for (const catId of categoryIds) {
        if (candidates.length >= limit * 3) break outer; // over-fetch buffer
        const r = await cjFetch(
          `/product/listV2?page=${page}&size=50&categoryId=${encodeURIComponent(catId)}`
        );
        cjPagesFetched++;
        if (r.code !== 200) continue;
        // Response is data.content[0].productList
        const content = r.data?.content || [];
        const list = content[0]?.productList || [];
        if (!list.length) continue;
        allEmpty = false;
        for (const it of list) {
          if (!it.id || seenPids.has(it.id)) continue;
          seenPids.add(it.id);
          const sku = String(it.sku || '').trim();
          const alreadyInShopify = sku && shopifySkus.has(sku);
          candidates.push({
            pid: it.id,
            title: it.nameEn,
            sku,
            image: it.bigImage,
            price: parseFloat(it.sellPrice) || 0,
            categoryId: it.categoryId,
            alreadyInShopify,
            listedByOthers: it.listedNum || 0,
          });
        }
      }
      if (allEmpty) break;
    }

    // ── Step 3: filter and slice to requested limit ────────────────────
    const fresh = candidates.filter(c => !c.alreadyInShopify).slice(0, limit);
    const skipped = candidates.filter(c => c.alreadyInShopify).length;

    res.status(200).json({
      shopifySkuCount: shopifySkus.size,
      cjCandidatesScanned: candidates.length,
      cjPagesFetched,
      duplicatesSkipped: skipped,
      readyToImport: fresh.length,
      products: fresh,
    });
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
}
