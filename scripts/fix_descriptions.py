#!/usr/bin/env python3
"""Bargain Drop: write composed body_html descriptions to Shopify via bulk productUpdate."""
import os, sys, json, time, uuid
import urllib.request, urllib.error

DOMAIN = os.environ['SHOPIFY_STORE_DOMAIN']
TOKEN  = os.environ['SHOPIFY_ACCESS_TOKEN']
API    = "https://" + DOMAIN + "/admin/api/2025-10"
DATA   = os.environ.get('DESC_DATA', 'scripts/desc-fix-data/writeback_list.json')

def gql(q, variables=None):
    body = {'query': q}
    if variables:
        body['variables'] = variables
    req = urllib.request.Request(API + '/graphql.json', data=json.dumps(body).encode(),
        headers={'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN})
    return json.load(urllib.request.urlopen(req, timeout=120))

def gql_raw(q, variables=None, tries=20):
    """Return raw response + surface errors."""
    last = None
    for attempt in range(tries):
        try:
            r = gql(q, variables)
            last = r
            if 'data' in r and r['data'] is not None:
                return r
            # has errors
            errs = r.get('errors') or []
            # if throttled, retry
            throttled = any((e.get('extensions') or {}).get('code') == 'THROTTLED' or 'throttl' in str(e.get('message','')).lower() for e in errs)
            if not throttled:
                print('GQL ERROR (non-throttle):', json.dumps(errs)[:800], file=sys.stderr, flush=True)
                return r
            print(f'THROTTLED attempt {attempt+1}', file=sys.stderr, flush=True)
            time.sleep(5)
        except Exception as e:
            last = {'__exception__': str(e)[:300]}
            print(f'EXCEPTION attempt {attempt+1}:', str(e)[:300], file=sys.stderr, flush=True)
            time.sleep(min(5*(attempt+1), 30))
    return last

def main():
    wb = json.load(open(DATA))
    print('writeback items', len(wb), flush=True)
    if not wb:
        print(json.dumps({'total_ok': 0, 'total_err': 0})); return

    CHUNK = 2000
    chunks = [wb[i:i+CHUNK] for i in range(0, len(wb), CHUNK)]
    print('chunks', len(chunks), flush=True)

    total_ok = 0; total_err = 0
    for ci, chunk in enumerate(chunks):
        r = gql_raw('mutation { stagedUploadsCreate(input:[{ resource: BULK_MUTATION_VARIABLES, filename: "desc_vars", mimeType: "text/jsonl", httpMethod: POST }]) { userErrors { field message } stagedTargets { url parameters { name value } } } }')
        sd = (r or {}).get('data',{}).get('stagedUploadsCreate') if isinstance(r, dict) else None
        if not sd:
            print('STAGED UPLOAD FAIL', json.dumps(r)[:600], file=sys.stderr, flush=True); sys.exit(1)
        if sd.get('userErrors'):
            print('STAGED USER ERRORS', json.dumps(sd['userErrors'])[:600], file=sys.stderr, flush=True); sys.exit(1)
        target = sd['stagedTargets'][0]
        upload_url = target['url']
        params = {p['name']: p['value'] for p in target['parameters']}
        staged_path = params.get('key')

        lines = [json.dumps({'input': {'id': 'gid://shopify/Product/' + it['id'], 'bodyHtml': it['body_html']}}) for it in chunk]
        jsonl_body = '\n'.join(lines) + '\n'

        boundary = '----bd' + uuid.uuid4().hex
        parts = []
        for k, v in params.items():
            parts.append('--'+boundary+'\r\nContent-Disposition: form-data; name="'+k+'"\r\n\r\n'+v+'\r\n')
        parts.append('--'+boundary+'\r\nContent-Disposition: form-data; name="file"; filename="desc_vars"\r\nContent-Type: text/jsonl\r\n\r\n'+jsonl_body+'\r\n')
        parts.append('--'+boundary+'--\r\n')
        body_bytes = ''.join(parts).encode('utf-8')

        req = urllib.request.Request(upload_url, data=body_bytes, method='POST')
        req.add_header('Content-Type', 'multipart/form-data; boundary='+boundary)
        try:
            ur = urllib.request.urlopen(req, timeout=120); us = ur.status
        except urllib.error.HTTPError as e:
            us = e.code
            print('UPLOAD HTTP', e.code, e.read().decode()[:500], file=sys.stderr, flush=True)
        print(f'chunk {ci} upload status {us}', flush=True)
        if us not in (200, 201):
            sys.exit(1)

        MUT = 'mutation call($input: ProductUpdateInput!) { productUpdate(product: $input) { product { id } userErrors { field message } } }'
        qm = 'mutation { bulkOperationRunMutation(mutation: ' + json.dumps(MUT) + ', stagedUploadPath: ' + json.dumps(staged_path) + ') { bulkOperation { id status } userErrors { field message } } }'
        r = gql_raw(qm)
        bm = (r or {}).get('data',{}).get('bulkOperationRunMutation') if isinstance(r, dict) else None
        if not bm:
            print('BULK MUT CREATE FAIL', json.dumps(r)[:600], file=sys.stderr, flush=True); sys.exit(1)
        if bm.get('userErrors'):
            print('BULK MUT USER ERRORS', json.dumps(bm['userErrors'])[:600], file=sys.stderr, flush=True)
            if any('in progress' in str(e.get('message','')).lower() for e in bm['userErrors']):
                print('busy; sleep 60 then retry', flush=True); time.sleep(60); continue
            sys.exit(1)
        opid = bm['bulkOperation']['id']
        print(f'chunk {ci} bulk op {opid}', flush=True)

        BQ = 'query($id: ID!){ node(id:$id){ ... on BulkOperation { id status objectCount errorCode url } } }'
        final = None
        for _ in range(500):
            rr = gql_raw(BQ, {'id': opid}, tries=5)
            n = (rr or {}).get('data',{}).get('node') if isinstance(rr, dict) else None
            if not n:
                time.sleep(3); continue
            if n['status'] == 'COMPLETED':
                final = n; break
            if n['status'] == 'FAILED':
                print('BULK MUT FAIL', n.get('errorCode'), file=sys.stderr, flush=True); sys.exit(1)
            time.sleep(3)
        if not final:
            print('timeout', file=sys.stderr, flush=True); sys.exit(1)

        err_count = 0
        if final.get('url'):
            try:
                rj = urllib.request.urlopen(final['url'], timeout=300).read().decode()
                for ln in rj.splitlines():
                    d = json.loads(ln)
                    if 'errors' in d or (d.get('data',{}).get('productUpdate',{}) or {}).get('userErrors'):
                        err_count += 1
            except Exception as e:
                print('result parse err', str(e)[:200], file=sys.stderr, flush=True)
        ok = len(chunk) - err_count
        total_ok += ok; total_err += err_count
        print(f'chunk {ci} COMPLETED ok={ok} err={err_count}', flush=True)

    print(json.dumps({'total_ok': total_ok, 'total_err': total_err, 'chunks': len(chunks)}), flush=True)

if __name__ == '__main__':
    main()
