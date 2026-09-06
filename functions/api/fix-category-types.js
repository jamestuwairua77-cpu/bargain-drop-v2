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
    finished: !!raw.finished,
    cursor: typeof raw.cursor === 'string' ? raw.cursor : null,
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
  const hasReset = url.searchParams.has('reset');
  const hasStatus = url.searchParams.has('status');
  const hasBuild = url.searchParams.has('build');
  const hasRun = url.searchParams.has('run');

  if (hasReset) {
    await saveState(env, { done: [], fixed: 0, other: 0, counts: {} });
    return json({ ok: true, reset: true });
  }

  // status: read progress only (no queue stored)
  if (hasStatus) {
    const st = await loadState(env);
    return json({ ok: true, done: st.done.length, fixed: st.fixed, other: st.other, counts: st.counts, finished: st.finished });
  }

  // build: just report the live count of broken products (does NOT store a queue)
  if (hasBuild) {
    const { list, truncated } = await scanBroken(env, 40000);
    return json({ ok: true, built: list.length, truncated });
  }

  // run: two-phase — (1) bounded scan for broken products, (2) classify + PUT within remaining budget
  if (hasRun) {
    const st = await loadState(env);
    const doneSet = new Set(st.done.map(String));
    const TOTAL_MS = 45000;
    const startedAt = Date.now();
    let fixed = 0, other = 0, scanned = 0;
    const counts = { ...(st.counts || {}) };
    const newDone = [];

    // Phase 1: scan for up to 15s, resuming from saved cursor
    const SCAN_MS = 15000;
    const res = await scanBroken(env, SCAN_MS, startedAt, st.cursor);
    const list = res.list, truncated = res.truncated, exhausted = res.exhausted;

    // Phase 2: classify + PUT the currently-known broken items (write budget = remaining)
    for (const q of list) {
      if (doneSet.has(String(q.id))) continue;
      if (Date.now() - startedAt > TOTAL_MS) break;
      const c = classify(q.title, q.body_html);
      scanned++;
      if (c === 'other') {
        other++;
        counts['other'] = (counts['other'] || 0) + 1;
        newDone.push(String(q.id));
        continue;
      }
      try {
        await shopifyFetch(env, '/products/' + q.id + '.json', {
          method: 'PUT',
          body: JSON.stringify({ product: { id: parseInt(q.id, 10), product_type: c } }),
          skip429Retry: true,
        });
        fixed++;
        counts[c] = (counts[c] || 0) + 1;
        newDone.push(String(q.id));
        await new Promise(r => setTimeout(r, 120));
      } catch (e) {
        // leave for next run
      }
    }

    const mergedDone = Array.from(new Set([...st.done, ...newDone]));
    // finished only when the scan reached the end of the catalog (exhausted) and this pass found nothing left to do
    const finished = exhausted && list.length === 0;
    await saveState(env, { done: mergedDone, fixed: st.fixed + fixed, other: st.other + other, counts, finished, cursor: res.cursor });
    return json({ ok: true, finished, truncated, scanned_this_run: scanned, fixed_this_run: fixed, other_this_run: other, total_fixed: st.fixed + fixed, total_other: st.other + other, done: mergedDone.length, counts });
  }

  return json({ ok: true, hint: 'use ?build=1 ?run=1 ?status=1 ?reset=1' });
}

// Live paginated scan of active products whose product_type is broken (numeric/empty/'other').
// budgetMs: max scan time; startAt: epoch ms (optional). Returns { list, truncated }.
async function scanBroken(env, budgetMs, startAt, startCursor) {
  const t0 = startAt || Date.now();
  const list = [];
  const base = '/products.json?limit=250&fields=id,title,body_html,product_type,status';
  let cursor = startCursor || null, guard = 0;
  let truncated = false, exhausted = false;
  while (true) {
    if (Date.now() - t0 > budgetMs) { truncated = true; break; }
    const u = base + (cursor ? '&page_info=' + encodeURIComponent(cursor) : '');
    let body, headers;
    try {
      ({ body, headers } = await shopifyFetch(env, u));
    } catch (e) { truncated = true; break; }
    for (const p of (body.products || [])) {
      if (p.status === 'active' && p.title && isBrokenType(p.product_type)) {
        list.push({ id: String(p.id), title: p.title, body_html: (p.body_html || '').slice(0, 3000) });
      }
    }
    const nc = nextPageCursor(headers);
    if (!nc) { exhausted = true; cursor = null; break; }
    cursor = nc;
    if (++guard > 500) { truncated = true; break; }
    await new Promise(r => setTimeout(r, 150));
  }
  return { list, truncated, exhausted, cursor };
}
