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

// ── mapCategory(productType) ──
// Maps CJ's full category path (e.g. "Men's Clothing > Bottoms > Man Jeans",
// sometimes "/"- or "-"-delimited, e.g. "bags-shoes-/-womens-shoes-/-flats")
// to the canonical top-level site category slug. Falls back to 'other'.
const CANONICAL_CATEGORIES = [
  'womens-clothing', 'mens-clothing', 'bags-shoes', 'jewelry-watches',
  'home-garden-furniture', 'consumer-electronics', 'sports-outdoors',
  'health-beauty-hair', 'phones-accessories', 'pet-supplies',
  'toys-kids-babies', 'home-improvement', 'automobiles-motorcycles', 'computer-office',
];
// keyword → canonical slug (order matters: most specific first)
const CATEGORY_KEYWORDS = [
  // Jewelry & Watches
  ['jewelry', 'jewelry-watches'], ['necklace', 'jewelry-watches'], ['bracelet', 'jewelry-watches'],
  ['earrings', 'jewelry-watches'], ['ring', 'jewelry-watches'], ['keychain', 'jewelry-watches'],
  ['watch', 'jewelry-watches'], ['925-silver', 'jewelry-watches'],
  // Bags & Shoes
  ['bags', 'bags-shoes'], ['bag', 'bags-shoes'], ['totes', 'bags-shoes'], ['backpack', 'bags-shoes'],
  ['handbag', 'bags-shoes'], ['crossbody', 'bags-shoes'], ['luggage', 'bags-shoes'], ['wallet', 'bags-shoes'],
  ['shoes', 'bags-shoes'], ['boots', 'bags-shoes'], ['slippers', 'bags-shoes'], ['sandals', 'bags-shoes'],
  ['heels', 'bags-shoes'], ['flats', 'bags-shoes'], ['pumps', 'bags-shoes'], ['sneakers', 'bags-shoes'],
  ['loafers', 'bags-shoes'],
  // Women's Clothing
  ['womens-clothing', 'womens-clothing'], ['woman-clothing', 'womens-clothing'],
  ['lady-dresses', 'womens-clothing'], ['dresses', 'womens-clothing'], ['blazers', 'womens-clothing'],
  ['skirts', 'womens-clothing'], ['blouses', 'womens-clothing'], ['jumpsuits', 'womens-clothing'],
  ['wide-leg-pants', 'womens-clothing'], ['pants-capris', 'womens-clothing'], ['sweaters', 'womens-clothing'],
  ['woman-jeans', 'womens-clothing'], ['woman-trench', 'womens-clothing'], ['bras', 'womens-clothing'],
  ['bikini', 'womens-clothing'], ['suits-sets', 'womens-clothing'], ['rompers', 'womens-clothing'],
  ['leggings', 'womens-clothing'],
  // Men's Clothing
  ['mens-clothing', 'mens-clothing'], ['man-jeans', 'mens-clothing'], ['mens-shirts', 'mens-clothing'],
  ['man-hoodies', 'mens-clothing'], ['mens-jackets', 'mens-clothing'], ['man-trench', 'mens-clothing'],
  ['man-shorts', 'mens-clothing'], ['casual-pants', 'mens-clothing'], ['cargo-pants', 'mens-clothing'],
  ['mens-shoes', 'bags-shoes'], ['man-shoes', 'bags-shoes'], ['men-sandals', 'bags-shoes'],
  ['mens-sweaters', 'mens-clothing'],
  // Home & Garden & Furniture
  ['home-garden-furniture', 'home-garden-furniture'], ['home-storage', 'home-garden-furniture'],
  ['kitchen', 'home-garden-furniture'], ['home-textiles', 'home-garden-furniture'], ['bedding', 'home-garden-furniture'],
  ['drinkware', 'home-garden-furniture'], ['dinnerware', 'home-garden-furniture'], ['furniture', 'home-garden-furniture'],
  ['cooking-tools', 'home-garden-furniture'], ['bakeware', 'home-garden-furniture'], ['pillows', 'home-garden-furniture'],
  ['stationeries', 'home-garden-furniture'], ['garden', 'home-garden-furniture'],
  // Home Improvement & Tools
  ['home-improvement', 'home-improvement'], ['tool-sets', 'home-improvement'], ['tool-set', 'home-improvement'],
  ['tools', 'home-improvement'], ['replacement-part', 'home-improvement'], ['lamp', 'home-improvement'],
  ['lighting', 'home-improvement'], ['bathroom', 'home-improvement'], ['cleaning', 'home-improvement'],
  ['drill', 'home-improvement'], ['screwdriver', 'home-improvement'], ['garden-tools', 'home-improvement'],
  // Health, Beauty & Hair
  ['health-beauty-hair', 'health-beauty-hair'], ['skin-care', 'health-beauty-hair'], ['facial', 'health-beauty-hair'],
  ['nail', 'health-beauty-hair'], ['makeup', 'health-beauty-hair'], ['beauty', 'health-beauty-hair'],
  ['body-care', 'health-beauty-hair'], ['hair', 'health-beauty-hair'], ['wigs', 'health-beauty-hair'],
  ['lipstick', 'health-beauty-hair'], ['eyeshadow', 'health-beauty-hair'],
  // Consumer Electronics
  ['consumer-electronics', 'consumer-electronics'], ['smart-electronics', 'consumer-electronics'],
  ['smart-home', 'consumer-electronics'], ['earphones', 'consumer-electronics'], ['headphones', 'consumer-electronics'],
  ['audio', 'consumer-electronics'], ['speaker', 'consumer-electronics'], ['amplifier', 'consumer-electronics'],
  ['camera', 'consumer-electronics'], ['keyboard', 'consumer-electronics'], ['hdd-enclosures', 'consumer-electronics'],
  // Phones & Accessories
  ['phones-accessories', 'phones-accessories'], ['phone-accessories', 'phones-accessories'],
  ['cases-covers', 'phones-accessories'], ['phone-cases', 'phones-accessories'], ['holders-stands', 'phones-accessories'],
  ['watch-band', 'phones-accessories'], ['charger', 'phones-accessories'], ['cables', 'phones-accessories'],
  ['silicone-cases', 'phones-accessories'], ['gps-trackers', 'phones-accessories'],
  // Sports & Outdoors
  ['sports-outdoors', 'sports-outdoors'], ['sportswear', 'sports-outdoors'], ['fishing', 'sports-outdoors'],
  ['camping', 'sports-outdoors'], ['hiking', 'sports-outdoors'], ['sneakers', 'sports-outdoors'],
  ['swimming', 'sports-outdoors'], ['yoga', 'sports-outdoors'], ['fitness', 'sports-outdoors'], ['gym', 'sports-outdoors'],
  ['bike', 'sports-outdoors'], ['outdoor', 'sports-outdoors'], ['sports-accessories', 'sports-outdoors'],
  // Pet Supplies
  ['pet-supplies', 'pet-supplies'], ['pet-', 'pet-supplies'], ['cat', 'pet-supplies'], ['dog', 'pet-supplies'],
  ['bird-feeders', 'pet-supplies'],
  // Toys, Kids & Babies
  ['toys-kids-babies', 'toys-kids-babies'], ['toys-hobbies', 'toys-kids-babies'], ['toy', 'toys-kids-babies'],
  ['baby', 'toys-kids-babies'], ['kids', 'toys-kids-babies'], ['dolls', 'toys-kids-babies'],
  ['puzzle', 'toys-kids-babies'], ['girl-clothing', 'toys-kids-babies'], ['action-toy', 'toys-kids-babies'],
  // Automobiles & Motorcycles
  ['automobiles-motorcycles', 'automobiles-motorcycles'], ['auto-replacement', 'automobiles-motorcycles'],
  ['motorcycle', 'automobiles-motorcycles'], ['automobile', 'automobiles-motorcycles'], ['car-washer', 'automobiles-motorcycles'],
];

