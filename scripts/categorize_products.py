#!/usr/bin/env python3
"""GitHub Actions: re-categorize ALL active Shopify products to a canonical top-level
category. Two-phase classifier:
  Phase 1 (local, instant): resolve top-level from product_type string (split on > / ->)
                            or title keywords. NO API calls.
  Phase 2 (only for genuine unknowns): CJ categoryName via SKU, prefetched CONCURRENTLY
                            across the available apiKeys (thread pool).
Writes canonical display name back to product_type via GraphQL productUpdate
(then the 6h cron rebuild picks it up). Resumable via a Shopify metafield.

Reads env: SHOPIFY_STORE_DOMAIN, SHOPIFY_ACCESS_TOKEN, CJ_KEYS (comma-separated),
           MAX_PER_RUN (default 20000).
"""
import os, sys, json, time, re, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib.parse

DOMAIN  = os.environ['SHOPIFY_STORE_DOMAIN']
TOKEN   = os.environ['SHOPIFY_ACCESS_TOKEN']
API     = f"https://{DOMAIN}/admin/api/2025-10"
CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'
MAX_PER_RUN = int(os.environ.get('MAX_PER_RUN', '20000'))

CJ_KEYS = [k.strip() for k in os.environ.get('CJ_KEYS', '').split(',') if k.strip()]
CJ_KEYS = list(dict.fromkeys(CJ_KEYS))
if not CJ_KEYS:
    CJ_KEYS = [
        'CJ5800059@api@f063a5b2bae64d659849301491d753d8',
        'CJ5798986@api@8e86ba7f88de4781812950784cbc2dc4',
        'CJ5799030@api@c764039900e64ebbbdc3b9398a26bb2c',
        'CJ5820279@api@e3b050af15cc44b590ac9b0d1f813ef',
    ]

SHOP_GID = 'gid://shopify/Shop/73594044547'
NS = 'categorize'
KEY = 'state'

TOP_LEVELS = [
    ('womens-clothing',   "Women's Clothing"),
    ('mens-clothing',     "Men's Clothing"),
    ('bags-shoes',        "Bags & Shoes"),
    ('jewelry-watches',   "Jewelry & Watches"),
    ('home-garden-furniture', "Home, Garden & Furniture"),
    ('home-improvement',  "Home Improvement"),
    ('health-beauty-hair', "Health, Beauty & Hair"),
    ('sports-outdoors',   "Sports & Outdoors"),
    ('toys-kids-babies',  "Toys, Kids & Babies"),
    ('phones-accessories', "Phones & Accessories"),
    ('consumer-electronics', "Consumer Electronics"),
    ('automobiles-motorcycles', "Automobiles & Motorcycles"),
    ('pet-supplies',      "Pet Supplies"),
    ('computer-office',   "Computer & Office"),
]
DISPLAY = {s: n for s, n in TOP_LEVELS}

