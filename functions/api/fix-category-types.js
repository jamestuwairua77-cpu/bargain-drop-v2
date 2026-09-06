// fix-category-types.js — classify products whose `product_type` is a stray
// numeric value (e.g. "5") by their OWN title + description, then write the
// correct canonical top-level category slug back to Shopify.
//
// Unlike fix-categories.js (which recovers category via per-product CJ lookups
// and is bottlenecked at CJ's 1 req/sec + fails on delisted products), this
// endpoint needs NO CJ calls — it infers the category locally, so it runs fast
// and works even for products no longer listed on CJ.
//
// Auth: X-Admin-Pin (or ?pin=) matching ADMIN_PIN.
//   /api/fix-category-types?preview=1        list counts + every id→category (no writes)
//   /api/fix-category-types?run=1            classify + write to Shopify (bounded batch)
//   /api/fix-category-types?status=1         progress (metafield fixcattypes/state)
//   /api/fix-category-types?reset=1          clear progress, start fresh
//
// Progress persists in a Shopify metafield (namespace `fixcattypes`, key `state`)
// so processing survives across worker invocations.

import { corsHeaders, isAdmin, adminDenied, shopifyFetch, nextPageCursor } from '../_sync-lib.js';

const SHOP_GID = 'gid://shopify/Shop/73594044547';
const NS = 'fixcattypes';
const KEY = 'state';
const NUMERIC_RE = /^\d+$/;
const BATCH = parseInt(process.env.NODE_ENV, 10) > 0 ? 200 : 200; // products per run

// Canonical top-level category slugs, with keyword rules (title+description).
// Order matters: more specific / riskier-overlap categories first.
function rx(...terms) {
  return new RegExp(terms.map(t => `(?:\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b)`).join('|'), 'i');
}
const RULES = [
  ['phones-accessories',     rx('phone case','iphone','samsung','phone cover','phone holder','airpods','earbuds case','charger cable','screen protector','mobile phone','xiaomi','huawei','bluetooth earphone','wireless earbuds','earphones','headset','power bank','phone stand','pop socket','cell phone','android')],
  ['computer-office',       rx('laptop','keyboard','mouse pad','monitor stand','desk','office chair','webcam','printer','usb hub','docking station','mouse','desktop','ergonomic')],
  ['consumer-electronics',  rx('bluetooth speaker','headphones','earphone','speaker','smart watch','smartwatch','gaming','camera','drone','projector','led light','led strip','tablet','audio','soundbar','wireless charger','smart home','alexa','echo dot','earbuds','stereo','amplifier','subwoofer','tws','digital camera','action camera','video recorder')],
  ['womens-clothing',       rx('women','womens','woman','ladies','lady','girls','dress','blouse','skirt','leggings','crop top','bodysuit','swimsuit','bikini','cardigan','jumpsuit','romper','gown','corset','bralette','camisole','tunic','bra')],
  ['mens-clothing',         rx("men's",'mens','gentlemen','male','boys','polo','boxer','boxers','briefs','suspenders','suit','cufflink','bow tie','neckwear','men ')],
  ['bags-shoes',            rx('shoe','shoes','sneaker','boot','boots','bootie','sandal','slipper','heel','heels','loafer','moccasin','handbag','backpack','wallet','purse','tote','crossbody','luggage','clutch','duffel','messenger bag','satchel','shoulder bag')],
  ['jewelry-watches',       rx('ring','earring','necklace','bracelet','pendant','wristwatch','wrist watch','jewelry','jewellery','bangle','anklet','charm','brooch','gemstone','watch band','timepiece')],
  ['health-beauty-hair',    rx('makeup','mascara','lipstick','eyeshadow','foundation','nail polish','nail gel','skin care','skincare','serum','moisturizer','face mask','facial','wig','hair extensions','shampoo','conditioner','perfume','cologne','beauty','cosmetic','hair dryer','hairdryer','razor','epilator','massage','lashes','eyelash','body lotion','sunscreen','makeup brush','eyebrow','lip gloss','highlighter','concealer','cleanser','teeth cleaning','toothbrush')],
  ['home-garden-furniture', rx('furniture','chair','sofa','couch','table','cabinet','shelf','shelves','shelving','wardrobe','mattress','rug','carpet','curtain','lamp','cushion','pillow','blanket','bedding','duvet','towel','kitchen','storage','organizer','garden','planter','vase','mirror','artificial plant','candle','home decor','bathroom','shower','clothes rack','hanger','laundry basket','nightstand','drawer','bookcase','tapestry','wall art','doormat','coaster','tablecloth','cookware','dinnerware','cutlery','glassware','cutting board','air fryer','coffee maker','sideboard','ground cover fabric','placemat')],
  ['home-improvement',      rx('tool','drill','screwdriver','wrench','pliers','hardware','plumbing','ladder','wallpaper','socket','faucet','door handle','lighting','light bulb','extension cord','flashlight','work light','tape measure')],
  ['pet-supplies',          rx('pet','dog','cat','puppy','kitten','leash','collar','cat toy','dog toy','aquarium','bird cage','fish tank','litter box','pet grooming','cat litter','pet bed','pet food','pet feeder','chew toy','bird feeder')],
  ['toys-kids-babies',      rx('toy','toys','kids','children','toddler','plush','doll','lego','building blocks','puzzle','action figure','stuffed animal','stroller','cradle','baby','infant','educational','puppet','rc car','remote control car','fidget','slime','board game','card game','magic trick')],
  ['sports-outdoors',       rx('sport','sports','gym','fitness','yoga','workout','camping','hiking','outdoor','fishing','cycling','football','soccer','basketball','tennis','goggles','skateboard','tent','sleeping bag','dumbbell','kettlebell','exercise','outdoors','ski','snowboard','surf','skate','jump rope','hammock','mountain bike','bicycle')],
  ['automobiles-motorcycles', rx('motorcycle','motorbike','car accessory','car seat','car cover','dashboard','steering wheel','car charger','sun shade','bike rack','car mat','auto part','muffler','exhaust','spoiler','tow hitch','car air freshener','headlight','tail light','windshield','oxygen sensor','trailer hook','valve cap')],
];

