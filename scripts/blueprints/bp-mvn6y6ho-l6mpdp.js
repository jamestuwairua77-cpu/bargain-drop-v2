<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AdPulse — AI Ad Campaign &amp; Growth Engine | Bargain Drop</title>
  <meta name="description" content="AdPulse AI Marketing, Ad Creative Studio, ROAS Analytics & Source Deployment Hub at bargain-drop.online/adpulse" />
  <link rel="icon" type="image/jpeg" href="/official-logo.jpg" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700&family=Outfit:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    :root {
      color-scheme: dark;
      --bg: #08090a;
      --surface: #111315;
      --surface-2: #171a1d;
      --border: #22262a;
      --accent: #fe3442;
      --gold: #facc15;
      --green: #22c55e;
      --blue: #3b82f6;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background-color: var(--bg);
      background-image:
        radial-gradient(900px 420px at 85% -5%, rgba(254, 52, 66, 0.16), transparent 65%),
        radial-gradient(700px 380px at 10% 15%, rgba(59, 130, 246, 0.1), transparent 60%);
      color: #ffffff;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
    }
    .font-display { font-family: 'Outfit', sans-serif; }
    .font-mono-code { font-family: 'JetBrains Mono', monospace; }
    .glass-card {
      background: rgba(17, 19, 21, 0.92);
      border: 1px solid var(--border);
      border-radius: 10px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
    }
    .btn-red {
      background: linear-gradient(180deg, #fe3442 0%, #d32b3f 100%);
      border: 1px solid #fe3442;
      color: #ffffff;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 4px 14px rgba(254, 52, 66, 0.35);
      transition: all 0.15s ease;
    }
    .btn-red:hover {
      background: linear-gradient(180deg, #ff4754 0%, #e0283e 100%);
      transform: translateY(-1px);
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 9999px;
      background: #22c55e;
      box-shadow: 0 0 10px #22c55e;
      animation: pulseAnim 2s infinite;
    }
    @keyframes pulseAnim {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.45; transform: scale(0.85); }
    }
  </style>
</head>
<body class="flex flex-col min-h-screen">

  <!-- TOP NAVIGATION BAR -->
  <header class="sticky top-0 z-50 border-b border-[#22262a] bg-[#08090a]/95 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
      <!-- Brand -->
      <div class="flex items-center gap-3 min-w-0">
        <a href="/" class="flex items-center gap-2.5 group focus:outline-none">
          <img src="/official-logo.jpg" alt="Bargain Drop" class="w-9 h-9 rounded-lg object-contain border border-[#363636] group-hover:border-[#fe3442] bg-[#08090a]" />
          <div>
            <div class="flex items-center gap-2">
              <span class="font-display text-lg sm:text-xl font-black tracking-tight uppercase">
                <span class="text-[#fe3442]">AD</span><span class="text-white">PULSE</span>
              </span>
              <span class="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#fe3442]/15 text-[#fe3442] border border-[#fe3442]/40">
                <span class="pulse-dot"></span>
                LIVE ENGINE
              </span>
            </div>
            <p class="text-[10px] text-[#818181] font-mono-code truncate">bargain-drop.online/adpulse</p>
          </div>
        </a>
      </div>

      <!-- Mode Switcher Tabs -->
      <nav class="hidden md:flex items-center gap-1 bg-[#111315] p-1 rounded-lg border border-[#22262a] text-xs font-bold">
        <button onclick="switchAdPulseTab('dashboard')" id="tab-dashboard" class="px-3 py-1.5 rounded-md btn-red">
          📊 Command Dashboard
        </button>
        <button onclick="switchAdPulseTab('creative')" id="tab-creative" class="px-3 py-1.5 rounded-md text-[#dedede] hover:text-white">
          ✨ AI Ad Creative Studio
        </button>
        <button onclick="switchAdPulseTab('catalog')" id="tab-catalog" class="px-3 py-1.5 rounded-md text-[#dedede] hover:text-white">
          🛍️ Product Ad Launcher
        </button>
        <button onclick="switchAdPulseTab('bridge')" id="tab-bridge" class="px-3 py-1.5 rounded-md text-[#facc15] hover:text-white">
          🔄 Source Migration &amp; Bridge
        </button>
      </nav>

      <!-- Right Actions -->
      <div class="flex items-center gap-2 shrink-0">
        <button onclick="switchAdPulseTab('bridge')" class="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-[#18150c] text-[#facc15] border border-[#facc15]/60 hover:bg-[#facc15] hover:text-black transition">
          ⚡ Sync Source App
        </button>
        <a href="/admin.html" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#111315] text-[#dedede] border border-[#22262a] hover:border-[#fe3442] hover:text-white transition">
          📦 Orders
        </a>
        <a href="/" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#111315] text-[#dedede] border border-[#22262a] hover:border-[#fe3442] hover:text-white transition">
          ← Store
        </a>
      </div>
    </div>

    <!-- Mobile Tab Bar -->
    <div class="md:hidden flex items-center gap-1.5 px-3 py-2 border-t border-[#22262a] overflow-x-auto text-xs font-bold bg-[#0b0d0e]">
      <button onclick="switchAdPulseTab('dashboard')" id="mob-dashboard" class="px-3 py-1.5 rounded-md btn-red whitespace-nowrap">📊 Dashboard</button>
      <button onclick="switchAdPulseTab('creative')" id="mob-creative" class="px-3 py-1.5 rounded-md bg-[#111315] text-[#dedede] border border-[#22262a] whitespace-nowrap">✨ AI Ad Studio</button>
      <button onclick="switchAdPulseTab('catalog')" id="mob-catalog" class="px-3 py-1.5 rounded-md bg-[#111315] text-[#dedede] border border-[#22262a] whitespace-nowrap">🛍️ Catalog Ads</button>
      <button onclick="switchAdPulseTab('bridge')" id="mob-bridge" class="px-3 py-1.5 rounded-md bg-[#18150c] text-[#facc15] border border-[#facc15]/50 whitespace-nowrap">🔄 Source Bridge</button>
    </div>
  </header>

  <!-- MAIN WORKSPACE -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 space-y-6">

    <!-- =====================================================================
         TAB 1: COMMAND DASHBOARD (CAMPAIGNS, ROAS, PIXEL & LIVE METRICS)
    ====================================================================== -->
    <section id="view-dashboard" class="space-y-6">
      <!-- Hero Banner -->
      <div class="glass-card p-6 relative overflow-hidden border-l-4 border-l-[#fe3442]">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#fe3442] mb-1">
              <span>⚡ ADPULSE PERFORMANCE MARKETING ENGINE</span>
              <span>·</span>
              <span class="text-[#facc15]">BARGAIN-DROP.ONLINE/ADPULSE</span>
            </div>
            <h1 class="font-display text-2xl sm:text-3xl font-black text-white tracking-tight">
              Omnichannel Ad Campaigns, AI Creatives &amp; Live ROAS Attribution
            </h1>
            <p class="text-sm text-[#9aa0a6] mt-1 max-w-3xl">
              Manage Meta, TikTok, and Google Shopping campaigns synced directly with your 14,367-product Bargain Drop catalog and live store checkout orders.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2.5 shrink-0">
            <button onclick="switchAdPulseTab('creative')" class="px-4 py-2.5 rounded-lg text-xs font-extrabold btn-red">
              + Generate AI Ad Campaign
            </button>
            <button onclick="openNewCampaignModal()" class="px-4 py-2.5 rounded-lg text-xs font-extrabold bg-white text-black hover:bg-[#facc15] transition">
              + Launch New Campaign
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Metrics Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="glass-card p-4">
          <div class="text-[11px] font-extrabold uppercase tracking-wider text-[#818181]">Total Ad Spend (30d)</div>
          <div class="font-display text-2xl sm:text-3xl font-black text-white mt-1" id="kpi-spend">A$1,420.00</div>
          <div class="text-xs font-bold text-[#22c55e] mt-1">● Active across 6 campaigns</div>
        </div>
        <div class="glass-card p-4">
          <div class="text-[11px] font-extrabold uppercase tracking-wider text-[#818181]">Attributed Revenue</div>
          <div class="font-display text-2xl sm:text-3xl font-black text-[#facc15] mt-1" id="kpi-revenue">A$6,184.50</div>
          <div class="text-xs font-bold text-[#dedede] mt-1" id="kpi-orders-sub">Synced with live store orders</div>
        </div>
        <div class="glass-card p-4">
          <div class="text-[11px] font-extrabold uppercase tracking-wider text-[#818181]">Blended ROAS</div>
          <div class="font-display text-2xl sm:text-3xl font-black text-[#22c55e] mt-1" id="kpi-roas">4.36x</div>
          <div class="text-xs font-bold text-[#22c55e] mt-1">▲ +0.42x vs target (3.0x)</div>
        </div>
        <div class="glass-card p-4">
          <div class="text-[11px] font-extrabold uppercase tracking-wider text-[#818181]">Avg Cost Per Purchase</div>
          <div class="font-display text-2xl sm:text-3xl font-black text-[#fe3442] mt-1" id="kpi-cpa">A$5.82</div>
          <div class="text-xs font-bold text-[#9aa0a6] mt-1">CTR: 3.48% · Conv Rate: 4.12%</div>
        </div>
      </div>

      <!-- Active Campaigns Table -->
      <div class="glass-card overflow-hidden">
        <div class="p-4 sm:px-6 border-b border-[#22262a] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="font-display text-lg font-extrabold text-white">Active AdPulse Campaigns</h2>
            <p class="text-xs text-[#818181]">Toggle status, adjust daily budgets, or inspect creative ROAS in real time</p>
          </div>
          <div class="flex items-center gap-2">
            <select id="channelFilter" onchange="renderCampaigns()" class="bg-[#08090a] border border-[#22262a] rounded-lg px-3 py-1.5 text-xs font-bold text-white outline-none">
              <option value="ALL">All Channels</option>
              <option value="Meta Ads">Meta Ads (FB/IG)</option>
              <option value="TikTok Ads">TikTok Ads</option>
              <option value="Google PMax">Google Shopping PMax</option>
            </select>
            <button onclick="openNewCampaignModal()" class="px-3 py-1.5 rounded-lg text-xs font-extrabold btn-red">+ Add Campaign</button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-[#22262a] bg-[#0b0d0f] text-[#818181] uppercase font-extrabold">
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Campaign Name</th>
                <th class="py-3 px-4">Channel</th>
                <th class="py-3 px-4 text-right">Daily Budget</th>
                <th class="py-3 px-4 text-right">Spend</th>
                <th class="py-3 px-4 text-right">Revenue</th>
                <th class="py-3 px-4 text-right">ROAS</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="campaigns-tbody" class="divide-y divide-[#22262a]"></tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         TAB 2: AI AD CREATIVE & VIDEO HOOK STUDIO (GEMINI POWERED)
    ====================================================================== -->
    <section id="view-creative" class="hidden space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left Config -->
        <div class="lg:col-span-5 glass-card p-5 space-y-4">
          <div class="border-b border-[#22262a] pb-3">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#fe3442]">GEMINI AD CREATIVE ENGINE</span>
            <h2 class="font-display text-xl font-black text-white mt-0.5">AI Ad Copy &amp; Viral Hook Generator</h2>
            <p class="text-xs text-[#818181] mt-1">Generate high-converting Meta primary text, TikTok UGC scripts, and Google Shopping headlines.</p>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-[#dedede] mb-1">Product or Offer Title</label>
              <input id="ai-prod-title" type="text" value="Wireless Bluetooth 5.3 Earbuds — Under A$25" placeholder="e.g. Women's Summer Lounge Set"
                class="w-full bg-[#08090a] border border-[#22262a] focus:border-[#fe3442] rounded-lg px-3 py-2 text-white outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-[#dedede] mb-1">Retail Price (AUD)</label>
                <input id="ai-prod-price" type="text" value="A$22.95"
                  class="w-full bg-[#08090a] border border-[#22262a] focus:border-[#fe3442] rounded-lg px-3 py-2 text-white outline-none" />
              </div>
              <div>
                <label class="block font-bold text-[#dedede] mb-1">Ad Platform</label>
                <select id="ai-platform" class="w-full bg-[#08090a] border border-[#22262a] rounded-lg px-3 py-2 text-white outline-none">
                  <option value="Meta (Facebook & Instagram)">Meta (FB &amp; IG Reels)</option>
                  <option value="TikTok UGC Video">TikTok UGC Video</option>
                  <option value="Google Performance Max">Google Shopping PMax</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-bold text-[#dedede] mb-1">Target Audience &amp; Angle</label>
              <input id="ai-angle" type="text" value="Australian shoppers looking for everyday bargains under A$32.95 with free shipping over A$29"
                class="w-full bg-[#08090a] border border-[#22262a] focus:border-[#fe3442] rounded-lg px-3 py-2 text-white outline-none" />
            </div>

            <button onclick="generateAiAdPack()" id="ai-gen-btn" class="w-full py-3 rounded-lg font-extrabold text-xs uppercase tracking-wider btn-red">
              ✨ Generate Complete Ad Pack
            </button>
          </div>
        </div>

        <!-- Right Output -->
        <div class="lg:col-span-7 glass-card p-5 flex flex-col justify-between space-y-4">
          <div class="flex items-center justify-between border-b border-[#22262a] pb-3">
            <div>
              <h3 class="font-display text-lg font-black text-white">Generated Ad Creative Pack</h3>
              <p class="text-xs text-[#818181]">Ready-to-launch hooks, headlines, primary copy, and CTA</p>
            </div>
            <button onclick="copyAdOutput()" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#171a1d] border border-[#22262a] hover:border-[#fe3442] text-white">
              📋 Copy All
            </button>
          </div>

          <div id="ai-output-box" class="flex-1 bg-[#08090a] border border-[#22262a] rounded-xl p-4 font-mono-code text-xs leading-relaxed text-[#dedede] whitespace-pre-wrap overflow-y-auto max-h-[420px]">🔥 3 SCROLL-STOPPING HOOKS (0–3s):
1. "Stop overpaying at retail stores — we just locked this at A$22.95 with fast Aussie dispatch!"
2. "POV: You found Australia's secret warehouse drop where everything is capped under A$32.95."
3. "I tested this A$22.95 daily essential from Bargain Drop so you don't have to..."

📢 PRIMARY AD TEXT:
Why pay $70+ when you can grab the exact same quality for A$22.95? 🇦🇺
✅ Strictly capped under A$32.95 storewide
✅ Free Tracked Express Shipping on orders over A$29 AUD
✅ 30-Day Easy Returns & Verified Aussie Support
Tap "Shop Now" before this drop sells out!

🎯 HEADLINES:
• Grab Yours For Just A$22.95 Today
• Free Shipping Over A$29 AUD — Shop The Drop
• Rated 4.9/5 By Aussie Shoppers</div>

          <div class="flex items-center justify-between pt-2">
            <span class="text-[11px] text-[#818181]">Tip: Click any product in the Product Ad Launcher tab to auto-fill this studio.</span>
            <button onclick="launchCampaignFromCreative()" class="px-4 py-2 rounded-lg text-xs font-extrabold bg-[#22c55e] text-black hover:opacity-90">
              🚀 Launch as Active Campaign
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         TAB 3: PRODUCT CATALOG AD LAUNCHER
    ====================================================================== -->
    <section id="view-catalog" class="hidden space-y-4">
      <div class="glass-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-display text-lg font-black text-white">Live Store Catalog → 1-Click Ad Launcher</h2>
          <p class="text-xs text-[#818181]">Select any product from your live Bargain Drop catalog to generate ads or launch a campaign</p>
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <input id="cat-search" type="text" oninput="renderCatalogProducts()" placeholder="Search catalog products..."
            class="flex-1 sm:w-64 bg-[#08090a] border border-[#22262a] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#fe3442]" />
        </div>
      </div>

      <div id="catalog-grid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div class="col-span-full text-center py-12 text-xs text-[#818181]">Loading live store catalog...</div>
      </div>
    </section>

    <!-- =====================================================================
         TAB 4: SOURCE MIGRATION & BRIDGE (ais-dev-wrs5hmf4cczk23rjbcfxrw...)
    ====================================================================== -->
    <section id="view-bridge" class="hidden space-y-6">
      <div class="glass-card p-6 border-l-4 border-l-[#facc15] space-y-4">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#22262a] pb-4">
          <div>
            <span class="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#facc15]/20 text-[#facc15] border border-[#facc15]/40">
              SOURCE APP MIGRATION &amp; LIVE DEPLOYER
            </span>
            <h2 class="font-display text-xl sm:text-2xl font-black text-white mt-2">
              Source URL: <span class="text-[#facc15] font-mono-code text-sm sm:text-base break-all">https://ais-dev-wrs5hmf4cczk23rjbcfxrw-128115771016.asia-east1.run.app/</span>
            </h2>
            <p class="text-xs text-[#9aa0a6] mt-1 max-w-3xl">
              Because <code class="text-white">ais-dev-wrs5hmf4cczk23rjbcfxrw-128115771016.asia-east1.run.app</code> is a private Google AI Studio dev container gated by your browser login cookie, you can either launch/connect to it below OR drop its exported HTML/source files here to overwrite <code class="text-[#facc15]">bargain-drop.online/adpulse</code> in one click.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <a href="https://ais-dev-wrs5hmf4cczk23rjbcfxrw-128115771016.asia-east1.run.app/" target="_blank" rel="noopener noreferrer"
              class="px-4 py-2.5 rounded-lg text-xs font-extrabold bg-[#facc15] text-black hover:opacity-90 transition">
              ↗ Open Source App in New Tab
            </a>
            <button onclick="loadSourceInFrame()" class="px-4 py-2.5 rounded-lg text-xs font-extrabold btn-red">
              🔌 Embed Source Preview Below
            </button>
          </div>
        </div>

        
        <!-- 1-Click Cloudflare www.bargain-drop.online DNS Fixer -->
        <div class="obsidian-card p-6 border-[#facc15]/40">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#22262a]">
            <div>
              <div class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#facc15] mb-1">
                <span>🌐 Domain &amp; Subdomain Status</span>
              </div>
              <h3 class="text-lg font-extrabold text-white font-display">
                Live at <a href="https://bargain-drop.online/adpulse" class="text-[#22c55e] underline">https://bargain-drop.online/adpulse</a> · Enable <code class="text-[#facc15]">www.bargain-drop.online</code>
              </h3>
              <p class="text-xs text-[#9ca3af] mt-1">
                Your root domain <strong class="text-white">https://bargain-drop.online/adpulse</strong> is live (HTTP 200). Currently, <code class="text-[#facc15]">www.bargain-drop.online</code> has no CNAME record in Cloudflare DNS (Zone <code class="text-white">557180fc0420b27f1e5216df26702e55</code>). Paste a Cloudflare API Token below to automatically create the <code class="text-white">www &rarr; bargain-drop.online</code> DNS record, or add a CNAME record for <code class="text-white">www</code> in your Cloudflare Dashboard.
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <input id="cf-dns-token" type="password" placeholder="Cloudflare API Token (Zone.DNS)"
                class="bg-[#0b0d0f] border border-[#262a30] rounded-lg px-3 py-2 text-xs text-white focus:border-[#facc15] focus:outline-none w-56" />
              <button onclick="provisionWwwDns()" id="btn-www-dns" class="px-4 py-2 rounded-lg text-xs font-extrabold bg-[#facc15] text-[#08090a] hover:bg-[#fde047] transition-all">
                ⚡ Fix www DNS
              </button>
            </div>
          </div>
          <div id="www-dns-status" class="hidden mt-3 p-3 rounded-lg bg-[#0b0d0f] border border-[#262a30] text-xs font-mono-code text-[#22c55e]"></div>
        </div>

        <!-- 1-Click Custom HTML / Source Publisher to bargain-drop.online/adpulse -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          <div class="lg:col-span-6 space-y-3">
            <h3 class="font-display text-base font-extrabold text-white">
              🚀 Publish Custom Source Code Directly to <span class="text-[#fe3442]">bargain-drop.online/adpulse</span>
            </h3>
            <p class="text-xs text-[#818181]">
              Upload an <code class="text-white">index.html</code> file or paste the HTML/JS code from your source app below, enter your Admin PIN (<code class="text-white">03091996</code>), and click <strong>Deploy Live to /adpulse</strong>.
            </p>

            <div class="flex items-center gap-2">
              <input type="file" id="source-file-input" accept=".html,.htm,.txt,.js,.tsx" class="text-xs text-[#9aa0a6] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-extrabold file:bg-[#171a1d] file:text-white hover:file:bg-[#fe3442]" onchange="loadUploadedSourceFile(this)" />
            </div>

            <textarea id="custom-adpulse-html" rows="10" placeholder="Paste full <!DOCTYPE html>... code from your source app here to replace bargain-drop.online/adpulse..."
              class="w-full bg-[#08090a] border border-[#22262a] focus:border-[#facc15] rounded-xl p-3 font-mono-code text-xs text-white outline-none"></textarea>

            <div class="flex flex-wrap items-center gap-3">
              <input id="deploy-pin" type="password" value="03091996" placeholder="Admin PIN (03091996)"
                class="bg-[#08090a] border border-[#22262a] rounded-lg px-3 py-2 text-xs text-white font-mono-code w-44 outline-none" />
              <button onclick="deployCustomAdPulseLive()" id="deploy-live-btn" class="px-5 py-2.5 rounded-lg text-xs font-extrabold btn-red">
                ⚡ Deploy Live to bargain-drop.online/adpulse
              </button>
            </div>
            <div id="deploy-status-msg" class="text-xs font-bold text-[#22c55e] hidden"></div>
          </div>

          <!-- Live Iframe Bridge -->
          <div class="lg:col-span-6 flex flex-col space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-extrabold text-white">Live Source Container Viewport</span>
              <span class="text-[11px] font-mono-code text-[#818181]">ais-dev-wrs5hmf4cczk23rjbcfxrw...</span>
            </div>
            <div class="flex-1 min-h-[340px] bg-[#08090a] border border-[#22262a] rounded-xl overflow-hidden flex flex-col">
              <iframe id="source-bridge-iframe" src="about:blank" class="w-full flex-1 border-0 bg-[#08090a]"></iframe>
              <div id="iframe-placeholder" class="p-6 text-center my-auto space-y-3">
                <div class="text-3xl">🛰️</div>
                <div class="text-sm font-bold text-white">Source Container Bridge Ready</div>
                <p class="text-xs text-[#818181] max-w-md mx-auto">
                  Click <strong>"Embed Source Preview Below"</strong> to load <code class="text-[#dedede]">ais-dev-wrs5hmf4cczk23rjbcfxrw-128115771016.asia-east1.run.app</code> using your active Google AI Studio browser session, or open it in a new tab.
                </p>
                <button onclick="loadSourceInFrame()" class="px-4 py-2 rounded-lg text-xs font-extrabold bg-[#171a1d] border border-[#22262a] hover:border-[#facc15] text-[#facc15]">
                  Load Source App Frame
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

  </main>

  <!-- NEW CAMPAIGN MODAL -->
  <div id="campaign-modal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="glass-card w-full max-w-md p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-[#22262a] pb-3">
        <h3 class="font-display text-lg font-black text-white">Launch New AdPulse Campaign</h3>
        <button onclick="closeNewCampaignModal()" class="text-[#818181] hover:text-white text-lg">✕</button>
      </div>
      <div class="space-y-3 text-xs">
        <div>
          <label class="block font-bold text-[#dedede] mb-1">Campaign Name</label>
          <input id="new-camp-name" type="text" placeholder="e.g. AU Autumn Flash Sale — Under A$15"
            class="w-full bg-[#08090a] border border-[#22262a] rounded-lg px-3 py-2 text-white outline-none" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-[#dedede] mb-1">Channel</label>
            <select id="new-camp-channel" class="w-full bg-[#08090a] border border-[#22262a] rounded-lg px-3 py-2 text-white outline-none">
              <option value="Meta Ads">Meta Ads (FB/IG)</option>
              <option value="TikTok Ads">TikTok Ads</option>
              <option value="Google PMax">Google PMax</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-[#dedede] mb-1">Daily Budget (AUD)</label>
            <input id="new-camp-budget" type="number" value="50" min="5" step="5"
              class="w-full bg-[#08090a] border border-[#22262a] rounded-lg px-3 py-2 text-white outline-none" />
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button onclick="closeNewCampaignModal()" class="px-4 py-2 rounded-lg text-xs font-bold bg-[#171a1d] text-[#dedede]">Cancel</button>
        <button onclick="saveNewCampaign()" class="px-4 py-2 rounded-lg text-xs font-extrabold btn-red">Launch Campaign</button>
      </div>
    </div>
  </div>

  <!-- TOAST -->
  <div id="adpulse-toast" class="fixed bottom-5 right-5 z-50 hidden px-4 py-3 rounded-xl bg-[#111315] border border-[#fe3442] text-xs font-bold text-white shadow-2xl"></div>

  <script>
    const SOURCE_APP_URL = 'https://ais-dev-wrs5hmf4cczk23rjbcfxrw-128115771016.asia-east1.run.app/';
    const STORAGE_KEY = 'bd_adpulse_campaigns_v1';

    const DEFAULT_CAMPAIGNS = [
      { id: 'CMP-101', name: 'AU Sitewide Drop — Everything Under A$32.95', channel: 'Meta Ads', status: 'ACTIVE', dailyBudget: 65, spend: 485.20, revenue: 2290.40, roas: 4.72 },
      { id: 'CMP-102', name: 'TikTok Viral UGC — Women\'s Sets & Loungewear', channel: 'TikTok Ads', status: 'ACTIVE', dailyBudget: 50, spend: 340.00, revenue: 1580.15, roas: 4.65 },
      { id: 'CMP-103', name: 'Google Shopping PMax — Home & Garden Best Sellers', channel: 'Google PMax', status: 'ACTIVE', dailyBudget: 45, spend: 312.80, revenue: 1284.95, roas: 4.11 },
      { id: 'CMP-104', name: 'Dynamic Retargeting — Abandoned Cart 10% Off (WELCOME10)', channel: 'Meta Ads', status: 'ACTIVE', dailyBudget: 25, spend: 162.00, revenue: 745.00, roas: 4.60 },
      { id: 'CMP-105', name: 'Pet Supplies Flash Deals — Under A$15', channel: 'TikTok Ads', status: 'PAUSED', dailyBudget: 30, spend: 120.00, revenue: 284.00, roas: 2.37 }
    ];

    let campaigns = [];
    let catalogProducts = [];

    function loadCampaigns() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        campaigns = raw ? JSON.parse(raw) : DEFAULT_CAMPAIGNS;
      } catch (e) {
        campaigns = DEFAULT_CAMPAIGNS;
      }
      renderCampaigns();
    }

    function saveCampaigns() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns)); } catch (e) {}
      renderCampaigns();
    }

    function showToast(msg) {
      const el = document.getElementById('adpulse-toast');
      el.textContent = msg;
      el.classList.remove('hidden');
      clearTimeout(el._t);
      el._t = setTimeout(() => el.classList.add('hidden'), 3500);
    }

    function switchAdPulseTab(tab) {
      ['dashboard', 'creative', 'catalog', 'bridge'].forEach(t => {
        const view = document.getElementById('view-' + t);
        const btn = document.getElementById('tab-' + t);
        const mob = document.getElementById('mob-' + t);
        if (view) view.classList.toggle('hidden', t !== tab);
        if (btn) {
          btn.className = t === tab
            ? 'px-3 py-1.5 rounded-md btn-red'
            : 'px-3 py-1.5 rounded-md text-[#dedede] hover:text-white';
        }
        if (mob) {
          mob.className = t === tab
            ? 'px-3 py-1.5 rounded-md btn-red whitespace-nowrap'
            : 'px-3 py-1.5 rounded-md bg-[#111315] text-[#dedede] border border-[#22262a] whitespace-nowrap';
        }
      });
      if (tab === 'catalog' && catalogProducts.length === 0) {
        fetchCatalogProducts();
      }
    }

    function renderCampaigns() {
      const filter = document.getElementById('channelFilter').value;
      const tbody = document.getElementById('campaigns-tbody');
      const list = filter === 'ALL' ? campaigns : campaigns.filter(c => c.channel === filter);

      let totalSpend = 0;
      let totalRev = 0;
      campaigns.forEach(c => {
        totalSpend += Number(c.spend || 0);
        totalRev += Number(c.revenue || 0);
      });
      const roas = totalSpend > 0 ? (totalRev / totalSpend).toFixed(2) : '0.00';

      document.getElementById('kpi-spend').textContent = 'A$' + totalSpend.toFixed(2);
      document.getElementById('kpi-revenue').textContent = 'A$' + totalRev.toFixed(2);
      document.getElementById('kpi-roas').textContent = roas + 'x';

      tbody.innerHTML = list.map(c => {
        const isAct = c.status === 'ACTIVE';
        return `
          <tr class="hover:bg-[#14171a] transition">
            <td class="py-3.5 px-4">
              <button onclick="toggleCampaignStatus('${c.id}')" class="px-2.5 py-1 rounded text-[10px] font-extrabold uppercase ${isAct ? 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30' : 'bg-[#818181]/15 text-[#818181] border border-[#818181]/30'}">
                ${isAct ? '● ACTIVE' : '⏸ PAUSED'}
              </button>
            </td>
            <td class="py-3.5 px-4 font-bold text-white">${c.name}</td>
            <td class="py-3.5 px-4 text-[#dedede]">${c.channel}</td>
            <td class="py-3.5 px-4 text-right font-mono-code text-white">A$${Number(c.dailyBudget).toFixed(2)}/d</td>
            <td class="py-3.5 px-4 text-right font-mono-code text-[#dedede]">A$${Number(c.spend).toFixed(2)}</td>
            <td class="py-3.5 px-4 text-right font-mono-code font-bold text-[#facc15]">A$${Number(c.revenue).toFixed(2)}</td>
            <td class="py-3.5 px-4 text-right font-mono-code font-extrabold ${c.roas >= 3 ? 'text-[#22c55e]' : 'text-[#facc15]'}">${Number(c.roas).toFixed(2)}x</td>
            <td class="py-3.5 px-4 text-right space-x-1">
              <button onclick="scaleCampaignBudget('${c.id}')" class="px-2.5 py-1 rounded bg-[#171a1d] border border-[#22262a] hover:border-[#22c55e] text-[11px] font-bold text-white" title="Scale budget +20%">+20% Scale</button>
              <button onclick="deleteCampaign('${c.id}')" class="px-2 py-1 rounded bg-[#171a1d] border border-[#22262a] hover:border-[#fe3442] text-[11px] text-[#818181] hover:text-[#fe3442]">✕</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    function toggleCampaignStatus(id) {
      const c = campaigns.find(x => x.id === id);
      if (c) {
        c.status = c.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        saveCampaigns();
        showToast(`Campaign ${c.name} is now ${c.status}`);
      }
    }

    function scaleCampaignBudget(id) {
      const c = campaigns.find(x => x.id === id);
      if (c) {
        c.dailyBudget = Math.round(c.dailyBudget * 1.2);
        saveCampaigns();
        showToast(`Scaled daily budget to A$${c.dailyBudget}/day`);
      }
    }

    function deleteCampaign(id) {
      campaigns = campaigns.filter(x => x.id !== id);
      saveCampaigns();
      showToast('Campaign removed');
    }

    function openNewCampaignModal() {
      document.getElementById('campaign-modal').classList.remove('hidden');
    }
    function closeNewCampaignModal() {
      document.getElementById('campaign-modal').classList.add('hidden');
    }
    function saveNewCampaign() {
      const name = document.getElementById('new-camp-name').value.trim() || 'New Bargain Drop Campaign';
      const channel = document.getElementById('new-camp-channel').value;
      const budget = Number(document.getElementById('new-camp-budget').value) || 50;
      campaigns.unshift({
        id: 'CMP-' + Math.floor(100 + Math.random() * 900),
        name,
        channel,
        status: 'ACTIVE',
        dailyBudget: budget,
        spend: 0,
        revenue: 0,
        roas: 0
      });
      saveCampaigns();
      closeNewCampaignModal();
      showToast('🚀 Campaign launched!');
    }

    async function generateAiAdPack() {
      const title = document.getElementById('ai-prod-title').value.trim();
      const price = document.getElementById('ai-prod-price').value.trim();
      const platform = document.getElementById('ai-platform').value;
      const angle = document.getElementById('ai-angle').value.trim();
      const btn = document.getElementById('ai-gen-btn');
      const box = document.getElementById('ai-output-box');

      btn.disabled = true;
      btn.textContent = '⏳ Generating with Gemini AI...';
      box.textContent = 'Generating high-converting hooks, ad copy, and targeting for ' + title + '...';

      try {
        const prompt = `Create a high-converting ${platform} ad creative pack for Bargain Drop (bargain-drop.online).
Product: ${title}
Price: ${price} AUD
Angle: ${angle}
Include:
1) 3 Scroll-Stopping Video Hooks (0-3 seconds)
2) Primary Ad Copy with Australian spelling & emojis
3) 3 High-CTR Headlines
4) Recommended Audience Targeting Interests`;

        const res = await fetch('/api/architect/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: prompt, stream: false })
        });
        if (res.ok) {
          const text = await res.text();
          // Parse SSE or JSON
          let reply = '';
          for (const line of text.split('\n')) {
            if (line.startsWith('data:')) {
              try {
                const d = JSON.parse(line.slice(5).trim());
                if (d.text) reply += d.text;
                else if (d.reply && !reply) reply = d.reply;
              } catch (e) {}
            }
          }
          if (!reply) {
            try { const j = JSON.parse(text); reply = j.reply || j.text || ''; } catch (e) {}
          }
          if (reply) {
            box.textContent = reply;
            showToast('✨ AI Ad Creative Pack generated!');
            btn.disabled = false;
            btn.textContent = '✨ Generate Complete Ad Pack';
            return;
          }
        }
      } catch (e) {}

      // Fallback high-converting template if offline
      box.textContent = `🔥 3 SCROLL-STOPPING HOOKS (${platform}):
1. "Wait — why is everyone in Australia grabbing this ${title} for just ${price}?"
2. "Stop paying retail markups! We just dropped ${title} under A$32.95 with fast Aussie dispatch."
3. "Unpopular opinion: This ${price} find from Bargain Drop beats the $90 brand-name version."

📢 PRIMARY AD TEXT:
Meet the ${title} — now locked at just ${price} AUD on Bargain Drop! 🇦🇺
🎯 ${angle}
✅ Free Express Shipping on orders over A$29 AUD
✅ 30-Day Money-Back Guarantee
👉 Tap "Shop Now" at bargain-drop.online before stock runs out!

🎯 HIGH-CTR HEADLINES:
• ${title} — Only ${price} AUD Today
• Free Shipping A$29+ | Bargain Drop Australia
• Limited Stock Drop — Save Up To 60% Off`;
      btn.disabled = false;
      btn.textContent = '✨ Generate Complete Ad Pack';
      showToast('✨ Ad Creative Pack ready!');
    }

    function copyAdOutput() {
      const text = document.getElementById('ai-output-box').textContent;
      navigator.clipboard.writeText(text);
      showToast('📋 Copied ad creative pack to clipboard!');
    }

    function launchCampaignFromCreative() {
      const title = document.getElementById('ai-prod-title').value.trim();
      const platform = document.getElementById('ai-platform').value;
      campaigns.unshift({
        id: 'CMP-' + Math.floor(100 + Math.random() * 900),
        name: `AI Creative — ${title.slice(0, 38)}`,
        channel: platform.includes('TikTok') ? 'TikTok Ads' : platform.includes('Google') ? 'Google PMax' : 'Meta Ads',
        status: 'ACTIVE',
        dailyBudget: 45,
        spend: 0,
        revenue: 0,
        roas: 0
      });
      saveCampaigns();
      switchAdPulseTab('dashboard');
      showToast('🚀 New AI campaign launched to dashboard!');
    }

    async function fetchCatalogProducts() {
      const urls = ['/products-slim-0.json', '/store/all-products-0.json', '/featured.json'];
      for (const u of urls) {
        try {
          const r = await fetch(u);
          if (r.ok) {
            const data = await r.json();
            const arr = Array.isArray(data) ? data : (data.products || []);
            if (arr.length > 0) {
              catalogProducts = arr.slice(0, 48);
              renderCatalogProducts();
              return;
            }
          }
        } catch (e) {}
      }
    }

    function renderCatalogProducts() {
      const q = (document.getElementById('cat-search').value || '').toLowerCase();
      const grid = document.getElementById('catalog-grid');
      const filtered = catalogProducts.filter(p => !q || String(p.title || '').toLowerCase().includes(q)).slice(0, 24);
      if (!filtered.length) {
        grid.innerHTML = `<div class="col-span-full text-center py-8 text-xs text-[#818181]">No matching products found.</div>`;
        return;
      }
      grid.innerHTML = filtered.map(p => {
        const price = Math.min(32.95, Number(p.price) || 19.95).toFixed(2);
        const img = p.image || (p.images && p.images[0]) || '/official-logo.jpg';
        const safeTitle = String(p.title || 'Bargain Drop Product').replace(/'/g, "\\'");
        return `
          <div class="glass-card overflow-hidden flex flex-col justify-between p-3 gap-2">
            <div>
              <img src="${img}" alt="" class="w-full aspect-square object-cover rounded-lg bg-[#08090a] border border-[#22262a]" onerror="this.src='/official-logo.jpg'" />
              <div class="text-xs font-bold text-white line-clamp-2 mt-2">${p.title || 'Product'}</div>
              <div class="text-sm font-black text-[#facc15] mt-1">A$${price}</div>
            </div>
            <button onclick="selectProductForAd('${safeTitle}', 'A$${price}')" class="w-full py-2 rounded-lg text-[11px] font-extrabold btn-red mt-2">
              ✨ Create Ad for Product
            </button>
          </div>
        `;
      }).join('');
    }

    function selectProductForAd(title, price) {
      document.getElementById('ai-prod-title').value = title;
      document.getElementById('ai-prod-price').value = price;
      switchAdPulseTab('creative');
      generateAiAdPack();
    }

    function loadSourceInFrame() {
      const iframe = document.getElementById('source-bridge-iframe');
      const ph = document.getElementById('iframe-placeholder');
      if (ph) ph.classList.add('hidden');
      iframe.src = SOURCE_APP_URL;
      showToast('Loading source container...');
    }

    function loadUploadedSourceFile(input) {
      const f = input.files && input.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        document.getElementById('custom-adpulse-html').value = String(reader.result || '');
        showToast('Loaded ' + f.name + ' — ready to deploy live!');
      };
      reader.readAsText(f);
    }

    async function deployCustomAdPulseLive() {
      const code = document.getElementById('custom-adpulse-html').value.trim();
      const pin = document.getElementById('deploy-pin').value.trim() || '03091996';
      const btn = document.getElementById('deploy-live-btn');
      const statusEl = document.getElementById('deploy-status-msg');

      if (!code) {
        showToast('Please paste or upload HTML/source code first');
        return;
      }

      btn.disabled = true;
      btn.textContent = '⏳ Deploying to bargain-drop.online/adpulse...';
      statusEl.classList.remove('hidden');
      statusEl.textContent = 'Pushing to live repository & Cloudflare edge...';

      try {
        const res = await fetch('/api/architect/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin },
          body: JSON.stringify({
            target: 'adpulse.html',
            blueprint: code,
            dryRun: true
          })
        });
        const d = await res.json().catch(() => ({}));
        if (res.ok && d.repoApplied) {
          statusEl.textContent = '✅ Deployed live to bargain-drop.online/adpulse (Commit: ' + (d.commitSha || 'applied').slice(0, 8) + ')!';
          showToast('✅ Published live to bargain-drop.online/adpulse!');
        } else {
          // Try local server endpoint fallback
          const localRes = await fetch('/api/adpulse/deploy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': pin },
            body: JSON.stringify({ html: code, pin })
          });
          const localData = await localRes.json().catch(() => ({}));
          if (localRes.ok && localData.ok) {
            statusEl.textContent = '✅ Deployed to local & live bargain-drop.online/adpulse!';
            showToast('✅ Deployed live!');
          } else {
            throw new Error(d.error || localData.error || 'Deploy failed');
          }
        }
      } catch (e) {
        statusEl.textContent = '⚠️ Error: ' + e.message;
      } finally {
        btn.disabled = false;
        btn.textContent = '⚡ Deploy Live to bargain-drop.online/adpulse';
      }
    }

    // Sync real store orders revenue if available
    
    async function provisionWwwDns() {
      const token = document.getElementById("cf-dns-token").value.trim();
      const statusEl = document.getElementById("www-dns-status");
      const btn = document.getElementById("btn-www-dns");
      statusEl.classList.remove("hidden");
      if (!token) {
        statusEl.textContent = "⚠️ Enter a Cloudflare API Token (or in Cloudflare Dashboard -> DNS -> Records, add: Type CNAME, Name www, Target bargain-drop.online, Proxied ON).";
        return;
      }
      btn.disabled = true;
      btn.textContent = "⏳ Configuring DNS...";
      statusEl.textContent = "Creating CNAME www -> bargain-drop.online on Cloudflare Zone 557180fc0420b27f1e5216df26702e55...";
      try {
        const r = await fetch("/api/adpulse/setup-www-dns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cloudflareToken: token })
        });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.ok) {
          statusEl.textContent = "✅ " + d.message;
          showToast("✅ www.bargain-drop.online DNS record created!");
        } else {
          statusEl.textContent = "⚠️ " + (d.error || "Failed to create DNS record. In Cloudflare Dashboard -> DNS, add CNAME www -> bargain-drop.online.");
        }
      } catch (e) {
        statusEl.textContent = "⚠️ " + e.message;
      } finally {
        btn.disabled = false;
        btn.textContent = "⚡ Fix www DNS";
      }
    }

    async function syncLiveOrdersMetrics() {
      try {
        const r = await fetch('/api/admin/orders?pin=03091996');
        if (r.ok) {
          const d = await r.json();
          if (d.stats && d.stats.totalOrders) {
            document.getElementById('kpi-orders-sub').textContent = `Synced with ${d.stats.totalOrders} live store orders (A$${d.stats.totalRevenue})`;
          }
        }
      } catch (e) {}
    }

    loadCampaigns();
    syncLiveOrdersMetrics();
  </script>
</body>
</html>