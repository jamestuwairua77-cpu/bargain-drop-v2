#!/usr/bin/env python3
import json
import os
import subprocess
import urllib.request
import urllib.error

ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
API_TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
ZONE_ID = os.environ.get("CLOUDFLARE_ZONE_ID", "557180fc0420b27f1e5216df26702e55").strip()

def cf_req(method, url, data=None, content_type="application/json"):
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": content_type,
        "User-Agent": "bargain-drop-deployer/1.0"
    }
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code} on {url}: {body[:300]}")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"error": body}
    except Exception as e:
        print(f"Error on {url}: {e}")
        return 0, {"error": str(e)}

def main():
    if not ACCOUNT_ID or not API_TOKEN:
        print("Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN")
        return

    script_name = "bargain-drop-cpagrip"
    if ZONE_ID:
        st, routes_data = cf_req("GET", f"https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/workers/routes")
        if st == 200 and routes_data.get("result"):
            for r in routes_data["result"]:
                pat = r.get("pattern", "")
                if "cpagrip" in pat and r.get("script"):
                    script_name = r["script"]
                    print(f"Found route {pat} -> script {script_name}")

    st, settings_data = cf_req("GET", f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/{script_name}/settings")
    bindings = []
    compat_date = "2025-10-01"
    if st == 200 and settings_data.get("result"):
        res = settings_data["result"]
        bindings = res.get("bindings", [])
        compat_date = res.get("compatibility_date") or compat_date
        print(f"Loaded existing settings for {script_name}: {len(bindings)} bindings")
    else:
        st_kv, kv_data = cf_req("GET", f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/storage/kv/namespaces?per_page=100")
        if st_kv == 200 and kv_data.get("result"):
            for ns in kv_data["result"]:
                title = ns.get("title", "").upper()
                if "CPAGRIP_CAMPAIGNS" in title or "CAMPAIGNS" in title:
                    bindings.append({"type": "kv_namespace", "name": "CPAGRIP_CAMPAIGNS", "namespace_id": ns["id"]})
                elif "CPAGRIP_BALANCE" in title or "BALANCE" in title:
                    bindings.append({"type": "kv_namespace", "name": "CPAGRIP_BALANCE", "namespace_id": ns["id"]})

    # Upload via multipart/form-data to Cloudflare Workers API
    boundary = "----BargainDropWorkerBoundary7MA4YWxkTrZu0gW"
    metadata = {
        "main_module": "worker.mjs",
        "compatibility_date": compat_date,
        "bindings": bindings
    }
    with open("functions/cpagrip.js", "rb") as f:
        worker_code = f.read()

    parts = []
    parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"metadata\"; filename=\"metadata.json\"\r\nContent-Type: application/json\r\n\r\n{json.dumps(metadata)}\r\n".encode("utf-8"))
    parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"worker.mjs\"; filename=\"worker.mjs\"\r\nContent-Type: application/javascript+module\r\n\r\n".encode("utf-8") + worker_code + b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode("utf-8"))
    body = b"".join(parts)

    put_url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/{script_name}"
    st_put, put_res = cf_req("PUT", put_url, data=body, content_type=f"multipart/form-data; boundary={boundary}")
    print(f"PUT Worker {script_name} status: {st_put}, success: {put_res.get('success')}")

if __name__ == "__main__":
    main()