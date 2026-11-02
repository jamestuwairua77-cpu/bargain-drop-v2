#!/usr/bin/env python3
import json, os, subprocess, urllib.request, urllib.error

ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
API_TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
ZONE_ID = os.environ.get("CLOUDFLARE_ZONE_ID", "557180fc0420b27f1e5216df26702e55").strip()

def cf_get(url):
    req = urllib.request.Request(url, headers={
        "Authorization": "Bearer " + API_TOKEN,
        "Content-Type": "application/json"
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read().decode("utf-8", errors="replace"))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")[:400]
    except Exception as e:
        return 0, str(e)

whoami_out = ""
try:
    p = subprocess.run(["npx", "--yes", "wrangler@latest", "whoami"], capture_output=True, text=True, timeout=30)
    whoami_out = (p.stdout or "") + "\n" + (p.stderr or "")
except Exception as e:
    whoami_out = str(e)

report = {
    "accountIdPrefix": ACCOUNT_ID[:6] if ACCOUNT_ID else "",
    "verify": cf_get("https://api.cloudflare.com/client/v4/user/tokens/verify"),
    "accounts": cf_get("https://api.cloudflare.com/client/v4/accounts"),
    "kv": cf_get("https://api.cloudflare.com/client/v4/accounts/" + ACCOUNT_ID + "/storage/kv/namespaces"),
    "pages": cf_get("https://api.cloudflare.com/client/v4/accounts/" + ACCOUNT_ID + "/pages/projects/bargain-drop"),
    "whoami": whoami_out[-1500:],
}

with open("cpagrip-probe.json", "w") as f:
    json.dump(report, f, indent=2)