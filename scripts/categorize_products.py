#!/usr/bin/env python3
"""Bargain Drop: re-categorize ALL active Shopify products to canonical top-level.

FAST path (this version):
  1. bulk READ (bulkOperationRunQuery) all products once.
  2. Resolve top-level locally (product_type string split + title keywords), CJ only
     for genuine unknowns (concurrent).
  3. Write back EVERYTHING in ONE bulkOperationRunMutation with productUpdate —
     Shopify processes the whole JSONL server-side, NOT subject to rate limits.
     This replaces ~3,800 serial productUpdate HTTP calls.

Reads env: SHOPIFY_STORE_DOMAIN, SHOPIFY_ACCESS_TOKEN, CJ_KEYS, MAX_PER_RUN.
"""
import os, sys, json, time, re, urllib.request, urllib.error, urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

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

# ---- CJ concurrent ----
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
    if not skus: return {}
    result = {}
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

# ---- Shopify GraphQL ----
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

# ---- 1) bulk READ ----
BULK = '{ products { edges { node { id title status productType variants(first:1){edges{node{sku}}} } } } }'
def gql_retry(q, variables=None, tries=20):
    for attempt in range(tries):
        try:
            r = gql(q, variables)
            if is_throttled(r): time.sleep(min(5*(attempt+1), 30)); continue
            return r
        except Exception:
            time.sleep(min(5*(attempt+1), 30))
    return None

r = gql_retry('mutation { bulkOperationRunQuery(query: "' + BULK.replace('\n', ' ') + '") { bulkOperation { id status } userErrors { field message } } }')
if not r or (r.get('data',{}).get('bulkOperationRunQuery',{}) or {}).get('userErrors'):
    print('BULK READ CREATE FAIL', r, file=sys.stderr); sys.exit(1)
opId = r['data']['bulkOperationRunQuery']['bulkOperation']['id']
print('bulk read op', opId, flush=True)

PQ = 'query($id: ID!){ node(id:$id){ ... on BulkOperation { id status url errorCode } } }'
url = None
for _ in range(240):
    rr = gql_retry(PQ, {'id': opId}, tries=5)
    if not rr: continue
    n = rr['data']['node']
    if n['status'] == 'COMPLETED': url = n['url']; break
    if n['status'] == 'FAILED': print('BULK READ FAIL', n.get('errorCode'), file=sys.stderr); sys.exit(1)
    time.sleep(3)
if not url: print('bulk read timeout', file=sys.stderr); sys.exit(1)

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
    if 'gid://shopify/Product/' not in oid: continue
    if o.get('status') != 'ACTIVE': continue
    products.append({'id': oid.split('/')[-1], 'title': o.get('title') or '', 'product_type': o.get('productType'), 'sku': None})

print('active products:', len(products), flush=True)

