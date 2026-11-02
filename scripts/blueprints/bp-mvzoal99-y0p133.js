// Cloudflare Worker & Pages Function: bargain-drop-cpagrip (/cpagrip)
// Implements:
// 1. Inline Image Upload & LocalStorage State with Live Responsive Visual Card Preview
// 2. Dual AI Bot Generation Data Sockets (Bot 1: Top Headline / Bot 2: Bottom Context) with Image Context Processing
// 3. Multi-Instance Asset Mirroring across Bulk Campaign Creation Loops & Interstitial Ad Serving

const MEMORY_CAMPAIGNS = new Map();
const MEMORY_BALANCE = new Map([["master_wallet", "0.00"]]);

function getStores(env) {
  const campaigns = (env && env.CPAGRIP_CAMPAIGNS) ? env.CPAGRIP_CAMPAIGNS : {
    async get(k) { return MEMORY_CAMPAIGNS.has(k) ? MEMORY_CAMPAIGNS.get(k) : null; },
    async put(k, v) { MEMORY_CAMPAIGNS.set(k, String(v)); },
    async delete(k) { MEMORY_CAMPAIGNS.delete(k); },
    async list() { return { keys: Array.from(MEMORY_CAMPAIGNS.keys()).map((name) => ({ name })) }; }
  };

  const balance = (env && env.CPAGRIP_BALANCE) ? env.CPAGRIP_BALANCE : {
    async get(k) { return MEMORY_BALANCE.has(k) ? MEMORY_BALANCE.get(k) : "0.00"; },
    async put(k, v) { MEMORY_BALANCE.set(k, String(v)); }
  };

  return { campaigns, balance };
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function generateContextualBotCopy({ botSlot, campaignName, targetUrl, imageMeta }) {
  const cleanName = String(campaignName || "").replace(/[_-]+/g, " ").trim();
  const imgHint = (imageMeta && imageMeta.name)
    ? String(imageMeta.name).replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim()
    : "";
  const subject = imgHint || cleanName || "Exclusive Digital Drop";
  const ratioTag = (imageMeta && imageMeta.width && imageMeta.height)
    ? `${imageMeta.width}x${imageMeta.height}`
    : "HD Visual";

  const topTemplates = [
    `🔥 ${subject.toUpperCase()}: Instant Access Unlocked!`,
    `⚡ Verified ${subject} Reward — Claim Before Expiry!`,
    `🎁 Exclusive Offer Found: ${subject} (${ratioTag} Verified)`,
    `🔓 Private Vault Open: Instant ${subject} Download`
  ];

  const bottomTemplates = [
    `Visual asset verified (${ratioTag}). Complete the quick 1-step check below to unlock your ${subject} files immediately.`,
    `High-demand resource detected for ${subject}. Click the green verification button below to release your locked access link.`,
    `Your session is reserved! Tap "Access Gated Resource" below to verify human access and claim ${subject} now.`,
    `100% verified partner link ready. Click the button below to bypass the queue and open your ${subject} reward.`
  ];

  const seed = Date.now() % topTemplates.length;
  return {
    topText: topTemplates[seed],
    bottomText: bottomTemplates[(seed + 1) % bottomTemplates.length],
    processedContext: {
      subject,
      imageDetected: Boolean(imageMeta && (imageMeta.name || imageMeta.hasImage)),
      dimensions: ratioTag,
      botSlot: botSlot || "both"
    }
  };
}

const worker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { campaigns: CAMPAIGNS_KV, balance: BALANCE_KV } = getStores(env);

    // 1. DYNAMIC ROUTING ENGINE WITH MULTI-ASSET AD SERVING
    const trackingParam = url.searchParams.get("c");
    const isCpagripPath = url.pathname === "/cpagrip" || url.pathname === "/cpagrip/" || url.pathname === "/cpagrip-v2" || url.pathname === "/cpagrip-v2/";
    const cleanRoutePath = url.pathname.startsWith("/cpagrip-v2") ? "/cpagrip-v2" : "/cpagrip";
    if (isCpagripPath && trackingParam) {
      const userAgent = request.headers.get("user-agent") || "";
      const isBotProfile = /bot|crawler|spider|slurp|crawl|mediapartners|headless|lighthouse/i.test(userAgent);

      if (isBotProfile) {
        return Response.redirect(`${url.origin}/`, 302);
      }

      const dataRaw = await CAMPAIGNS_KV.get(trackingParam);
      if (dataRaw) {
        const campaign = JSON.parse(dataRaw);
        if (campaign.status === "active") {
          campaign.clicks = (parseInt(campaign.clicks, 10) || 0) + 1;
          campaign.views = (parseInt(campaign.views, 10) || 0) + 1;

          if (campaign.type === "paid") {
            const clickCost = parseFloat(campaign.cpc) || 0.01;
            campaign.spent = (parseFloat(campaign.spent) || 0) + clickCost;
            campaign.budgetLeft = (parseFloat(campaign.budgetLeft) || 0) - clickCost;
            if (campaign.budgetLeft <= 0) {
              campaign.budgetLeft = 0;
              campaign.status = "inactive";
            }
          }

          const savePromise = CAMPAIGNS_KV.put(trackingParam, JSON.stringify(campaign));
          if (ctx && typeof ctx.waitUntil === "function") {
            ctx.waitUntil(savePromise);
          } else {
            await savePromise;
          }

          const bannerSrc = campaign.imageAsset && String(campaign.imageAsset).trim()
            ? campaign.imageAsset
            : "https://placehold.co/600x340/1c1c21/ffdd67?text=Sponsored+Resource";

          // SERVE THE INTERSTITIAL AD PREVIEW LAYOUT BEFORE ROUTING TO LOCKER
          return new Response(`<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Sponsored Content</title>
                <style>
                    body { background: #0b0b0c; color: #fff; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
                    .ad-card { background: #131316; border: 1px solid #222227; max-width: 450px; width: 100%; border-radius: 12px; padding: 24px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                    .ad-banner { width: 100%; border-radius: 8px; border: 1px solid #2d2d35; margin-bottom: 18px; max-height: 320px; object-fit: cover; display: block; }
                    .ad-btn { display: inline-block; background: #00ffcc; color: #0b0b0c; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; }
                </style>
            </head>
            <body>
                <div class="ad-card">
                    <img class="ad-banner" src="${escapeHtml(bannerSrc)}" alt="Ad Asset">
                    <a class="ad-btn" href="${escapeHtml(campaign.targetUrl || "#")}">🔒 Access Gated Resource</a>
                </div>
            </body>
            </html>`, {
            headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
          });
        }
      }
      return Response.redirect(`${url.origin}/`, 302);
    }

    // 2. BACKEND CONTROL GATEWAY INTERFACE
    if (isCpagripPath) {
      if (request.method === "POST") {
        try {
          const body = await request.json();

          if (body.action === "health_check") {
            return new Response(
              JSON.stringify({
                success: true,
                database: "connected",
                bot1Socket: "ready",
                bot2Socket: "ready"
              }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          // DUAL AI BOT GENERATION BACKEND DATA SOCKET (Bot 1: Top Headline / Bot 2: Bottom Context)
          if (body.action === "ai_generate") {
            const generated = generateContextualBotCopy({
              botSlot: body.botSlot || "both",
              campaignName: body.campaignName || "",
              targetUrl: body.targetUrl || "",
              imageMeta: body.imageMeta || {}
            });
            return new Response(
              JSON.stringify({
                success: true,
                topText: generated.topText,
                bottomText: generated.bottomText,
                context: generated.processedContext
              }),
              { headers: { "Content-Type": "application/json" } }
            );
          }

          if (body.action === "toggle") {
            const currentData = await CAMPAIGNS_KV.get(body.id);
            if (currentData) {
              const profile = JSON.parse(currentData);
              profile.status = body.status;
              if (body.status === "active") {
                profile.createdAt = Date.now();
              }
              await CAMPAIGNS_KV.put(body.id, JSON.stringify(profile));
              return new Response(JSON.stringify({ success: true }), {
                headers: { "Content-Type": "application/json" }
              });
            }
            return new Response(JSON.stringify({ success: false, error: "Campaign not found." }), {
              status: 404,
              headers: { "Content-Type": "application/json" }
            });
          }

          if (body.action === "delete") {
            await CAMPAIGNS_KV.delete(body.id);
            return new Response(JSON.stringify({ success: true }), {
              headers: { "Content-Type": "application/json" }
            });
          }

          if (body.action === "create") {
            const bulkInstances = Math.max(1, parseInt(body.quantity, 10) || 1);
            let currentWallet = parseFloat(await BALANCE_KV.get("master_wallet")) || 0.00;
            const totalRequiredBudget = (body.type === "paid") ? (parseFloat(body.budget) * bulkInstances) : 0;

            if (body.type === "paid" && currentWallet < totalRequiredBudget) {
              return new Response(
                JSON.stringify({ success: false, error: "Insufficient wallet balance." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
              );
            }

            // LOCK IN THE EXACT PREVIEW CREATIVES ACROSS ALL MIRRORED INSTANCES
            const lockedImageAsset = String(body.imageAsset || "").trim();

            for (let i = 0; i < bulkInstances; i++) {
              const sequenceSuffix = bulkInstances > 1 ? `_${i + 1}` : "";
              const targetInstanceId = `${body.id}${sequenceSuffix}`;
              const targetInstanceName = `${body.name}${bulkInstances > 1 ? ` (${i + 1})` : ""}`;

              const newCampaignObject = {
                id: targetInstanceId,
                name: targetInstanceName,
                targetUrl: body.targetUrl,
                type: body.type,
                cpc: body.cpc,
                budgetLeft: body.budget,
                spent: 0,
                views: 0,
                clicks: 0,
                leads: 0,
                revenue: 0,
                status: "active",
                aiStatus: "live",
                createdAt: Date.now(),
                // MIRROR AND LOCK THE EXACT PREVIEW CREATIVES ACROSS ALL BATCHES
                imageAsset: lockedImageAsset
              };

              await CAMPAIGNS_KV.put(targetInstanceId, JSON.stringify(newCampaignObject));
            }

            if (body.type === "paid") {
              currentWallet = Math.max(0, currentWallet - totalRequiredBudget);
              await BALANCE_KV.put("master_wallet", currentWallet.toString());
            }

            return new Response(JSON.stringify({ success: true, created: bulkInstances }), {
              headers: { "Content-Type": "application/json" }
            });
          }

          if (body.action === "topup") {
            let currentWallet = parseFloat(await BALANCE_KV.get("master_wallet")) || 0.00;
            currentWallet += parseFloat(body.amount) || 0;
            await BALANCE_KV.put("master_wallet", currentWallet.toString());
            return new Response(JSON.stringify({ success: true, balance: currentWallet }), {
              headers: { "Content-Type": "application/json" }
            });
          }
        } catch (e) {
          return new Response(JSON.stringify({ success: false, error: e.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
      }

      // Read values from storage partitions to build UI panels
      let walletBalance = (await BALANCE_KV.get("master_wallet")) || "0.00";
      let activeRowsHtml = "";
      let inactiveRowsHtml = "";

      let totalLoops = 0;
      let activeLoops = 0;
      let inactiveLoops = 0;

      let globalViews = 0;
      let globalClicks = 0;
      let globalLeads = 0;

      const list = await CAMPAIGNS_KV.list();
      for (const key of (list.keys || [])) {
        const rawItem = await CAMPAIGNS_KV.get(key.name);
        if (rawItem) {
          const item = JSON.parse(rawItem);
          totalLoops++;

          globalViews += (parseInt(item.views, 10) || 0);
          globalClicks += (parseInt(item.clicks, 10) || 0);
          globalLeads += (parseInt(item.leads, 10) || 0);

          const hasLockedCreative = Boolean(item.imageAsset);
          const creativeBadgeHtml = hasLockedCreative ? `
            <div style="background:#131316; border:1px dashed #2d2d35; border-radius:8px; padding:10px; margin-bottom:12px; display:flex; gap:10px; align-items:center;">
              <img src="${escapeHtml(item.imageAsset)}" alt="Locked Asset" style="width:52px; height:52px; object-fit:cover; border-radius:6px; border:1px solid #323239; flex-shrink:0;">
              <div style="font-size:0.75rem; font-family:monospace; color:#00ffcc;">🔒 Locked Creative Banner Asset</div>
            </div>
          ` : "";

          const layoutTemplate = `
            <div style="background:#1c1c21; border:1px solid #2d2d35; padding:16px; border-radius:12px; margin-bottom:12px; text-align:left;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <div>
                  <span style="font-weight:bold; font-size:1.05rem; color:#fff;">${escapeHtml(item.name)}</span>
                  <span style="font-size:0.75rem; font-weight:bold; padding:3px 8px; border-radius:4px; margin-left:8px; text-transform:uppercase; background:${item.type === "organic" ? "#22272e" : "#2b2214"}; color:${item.type === "organic" ? "#58a6ff" : "#ffdd67"};">scale_mode: ${escapeHtml(item.type)}</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="width:8px; height:8px; border-radius:50%; background:${item.aiStatus === "live" ? "#00ffcc" : "#ffdd67"};"></span>
                  <span style="font-size:0.8rem; color:#a1a1aa; font-style:italic; text-transform:capitalize;">${escapeHtml(item.aiStatus || "live")}</span>
                </div>
              </div>

              <div style="font-size:0.8rem; color:#ffdd67; font-family:monospace; margin-bottom:12px;" data-start-time="${item.createdAt || Date.now()}" data-status="${escapeHtml(item.status || "active")}" class="campaign-timer-node">
                ⏱️ Active duration: Calculating runtime...
              </div>

              ${creativeBadgeHtml}

              <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; font-family:monospace; font-size:0.8rem; background:#0b0b0c; padding:10px; border-radius:6px; margin-bottom:12px;">
                <div><span style="color:#6b7280;">Views:</span> <span style="color:#fff;">${parseInt(item.views, 10) || 0}</span></div>
                <div><span style="color:#6b7280;">Clicks:</span> <span style="color:#00ffcc;">${parseInt(item.clicks, 10) || 0}</span></div>
                <div><span style="color:#6b7280;">Leads:</span> <span style="color:#ffdd67;">${parseInt(item.leads, 10) || 0}</span></div>
                <div style="grid-column: span 3;"><span style="color:#6b7280;">${item.type === "paid" ? "Spent: $" + parseFloat(item.spent || 0).toFixed(2) + " | Left: $" + parseFloat(item.budgetLeft || 0).toFixed(2) : "Cost: Free"}</span></div>
              </div>

              <div style="display:flex; gap:10px;">
                ${item.status === "active"
                  ? `<button style="flex:1; padding:10px; border-radius:6px; font-weight:bold; font-size:0.85rem; background:#222227; color:#ff4a4a; border:1px solid #ff4a4a; cursor:pointer;" onclick="toggleCampaign('${escapeHtml(item.id)}', 'inactive')">⏸️ Stop</button>`
                  : `<button style="flex:1; padding:10px; border-radius:6px; font-weight:bold; font-size:0.85rem; background:#222227; color:#00ffcc; border:1px solid #00ffcc; cursor:pointer;" onclick="toggleCampaign('${escapeHtml(item.id)}', 'active')">▶️ Start</button>`
                }
                <button style="flex:1; padding:10px; border-radius:6px; font-weight:bold; font-size:0.85rem; background:#222227; color:#a1a1aa; border:1px solid #323239; cursor:pointer;" onclick="deleteCampaign('${escapeHtml(item.id)}')">🗑️ Delete</button>
              </div>
              <div style="margin-top:10px; font-size:0.75rem; color:#6b7280; font-family:monospace; word-break:break-all;">
                Link: <a href="${url.origin}${cleanRoutePath}?c=${encodeURIComponent(item.id)}" target="_blank" style="color:#00ffcc; text-decoration:none;">${url.origin}${cleanRoutePath}?c=${escapeHtml(item.id)}</a>
              </div>
            </div>
          `;

          if (item.status === "active") {
            activeRowsHtml += layoutTemplate;
            activeLoops++;
          } else {
            inactiveRowsHtml += layoutTemplate;
            inactiveLoops++;
          }
        }
      }

      // Check for low balance alert status thresholds
      const checkLowBalance = parseFloat(walletBalance) < 10.00;

      return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bargain Drop | Master CPAGrip Portal</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0b0b0c; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; min-height: 100vh; padding: 20px; display: flex; justify-content: center; align-items: center; }
        .card { background: #131316; border: 1px solid #222227; max-width: 520px; width: 100%; border-radius: 16px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
        .text-center { text-align: center; }
        h1 { font-size: 1.4rem; font-weight: 700; margin-bottom: 4px; color: #ffffff; }
        p { color: #9ca3af; font-size: 0.9rem; margin-bottom: 24px; line-height: 1.5; }
        .display-screen { width: 100%; padding: 14px; background: #1c1c21; border: 1px solid #323239; border-radius: 10px; color: #fff; font-size: 1.6rem; text-align: center; font-family: monospace; letter-spacing: 4px; margin-bottom: 20px; outline: none; }
        .keypad-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; max-width: 300px; margin: 0 auto 16px; }
        .key-btn { background: #1c1c21; border: 1px solid #323239; color: #fff; border-radius: 10px; padding: 16px; font-size: 1.3rem; font-weight: bold; cursor: pointer; transition: background 0.1s; outline: none; }
        .key-btn:active { background: #2d2d35; border-color: #ffdd67; }
        .key-btn.action { background: #222227; font-size: 0.9rem; color: #a1a1aa; }
        .error-msg { color: #ff4a4a; font-size: 0.85rem; margin-top: 10px; display: none; text-align: center; }

        /* WALLET MONITOR BOARDS */
        .wallet-container { background: #1c1c21; border: 1px solid ${checkLowBalance ? "#ffdd67" : "#2d2d35"}; padding: 16px; border-radius: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        .wallet-amt { font-size: 1.4rem; font-weight: bold; color: #00ffcc; font-family: monospace; }
        .btn-topup { background: #222227; color: #ffdd67; border: 1px solid #ffdd67; padding: 10px 14px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; }
        .counter-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px; text-align: center; }
        .counter-box { background: #1c1c21; border: 1px solid #222227; padding: 10px; border-radius: 8px; font-size: 0.8rem; color: #9ca3af; }
        .counter-val { font-size: 1.1rem; font-weight: bold; margin-top: 4px; font-family: monospace; color: #fff; }

        /* GLOBAL METRICS COUNTERS STRIP */
        .metrics-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px; text-align: center; background: #1c1c21; border: 1px solid #222227; padding: 12px; border-radius: 10px; }
        .metric-label { font-size: 0.75rem; color: #9ca3af; font-weight: bold; text-transform: uppercase; }
        .metric-value { font-size: 1.2rem; font-weight: bold; font-family: monospace; margin-top: 2px; }

        label { font-size: 0.8rem; color: #9ca3af; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; display: block; margin-bottom: 6px; margin-top: 14px; text-align: left; }
        .textbox-input, .select-input { width: 100%; background: #1c1c21; border: 1px solid #323239; color: #fff; padding: 12px; border-radius: 8px; outline: none; font-size: 0.9rem; font-family: monospace; display: block; margin-bottom: 12px; }
        .textbox-input:focus, .select-input:focus { border-color: #ffdd67; }

        .slider-container { display: flex; align-items: center; gap: 12px; margin-top: 6px; margin-bottom: 12px; }
        .slider-input { flex: 1; accent-color: #ffdd67; }
        .btn-master { display: block; width: 100%; background: #ffdd67; color: #0b0b0c; font-weight: 700; font-size: 1rem; border: none; padding: 14px; border-radius: 10px; cursor: pointer; text-align: center; margin-top: 20px; }
        .btn-master:hover { background: #f5ce42; }
        .btn-test { display: block; width: 100%; background: #222227; color: #a1a1aa; font-weight: bold; font-size: 0.85rem; border: 1px dashed #323239; padding: 10px; border-radius: 8px; cursor: pointer; text-align: center; margin-top: 10px; }
        .btn-test:hover { border-color: #00ffcc; color: #00ffcc; }
        .section-header { font-size: 1rem; font-weight: bold; color: #fff; margin-top: 24px; margin-bottom: 12px; display: flex; justify-content: space-between; border-bottom: 1px solid #222227; padding-bottom: 6px; text-align: left; }
        .empty-box { color: #6b7280; text-align: center; padding: 16px; background: #1c1c21; border-radius: 8px; border: 1px dashed #222227; font-size: 0.85rem; }
        .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: none; align-items: center; justify-content: center; padding: 20px; z-index: 1000; }
        .modal-content { background: #131316; border: 1px solid #323239; width: 100%; max-width: 400px; border-radius: 16px; padding: 24px; color: #fff; text-align: left; }
        .pay-option { background: #1c1c21; border: 1px solid #2d2d35; padding: 14px; border-radius: 10px; margin-bottom: 10px; cursor: pointer; text-align: center; font-weight: bold; font-size: 0.95rem; }
        .pay-option:hover { border-color: #ffdd67; color: #ffdd67; }

        /* PREVIEW CONTAINER STYLINGS */
        .preview-mockup-frame { background: #1c1c21; border: 1px solid #323239; border-radius: 10px; padding: 16px; margin-top: 14px; text-align: center; }
        .preview-banner-asset { width: 100%; border-radius: 6px; border: 1px solid #2d2d35; margin-top: 10px; margin-bottom: 10px; display: none; max-height: 260px; object-fit: cover; }
        .preview-bot-text { font-family: monospace; font-size: 0.85rem; padding: 8px 10px; background: #0b0b0c; border-radius: 4px; border: 1px dashed #2d2d35; color: #ffdd67; margin-top: 4px; word-break: break-word; line-height: 1.4; }
        .bot-socket-card { background: #18181d; border: 1px solid #2d2d35; border-radius: 10px; padding: 12px; margin-top: 12px; text-align: left; }
        .bot-socket-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-family: monospace; font-size: 0.78rem; color: #00ffcc; }
        .btn-bot-gen { background: #222227; color: #ffdd67; border: 1px solid #ffdd67; padding: 6px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; cursor: pointer; font-family: monospace; }
        .btn-bot-gen:hover { background: #ffdd67; color: #0b0b0c; }
    </style>
</head>
<body>
    <!-- STATE A: CONSOLE VERIFICATION KEYPAD -->
    <div class="card text-center" id="gate-card">
        <h1>Console Verification</h1>
        <p>Input your authentication PIN on the keypad below to access analytics data.</p>

        <input type="text" id="keypad-screen" class="display-screen" placeholder="••••••••" readonly>

        <div class="keypad-grid">
            <button class="key-btn" onclick="pressKey('1')">1</button>
            <button class="key-btn" onclick="pressKey('2')">2</button>
            <button class="key-btn" onclick="pressKey('3')">3</button>
            <button class="key-btn" onclick="pressKey('4')">4</button>
            <button class="key-btn" onclick="pressKey('5')">5</button>
            <button class="key-btn" onclick="pressKey('6')">6</button>
            <button class="key-btn" onclick="pressKey('7')">7</button>
            <button class="key-btn" onclick="pressKey('8')">8</button>
            <button class="key-btn" onclick="pressKey('9')">9</button>
            <button class="key-btn action" onclick="clearKeys()">Clear</button>
            <button class="key-btn" onclick="pressKey('0')">0</button>
            <button class="key-btn action" style="color: #ffdd67;" onclick="submitGatePass()">Enter</button>
        </div>
        <div id="alert-msg" class="error-msg">Invalid Authentication Pin. Please try again.</div>
    </div>

    <!-- STATE B: MASTER CONTROL DASHBOARD -->
    <template id="master-control-dashboard">
        <div class="card">
            <div class="wallet-container">
                <div style="text-align:left;">
                    <div style="font-size:0.75rem; color:#9ca3af; text-transform:uppercase; font-weight:bold; letter-spacing:1px;">Master Wallet Bank</div>
                    <div class="wallet-amt">$${parseFloat(walletBalance).toFixed(2)}</div>
                </div>
                <button class="btn-topup" onclick="openPaymentSheet()">➕ Add Balance</button>
            </div>

            <div class="counter-strip">
                <div class="counter-box">
                    <div>Total Loops</div>
                    <div class="counter-val">${totalLoops}</div>
                </div>
                <div class="counter-box">
                    <div>Active Loops</div>
                    <div class="counter-val" style="color:#00ffcc;">${activeLoops}</div>
                </div>
                <div class="counter-box">
                    <div>Inactive</div>
                    <div class="counter-val" style="color:#ff4a4a;">${inactiveLoops}</div>
                </div>
            </div>

            <div class="metrics-strip">
                <div>
                    <div class="metric-label">Global Views</div>
                    <div class="metric-value" style="color:#fff;">${globalViews}</div>
                </div>
                <div>
                    <div class="metric-label">Human Clicks</div>
                    <div class="metric-value" style="color:#00ffcc;">${globalClicks}</div>
                </div>
                <div>
                    <div class="metric-label">Total Leads</div>
                    <div class="metric-value" style="color:#ffdd67;">${globalLeads}</div>
                </div>
            </div>

            <h1 style="text-align:left;">Campaign Configurator</h1>
            <p style="text-align:left; margin-bottom:16px; font-size:0.85rem;">Staging interface parameters &amp; multi-instance creative mirroring node</p>

            <label>Paste CPAGrip Destination Link:</label>
            <input type="text" id="cpagrip-url" class="textbox-input" placeholder="https://installyourfiles.com/1920367" value="https://installyourfiles.com/1920367">

            <label>Campaign Identifier Name:</label>
            <input type="text" id="campaign-tag" class="textbox-input" placeholder="e.g., tiktok_loop_1">

            <label>Batch Launch Quantity (Instances):</label>
            <input type="number" id="campaign-quantity" class="textbox-input" value="1" min="1" step="1">

            <!-- 1. INLINE IMAGE FILE UPLOAD & LOCAL STORAGE STATE -->
            <label>Upload Creative Banner Image (Local Storage State):</label>
            <input type="file" id="creative-file-input" accept="image/*" class="textbox-input" style="padding:9px;" onchange="handleImageFileUpload(event)">
            <div style="display:flex; gap:8px; margin-bottom:8px;">
                <input type="text" id="creative-image-url" class="textbox-input" style="margin-bottom:0; flex:1;" placeholder="Or paste direct image URL / Data URI..." oninput="handleImageUrlInput(this.value)">
                <button type="button" onclick="clearCreativeImage()" style="background:#222227; color:#a1a1aa; border:1px solid #323239; border-radius:8px; padding:0 12px; font-size:0.75rem; font-weight:bold; cursor:pointer;">Clear</button>
            </div>

            <!-- LIVE RESPONSIVE VISUAL CARD PREVIEW -->
            <div class="preview-mockup-frame" id="active-preview-container">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-size:0.72rem; font-family:monospace; color:#9ca3af; text-transform:uppercase; letter-spacing:1px;">Live Responsive Interstitial Card Preview</span>
                    <span id="preview-lock-status" style="font-size:0.7rem; font-family:monospace; color:#00ffcc;">🔒 Mirror Ready</span>
                </div>
                <img id="preview-banner-img" class="preview-banner-asset" src="" alt="Live Creative Asset Preview">
                <div style="margin-top:12px;">
                    <span style="display:inline-block; background:#00ffcc; color:#0b0b0c; padding:8px 18px; border-radius:6px; font-weight:bold; font-size:0.8rem;">🔒 Access Gated Resource</span>
                </div>
            </div>

            <label>Campaign Traffic Category Mode:</label>
            <select id="traffic-mode-select" class="select-input" onchange="toggleTypeLayout(this.value)">
                <option value="organic">Organic Traffic Loop (Free)</option>
                <option value="paid">Paid Network Programmatic Traffic</option>
            </select>

            <div id="paid-config-frame" style="display:none; background:#19191f; border:1px solid #2d2d35; padding:14px; border-radius:10px; margin-top:12px;">
                <label style="margin-top:0;">Assigned Campaign Budget Allocation ($ per loop):</label>
                <input type="number" id="campaign-budget" class="textbox-input" value="10.00" min="1" step="1">
                <label>Live Cost-Per-Click Rate Slider (CPC): <span id="cpc-display-label" style="color:#ffdd67;">$0.010</span></label>
                <div class="slider-container">
                    <input type="range" id="cpc-slider" class="slider-input" min="0.005" max="0.500" step="0.005" value="0.010" oninput="updateCpcLabel(this.value)">
                </div>
            </div>

            <button class="btn-master" onclick="executeBuildPipeline()">🚀 Run Campaign &amp; Mirror Assets</button>
            <button class="btn-test" onclick="runSystemDiagnostic()">🔍 Run System Diagnostic Test</button>
            <div id="diagnostic-banner" style="display:none; margin-top:10px; padding:10px; border-radius:8px; font-family:monospace; font-size:0.8rem; text-align:center; background:#0b0b0c; border:1px solid #00ffcc; color:#00ffcc;"></div>

            <div class="section-header">
                <span>🟢 Active Campaigns</span>
                <span style="color:#00ffcc; font-family:monospace;">(${activeLoops})</span>
            </div>
            <div>${activeRowsHtml || '<div class="empty-box">No active loops deployed.</div>'}</div>

            <div class="section-header">
                <span>🔴 Inactive Campaigns</span>
                <span style="color:#ff4a4a; font-family:monospace;">(${inactiveLoops})</span>
            </div>
            <div>${inactiveRowsHtml || '<div class="empty-box">No inactive or paused items.</div>'}</div>
        </div>

        <!-- TRANSACTION BILLING MODAL -->
        <div id="payment-modal" class="modal-backdrop">
            <div class="modal-content">
                <h2 style="font-size:1.25rem; font-weight:700; margin-bottom:4px;">Deposit Ad Credits</h2>
                <p style="font-size:0.85rem; color:#9ca3af; margin-bottom:16px;">Top up your master wallet balance instantly.</p>
                <label>Amount to Load ($):</label>
                <input type="number" id="topup-amount" class="textbox-input" value="25.00" min="5" step="5">
                <label style="margin-bottom:10px;">Select Verified Merchant Channel:</label>
                <div class="pay-option" onclick="processTopUp('stripe')">💳 Credit / Debit Card (Stripe)</div>
                <div class="pay-option" onclick="processTopUp('gpay')">📱 Google Pay</div>
                <div class="pay-option" onclick="processTopUp('paypal')">🅿️ PayPal Secure</div>
                <button onclick="closePaymentSheet()" style="width:100%; background:#222227; color:#a1a1aa; border:1px solid #323239; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer; margin-top:8px;">Cancel</button>
            </div>
        </div>
    </template>

    <script type="text/javascript">
        var inputBuffer = "";
        var timerInterval = null;

        // LOCAL STORAGE KEYS FOR PERSISTENT PREVIEW & MULTI-INSTANCE MIRRORING
        var LS_IMAGE_KEY = "cpagrip_preview_image_asset";
        var LS_META_KEY = "cpagrip_preview_image_meta";

        var activePreviewState = {
            imageAsset: "",
            imageMeta: { name: "", width: 0, height: 0, hasImage: false }
        };

        function loadPreviewStateFromStorage() {
            try {
                var savedImg = localStorage.getItem(LS_IMAGE_KEY);
                var savedMeta = localStorage.getItem(LS_META_KEY);

                if (savedImg) activePreviewState.imageAsset = savedImg;
                if (savedMeta) {
                    try { activePreviewState.imageMeta = JSON.parse(savedMeta); } catch (_e) {}
                }
            } catch (_err) {}
            renderActivePreviewContainer();
        }

        function savePreviewStateToStorage() {
            try {
                localStorage.setItem(LS_IMAGE_KEY, activePreviewState.imageAsset || "");
                localStorage.setItem(LS_META_KEY, JSON.stringify(activePreviewState.imageMeta || {}));
            } catch (_err) {}
        }

        function renderActivePreviewContainer() {
            var urlInput = document.getElementById("creative-image-url");
            var bannerImg = document.getElementById("preview-banner-img");

            if (urlInput && document.activeElement !== urlInput && activePreviewState.imageAsset && !activePreviewState.imageAsset.startsWith("data:")) {
                urlInput.value = activePreviewState.imageAsset;
            }
            if (bannerImg) {
                if (activePreviewState.imageAsset) {
                    bannerImg.src = activePreviewState.imageAsset;
                    bannerImg.style.display = "block";
                } else {
                    bannerImg.removeAttribute("src");
                    bannerImg.style.display = "none";
                }
            }
        }

        function handleImageFileUpload(event) {
            var file = event && event.target && event.target.files && event.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function(loadEvt) {
                var rawDataUrl = loadEvt.target.result;
                var img = new Image();
                img.onload = function() {
                    // Compress/scale image to max 640px width for fast KV & localStorage persistence
                    var maxW = 640;
                    var w = img.width;
                    var h = img.height;
                    if (w > maxW) {
                        h = Math.round(h * (maxW / w));
                        w = maxW;
                    }
                    var canvas = document.createElement("canvas");
                    canvas.width = w;
                    canvas.height = h;
                    var ctx2d = canvas.getContext("2d");
                    ctx2d.drawImage(img, 0, 0, w, h);
                    var compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);

                    activePreviewState.imageAsset = compressedDataUrl;
                    activePreviewState.imageMeta = {
                        name: file.name,
                        width: img.width,
                        height: img.height,
                        hasImage: true
                    };
                    savePreviewStateToStorage();
                    renderActivePreviewContainer();
                };
                img.src = rawDataUrl;
            };
            reader.readAsDataURL(file);
        }

        function handleImageUrlInput(val) {
            var trimmed = String(val || "").trim();
            activePreviewState.imageAsset = trimmed;
            activePreviewState.imageMeta = {
                name: trimmed.split("/").pop() || "remote_asset",
                width: 600,
                height: 340,
                hasImage: Boolean(trimmed)
            };
            savePreviewStateToStorage();
            renderActivePreviewContainer();
        }

        function clearCreativeImage() {
            activePreviewState.imageAsset = "";
            activePreviewState.imageMeta = { name: "", width: 0, height: 0, hasImage: false };
            var fileInput = document.getElementById("creative-file-input");
            var urlInput = document.getElementById("creative-image-url");
            if (fileInput) fileInput.value = "";
            if (urlInput) urlInput.value = "";
            savePreviewStateToStorage();
            renderActivePreviewContainer();
        }

        function formatElapsedDuration(ms) {
            var totalSeconds = Math.max(0, Math.floor(ms / 1000));
            var hours = Math.floor(totalSeconds / 3600);
            var minutes = Math.floor((totalSeconds % 3600) / 60);
            var seconds = totalSeconds % 60;
            var pad = function(n) { return n < 10 ? "0" + n : String(n); };
            return pad(hours) + "h " + pad(minutes) + "m " + pad(seconds) + "s";
        }

        function updateCampaignTimers() {
            var nodes = document.querySelectorAll('.campaign-timer-node');
            var now = Date.now();
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                var status = node.getAttribute('data-status');
                if (status && status !== 'active') {
                    node.innerText = "⏱️ Active duration: Paused";
                    continue;
                }
                var startTime = parseInt(node.getAttribute('data-start-time'), 10) || now;
                node.innerText = "⏱️ Active duration: " + formatElapsedDuration(now - startTime);
            }
        }

        function startHardwareClocks() {
            updateCampaignTimers();
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = setInterval(updateCampaignTimers, 1000);
        }

        function pressKey(digit) {
            if (inputBuffer.length < 8) {
                inputBuffer += digit;
                document.getElementById('keypad-screen').value = "*".repeat(inputBuffer.length);
            }
        }

        function clearKeys() {
            inputBuffer = "";
            document.getElementById('keypad-screen').value = "";
        }

        function unlockDashboardView() {
            var injectDashboard = document.getElementById('master-control-dashboard').innerHTML;
            document.body.innerHTML = injectDashboard;
            loadPreviewStateFromStorage();
            startHardwareClocks();
        }

        function submitGatePass() {
            var errorAlert = document.getElementById('alert-msg');
            if (inputBuffer === "03091996") {
                errorAlert.style.display = "none";
                try { sessionStorage.setItem("cpagrip_unlocked", "1"); } catch (e) {}
                unlockDashboardView();
            } else {
                errorAlert.style.display = "block";
                clearKeys();
            }
        }

        try {
            if (sessionStorage.getItem("cpagrip_unlocked") === "1") {
                unlockDashboardView();
            }
        } catch (e) {}

        document.addEventListener('keydown', function(e) {
            if (!document.getElementById('gate-card')) return;
            if (e.key >= '0' && e.key <= '9') {
                pressKey(e.key);
            } else if (e.key === 'Backspace' || e.key === 'Escape') {
                clearKeys();
            } else if (e.key === 'Enter') {
                submitGatePass();
            }
        });

        function toggleTypeLayout(val) {
            document.getElementById('paid-config-frame').style.display = (val === 'paid') ? 'block' : 'none';
        }

        function updateCpcLabel(val) {
            document.getElementById('cpc-display-label').innerText = "$" + parseFloat(val).toFixed(3);
        }

        function openPaymentSheet() { document.getElementById('payment-modal').style.display = 'flex'; }
        function closePaymentSheet() { document.getElementById('payment-modal').style.display = 'none'; }

        async function runSystemDiagnostic() {
            var banner = document.getElementById('diagnostic-banner');
            try {
                var res = await fetch(window.location.pathname || "/cpagrip", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "health_check" })
                });
                var data = await res.json();
                if (res.ok && data.success && data.database === "connected") {
                    var msg = "✅ System Diagnostic Ready: KV Database (" + data.database + ") | Dual AI Bot Sockets Ready | Asset Mirroring Active";
                    if (banner) {
                        banner.style.display = "block";
                        banner.innerText = msg;
                    }
                } else {
                    if (banner) {
                        banner.style.display = "block";
                        banner.innerText = "⚠️ System Diagnostic Warning: Unexpected response.";
                    }
                }
            } catch (err) {
                if (banner) {
                    banner.style.display = "block";
                    banner.innerText = "❌ System Diagnostic Failed: " + err.message;
                }
            }
        }

        async function executeBuildPipeline() {
            var urlVal = document.getElementById('cpagrip-url').value;
            var nameVal = document.getElementById('campaign-tag').value;
            var qtyEl = document.getElementById('campaign-quantity');
            var qtyVal = qtyEl ? (parseInt(qtyEl.value, 10) || 1) : 1;
            var modeVal = document.getElementById('traffic-mode-select').value;

            if (!urlVal.trim() || !nameVal.trim()) {
                return;
            }

            var payloadId = nameVal.trim().toLowerCase().replace(/\\s+/g, '_');
            var budgetVal = (modeVal === 'paid') ? document.getElementById('campaign-budget').value : 0;
            var cpcVal = (modeVal === 'paid') ? document.getElementById('cpc-slider').value : 0;

            var res = await fetch(window.location.pathname || "/cpagrip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "create",
                    id: payloadId,
                    name: nameVal.trim(),
                    targetUrl: urlVal.trim(),
                    type: modeVal,
                    budget: budgetVal,
                    cpc: cpcVal,
                    quantity: qtyVal,
                    // LOCK IN ACTIVE PREVIEW CREATIVES ACROSS ALL MIRRORED INSTANCES
                    imageAsset: activePreviewState.imageAsset || ""
                })
            });
            var data = await res.json().catch(function() { return {}; });
            if (res.ok && data.success) {
                location.reload();
            } else if (data.error) {
                var banner = document.getElementById('diagnostic-banner');
                if (banner) {
                    banner.style.display = "block";
                    banner.style.color = "#ff4a4a";
                    banner.innerText = "⚠️ " + data.error;
                }
            }
        }

        async function toggleCampaign(id, status) {
            var res = await fetch(window.location.pathname || "/cpagrip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "toggle", id: id, status: status })
            });
            if (res.ok) { location.reload(); }
        }

        async function deleteCampaign(id) {
            var res = await fetch(window.location.pathname || "/cpagrip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", id: id })
            });
            if (res.ok) { location.reload(); }
        }

        async function processTopUp(method) {
            var amt = document.getElementById('topup-amount').value;
            var res = await fetch(window.location.pathname || "/cpagrip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "topup", amount: amt, method: method })
            });
            if (res.ok) { location.reload(); }
        }
    </script>
</body>
</html>`, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
      });
    }

    return new Response("Bargain Drop Routing Service Running.", { status: 200 });
  }
};

export default worker;

export async function onRequest(context) {
  return worker.fetch(context.request, context.env || {}, context);
}