function slugifyCategory(s) {
  return String(s || '').toLowerCase()
    .replace(/ & /g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mapCategory(productType) {
  const raw = String(productType || '').trim();
  if (!raw) return 'other';
  // Normalize separators (">", "/", "-") into a single hyphenated, keyword-searchable string,
  // but preserve readability. We match against a hyphen-joined lowercased form.
  const norm = slugifyCategory(raw);
  if (!norm) return 'other';
  // If it already IS a canonical slug (or starts with one), return it directly.
  if (CANONICAL_CATEGORIES.includes(norm)) return norm;
  for (const slug of CANONICAL_CATEGORIES) {
    if (norm === slug || norm.startsWith(slug + '-') || norm.startsWith(slug + '--')) return slug;
  }
  // ── GENDER PRECHECK (fixes "men's clothes landing in women's clothes") ──
  // CJ category paths carry a top-level gender segment ("Men's Clothing", "Women's
  // Clothing", "Lady ...", "Man ..."). A flat keyword scan was mis-routing generic
  // apparel (sweaters, blazers, pants, shirts) because "sweaters" etc. matched the
  // women's keyword block first. Detect an explicit male/female indicator up front —
  // BUT only for CLOTHING/APPAREL. Footwear (shoes/boots/sneakers/loafers/sandals),
  // bags, jewelry and other accessories stay gender-neutral and fall through to the
  // keyword scan (which maps them to bags-shoes etc. regardless of gender).
  const n0 = norm0(raw);
  const HAS_MEN = /\b(men|men's|mens|man|man's|mans|male|boy|boys)\b/.test(n0);
  const HAS_WOMEN = /\b(women|women's|womens|woman|woman's|womans|lady|ladies|female|girl|girls|miss|wmn)\b/.test(n0);
  // gender-agnostic CATEGORIES that must NOT be forced into clothing:
  const IS_FOOTWEAR = /\b(shoes|boots|boot|sneakers|sneaker|loafers|loafer|sandals|sandal|slippers|slipper|heels|heel|flats|flat|pumps|pump|footwear)\b/.test(n0);
  const IS_BAG_ACC = /\b(bag|bags|backpack|backpacks|handbag|handbags|tote|totes|crossbody|wallet|wallets|luggage|purse|purses)\b/.test(n0);
  const IS_JEWELRY = /\b(jewelry|necklace|necklaces|bracelet|bracelets|earrings|earring|ring|rings|keychain|keychains|watch|watches)\b/.test(n0);
  const skipGender = IS_FOOTWEAR || IS_BAG_ACC || IS_JEWELRY;
  if (!skipGender) {
    if (HAS_MEN && !HAS_WOMEN) return 'mens-clothing';
    if (HAS_WOMEN && !HAS_MEN) return 'womens-clothing';
  }
  // (paths containing BOTH genders, or gender-agnostic categories, fall through)
  // Keyword matching (most-specific first).
  for (const [kw, slug] of CATEGORY_KEYWORDS) {
    if (norm.includes(kw)) return slug;
  }
  return 'other';
}

// Gender-word probe helper: lowercase + normalize punctuation so word boundaries work
// reliably on the ORIGINAL (un-slugified) string, e.g. "Men's Clothing" -> "men s clothing".
function norm0(s) {
  return String(s || '').toLowerCase().replace(/[^a-z]+/g, ' ');
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
    let prods = [], since_id = 0, queue = [];
    let pageFetch = async (sid) => shopifyFetch(env, `/products.json?limit=250&fields=id,title,body_html,vendor,product_type,tags,variants,images,image,status&since_id=${sid}`);
    // Simple queue of one in-flight concurrent page fetch (roughly doubles throughput safely).
    while (true) {
      // Fetch the current page (retry transient failures so we never silently truncate).
      let r = null;
      for (let attempt = 0; attempt < 4; attempt++) {
        r = await pageFetch(since_id);
        if (r.ok) break;
        // 429 / 5xx — back off and retry rather than truncating the catalog.
        await new Promise(res => setTimeout(res, 1000 * (attempt + 1)));
      }
      if (!r || !r.ok) {
        // Persistent failure: abort the whole sync so we do NOT write a partial catalog.
        return new Response(JSON.stringify({ ok: false, error: 'Shopify fetch failed at since_id=' + since_id + ' — aborting to avoid partial catalog' }), {
          status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        });
      }
      const rawProducts = r.body.products || [];
      const batch = rawProducts.filter(p => p.status === 'active' && p.title);
      if (batch.length === 0 && rawProducts.length === 0) break;
      prods.push(...batch);
      // Advance using the RAW last product (not the filtered one) so we never skip
      // or re-fetch rows, and continue paginating based on the RAW page fullness.
      since_id = rawProducts[rawProducts.length - 1].id;
      if (rawProducts.length < 250) break;
      await new Promise(res => setTimeout(res, 400));
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
      const key = mapCategory(p.product_type);
      if (!cats[key]) cats[key] = { name: ptype.split(/[>\/]/)[0].trim(), products: [] };
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
