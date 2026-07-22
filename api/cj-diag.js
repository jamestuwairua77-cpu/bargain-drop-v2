// Diagnostic endpoint — test CJ API v2 endpoints directly
import { cors, cjFetch } from './_sync-lib.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const results = {};
  const pid = req.query?.pid || '2507060149501619600';

  // 1. Categories
  try {
    const r = await cjFetch('/product/getCategory');
    results.categories = { code: r.code, count: Array.isArray(r.data) ? r.data.length : 0 };
  } catch (e) { results.categories = { error: e.message }; }

  // 2. Product details
  try {
    const r = await cjFetch(`/product/query?pid=${pid}`);
    results.details = {
      code: r.code,
      dataKeys: r.data ? Object.keys(r.data) : [],
      product: r.data,
    };
  } catch (e) { results.details = { error: e.message }; }

  // 3. Product variants
  try {
    const r = await cjFetch(`/product/variant/query?pid=${pid}`);
    results.variants = {
      code: r.code,
      count: Array.isArray(r.data) ? r.data.length : 0,
      keys: Array.isArray(r.data) && r.data[0] ? Object.keys(r.data[0]) : [],
      sample: Array.isArray(r.data) ? r.data[0] : null,
      raw: !Array.isArray(r.data) ? r : undefined,
    };
  } catch (e) { results.variants = { error: e.message }; }

  // 4. Inventory
  try {
    const r = await cjFetch(`/product/stock/queryByPid?pid=${pid}`);
    results.inventory = { code: r.code, data: r.data };
  } catch (e) { results.inventory = { error: e.message }; }

  res.status(200).json(results);
}
