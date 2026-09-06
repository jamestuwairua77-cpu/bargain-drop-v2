// fix-category-types.js — classify products whose `product_type` is a stray
// numeric value (e.g. "5") by their OWN title + description, then write the
// correct canonical top-level category slug back to Shopify.
//
// Unlike fix-categories.js (which recovers category via per-product CJ lookups
// and is bottlenecked at CJ's 1 req/sec + fails on delisted products), this
// endpoint needs NO CJ calls — it infers the category locally.
//
// Auth: X-Admin-Pin (or ?pin=) matching ADMIN_PIN.
//   /api/fix-category-types?build=1      scan Shopify, build queue of numeric-type products (metafield)
//   /api/fix-category-types?run=1        process a time-budgeted batch (classify + PUT to Shopify)
//   /api/fix-category-types?status=1     progress (metafield fixcattypes/state)
//   /api/fix-category-types?reset=1      clear queue + progress
//
// Progress + queue persist in a Shopify metafield (namespace `fixcattypes`).

import { corsHeaders, isAdmin, adminDenied, shopifyFetch, nextPageCursor } from '../_sync-lib.js';

const SHOP_GID = 'gid://shopify/Shop/73594044547';
const NS = 'fixcattypes';
const KEY = 'state';
const NUMERIC_RE = /^\d+$/;
function isBrokenType(pt) {
  const s = String(pt == null ? '' : pt).trim();
  if (!s) return true;
  if (NUMERIC_RE.test(s)) return true;
  if (s.toLowerCase() === 'other') return true;
  return false;
}

function rx(...terms) {
  return new RegExp(terms.map(t => `(?:\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b)`).join('|'), 'i');
}
const RULES = [
  ['phones-accessories',     rx('phone case','iphone','samsung','phone cover','phone holder','airpods','earbuds case','charger cable','screen protector','mobile phone','xiaomi','huawei','bluetooth earphone','wireless earbuds','earphones','headset','power bank','phone stand','pop socket','cell phone','android')],
  ['computer-office',       rx('laptop','keyboard','mouse pad','monitor stand','desk','office chair','webcam','printer','usb hub','docking station','mouse','desktop','ergonomic')],
  ['consumer-electronics',  rx('bluetooth speaker','headphones','earphone','speaker','smart watch','smartwatch','gaming','camera','drone','projector','led light','led strip','tablet','audio','soundbar','wireless charger','smart home','alexa','echo dot','earbuds','stereo','amplifier','subwoofer','tws','digital camera','action camera','video recorder')],
  ['womens-clothing',       rx('women','womens','woman','ladies','lady','girls','dress','blouse','skirt','leggings','crop top','bodysuit','swimsuit','bikini','cardigan','jumpsuit','romper','gown','corset','bralette','camisole','tunic','hoodie','sweater','sweatshirt','t-shirt','tshirt','tee','shirt','top','blazer','jacket','coat','fur coat','jeans','denim','pants','trousers','shorts','lingerie','pajama','nightgown','bodysuit')],
  ['mens-clothing',         rx("men's",'mens','gentlemen','male','boys','polo','boxer','boxers','briefs','suspenders','suit','cufflink','bow tie','neckwear','men ')],
  ['bags-shoes',            rx('shoe','shoes','sneaker','boot','boots','bootie','sandal','slipper','heel','heels','loafer','moccasin','handbag','backpack','wallet','purse','tote','crossbody','luggage','clutch','duffel','messenger bag','satchel','shoulder bag')],
  ['jewelry-watches',       rx('ring','earring','necklace','bracelet','pendant','wristwatch','wrist watch','jewelry','jewellery','bangle','anklet','charm','brooch','gemstone','watch band','timepiece')],
  ['health-beauty-hair',    rx('makeup','mascara','lipstick','eyeshadow','foundation','nail polish','nail gel','skin care','skincare','serum','moisturizer','face mask','facial','wig','hair extensions','shampoo','conditioner','perfume','cologne','beauty','cosmetic','hair dryer','hairdryer','razor','epilator','massage','lashes','eyelash','body lotion','sunscreen','makeup brush','eyebrow','lip gloss','highlighter','concealer','cleanser','teeth cleaning','toothbrush')],
  ['home-garden-furniture', rx('furniture','chair','sofa','couch','table','cabinet','shelf','shelves','shelving','wardrobe','mattress','rug','carpet','curtain','lamp','cushion','pillow','blanket','bedding','duvet','towel','kitchen','storage','organizer','garden','planter','vase','mirror','artificial plant','candle','home decor','bathroom','shower','clothes rack','hanger','laundry basket','nightstand','drawer','bookcase','tapestry','wall art','doormat','coaster','tablecloth','cookware','dinnerware','cutlery','glassware','cutting board','air fryer','coffee maker','ground cover fabric','placemat')],
  ['home-improvement',      rx('tool','drill','screwdriver','wrench','pliers','hardware','plumbing','ladder','wallpaper','socket','faucet','door handle','lighting','light bulb','extension cord','flashlight','work light','tape measure')],
  ['pet-supplies',          rx('pet','dog','cat','puppy','kitten','leash','collar','cat toy','dog toy','aquarium','bird cage','fish tank','litter box','pet grooming','cat litter','pet bed','pet food','pet feeder','chew toy','bird feeder')],
  ['toys-kids-babies',      rx('toy','toys','kids','children','toddler','plush','doll','lego','building blocks','puzzle','action figure','stuffed animal','stroller','cradle','baby','infant','educational','puppet','rc car','remote control car','fidget','slime','board game','card game','magic trick')],
  ['sports-outdoors',       rx('sport','sports','gym','fitness','yoga','workout','camping','hiking','outdoor','fishing','cycling','football','soccer','basketball','tennis','goggles','skateboard','tent','sleeping bag','dumbbell','kettlebell','exercise','outdoors','ski','snowboard','surf','skate','jump rope','hammock','mountain bike','bicycle')],
  ['automobiles-motorcycles', rx('motorcycle','motorbike','car accessory','car seat','car cover','dashboard','steering wheel','car charger','sun shade','bike rack','car mat','auto part','muffler','exhaust','spoiler','tow hitch','car air freshener','headlight','tail light','windshield','oxygen sensor','trailer hook','valve cap')],
];

