// Cloudflare Pages Function: /api/product-sync-webhook
// Handles Shopify webhooks for products/create, products/update, products/delete.
// Rebuilds all-products.json, categories-data.json, categories-index.json.

import { corsHeaders, shopifyFetch, ghRead, ghWrite, verifyHmac } from '../_sync-lib.js';

function getImages(prod) {
  // Return [{id,src}] so we can resolve variant.image_id -> image index.
  const out = [];
  const push = (id, src) => { if (src && !out.some(x => x.src === src)) out.push({ id, src }); };
  if (prod.image && prod.image.src) push(prod.image.id, prod.image.src);
  else if (typeof prod.image === 'string') push(null, prod.image);
  if (Array.isArray(prod.images)) {
    for (const img of prod.images) {
      if (img && img.src) push(img.id, img.src);
      else if (typeof img === 'string') push(null, img);
    }
  }
  return out;
}

async function rebuildAllProducts(env) {
  let prods = [], since_id = 0;
  while (true) {
    const { body: shopBody } = await shopifyFetch(env,
      '/products.json?limit=250&fields=id,title,body_html,vendor,product_type,tags,variants,images,image,status&since_id=' + since_id
    );
    const batch = (shopBody.products || []).filter(p => p.status === 'active' && p.title);
    if (batch.length === 0) break;
    prods.push(...batch);
    since_id = batch[batch.length - 1].id;
    if (batch.length < 250) break;
    await new Promise(r => setTimeout(r, 500));
  }
  if (!prods.length) throw new Error('No active products');

  const cats = {}, all = [], idx = {};
  for (const p of prods) {
    const imgs = getImages(p);
    const imgIndexOf = new Map();
    imgs.forEach((im, i) => { if (im.id != null) imgIndexOf.set(im.id, i); });
    const srcs = imgs.map(im => im.src);
    const price = Number(p.variants?.[0]?.price || 0);
    const comp = Number(p.variants?.[0]?.compare_at_price || 0);
    const vars = (p.variants || []).map(v => ({
      option1: v.option1, option2: v.option2, option3: v.option3,
      price: Number(v.price || 0), sku: v.sku,
      available: v.inventory_quantity > 0,
      image_id: v.image_id != null && imgIndexOf.has(v.image_id) ? imgIndexOf.get(v.image_id) : null,
    }));
    all.push({
      id: String(p.id), title: p.title, price,
      compare_at_price: comp > price ? comp : undefined,
      image: srcs[0] || null, images: srcs,
      body_html: p.body_html || '', vendor: p.vendor,
      product_type: p.product_type, tags: p.tags,
      variants: vars,
    });
    const ptype = p.product_type || 'other';
    const key = ptype.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-').replace(/[\"',]/g, '');
    if (!cats[key]) cats[key] = { name: ptype, products: [] };
    cats[key].products.push({
      id: String(p.id), title: p.title, price,
      image: srcs[0] || null, body_html: p.body_html || '',
      vendor: p.vendor, product_type: p.product_type,
      variants: vars.length, images: imgs.length,
    });
    idx[String(p.id)] = { idx: cats[key].products.length - 1, category: key };
  }

  const files = [
    { path: 'all-products.json', data: JSON.stringify(all, null, 2), msg: 'auto: rebuild from product webhook' },
    { path: 'categories-data.json', data: JSON.stringify(cats, null, 2), msg: 'auto: rebuild from product webhook' },
    { path: 'categories-index.json', data: JSON.stringify(idx, null, 2), msg: 'auto: rebuild from product webhook' },
  ];

  const results = [];
  for (const f of files) {
    // ghWrite routes >900KB to ghWriteLarge (atomic fresh-ref commit); no stale sha -> no 409.
    const r = await ghWrite(env, f.path, f.data, f.msg);
    results.push({ file: f.path, sha: r?.commit?.sha || r?.content?.sha || r?.sha });
  }

  return {
    total_products: all.length,
    with_descriptions: all.filter(p => p.body_html && p.body_html.length > 20).length,
    categories: Object.keys(cats).length,
    files: results,
  };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  const raw = new Uint8Array(await request.arrayBuffer());
  const hmac = request.headers.get('x-shopify-hmac-sha256');
  const topic = request.headers.get('x-shopify-topic') || 'unknown';
  const secret = env.SHOPIFY_WEBHOOK_SECRET || '';

  const verified = await verifyHmac(raw, hmac, secret);
  if (!verified) {
    return new Response(JSON.stringify({ error: 'Invalid HMAC' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const decoder = new TextDecoder();
  let payload;
  try { payload = JSON.parse(decoder.decode(raw)); } catch {
    return new Response(JSON.stringify({ error: 'Bad JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  if (topic === 'products/create' || topic === 'products/update' || topic === 'products/delete') {
    try {
      const result = await rebuildAllProducts(env);
      return new Response(JSON.stringify({
        success: true, event: topic,
        product_title: payload.title, product_id: payload.id,
        ...result,
      }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
  }

  return new Response(JSON.stringify({ success: true, ignored: topic }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