KEYWORDS = {
 'womens-clothing': ['women','womens','lady','ladies','girl','dress','blouse','skirt','legging','bikini','swimsuit','bra','crop top','bodysuit','jumpsuit','romper','cardigan','gown','corset','tunic','hoodie','sweater','blazer','jeans','denim','lingerie','pajama','nightgown'],
 'mens-clothing': ['men','mens','gentlemen','polo','boxer','suite','tie','cufflink','suspenders','briefs'],
 'bags-shoes': ['shoe','sneaker','boot','sandal','slipper','heel','heels','loafer','moccasin','handbag','backpack','wallet','purse','tote','crossbody','luggage','clutch','duffel','satchel','shoulder bag','bootie'],
 'jewelry-watches': ['ring','earring','necklace','bracelet','pendant','watch','jewelry','jewellery','bangle','anklet','charm','brooch','gemstone','timepiece'],
 'home-garden-furniture': ['furniture','chair','sofa','couch','table','cabinet','shelf','shelves','wardrobe','mattress','rug','carpet','curtain','lamp','cushion','pillow','blanket','bedding','duvet','towel','kitchen','storage','organizer','garden','planter','vase','mirror','artificial plant','candle','decor','bathroom','shower','clothes rack','hanger','laundry','bookcase','tapestry','wall art','doormat','coaster','tablecloth','cookware','dinnerware','cutlery','glassware','cutting board','air fryer','coffee maker','christmas','festive'],
 'home-improvement': ['tool','drill','screwdriver','wrench','pliers','hardware','plumb','ladder','wallpaper','socket','faucet','door handle','lighting','light bulb','extension cord','flashlight','work light','tape measure'],
 'health-beauty-hair': ['makeup','mascara','lipstick','eyeshadow','foundation','nail','serum','moistur','skincare','skin care','wig','shampoo','conditioner','perfume','cologne','beauty','cosmetic','hair dryer','razor','epilator','massage','lash','body lotion','sunscreen','makeup brush','eyebrow','lip gloss','highlighter','concealer','cleanser','toothbrush'],
 'sports-outdoors': ['sport','gym','fitness','yoga','workout','camping','hiking','outdoor','fishing','cycling','football','soccer','basketball','tennis','goggles','skateboard','tent','sleeping bag','dumbbell','kettlebell','exercise','ski','snowboard','surf','skate','jump rope','hammock','bicycle'],
 'toys-kids-babies': ['toy','toys','kids','child','toddler','plush','doll','lego','building block','puzzle','action figure','stuffed','stroller','cradle','baby','infant','educational','puppet','rc car','remote control','fidget','slime','board game','card game','romper','onesie'],
 'phones-accessories': ['phone case','iphone','samsung','phone cover','phone holder','airpods','charger cable','screen protector','mobile phone','xiaomi','huawei','phone stand','power bank','pop socket','cell phone','android'],
 'consumer-electronics': ['speaker','headphone','earphone','earbuds','smart watch','smartwatch','gaming','camera','drone','projector','led light','led strip','tablet','audio','soundbar','wireless charger','smart home','alexa','echo dot','stereo','amplifier','subwoofer','tws','camcorder'],
 'automobiles-motorcycles': ['motorcycle','motorbike','car accessory','car seat','car cover','dashboard','steering wheel','car charger','sun shade','bike rack','car mat','auto part','muffler','exhaust','spoiler','tow hitch','air freshener','headlight','tail light','windshield','oxygen sensor','trailer','valve cap','jump starter'],
 'pet-supplies': ['pet','dog','cat','puppy','kitten','leash','collar','cat toy','dog toy','aquarium','bird cage','fish tank','litter box','pet grooming','cat litter','pet bed','pet food','pet feeder','chew toy','bird feeder','cat tree','pet nest'],
 'computer-office': ['laptop','keyboard','mouse pad','mouse','monitor','desk','office chair','webcam','printer','usb hub','docking station','desktop','ergonomic','tablet accessories','hdd enclosure','surveillance'],
}

def norm(s):
    s = re.sub(r'\s+', ' ', s or '').strip().lower()
    s = s.replace('\uff0c', ',').replace('\uff06', '&').replace('\u2019', "'")
    return s

alias2slug = {}
for slug, name in TOP_LEVELS:
    for a in (slug, name, norm(name), name.lower()):
        alias2slug[a] = slug

def title_slug(title):
    t = norm(title)
    if not t: return None
    scores = {}
    for slug, kws in KEYWORDS.items():
        sc = sum(1 for k in kws if k in t)
        if sc: scores[slug] = sc
    if not scores: return None
    return max(scores, key=scores.get)

def pt_slug(pt):
    if not pt: return None
    n = norm(pt)
    if n in alias2slug: return alias2slug[n]
    first = re.split(r'>|/|->', pt)[0]
    return alias2slug.get(norm(first))

# ---- CJ (concurrent) ----
def _cj_token(apikey):
    try:
        req = urllib.request.Request(CJ_BASE + '/authentication/getAccessToken',
                data=json.dumps({'apiKey': apikey}).encode(),
                headers={'Content-Type': 'application/json'}, method='POST')
        j = json.load(urllib.request.urlopen(req, timeout=30))
        return (j.get('data') or {}).get('accessToken')
    except Exception:
        return None