function classify(title, body) {
  const text = (title || '') + ' ' + (body || '');
  for (const [cat, re] of RULES) {
    if (re.test(text)) return cat;
  }
  return 'other';
}

async function loadState(env) {
  let raw = null;
  try {
    const q = `query { shop { metafields(first:1, keys: ["${NS}.${KEY}"]) { edges { node { value } } } } }`;
    const { body } = await shopifyFetch(env, '/graphql.json', { method: 'POST', body: JSON.stringify({ query: q }) });
    const edges = body?.data?.shop?.metafields?.edges || [];
    if (edges.length) raw = JSON.parse(edges[0].node.value || '{}');
  } catch {}
  raw = raw && typeof raw === 'object' ? raw : {};
  const done = Array.isArray(raw.done) ? raw.done : [];
  return { done, fixed: raw.fixed || 0, skipped: raw.skipped || 0, counts: raw.counts || {} };
}

async function saveState(env, state) {
  try {
    const mq = `mutation set($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { metafields { id } userErrors { field message } } }`;
    await shopifyFetch(env, '/graphql.json', {
      method: 'POST',
      body: JSON.stringify({ query: mq, variables: { m: [{ ownerId: SHOP_GID, namespace: NS, key: KEY, type: 'json', value: JSON.stringify(state) }] } }),
    });
  } catch {}
}

async function fetchAllActiveProducts(env) {
  const base = '/products.json?limit=250&fields=id,title,body_html,product_type,variants,status';
  let prods = [], cursor = null, guard = 0;
  while (true) {
    const url = base + (cursor ? '&page_info=' + encodeURIComponent(cursor) : '');
    const { body, headers } = await shopifyFetch(env, url);
    for (const p of (body.products || [])) if (p.status === 'active' && p.title) prods.push(p);
    cursor = nextPageCursor(headers);
    if (!cursor) break;
    if (++guard > 1000) throw new Error('pagination runaway');
    await new Promise(r => setTimeout(r, 300));
  }
  return prods;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();
  const url = new URL(request.url);
  const action = url.searchParams.get('run') || url.searchParams.get('preview') || url.searchParams.get('status') || url.searchParams.get('reset') || 'status';

  if (action === 'reset') {
    await saveState(env, { done: [], fixed: 0, skipped: 0, counts: {} });
    return new Response(JSON.stringify({ ok: true, reset: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  const state = await loadState(env);
  const doneSet = new Set(state.done);

  if (action === 'status') {
    return new Response(JSON.stringify({ ok: true, fixed: state.fixed, skipped: state.skipped, done: state.done.length, counts: state.counts }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  // Load all products and identify numeric-type ones not yet fixed.
  const all = await fetchAllActiveProducts(env);
  let targets = all.filter(p => NUMERIC_RE.test(String(p.product_type || '').trim()) && !doneSet.has(String(p.id)));

  // preview: no writes, return classification summary + sample
  if (action === 'preview') {
    const counts = {};
    const map = {};
    let unknown = 0;
    for (const p of targets) {
      const c = classify(p.title, p.body_html);
      counts[c] = (counts[c] || 0) + 1;
      map[p.id] = c;
      if (c === 'other') unknown++;
    }
    return new Response(JSON.stringify({ ok: true, total_numeric: all.filter(p => NUMERIC_RE.test(String(p.product_type || '').trim())).length, pending: targets.length, counts, unknown, sample: Object.entries(map).slice(0, 40) }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  // run: process a bounded batch
  if (targets.length === 0) {
    return new Response(JSON.stringify({ ok: true, finished: true, fixed: state.fixed, skipped: state.skipped, counts: state.counts }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
  }

  const batch = targets.slice(0, BATCH);
  let fixed = 0, skipped = 0;
  const counts = { ...state.counts };
  const errors = [];
  const newlyDone = [];

  for (const p of batch) {
    const id = String(p.id);
    const c = classify(p.title, p.body_html);
    if (c === 'other') {
      skipped++;
      counts['other'] = (counts['other'] || 0) + 1;
      newlyDone.push(id);
      continue;
    }
    try {
      await shopifyFetch(env, '/products/' + id + '.json', {
        method: 'PUT',
        body: JSON.stringify({ product: { id: parseInt(id, 10), product_type: c } }),
      });
      fixed++;
      counts[c] = (counts[c] || 0) + 1;
      newlyDone.push(id);
      // be gentle on Shopify rate limits
      await new Promise(r => setTimeout(r, 150));
    } catch (e) {
      errors.push({ id, error: String(e && e.message) });
    }
  }

  const nextDone = [...state.done, ...newlyDone];
  await saveState(env, { done: nextDone, fixed: state.fixed + fixed, skipped: state.skipped + skipped, counts });

  return new Response(JSON.stringify({
    ok: true,
    batch: batch.length,
    fixed,
    skipped,
    errors: errors.length ? errors : undefined,
    total_fixed: state.fixed + fixed,
    total_done: nextDone.length,
    remaining: targets.length - batch.length,
    counts,
  }), { headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
}
