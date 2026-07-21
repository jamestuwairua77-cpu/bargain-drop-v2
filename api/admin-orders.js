// Admin Shopify orders endpoint — handles the protected-data scope issue
import { cors, shopifyFetch } from './_sync-lib.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { limit = 50, status = 'any' } = req.query;

  try {
    // Try full orders endpoint first
    const result = await shopifyFetch(`/orders.json?status=${status}&limit=${limit}&fields=id,name,total_price,created_at,financial_status,fulfillment_status,order_number,customer`);
    
    if (result.ok) {
      const orders = (result.body.orders || []).map(o => ({
        id: o.id,
        name: o.name,
        order_number: o.order_number,
        total: parseFloat(o.total_price || 0),
        created_at: o.created_at,
        financial_status: o.financial_status,
        fulfillment_status: o.fulfillment_status,
        customer_name: o.customer ? `${o.customer.first_name || ''} ${o.customer.last_name || ''}`.trim() : 'Guest',
      }));
      return res.status(200).json({ orders, count: orders.length, access: 'full' });
    }

    // Fallback — try count only
    const countResult = await shopifyFetch(`/orders/count.json?status=${status}`);
    return res.status(200).json({
      orders: [],
      count: countResult?.body?.count || 0,
      access: 'count_only',
      note: 'Full order details unavailable — review Shopify Admin API scopes in your private app settings.',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
