#!/usr/bin/env python3
"""GitHub Actions: re-categorize ALL active Shopify products to a canonical top-level
category by judging each product via CJ's own categoryName (SKU lookup, FREE + authoritative)
with a title-keyword fallback. Writes canonical display name back to Shopify product_type,
resumably (progress persists in a Shopify metafield), then the 6h cron rebuild picks it up.

Reads env: SHOPIFY_STORE_DOMAIN, SHOPIFY_ACCESS_TOKEN, GITHUB_TOKEN, REPO,
           CJ_KEYS (comma-separated CJ apiKeys),
           CJ_ACCESS_TOKEN (optional single key)
Batch: processes at most MAX_PER_RUN products per invocation (resumable across dispatches).
"""
import os, sys, json, time, re, urllib.request, urllib.error

DOMAIN  = os.environ['SHOPIFY_STORE_DOMAIN']
TOKEN   = os.environ['SHOPIFY_ACCESS_TOKEN']
API     = f"https://{DOMAIN}/admin/api/2025-10"
CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'
MAX_PER_RUN = int(os.environ.get('MAX_PER_RUN', '400'))

# CJ api keys (comma separated in CJ_KEYS, plus optional CJ_ACCESS_TOKEN)
CJ_KEYS = [k.strip() for k in os.environ.get('CJ_KEYS','').split(',') if k.strip()]
if os.environ.get('CJ_ACCESS_TOKEN'):
    CJ_KEYS.append(os.environ['CJ_ACCESS_TOKEN'])
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

