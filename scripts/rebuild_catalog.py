#!/usr/bin/env python3
"""GitHub Actions catalog rebuild: fetch all active Shopify products via Bulk API,
build catalog shards (identical to functions/api/rebuild-data.js), and commit atomically.
Reads env: SHOPIFY_STORE_DOMAIN, SHOPIFY_ACCESS_TOKEN, GITHUB_TOKEN, REPO."""
import os, sys, json, time, urllib.request

DOMAIN = os.environ['SHOPIFY_STORE_DOMAIN']
TOKEN  = os.environ['SHOPIFY_ACCESS_TOKEN']
GH     = os.environ['GITHUB_TOKEN']
REPO   = os.environ['REPO']
BRANCH = 'main'
API    = f"https://{DOMAIN}/admin/api/2025-10"

def gql(query, variables=None):
    body = {'query': query}
    if variables: body['variables'] = variables
    req = urllib.request.Request(API + '/graphql.json', data=json.dumps(body).encode(),
        headers={'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN})
    return json.load(urllib.request.urlopen(req, timeout=120))

BULK_QUERY = """{ products { edges { node {
  id __typename title status bodyHtml vendor productType tags
  images(first:250){edges{node{id src}}}
  variants(first:250){edges{node{id price sku inventoryQuantity selectedOptions{name value} image{id}}}}
} } } }"""
mq = 'mutation { bulkOperationRunQuery(query: "' + BULK_QUERY.replace('\n',' ') + '") { bulkOperation { id status } userErrors { field message } } }'
r = gql(mq)
ue = r.get('data',{}).get('bulkOperationRunQuery',{}).get('userErrors')
if ue:
    print('BULK USER ERRORS:', ue, file=sys.stderr); sys.exit(1)
opId = r['data']['bulkOperationRunQuery']['bulkOperation']['id']
print('bulk op', opId)

PQ = 'query($id: ID!){ node(id:$id){ ... on BulkOperation { id status objectCount url errorCode } } }'
for _ in range(120):
    n = gql(PQ, {'id': opId})['data']['node']
    if n['status'] == 'COMPLETED':
        url = n['url']; break
    if n['status'] == 'FAILED':
        print('BULK FAILED', n.get('errorCode'), file=sys.stderr); sys.exit(1)
    time.sleep(3)
else:
    print('bulk timed out', file=sys.stderr); sys.exit(1)

jsonl = urllib.request.urlopen(url, timeout=300).read().decode()

products = {}
order = []
for line in jsonl.splitlines():
    s = line.strip()
    if not s: continue
    o = json.loads(s)
    if '__parentId' in o:
        pid = o['__parentId'].split('/')[-1]
        p = products.get(pid)
        if p is None: continue
        if 'sku' in o or 'price' in o:
            opts = o.get('selectedOptions') or []
            vals = [x.get('value') for x in opts]
            p['variants'].append({'option1': vals[0] if len(vals)>0 else None,
                                  'option2': vals[1] if len(vals)>1 else None,
                                  'option3': vals[2] if len(vals)>2 else None,
                                  'price': o.get('price'), 'sku': o.get('sku'),
                                  'available': (o.get('inventoryQuantity') or 0) > 0})
        if 'src' in o:
            p['images'].append(o.get('src'))
    else:
        if o.get('__typename') != 'Product': continue
        pid = o['id'].split('/')[-1]
        products[pid] = {'id': pid, 'title': o.get('title'), 'status': o.get('status'),
                         'body_html': o.get('bodyHtml') or '', 'vendor': o.get('vendor'),
                         'product_type': o.get('productType'), 'tags': o.get('tags'),
                         'variants': [], 'images': []}
        order.append(pid)

prods = [products[pid] for pid in order if products[pid]['status'] == 'ACTIVE' and (products[pid]['title'] or '').strip()]
print('active+titled products:', len(prods))

cats, all_, idx = {}, [], {}
for p in prods:
    imgs = []
    for s in p['images']:
        if s and s not in imgs: imgs.append(s)
    vars_list = p['variants']
    price = float(vars_list[0]['price'] or 0) if vars_list else 0
    all_.append({'id': p['id'], 'title': p['title'], 'price': price,
                 'image': imgs[0] if imgs else None, 'images': imgs,
                 'body_html': p['body_html'], 'vendor': p['vendor'],
                 'product_type': p['product_type'], 'tags': p['tags'], 'variants': vars_list})
    ptype = p['product_type'] or 'other'
    key = ptype.lower().replace(' & ', '-').replace(' ', '-').replace('"','').replace("'",'').replace(',','')
    if key not in cats: cats[key] = {'name': ptype, 'products': []}
    cats[key]['products'].append({'id': p['id'], 'title': p['title'], 'price': price,
        'image': imgs[0] if imgs else None, 'body_html': p['body_html'], 'vendor': p['vendor'],
        'product_type': p['product_type'], 'variants': len(vars_list), 'images': len(imgs)})
    idx[p['id']] = {'idx': len(cats[key]['products'])-1, 'category': key}

def shard(arr, size):
    return [arr[i:i+size] for i in range(0, len(arr), size)]

p_shards = shard(all_, 1200)
catObjs = [{'key': k, 'name': v['name'], 'products': v['products']} for k, v in cats.items()]
c_shards = []
cur, cnt = [], 0
for c in catObjs:
    pc = len(c['products'])
    if cur and cnt + pc > 6000:
        c_shards.append(cur); cur = []; cnt = 0
    cur.append(c); cnt += pc
if cur: c_shards.append(cur)

files = {}
for i, s in enumerate(p_shards):
    files[f'all-products-{i}.json'] = json.dumps(s, ensure_ascii=False)
files['all-products.json'] = json.dumps({'shards': len(p_shards), 'count': len(all_)})
for i, s in enumerate(c_shards):
    files[f'categories-data-{i}.json'] = json.dumps(s, ensure_ascii=False)
files['categories-data.json'] = json.dumps({'shards': len(c_shards), 'count': len(catObjs)})
files['products-index.json'] = json.dumps(idx)

print('product shards:', len(p_shards), 'category shards:', len(c_shards), 'index:', len(idx))

GHAPI = f'https://api.github.com/repos/{REPO}'
HDR = {'Authorization': 'Bearer ' + GH, 'Accept': 'application/vnd.github+json', 'User-Agent': 'bargain-drop-rebuild'}

def gh(url, method='GET', data=None):
    hdr = dict(HDR)
    if method != 'GET': hdr['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, method=method, headers=hdr)
    body = json.dumps(data).encode() if data is not None else None
    resp = urllib.request.urlopen(req, data=body, timeout=120)
    return json.load(resp)

ref = gh(f'{GHAPI}/git/ref/heads/{BRANCH}')
base_sha = ref['object']['sha']
commit = gh(f'{GHAPI}/git/commits/{base_sha}')
base_tree = commit['tree']['sha']

entries = []
for path, content in files.items():
    b = gh(f'{GHAPI}/git/blobs', 'POST', {'content': content, 'encoding': 'utf-8'})
    entries.append({'path': path, 'mode': '100644', 'type': 'blob', 'sha': b['sha']})

tree = gh(f'{GHAPI}/git/trees', 'POST', {'base_tree': base_tree, 'tree': entries})
new_commit = gh(f'{GHAPI}/git/commits', 'POST', {
    'message': 'data: full catalog rebuild (12k) from GitHub Actions',
    'tree': tree['sha'], 'parents': [base_sha]})
gh(f'{GHAPI}/git/refs/heads/{BRANCH}', 'PATCH', {'sha': new_commit['sha']})

print('COMMITTED', new_commit['sha'], 'products', len(all_))
