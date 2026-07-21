// Admin CJ Products + Orders endpoint
import { cors, cjFetch } from './_sync-lib.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Get CJ my products (limited for speed)
    const myProds = await cjFetch('/product/myProduct/query?page=1&size=20');
    
    // Get CJ orders (recent)
    const cjOrders = await cjFetch('/shopping/order/list?page=1&size=20');

    // Get product inventory for the first few products
    let productDetails = [];
    if (myProds.code === 200 && myProds.data?.content) {
      const prods = myProds.data.content.slice(0, 10);
      for (const p of prods) {
        try {
          const detail = await cjFetch(`/product/query?pid=${p.productId}`);
          if (detail.code === 200 && detail.data) {
            productDetails.push({
              id: p.productId,
              name: p.nameEn || detail.data.productNameEn || '',
              sku: p.sku || detail.data.productSku || '',
              image: p.bigImage || detail.data.bigImage || '',
              sellPrice: parseFloat(detail.data.sellPrice || 0),
              variants: (detail.data.variants || []).map(v => ({
                vid: v.vid,
                sku: v.variantSku,
                price: parseFloat(v.variantSellPrice || 0),
                inventory: (v.inventories || []).reduce((s, i) => s + (i.totalInventory || 0), 0),
              })),
            });
          }
        } catch (e) { /* skip individual product failures */ }
      }
    }

    const orders = cjOrders.code === 200 ? (cjOrders.data?.list || []).map(o => ({
      id: o.orderId,
      orderNumber: o.orderNumber,
      status: o.orderStatus,
      total: parseFloat(o.totalPrice || 0),
      created: o.createTime,
      tracking: o.trackingNumber || null,
    })) : [];

    res.status(200).json({
      products: {
        total: myProds.code === 200 ? (myProds.data?.totalRecords || 0) : 0,
        sample: productDetails,
      },
      orders: {
        total: cjOrders.code === 200 ? (cjOrders.data?.total || 0) : 0,
        recent: orders,
      },
      connected: myProds.code === 200,
    });
  } catch (e) {
    res.status(200).json({
      products: { total: 0, sample: [] },
      orders: { total: 0, recent: [] },
      connected: false,
      error: e.message,
    });
  }
}