# ---- canonical top-levels ----
TOP_LEVELS = [
    ('womens-clothing',   "Women's Clothing"),
    ('mens-clothing',     "Men's Clothing"),
    ('bags-shoes',        "Bags & Shoes"),
    ('jewelry-watches',   "Jewelry & Watches"),
    ('home-garden-furniture', "Home, Garden & Furniture"),
    ('home-improvement',  "Home Improvement"),
    ('health-beauty-hair',"Health, Beauty & Hair"),
    ('sports-outdoors',   "Sports & Outdoors"),
    ('toys-kids-babies',  "Toys, Kids & Babies"),
    ('phones-accessories',"Phones & Accessories"),
    ('consumer-electronics',"Consumer Electronics"),
    ('automobiles-motorcycles',"Automobiles & Motorcycles"),
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
 'health-beauty-hair': ['makeup','mascara','lipstick','eyeshadow','foundation','nail','serum','moisturiz','skincare','skin care','wig','shampoo','conditioner','perfume','cologne','beauty','cosmetic','hair dryer','razor','epilator','massage','lash','body lotion','sunscreen','makeup brush','eyebrow','lip gloss','highlighter','concealer','cleanser','toothbrush'],
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
    if norm(pt) in alias2slug: return alias2slug[norm(pt)]
    first = re.split(r'[>/\->]', pt)[0]
    return alias2slug.get(norm(first))

def cj_category_name(sku):
    """Return CJ categoryName (string) for a variant SKU, or None. Free + authoritative."""
    if not sku: return None
    # token cache
    cache = {}
    for apikey in CJ_KEYS:
        # get access token (cached in-memory)
        tok = cache.get(apikey)
        if not tok:
            try:
                req = urllib.request.Request(CJ_BASE + '/authentication/getAccessToken',
                    data=json.dumps({'apiKey': apikey}).encode(),
                    headers={'Content-Type': 'application/json'}, method='POST')
                j = json.load(urllib.request.urlopen(req, timeout=30))
                tok = (j.get('data') or {}).get('accessToken')
                if tok: cache[apikey] = tok
            except Exception:
                tok = None
        if not tok: continue
        try:
            path = '/product/query?variantSku=' + urllib.parse.quote(sku)
            req = urllib.request.Request(CJ_BASE + path, headers={'CJ-Access-Token': tok})
            j = json.load(urllib.request.urlopen(req, timeout=30))
            d = j.get('data')
            if j.get('code') == 200 and d:
                name = d.get('categoryName') or d.get('category')
                if name: return name
            # 1600014 = product not visible under this account; try next key
        except Exception:
            pass
        time.sleep(1.0)  # 1 req/sec
    return None

def cj_top_slug(catname):
    """Map a CJ categoryName (like "Women's Clothing > Tops") to canonical top-level slug."""
    if not catname: return None
    # CJ categoryName often starts with the top-level; try exact then prefix on first segment
    first = re.split(r'[>/\->]', catname)[0]
    s = alias2slug.get(norm(first)) or alias2slug.get(norm(catname))
    return s

# ---- Shopify GraphQL helpers ----
import urllib.parse
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
    except Exception: pass
    return {'done': [], 'fixed': 0}

def save_state(state):
    try:
        mq = 'mutation set($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { metafields { id } userErrors { field message } } }'
        gql(mq, {'m': [{'ownerId': SHOP_GID, 'namespace': NS, 'key': KEY, 'type': 'json', 'value': json.dumps(state)}]})
    except Exception: pass

# ---- 1) bulk pull ----
BULK = '{ products { edges { node { id title status productType variants(first:1){edges{node{sku}}} } } } }'
mq = 'mutation { bulkOperationRunQuery(query: "' + BULK.replace('\n',' ') + '") { bulkOperation { id status } userErrors { field message } } }'
opId = None
for attempt in range(20):
    r = gql(mq)
    if is_throttled(r): time.sleep(min(10*(attempt+1),120)); continue
    ue = (r.get('data',{}).get('bulkOperationRunQuery',{}) or {}).get('userErrors')
    if ue: print('BULK USER ERRORS', ue, file=sys.stderr); sys.exit(1)
    d = (r.get('data',{}).get('bulkOperationRunQuery',{}) or {}).get('bulkOperation')
    if d and d.get('id'): opId = d['id']; break
if not opId: print('FAILED bulk create', file=sys.stderr); sys.exit(1)
print('bulk op', opId)

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
        # variant SKU line
        p = pid.split('/')[-1]
        if products and products[-1]['id'] == p and o.get('sku'):
            products[-1]['sku'] = o.get('sku')
        continue
    oid = o.get('id') or ''
    if 'gid://shopify/Product/' not in oid:
        continue
    if o.get('status') != 'ACTIVE': continue
    products.append({'id': oid.split('/')[-1], 'title': o.get('title') or '', 'product_type': o.get('productType'), 'sku': None})

print('active products:', len(products))

state = load_state()
done = set(state['done'])

# ---- 2) categorize this batch ----
changed = 0
ci_fixed = 0
title_fixed = 0
kept = 0
processed = 0
errors = []

for p in products:
    if processed >= MAX_PER_RUN: break
    pid = p['id']
    if pid in done: continue
    done.add(pid)
    processed += 1

    # (a) existing canonical top-level? keep (but re-judge if title strongly disagrees)
    cur_slug = pt_slug(p['product_type'])
    # (b) CJ authoritative
    cj = cj_category_name(p['sku']) if not cur_slug else None
    cj_slug = cj_top_slug(cj) if cj else None
    # (c) title fallback
    t_slug = title_slug(p['title'])

    new_slug = cj_slug or cur_slug or t_slug
    if not new_slug:
        new_slug = 'other'

    if new_slug in DISPLAY:
        new_name = DISPLAY[new_slug]
    else:
        new_name = 'Other'

    # decide counters
    if cj_slug: ci_fixed += 1
    elif cur_slug: kept += 1
    elif t_slug: title_fixed += 1

    # write back if the RAW product_type is not already the canonical display name
    raw_pt = p['product_type'] or ''
    if raw_pt == new_name:
        continue  # already clean

    try:
        req = urllib.request.Request(f"{API}/products/{pid}.json", method='PUT',
            data=json.dumps({'product': {'id': int(pid), 'product_type': new_name}}).encode(),
            headers={'Content-Type':'application/json','X-Shopify-Access-Token':TOKEN})
        urllib.request.urlopen(req, timeout=60)
        changed += 1
    except Exception as e:
        errors.append({'id': pid, 'error': str(e)})
    if changed % 25 == 0:
        print(f'  wrote {changed}...', flush=True)
    time.sleep(0.35)

state['done'] = sorted(done)
state['fixed'] = state.get('fixed', 0) + changed
save_state(state)

print(json.dumps({'processed': processed, 'changed': changed, 'cj_fixed': ci_fixed,
                  'kept': kept, 'title_fixed': title_fixed, 'errors': len(errors),
                  'total_done': len(done), 'total_products': len(products)}))
