#!/usr/bin/env python3
"""Bargain Drop: re-categorize ALL active Shopify products to canonical top-level.

FAST path (this version):
  1. bulk READ (bulkOperationRunQuery) all products once.
  2. Resolve top-level locally (product_type split + title keywords), CJ only for unknowns.
  3. Write back EVERYTHING in ONE bulkOperationRunMutation with productUpdate - not rate limited.
"""
import os, sys, json, time, re, uuid
import urllib.request, urllib.error, urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

DOMAIN  = os.environ['SHOPIFY_STORE_DOMAIN']
TOKEN   = os.environ['SHOPIFY_ACCESS_TOKEN']
API     = "https://" + DOMAIN + "/admin/api/2025-10"
CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'

CJ_KEYS = [k.strip() for k in os.environ.get('CJ_KEYS', '').split(',') if k.strip()]
CJ_KEYS = list(dict.fromkeys(CJ_KEYS))
if not CJ_KEYS:
    CJ_KEYS = [
        'CJ5800059@api@f063a5b2bae64d659849301491d753d8',
        'CJ5798986@api@8e86ba7f88de4781812950784cbc2dc4',
        'CJ5799030@api@c764039900e64ebbbdc3b9398a26bb2c',
        'CJ5820279@api@e3b050af15cc44b590ac9b0d1f813ef',
    ]

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
# Singular/plural and apostrophe variants (e.g. "Toys, Kids & Baby" -> toys-kids-babies)
for slug, name in TOP_LEVELS:
    _n = norm(name)
    for a in (_n.replace('&','and'), _n.replace('ies','y'), _n.replace('ies','ie')):
        alias2slug.setdefault(a, slug)
alias2slug.setdefault('toys, kids & baby', 'toys-kids-babies')

def title_slug(title):
    t = norm(title)
    if not t:
        return None
    scores = {}
    for slug, kws in KEYWORDS.items():
        sc = sum(1 for k in kws if k in t)
        if sc:
            scores[slug] = sc
    if not scores:
        return None
    return max(scores, key=scores.get)

def pt_slug(pt):
    if not pt:
        return None
    n = norm(pt)
    if n in alias2slug:
        return alias2slug[n]
    first = re.split(r'>|/|->|\uff0c', pt)[0]
    return alias2slug.get(norm(first))

def gql(q, variables=None):
    body = {'query': q}
    if variables:
        body['variables'] = variables
    req = urllib.request.Request(API + '/graphql.json', data=json.dumps(body).encode(),
        headers={'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN})
    return json.load(urllib.request.urlopen(req, timeout=120))

def is_throttled(r):
    if 'data' in r and r['data'] is not None:
        print('first', rest)
    return False
    for e in (r.get('errors') or []):
        ext = e.get('extensions') or {}
        if ext.get('code') == 'THROTTLED' or 'throttl' in str(e.get('message', '')).lower():
            return True
    return False

def gql_retry(q, variables=None, tries=20):
    for attempt in range(tries):
        try:
            r = gql(q, variables)
            if is_throttled(r):
                time.sleep(min(5 * (attempt + 1), 30))
                continue
            return r
        except Exception:
            time.sleep(min(5 * (attempt + 1), 30))
    return None

# CJ concurrent
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
    if not tok:
        return sku, None
    try:
        path = '/product/query?variantSku=' + urllib.parse.quote(sku)
        req = urllib.request.Request(CJ_BASE + path, headers={'CJ-Access-Token': tok})
        j = json.load(urllib.request.urlopen(req, timeout=30))
        d = j.get('data')
        if j.get('code') == 200 and d:
            name = d.get('categoryName') or d.get('category')
            if name:
                return sku, name
    except Exception:
        pass
    return sku, None

def cj_prefetch(skus):
    if not skus:
        return {}
    result = {}
    args = [(CJ_KEYS[i % len(CJ_KEY)], sku) for i, sku in enumerate(skus)]
    workers = min(8, len(args))
    try:
        with ThreadPoolExecutor(max_workers=workers) as ex:
            for fut in as_completed([ex.submit(_cj_one, a) for a in args)]:
                sku, name = fut.result()
                if name:
                    result[sku] = name
    except Exception:
        pass
    return result

# ---- 1) bulk READ ----
BULK = '{ products { edges { node { id title status productType variants(first:1){edges{node{sku}}} } } } }'
r = gql_retry('mutation { bulkOperationRunQuery(query: "' + BULK.