def _cj_one(args):
    apikey, sku = args
    tok = _cj_token(apikey)
    if not tok: return sku, None
    try:
        path = '/product/query?variantSku=' + urllib.parse.quote(sku)
        req = urllib.request.Request(CJ_BASE + path, headers={'CJ-Access-Token': tok})
        j = json.load(urllib.request.urlopen(req, timeout=30))
        d = j.get('data')
        if j.get('code') == 200 and d:
            name = d.get('categoryName') or d.get('category')
            if name: return sku, name
    except Exception:
        pass
    return sku, None

def cj_prefetch(skus):
    """Concurrently resolve CJ categoryName for a set of SKUs, round-robining keys."""
    if not skus: return {}
    result = {}
    # round-robin assign each sku to a worker (key), so 4 keys = 4-way concurrency
    args = [(CJ_KEYS[i % len(CJ_KEYS)], sku) for i, sku in enumerate(skus)]
    workers = min(8, len(args))
    try:
        with ThreadPoolExecutor(max_workers=workers) as ex:
            for fut in as_completed([ex.submit(_cj_one, a) for a in args]):
                sku, name = fut.result()
                if name: result[sku] = name
    except Exception:
        pass
    return result

# ---- Shopify GraphQL helpers ----
def gql(q, variables=None):
    body = {'query': q}
    if variables: body['variables'] = variables
    req = urllib.request.Request(API + '/graphql.json', data=json.dumps(body).encode(),
        headers={'Content-Type':'application/json','X-Shopify-Access-Token':TOKEN})
    return json.load(urllib.request.urlopen(req, timeout=120))

def is_throttled(r):
    if 'data' in r and r['data'] is not None: return False
    for e in (r.get('errors') or []):
        ext = e.get('extensions') or {}
        if ext.get('code') == 'THROTTLED' or 'throttl' in str(e.get('message','')).lower(): return True
    return False

def load_state():
    try:
        q = 'query { shop { metafields(first:1, keys:["%s.%s"]) { edges { node { value } } } } }' % (NS, KEY)
        body = gql(q)
        edges = body.get('data',{}).get('shop',{}).get('metafields',{}).get('edges') or []
        if edges:
            raw = json.loads(edges[0]['node']['value'] or '{}')
            raw.setdefault('done', []); raw.setdefault('fixed', 0)
            return raw
    except Exception:
        pass
    return {'done': [], 'fixed': 0}

def save_state(state):
    try:
        mq = 'mutation set($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { metafields { id } userErrors { field message } } }'
        gql(mq, {'m': [{'ownerId': SHOP_GID, 'namespace': NS, 'key': KEY, 'type': 'json', 'value': json.dumps(state)}]})
    except Exception:
        pass

UPDATE_MUT = 'mutation update($input: ProductInput!) { productUpdate(product: $input) { product { id } userErrors { field message } } }'

def write_product_type(pid, new_name):
    for attempt in range(5):
        try:
            r = gql(UPDATE_MUT, {'input': {'id': f'gid://shopify/Product/{pid}', 'productType': new_name}})
            if is_throttled(r):
                time.sleep(min(2 * (attempt+1), 15))
                continue
            ue = (r.get('data',{}).get('productUpdate',{}) or {}).get('userErrors')
            if ue:
                return False
            if r.get('data',{}).get('productUpdate',{}).get('product'):
                return True
            return False
        except Exception:
            time.sleep(min(2 * (attempt+1), 15))
    return False

# ---- 1) bulk pull ----
BULK = '{ products { edges { node { id title status productType variants(first:1){edges{node{sku}}} } } } }'
mq = 'mutation { bulkOperationRunQuery(query: "' + BULK.replace('\n', ' ') + '") { bulkOperation { id status } userErrors { field message } } }'
opId = None
for attempt in range(20):
    r = gql(mq)
    if is_throttled(r): time.sleep(min(10*(attempt+1),120)); continue
    ue = (r.get('data',{}).get('bulkOperationRunQuery',{}) or {}).get('userErrors')
    if ue: print('BULK USER ERRORS', ue, file=sys.stderr); sys.exit(1)
    d = (r.get('data',{}).get('bulkOperationRunQuery',{}) or {}).get('bulkOperation')
    if d and d.get('id'): opId = d['id']; break
if not opId: print('FAILED bulk create', file=sys.stderr); sys.exit(1)
print('bulk op', opId, flush=True)

