#!/usr/bin/env python3
import json
import os
import urllib.request
import urllib.error

ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
API_TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
ZONE_ID = os.environ.get("CLOUDFLARE_ZONE_ID", "557180fc0420b27f1e5216df26702e55").strip()


def cf_req(method, url, data=None, content_type="application/json"):
    headers = {
        "Authorization": "Bearer " + API_TOKEN,
        "Content-Type": content_type,
        "User-Agent": "bargain-drop-deployer/1.0",
    }
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            return resp.status, json.loads(raw)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print("HTTP", e.code, "on", url, ":", body[:400])
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"error": body[:400]}
    except Exception as e:
        print("Error on", url, ":", str(e))
        return 0, {"error": str(e)}


def build_multipart(boundary, metadata_dict, worker_bytes):
    crlf = b"\r\n"
    b_bound = ("--" + boundary).encode("utf-8")
    meta_json = json.dumps(metadata_dict).encode("utf-8")

    chunks = [
        b_bound,
        b'Content-Disposition: form-data; name="metadata"; filename="metadata.json"',
        b"Content-Type: application/json",
        b"",
        meta_json,
        b_bound,
        b'Content-Disposition: form-data; name="worker.mjs"; filename="worker.mjs"',
        b"Content-Type: application/javascript+module",
        b"",
        worker_bytes,
        b_bound + b"--",
        b"",
    ]
    return crlf.join(chunks)


def main():
    report = {
        "hasAccountId": bool(ACCOUNT_ID),
        "hasApiToken": bool(API_TOKEN),
        "zoneId": ZONE_ID,
        "steps": [],
    }

    if not ACCOUNT_ID or not API_TOKEN:
        report["error"] = "Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN"
        with open("cpagrip-deploy-status.json", "w") as f:
            json.dump(report, f, indent=2)
        return

    target_scripts = ["bargain-drop-cpagrip"]

    # 1. Check Zone Worker routes
    if ZONE_ID:
        st_r, routes_data = cf_req(
            "GET",
            "https://api.cloudflare.com/client/v4/zones/" + ZONE_ID + "/workers/routes",
        )
        report["steps"].append({"step": "zone_routes", "status": st_r, "result": routes_data.get("result")})
        if st_r == 200 and isinstance(routes_data.get("result"), list):
            for r in routes_data["result"]:
                pat = str(r.get("pattern", ""))
                scr = r.get("script")
                if "cpagrip" in pat and scr and scr not in target_scripts:
                    target_scripts.insert(0, scr)

    # 2. Check Account Worker scripts list
    st_s, scripts_data = cf_req(
        "GET",
        "https://api.cloudflare.com/client/v4/accounts/" + ACCOUNT_ID + "/workers/scripts",
    )
    if st_s == 200 and isinstance(scripts_data.get("result"), list):
        found_names = [s.get("id") for s in scripts_data["result"] if s.get("id")]
        report["steps"].append({"step": "list_scripts", "status": st_s, "scripts": found_names})
        for name in found_names:
            if "cpagrip" in name.lower() and name not in target_scripts:
                target_scripts.append(name)
    else:
        report["steps"].append({"step": "list_scripts", "status": st_s, "error": scripts_data.get("errors")})

    with open("functions/cpagrip.js", "rb") as f:
        worker_code = f.read()

    boundary = "----BargainDropWorkerBoundary7MA4YWxkTrZu0gW"

    for script_name in target_scripts:
        st_set, settings_data = cf_req(
            "GET",
            "https://api.cloudflare.com/client/v4/accounts/"
            + ACCOUNT_ID
            + "/workers/scripts/"
            + script_name
            + "/settings",
        )
        bindings = []
        compat_date = "2025-10-01"
        if st_set == 200 and isinstance(settings_data.get("result"), dict):
            res = settings_data["result"]
            bindings = res.get("bindings") or []
            compat_date = res.get("compatibility_date") or compat_date

        metadata = {
            "main_module": "worker.mjs",
            "compatibility_date": compat_date,
            "keep_bindings": ["kv_namespace", "plain_text", "secret_text"],
        }
        if bindings:
            metadata["bindings"] = bindings

        body = build_multipart(boundary, metadata, worker_code)
        put_url = (
            "https://api.cloudflare.com/client/v4/accounts/"
            + ACCOUNT_ID
            + "/workers/scripts/"
            + script_name
        )
        st_put, put_res = cf_req(
            "PUT",
            put_url,
            data=body,
            content_type="multipart/form-data; boundary=" + boundary,
        )
        report["steps"].append(
            {
                "step": "put_worker",
                "script": script_name,
                "settingsStatus": st_set,
                "bindingsCount": len(bindings),
                "putStatus": st_put,
                "putSuccess": put_res.get("success"),
                "putErrors": put_res.get("errors"),
            }
        )

    with open("cpagrip-deploy-status.json", "w") as f:
        json.dump(report, f, indent=2)


if __name__ == "__main__":
    main()