# ---- 2) local + CJ resolve ----
need_cj = []
plan = {}   # pid -> new_name
for p in products:
    pid = p['id']
    cur_slug = pt_slug(p['product_type')
    t_slug = title_slug(p['title'])
    new_slug = cur_slug or t_slug
    if new_slug and new_slug in DISPLAYY:
        plan[pid] = DISPLAY[new_slug]
    else:
        need_cj.append(p)

cj_skus = [p['sku'] for p in need_cj if p.get('sku')]
print('need CJ lookups:', len(cj_skus), flush=True)
cj_map = cj_prefetch(cj_skus) if cj_skus else {}
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

# ---- 3) filter to only products that actually need a write ----
# (raw product_type != canonical display name)
to_write = []
for p in products:
    pid = p['id']
    new_name = plan.get(pid)
    if not new_name: continu
    raw_pt = p['product_type'] or ''
    if raw_pt != new_name:
        to_write.append((pid, new_name))

print('products to write:', len(to_write), flush=True)

if not to_write:
    print(json.dumps({'changed': 0, 'errors': 0, 'total_products': len(products), 'to_write': 0}))
    sys.exit(0)

# ---- 4) BULK MUTATION write-back ----
# 4a. stagedUploadsCreate
r = gql_retry('''mutation { stagedUploadsCreate(input:[{ resource: BULK_MUTATION_VARIABLES, filename: "cat_vars", mimeType: "text/jsonl", httpMethod: POST }]) { userErrors { field message } stagedTargets { url parameters { name value } } }''')
if not r:
    print('STAGED UPLOAD FAIL', file=sys.stderr); sys.exit(1)
sd = r['data']['stagedUploadsCreate']
if sd['userErrors']:
    print('STAGED USER ERRORS', sd['userErrors'], file=sys.stderr); sys.exit(1)
target = sd['stagedTargets'][0]
upload_url = target['url']
params = {p['name']: p['value'] for p in target['parameters']}
staged_path = params.get('key')

# 4b. build JSONL variables
lines = []
for pid, name in to_write:
    lines.append(json.dumps({'input': {'id': f'gid://shopify/Product/{pid}', 'productType': name}}))
jsonl_body = '\n'.join(lines) + '\n'

# 4c. multipart upload to Google Storage
boundary = '----bargaindrop' + str(int(time.time()))
import uuid
boundary = '----bargaindrop' + uuid.uuid4().hex
parts = []
for k, v in params.items():
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n')
parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="cat_vars"\r\nContent-Type: text/jsonl\r\n\r\n{jsonl_body}\r\n')
parts.append(f'--{boundary}--\r\n')
body_bytes = ''.join(parts).encode('utf-8')

req = urllib.request.Request(upload_url, data=body_bytes, method='POST')
req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
try:
    upload_resp = urllib.request.urlopen(req, timeout=120)
    upload_status = upload_resp.status
except urllib.error.HTTPError as e:
    upload_status = e.code
    print('UPLOAD HTTP', e.code, e.read().decode()[:500], file=sys.stderr)
print('upload status:', upload_status, flush=True)

# 4d. bulkOperationRunMutation with productUpdate
MUT = 'mutation call($input: ProductUpdateInput!) { productUpdate(product: $input) { product { id } userErrors { field message } } }'
qm = 'mutation { bulkOperationRunMutation(mutation: ' + json.dumps(MUT) + ', stagedUploadPath: ' + json.dumps(staged_path) + ') { bulkOperation { id status } userErrors { field message } } }'
r = gql_retry(qm)
if not r:
    print('BULK MUT CREATE FAIL', file=sys.stderr); sys.exit(1)
bm = r['data']['bulkOperationRunMutation']
if bm['userErrors']:
    print('BULK MUT USER ERRORS', bm['userErrors'], file=sys.stderr); sys.exit(1)
mutOpId = bm['bulkOperation']['id']
print('bulk mutation op', mutOpId, flush=True)

# 4e. poll
BQ = 'query($id: ID!){ node(id:$id){ ... on BulkOperation { id status objectCount errorCode url } } }'
final = None
for _ in range(240):
    rr = gql_retry(BQ, {'id': mutOpId}, tries=5)
    if not rr: time.sleep(3); continue
    n = rr['data']['node']
    if n['status'] == 'COMPLETED':
        final = n; break
    if n['status'] == 'FAILED':
        print('BULK MUT FAIL', n.get('errorCode'), file=sys.stderr); sys.exit(1)
    time.sleep(3)

if not final:
    print('bulk mut timeout', file=sys.stderr); sys.exit(1)

print('bulk mutation COMPLETED, objectCount:', final.get('objectCount'), flush=True)

# optional: read result file to count errors
err_count = 0
if final.get('url'):
    try:
        rj = urllib.request.urlopen(final['url'], timeout=300).read().decode()
        for ln in rj.splitlines():
            d = json.loads(ln)
            if 'errors' in d or (d.get('data',{}).get('productUpdate',{}) or {}).get('userErrors'):
                err_count += 1
    except Exception:
        err_count = 0

changed = len(to_write) - err_count
print(json.dumps({'processed': len(plan), 'changed': changed, 'errors': err_count,
                  'to_write': len(to_write), 'total_products': len(products)}))
