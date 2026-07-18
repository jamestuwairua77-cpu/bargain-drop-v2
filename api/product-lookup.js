// Product lookup API — fetches product by ID
// GET /api/product-lookup?id=9115605336195
// Loads data from GitHub (always fresh) with fast in-memory cache

let cachedData = null;
let cachedIndex = null;
let cachedAll = null; // fallback: all-products.json; also used to merge proper images arrays
let cacheTime = 0;

async function loadData() {
  const now = Date.now();
  if (cachedData && cachedIndex && (now - cacheTime) < 120000) {
    return { data: cachedData, index: cachedIndex, all: cachedAll };
  }

  const BASE = 'https://raw.githubusercontent.com/jamestuwairua77-cpu/bargain-drop-v2/main';

  try {
    const [dataResp, idxResp, allResp] = await Promise.all([
      fetch(`${BASE}/categories-data.json`, {
        headers: { 'Accept-Encoding': 'br', 'Cache-Control': 'no-cache' }
      }),
      fetch(`${BASE}/products-index.json`, {
        headers: { 'Accept-Encoding': 'br', 'Cache-Control': 'no-cache' }
      }),
      fetch(`${BASE}/all-products.json`, {
        headers: { 'Accept-Encoding': 'br', 'Cache-Control': 'no-cache' }
      })
    ]);

    if (!dataResp.ok || !idxResp.ok) {
      throw new Error(`GitHub fetch failed: ${dataResp.status}/${idxResp.status}`);
    }

    cachedData = await dataResp.json();
    cachedIndex = await idxResp.json();
    if (allResp.ok) cachedAll = await allResp.json();
    cacheTime = now;
  } catch (e) {
    console.error('Failed to load data:', e.message);
    // Fallback to deployment's own files
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://bargain-drop.online';
    try {
      const [dataResp2, idxResp2, allResp2] = await Promise.all([
        fetch(`${base}/categories-data.json`, { headers: { 'Accept-Encoding': 'br' } }),
        fetch(`${base}/products-index.json`, { headers: { 'Accept-Encoding': 'br' } }),
        fetch(`${base}/all-products.json`, { headers: { 'Accept-Encoding': 'br' } })
      ]);
      cachedData = await dataResp2.json();
      cachedIndex = await idxResp2.json();
      if (allResp2.ok) cachedAll = await allResp2.json();
    } catch (e2) {
      console.error('Fallback also failed:', e2.message);
    }
  }

  return { data: cachedData, index: cachedIndex, all: cachedAll };
}

// Build a lookup map from all-products for fast images array merging
let allMap = null;
function getAllMap() {
  if (allMap && cachedAll) return allMap;
  if (!cachedAll || !Array.isArray(cachedAll)) return null;
  allMap = {};
  for (const p of cachedAll) {
    if (p.id) allMap[String(p.id)] = p;
  }
  return allMap;
}

// Enrich a product with proper images array from all-products.json
function enrichProduct(product) {
  if (!allMap) return product;
  const full = allMap[String(product.id)];
  if (!full) return product;
  // Merge in the proper images array from all-products.json
  if (Array.isArray(full.images) && full.images.length > 0) {
    product.images = full.images;
    // Also ensure primary image is set
    if (!product.image && full.images.length > 0) {
      product.image = full.images[0];
    }
  }
  if (!product.image && full.image && full.image.trim()) {
    product.image = full.image;
  }
  return product;
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing product id' });
  }

  try {
    const { data, index, all } = await loadData();
    getAllMap(); // ensure lookup map is built

    if (!data || !index) {
      return res.status(503).json({ error: 'Data not yet available' });
    }

    // Try index lookup first
    const entry = index[String(id)];
    if (entry) {
      const idx = entry.idx !== undefined ? entry.idx : entry.index;
      const catData = data[entry.category];
      if (catData && idx !== undefined) {
        const products = Array.isArray(catData) ? catData : (catData.products || []);
        const product = products[idx];
        if (product && String(product.id) === String(id)) {
          if (Array.isArray(product.tags)) product.tags = product.tags.join(',');
          return res.status(200).json({ product: enrichProduct(product), category: entry.category });
        }
      }
    }

    // Fallback 1: linear search in categories-data
    for (const [catName, catData] of Object.entries(data)) {
      const products = Array.isArray(catData) ? catData : (catData.products || []);
      const product = products.find(p => String(p.id) === String(id));
      if (product) {
        if (Array.isArray(product.tags)) product.tags = product.tags.join(',');
        return res.status(200).json({ product: enrichProduct(product), category: catName });
      }
    }

    // Fallback 2: search in all-products.json (full product list with proper images)
    if (all && Array.isArray(all)) {
      const product = all.find(p => String(p.id) === String(id));
      if (product) {
        if (Array.isArray(product.tags)) product.tags = product.tags.join(',');
        const category = product.product_type || product.category || (typeof product.tags === 'string' ? product.tags : '');
        return res.status(200).json({ product, category });
      }
    }

    // Fallback: try fetching from the category data files on GitHub
    const CATS = ['basic-jacket','man-jeans','man-shorts','man-sandals','mens-jackets',
      'mens-long-sleeved','mens-shirts','mens-sweaters'];
    for (const c of CATS) {
      try {
        const r = await fetch(`https://raw.githubusercontent.com/jamestuwairua77-cpu/bargain-drop-v2/main/data/${c}.json`);
        if (!r.ok) continue;
        const cd = await r.json();
        const p2 = (Array.isArray(cd)?cd:cd.products||[]).find(p => String(p.id)===String(id));
        if (p2) {
          if (Array.isArray(p2.tags)) p2.tags = p2.tags.join(',');
          const ct = p2.product_type || p2.category || c;
          return res.status(200).json({ product: p2, category: ct });
        }
      } catch(e) { continue; }
    }
    return res.status(404).json({ error: 'Product not found' });
    }

    // Final fallback: try CJ Dropshipping API for this product
    try {
      const CJ_KEY = process.env.CJ_ACCESS_TOKEN || '';
      if (CJ_KEY) {
        const cjAuth = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: CJ_KEY }),
        }).then(r => r.json());
        const cjToken = cjAuth?.data?.accessToken;
        if (cjToken) {
          const cjProd = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/${encodeURIComponent(id)}`, {
            headers: { 'CJ-Access-Token': cjToken },
          }).then(r => r.json());
          if (cjProd?.data) {
            const p = cjProd.data;
            const product = {
              id: String(id),
              title: p.productNameEn || p.productName || '',
              price: Number(p.sellPrice || p.variants?.[0]?.sellPrice || 0),
              image: p.mainImage || p.images?.[0] || '',
              images: p.images || [],
              body_html: p.description || p.brief || '',
              vendor: 'CJ Dropshipping',
              product_type: p.categoryName || '',
            };
            return res.status(200).json({ product, category: product.product_type });
          }
        }
      }
    } catch(e) {
      // CJ fallback failed, continue to 404
    }

    return res.status(404).json({ error: 'Product not found' });
  } catch (e) {
    return res.status(500).json({ error: 'Internal error', message: e.message });
  }
}
