import { corsHeaders, shopifyFetch, ghRead, ghWrite } from '../_sync-lib.js';
export async function onRequest(context) {
  const { request, env } = context; const url = new URL(request.url); const action = url.searchParams.get('action') || 'status';
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  const TK = env.SHOPIFY_ACCESS_TOKEN || env.SHOPIFY_TOKEN || ''; const GHTOKEN = env.GITHUB_TOKEN || '';
  if (!TK || !GHTOKEN) return new Response(JSON.stringify({ ok: false, error: 'Missing env variables' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  if (action === 'status') {
    try { const { body } = await shopifyFetch(env, '/products/count.json'); return new Response(JSON.stringify({ ok: true, count: body.count }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
    catch (e) { return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
  }
  if (action !== 'sync') return new Response(JSON.stringify({ error: 'Use ?action=status|sync' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  const start = Date.now();
  try {
    let prods = [], since_id = 0;
    while (true) {
      const { body: d } = await shopifyFetch(env, '/products.json?limit=250&fields=id,title,body_html,vendor,product_type,tags,variants,images,image,status&since_id='+since_id);
      const batch = (d.products || []).filter(p => p.status === 'active' && p.title);
      if (batch.length === 0) break; prods.push(...batch); since_id = batch[batch.length - 1].id;
      if (batch.length < 250) break; await new Promise(r => setTimeout(r, 500));
    }
    const cats={}, all=[], idx={};
    for (const p of prods) {
      const imgs=[]; if (p.image?.src) imgs.push(p.image.src);
      if (Array.isArray(p.images)) for (const i of p.images) if (i.src && !imgs.includes(i.src)) imgs.push(i.src);
      const price = Number(p.variants?.[0]?.price || 0); const comp = Number(p.variants?.[0]?.compare_at_price || 0);
      const vars = (p.variants || []).map(v => ({ option1: v.option1, option2: v.option2, option3: v.option3, price: Number(v.price || 0), sku: v.sku, available: (v.inventory_quantity || 0) > 0 }));
      all.push({ id: String(p.id), title: p.title, price, compare_at_price: comp > price ? comp : undefined, image: imgs[0] || null, images: imgs, body_html: p.body_html || '', vendor: p.vendor, product_type: p.product_type, tags: p.tags, variants: vars });
      const ptype = p.product_type || 'other'; const key = ptype.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-').replace(/["',]/g, '');
      if (!cats[key]) cats[key] = { name: ptype, products: [] };
      cats[key].products.push({ id: String(p.id), title: p.title, price, image: imgs[0] || null, body_html: p.body_html || '', vendor: p.vendor, product_type: p.product_type, variants: vars.length, images: imgs.length });
      idx[String(p.id)] = { idx: cats[key].products.length - 1, category: key };
    }
    async function putFile(path, content, cmsg) { let sha = null; const existing = await ghRead(env, path); if (existing) sha = existing.sha; return ghWrite(env, path, content, cmsg, sha); }
    let errors=[], written=0;
    for (const [path, data, name] of [['categories-data.json', JSON.stringify(cats), 'categories'], ['all-products.json', JSON.stringify(all), 'all-products'], ['products-index.json', JSON.stringify(idx), 'index']]) {
      try { await putFile(path, data, 'data: rebuild '+name+' from Shopify'); written++; } catch (e) { errors.push({ file: path, error: e.message }); }
    }
    const desc = all.filter(p => p.body_html && p.body_html.length > 20).length;
    return new Response(JSON.stringify({ ok: true, products: all.length, categories: Object.keys(cats).length, with_descriptions: desc, files_written: written, errors: errors.length ? errors : undefined, elapsed_sec: ((Date.now() - start) / 1000).toFixed(1) }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  } catch (e) { return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }); }
}