// Returns CJ Dropshipping category tree (flattened to 3rd-level for multi-select).
import { cors, cjFetch } from './_sync-lib.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const r = await cjFetch('/product/getCategory');
    if (r.code !== 200) {
      return res.status(500).json({ error: r.message || 'CJ categories failed', raw: r });
    }

    // Flatten: [{ id, name, path, l1, l2 }] — path is "L1 > L2 > L3" for display.
    const flat = [];
    const grouped = []; // [{ l1Name, subs: [{ l2Name, cats: [{id,name}] }] }]

    for (const l1 of (r.data || [])) {
      const l1Name = l1.categoryFirstName;
      const l1Group = { l1: l1Name, subs: [] };
      for (const l2 of (l1.categoryFirstList || [])) {
        const l2Name = l2.categorySecondName;
        const l2Group = { l2: l2Name, cats: [] };
        for (const l3 of (l2.categorySecondList || [])) {
          const item = {
            id: l3.categoryId,
            name: l3.categoryName,
            path: `${l1Name} › ${l2Name} › ${l3.categoryName}`,
            l1: l1Name,
            l2: l2Name,
          };
          flat.push(item);
          l2Group.cats.push({ id: l3.categoryId, name: l3.categoryName });
        }
        l1Group.subs.push(l2Group);
      }
      grouped.push(l1Group);
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ categories: flat, grouped, total: flat.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