PQ = 'query($id: ID!){ node(id:$id){ ... on BulkOperation { id status url errorCode } } }'
url = None
for _ in range(240):
    n = None
    for a2 in range(10):
        r = gql(PQ, {'id': opId})
        if is_throttled(r): time.sleep(min(10*(a2+1),120)); continue
        n = r['data']['node']; break
    if n is None: continue
    if n['status'] == 'COMPLETED': url = n['url']; break
    if n['status'] == 'FAILED': print('BULK FAILED', n.get('errorCode'), file=sys.stderr); sys.exit(1)
    time.sleep(3)
else:
    print('bulk timeout', file=sys.stderr); sys.exit(1)

jsonl = urllib.request.urlopen(url, timeout=300).read().decode()
products = []
for line in jsonl.splitlines():
    s = line.strip()
    if not s: continue
    o = json.loads(s)
    pid = o.get('__parentId')
    if pid:
        p = pid.split('/')[-1]
        if products and products[-1]['id'] == p and o.get('sku'):
            products[-1]['sku'] = o.get('sku')
        continue
    oid = o.get('id') or ''
    if 'gid://shopify/Product/' not in oid:
        continue
    if o.get('status') != 'ACTIVE': continue
    products.append({'id': oid.split('/')[-1], 'title': o.get('title') or '', 'product_type': o.get('productType'), 'sku': None})

print('active products:', len(products), flush=True)

state = load_state()
done = set(state['done'])

# ---- 2) Phase 1: local resolution (no API) ----
# Determine which products need CJ (genuine unknowns).
need_cj = []  # list of (product_dict)
plan = {}     # pid -> new_name

for p in products:
    pid = p['id']
    if pid in done: continue
    cur_slug = pt_slug(p['product_type'])       # local string match
    t_slug = title_slug(p['title'])              # local keyword match
    new_slug = cur_slug or t_slug
    if new_slug and new_slug in DISPLAY:
        plan[pid] = DISPLAY[new_slug]
    else:
        # genuine unknown -> may need CJ (only if we have a SKU)
        need_cj.append(p)

# ---- 3) Phase 2: concurrent CJ prefetch for genuine unknowns ----
cj_skus = [p['sku'] for p in need_cj if p.get('sku')]
print('need CJ lookups:', len(cj_skus), flush=True)
cj_map = cj_prefetch(cj_skus)
print('CJ resolved:', len(cj_map), flush=True)

for p in need_cj:
    pid = p['id']
    cat = cj_map.get(p.get('sku')) if p.get('sku') else None
    slug = None
    if cat:
        first = re.split(r'>|/|->', cat)[0]
        slug = alias2slug.get(norm(first)) or alias2slug.get(norm(cat))
    if slug and slug in DISPLAY:
        plan[pid] = DISPLAY[slug]

# ---- 4) write back ----
changed = 0
cj_fixed = 0
kept = 0
title_fixed = 0
failed = []

prod_by_id = {p['id']: p for p in products}
for pid, new_name in plan.items():
    p = prod_by_id.get(pid)
    if p is None: continue
    raw_pt = p['product_type'] or ''
    if raw_pt == new_name:
        done.add(pid)
        kept += 1
        continue
    if write_product_type(pid, new_name):
        changed += 1
        done.add(pid)
        # classify source for reporting
        cur_slug = pt_slug(p['product_type'])
        t_slug = title_slug(p['title'])
        cat = cj_map.get(p.get('sku')) if p.get('sku') else None
        if not cur_slug:
            if cat: cj_fixed += 1
            else: title_fixed += 1
    else:
        failed.append(pid)

    if changed % 100 == 0:
        print(f'  wrote {changed}...', flush=True)

# any products which resolved clean already (not in plan) but not yet done -> mark done
for p in products:
    pid = p['id']
    if pid in done: continue
    if pid not in plan:
        # already canonical (kept) — mark done
        done.add(pid)

state['done'] = sorted(done)
state['fixed'] = state.get('fixed', 0) + changed
save_state(state)

print(json.dumps({'processed': len(plan), 'changed': changed, 'cj_fixed': cj_fixed,
                  'kept': kept, 'title_fixed': title_fixed, 'errors': len(failed),
                  'total_done': len(done), 'total_products': len(products)}))
