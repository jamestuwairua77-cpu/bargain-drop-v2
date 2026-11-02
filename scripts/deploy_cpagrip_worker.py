#!/usr/bin/env python3
import json, os, subprocess, urllib.request, urllib.error

all_sec_raw = os.environ.get("ALL_SECRETS", "{}")
try:
    all_sec = json.loads(all_sec_raw)
except Exception:
    all_sec = {}

ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
API_TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()

whoami_out = ""
try:
    p = subprocess.run(["npx", "--yes", "wrangler@latest", "whoami"], capture_output=True, text=True, timeout=30)
    whoami_out = (p.stdout or "") + "\n" + (p.stderr or "")
except Exception as e:
    whoami_out = str(e)

report = {
    "secretKeys": list(all_sec.keys()),
    "whoami": whoami_out[-1500:],
}

with open("cpagrip-probe.json", "w") as f:
    json.dump(report, f, indent=2)