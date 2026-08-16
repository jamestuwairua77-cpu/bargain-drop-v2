// Cloudflare Pages Function: /api/sync-full
// GET ?action=status | sync — Pulls all Shopify products, writes JSON to GitHub

import { corsHeaders, shopifyFetch, ghRead, ghWrite } from '../_sync-lib.js';

function getImages(prod) {
  // Return list of {id, src} so we can resolve variant.image_id -> index.
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

// ── Normalize CJK variant option values (CJ Dropshipping ships Chinese titles/colours) ──
const CN_COLOR_MAP = [
  ['黑色','Black'],['白色','White'],['红色','Red'],['蓝色','Blue'],
  ['绿色','Green'],['粉色','Pink'],['粉红','Pink'],['紫色','Purple'],
  ['黄色','Yellow'],['灰色','Grey'],['橙色','Orange'],['棕色','Brown'],
  ['米色','Beige'],['藏青色','Navy'],['藏青','Navy'],['金色','Gold'],
  ['银色','Silver'],['卡其','Khaki'],['酒红','Wine'],['酒红色','Wine'],
  ['杏色','Apricot'],['深蓝','Navy'],['浅蓝','Light Blue'],['玫红','Rose'],
  ['天蓝','Sky Blue'],['肤色','Skin'],['裸色','Nude'],['黑白','Black'],
];
const COLOR_PALETTE = ['Black','White','Blue','Red','Green','Pink','Grey','Khaki','Brown','Purple','Beige','Navy','Gold','Silver','Rose','Wine','Apricot','Orange'];
const TITLE_COLORS = ['Black','White','Red','Blue','Green','Pink','Purple','Yellow','Grey','Gray','Orange','Brown','Beige','Navy','Gold','Silver','Khaki','Rose','Wine','Apricot','Olive','Copper','Emerald','Teal','Maroon','Tan','Cream','Ivory','Champagne','Skin','Nude','Leopard'];

function hasCJK(s){ return /[\u4e00-\u9fff]/.test(s || ''); }
function cnToEn(s){ for (const [cn,en] of CN_COLOR_MAP) if ((s||'').includes(cn)) return en; return null; }
function seedFromId(s){ let h=0; const str=String(s); for (let i=0;i<str.length;i++){ const ch=str.charCodeAt(i); h=((h<<5)-h)+ch; h|=0; } return Math.abs(h); }
function titleColor(title){ if(!title) return null; for (const c of TITLE_COLORS){ if (new RegExp('\\b'+c+'\\b','i').test(title)) return c; } return null; }
function buildPalette(seed){ const n=2+(seed%3); const out=[]; const used=new Set(); let s=seed; while(out.length<n){ s=(Math.imul(s,1103515245)+12345)&0x7FFFFFFF; const col=COLOR_PALETTE[s%COLOR_PALETTE.length]; if(!used.has(col)){ used.add(col); out.push(col); } } return out; }

function normalizeVariantOption(raw, productId, title, allRawOptions) {
  if (!hasCJK(raw)) return (raw == null ? '' : raw);
  const en = cnToEn(raw);
  if (en) return en;
  // CJK title-garbage → deterministic colour (or title colour for single-option items)
  const tcol = titleColor(title);
  if (tcol) return tcol;
  const seed = seedFromId(productId);
  const pal = buildPalette(seed);
  return pal[0];
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
      const imgIndexOf = new Map(); // shopify image id -> index in imgs
      imgs.forEach((im, i) => { if (im.id != null) imgIndexOf.set(im.id, i); });
      const srcs = imgs.map(im => im.src); // catalog stores images as URL strings
      const price = Number(p.variants?.[0]?.price || 0);
      const comp = Number(p.variants?.[0]?.compare_at_price || 0);
      const allOpt1 = (p.variants || []).map(v => v.option1 || '');
      const vars = (p.variants || []).map(v => ({
        option1: normalizeVariantOption(v.option1, p.id, p.title, allOpt1),
        option2: normalizeVariantOption(v.option2, p.id, p.title, allOpt1),
        option3: v.option3,
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
        image: srcs[0] || null,
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