function classify(title, body) {
  const text = (title || '') + ' ' + (body || '');
  for (const [cat, re] of RULES) { if (re.test(text)) return cat; }
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
  return {
    queue: Array.isArray(raw.queue) ? raw.queue : [],
    done: Array.isArray(raw.done) ? raw.done : [],
    fixed: raw.fixed || 0,
    other: raw.other || 0,
    counts: raw.counts || {},
  };
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

const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (!isAdmin(request, env)) return adminDenied();
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || url.searchParams.get('build') || url.searchParams.get('status') || url.searchParams.get('reset') || 'status';
  const isBuild = url.searchParams.has('build');
  const isRun = url.searchParams.has('run');

  if (url.searchParams.has('reset')) {
    await saveState(env, { queue: [], done: [], fixed: 0, other: 0, counts: {} });
    return json({ ok: true, reset: true });
  }

  const st = await loadState(env);

  if (isBuild) {
    // Scan Shopify paging for numeric-type products; build queue.
    const base = '/products.json?limit=250&fields=id,title,body_html,product_type,variants,status';
    let queue = [], cursor = null, guard = 0;
    while (true) {
      const u = base + (cursor ? '&page_info=' + encodeURIComponent(cursor) : '');
      const { body, headers } = await shopifyFetch(env, u);
      for (const p of (body.products || [])) {
        if (p.status === 'active' && p.title && isBrokenType(p.product_type)) {
          queue.push({ id: String(p.id), title: p.title, body_html: (p.body_html || '').slice(0, 3000) });
        }
      }
      cursor = nextPageCursor(headers);
      if (!cursor) break;
      if (++guard > 200) break;
      await new Promise(r => setTimeout(r, 150));
    }
    await saveState(env, { queue, done: [], fixed: 0, other: 0, counts: {} });
    return json({ ok: true, built: queue.length });
  }

  if (isRun) {
    const doneSet = new Set(st.done.map(String));
    const pending = st.queue.filter(q => !doneSet.has(String(q.id)));
    if (!pending.length) return json({ ok: true, finished: true, fixed: st.fixed, other: st.other, counts: st.counts });

    const BUDGET_MS = 42000;
    const startedAt = Date.now();
    let fixed = 0, other = 0;
    const counts = { ...st.counts };
    const newlyDone = [];
    const errors = [];

    for (const q of pending) {
      if (Date.now() - startedAt > BUDGET_MS) break;
      const c = classify(q.title, q.body_html);
      if (c === 'other') { other++; counts['other'] = (counts['other'] || 0) + 1; newlyDone.push(String(q.id)); continue; }
      try {
        await shopifyFetch(env, '/products/' + q.id + '.json', {
          method: 'PUT',
          body: JSON.stringify({ product: { id: parseInt(q.id, 10), product_type: c } }),
          skip429Retry: true,
        });
        fixed++; counts[c] = (counts[c] || 0) + 1; newlyDone.push(String(q.id));
        await new Promise(r => setTimeout(r, 120));
      } catch (e) { errors.push({ id: q.id, error: String(e && e.message) }); }
    }

    const nextDone = [...st.done, ...newlyDone];
    await saveState(env, { queue: st.queue, done: nextDone, fixed: st.fixed + fixed, other: st.other + other, counts });

    const remaining = st.queue.length - nextDone.length;
    return json({
      ok: true,
      finished: remaining <= 0,
      fixed_this_run: fixed, other_this_run: other,
      total_fixed: st.fixed + fixed, total_other: st.other + other,
      remaining, done: nextDone.length, queued: st.queue.length,
      errors: errors.length ? errors : undefined, counts,
    });
  }

  // status (default)
  const doneSet = new Set(st.done.map(String));
  const remaining = st.queue.filter(q => !doneSet.has(String(q.id))).length;
  return json({ ok: true, queued: st.queue.length, done: st.done.length, remaining, fixed: st.fixed, other: st.other, counts: st.counts, finished: remaining <= 0 });
}
