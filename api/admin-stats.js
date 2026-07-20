// Admin stats aggregator — Shopify + CJ + local product data
import { cors, shopifyFetch, cjFetch, loadJSON } from '../_sync-lib.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const [shop, prodCount, orderCount] = await Promise.all([
      shopifyFetch('/shop.json'),
      shopifyFetch('/products/count.json'),
      shopifyFetch('/orders/count.json?status=any'),
    ]);

    // Try to get recent orders (may fail due to scope)
    let recentOrders = [];
    let totalRevenue = 0;
    try {
      const ord = await shopifyFetch('/orders.json?status=any&limit=50&fields=id,name,total_price,created_at,financial_status,fulfillment_status');
      if (ord.ok && ord.body.orders) {
        recentOrders = ord.body.orders;
        totalRevenue = ord.body.orders.reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
      }
    } catch (e) {
      // Orders endpoint may be restricted — that's OK
    }

    // CJ data — try to get product & order info
    let cjProducts = { total: 0, synced: 0 };
    let cjOrders = { total: 0, pending: 0, shipped: 0 };
    try {
      // Get CJ my products count
      const myProds = await cjFetch('/product/myProduct/query?page=1&size=1');
      if (myProds.code === 200 && myProds.data) {
        cjProducts.total = myProds.data.totalRecords || 0;
      }
      
      // Get CJ orders
      const cjOrd = await cjFetch('/shopping/order/list?page=1&size=50');
      if (cjOrd.code === 200 && cjOrd.data?.list) {
        cjOrders.total = cjOrd.data.total || cjOrd.data.list.length;
        cjOrders.pending = cjOrd.data.list.filter(o => o.orderStatus === 'UNSHIPPED' || o.orderStatus === 'PENDING').length;
        cjOrders.shipped = cjOrd.data.list.filter(o => o.orderStatus === 'SHIPPED').length;
      }
    } catch (e) {
      // CJ may not be configured yet
    }

    // Local tracking data
    const localOrders = loadJSON('/tmp/data/orders.json', []);
    const syncLog = loadJSON('/tmp/data/sync-log.json', []).slice(0, 10);

    res.status(200).json({
      shopify: {
        name: shop?.body?.shop?.name || 'Bargain Drop',
        domain: shop?.body?.shop?.domain || 'shop.bargain-drop.online',
        plan: shop?.body?.shop?.plan_name || 'basic',
        currency: shop?.body?.shop?.currency || 'AUD',
        product_count: prodCount?.body?.count || 0,
        order_count: orderCount?.body?.count || 0,
        recent_orders: recentOrders.slice(0, 10),
        total_revenue: Math.round(totalRevenue * 100) / 100,
      },
      cj: cjProducts.total > 0 ? {
        products: cjProducts,
        orders: cjOrders,
      } : null,
      local: {
        synced_orders: localOrders.length,
        recent_syncs: syncLog,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
