// Cloudflare Pages Function: /api/sync-full
// GET ?action=status | sync — Pulls all Shopify products, writes JSON to GitHub

import { corsHeaders, shopifyFetch, ghRead, ghWrite } from '../_sync-lib.js';

function getImages(prod) {
  const out = [];
  if (prod.image && prod.image.src) out.push(prod.image.src);
  else if (typeof prod.image === 'string') out.push(prod.image);
  if (Array.isArray(prod.images)) {
    for (const img of prod.images) {
      if (img.src && !out.includes(img.src)) out.push(img.src);
      else if (typeof img === 'string' && !out.includes(img)) out.push(img);
    }
  }
  return out;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'status';

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }

  const TOKEN = env.SHOPIFY_ACCESS_TOKEN || env.SHOPIFY_TOKEN || '';
  if (!TOKEN) {
    return new Response(JSON.stringify({ ok: false, error: 'Shopify token not configured' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  if (action === 'status') {
    try {
      const r = await shopifyFetch(env, '/products/count.json');
      return new Response(JSON.stringify({ ok: true, count: r.body.count }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: e.message }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
  }

  if (action !== 'sync') {
    return new Response(JSON.stringify({ error: 'Add ?action=status || sync' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const GHTOKEN = env.GITHUB_TOKEN || '';
  if (!GHTOKEN) {
    return new Response(JSON.stringify({ ok: false, error: 'GITHUB_TOKEN not set' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const start = Date.now();
  try {
    let prods = [], since_id = 0;
    while (true) {
      const r = await shopifyFetch(env, `/products.json?limit=250&fields=id,title,body_html,vendor,product_type,tags,variants,images,image,status&since_id=${since_id}`);
      if (!r.ok) break;
      const batch = (r.body.products || []).filter(p => p.status === 'active' && p.title);
      if (batch.length === 0) break;
      prods.push(...batch);
      since_id = batch[batch.length - 1].id;
      if (batch.length < 250) break;
      await new Promise(r => setTimeout(r, 500));
    }

    if (!prods.length) return new Response(JSON.stringify({ ok: false, error: 'No active products' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });

    const cats = {}, idx = {}, all = [];
    for (const p of prods) {
      const imgs = getImages(p);
      const price = Number(p.variants?.[0]?.price || 0);
      const comp = Number(p.variants?.[0]?.compare_at_price || 0);
      const vars = (p.variants || []).map(v => ({
        option1: v.option1, option2: v.option2, option3: v.option3,
        price: Number(v.price || 0), sku: v.sku,
        available: v.inventory_quantity > 0,
      }));
      all.push({
        id: String(p.id), title: p.title, price,
        compare_at_price: comp > price ? comp : undefined,
        image: imgs[0] || null, images: imgs,
        body_html: p.body_html || '', vendor: p.vendor,
        product_type: p.product_type, tags: p.tags,
        variants: vars,
      });
      const ptype = p.product_type || 'other';
      const key = ptype.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-').replace(/[\"',]/g, '');
      if (!cats[key]) cats[key] = { name: ptype, products: [] };
      cats[key].products.push({
        id: String(p.id), title: p.title, price,
        image: imgs[0] || null,
        body_html: p.body_html || '',
        vendor: p.vendor,
        product_type: p.product_type,
        variants: vars.length, images: imgs.length,
      });
      idx[String(p.id)] = { idx: cats[key].products.length - 1, category: key };
    }

    const withDesc = all.filter(p => p.body_html && p.body_html.length > 20).length;
    const withImg = all.filter(p => p.image).length;

    const files = [
      { path: 'categories-data.json', data: JSON.stringify(cats, null, 2), msg: 'data: rebuild from Shopify full sync' },
      { path: 'all-products.json', data: JSON.stringify(all, null, 2), msg: 'data: rebuild from Shopify full sync' },
      { path: 'products-index.json', data: JSON.stringify(idx, null, 2), msg: 'data: rebuild from Shopify full sync' },
    ];

    let written = 0, err = [];
    for (const f of files) {
      try {
        const e = await ghRead(env, f.path);
        await ghWrite(env, f.path, f.data, f.msg, e?.sha);
        written++;
        await new Promise(r => setTimeout(r, 1500));
      } catch (e) { err.push({ file: f.path, error: e.message }); }
    }

    const sec = ((Date.now() - start) / 1000).toFixed(1);
    return new Response(JSON.stringify({
      ok: true, shopify_total: prods.length, unique: all.length,
      with_descriptions: withDesc, with_images: withImg,
      categories: Object.keys(cats).length,
      files_written: written,
      errors: err.length ? err : undefined,
      elapsed_sec: sec,
      note: 'JSON data files rebuilt with descriptions.',
    }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
