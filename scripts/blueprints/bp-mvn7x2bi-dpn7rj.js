<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AdStudio — AI Video Ad & Creative Studio | Bargain Drop</title>
  <meta name="description" content="Bargain Drop AdStudio — AI Video Ads, TikTok & Meta Creative Studio, Viral Hooks & Campaign Automation at bargain-drop.online/adstudio" />
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
        radial-gradient(700px 380px at 15% 15%, rgba(59, 130, 246, 0.10), transparent 60%);
      color: #f3f4f6;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      min-height: 100vh;
    }
    .font-display { font-family: 'Outfit', sans-serif; }
    .font-mono-code { font-family: 'JetBrains Mono', monospace; }
    .obsidian-card {
      background: linear-gradient(180deg, #121417 0%, #0d0f11 100%);
      border: 1px solid var(--border);
      border-radius: 12px;
    }
    .obsidian-card:hover {
      border-color: rgba(254, 52, 66, 0.35);
    }
    .btn-red {
      background: linear-gradient(180deg, #fe3442 0%, #d32b3f 100%);
      color: #ffffff;
      font-weight: 800;
      box-shadow: 0 4px 16px rgba(254, 52, 66, 0.35);
      transition: all 0.18s ease;
    }
    .btn-red:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 22px rgba(254, 52, 66, 0.5);
    }
    .phone-mockup {
      width: 280px;
      height: 560px;
      border: 10px solid #1f2429;
      border-radius: 36px;
      box-shadow: 0 25px 60px -15px rgba(0,0,0,0.9), 0 0 25px rgba(254,52,66,0.15);
      position: relative;
      overflow: hidden;
      background: #000;
    }
    .phone-notch {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100px;
      height: 18px;
      background: #1f2429;
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
      z-index: 30;
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0c0e10; }
    ::-webkit-scrollbar-thumb { background: #262a30; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #fe3442; }
  </style>
</head>
<body class="flex flex-col min-h-screen">

  <!-- Top Global Bar -->
  <header class="border-b border-[#22262a] bg-[#090b0d]/90 backdrop-blur-md sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <a href="/" class="flex items-center gap-2.5">
          <img src="/official-logo.jpg" alt="Bargain Drop" class="w-8 h-8 rounded-lg object-contain border border-[#262a30]" />
          <div>
            <div class="text-sm font-black uppercase tracking-tight font-display">
              <span class="text-[#fe3442]">BARGAIN</span> <span class="text-white">DROP</span>
            </div>
            <div class="text-[10px] font-extrabold text-[#facc15] tracking-widest uppercase -mt-0.5">
              AdStudio AI v2.4
            </div>
          </div>
        </a>
        <span class="hidden md:inline-block h-4 w-[1px] bg-[#22262a]"></span>
        <span class="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-[#14181c] border border-[#262a30] text-[#9ca3af]">
          <span>🎬 Video &amp; Meta Ad Suite</span>
        </span>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-1.5 sm:gap-2 text-xs font-extrabold">
        <button onclick="switchStudioTab('builder')" id="tab-builder" class="px-3 py-1.5 rounded-md btn-red">
          🚀 Ad Builder
        </button>
        <button onclick="switchStudioTab('storyboard')" id="tab-storyboard" class="px-3 py-1.5 rounded-md text-[#dedede] hover:text-white hover:bg-[#15181b]">
          📜 Storyboards
        </button>
        <button onclick="switchStudioTab('catalog')" id="tab-catalog" class="px-3 py-1.5 rounded-md text-[#dedede] hover:text-white hover:bg-[#15181b]">
          🛍️ Catalog
        </button>
        <button onclick="switchStudioTab('source-clone')" id="tab-source-clone" class="px-3 py-1.5 rounded-md text-[#facc15] hover:bg-[#facc15]/10 border border-[#facc15]/30">
          ⚡ Source Container
        </button>
        <a href="/admin.html" class="px-3 py-1.5 rounded-md text-[#9ca3af] hover:text-white hover:bg-[#15181b] border border-[#22262a]">
          Admin 🔒
        </a>
      </div>
    </div>
  </header>

  <!-- Main Workspace -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

    <!-- Hero / Status Banner -->
    <div class="obsidian-card p-5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-[#fe3442]">
      <div>
        <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#fe3442] mb-1">
          <span>● Live Edge Deployment</span>
          <span class="text-[#818181]">·</span>
          <span class="text-[#22c55e]">bargain-drop.online/adstudio</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
          AdStudio — AI Viral Ad &amp; Video Creative Engine
        </h1>
        <p class="text-sm text-[#9ca3af] mt-1 max-w-3xl">
          Instantly generate high-CTR TikTok video hooks, UGC storyboards, Meta primary text, and Instagram Reels copy for any Bargain Drop product. Capped under A$32.95 AUD with fast Australian dispatch.
        </p>
      </div>

      <div class="flex items-center gap-2.5 shrink-0">
        <a href="https://bargain-drop.online/adpulse" class="px-3.5 py-2 rounded-lg text-xs font-extrabold bg-[#15181b] text-[#dedede] border border-[#262a30] hover:border-[#fe3442] transition-colors">
          📊 AdPulse Metrics
        </a>
        <button onclick="generateAdCreative()" id="btn-hero-gen" class="px-4 py-2 rounded-lg text-xs font-extrabold btn-red flex items-center gap-1.5">
          <span>✨</span>
          <span>Generate Viral Ad</span>
        </button>
      </div>
    </div>

    <!-- ==================== TAB 1: AD BUILDER & CREATIVE STUDIO ==================== -->
    <section id="panel-builder" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Left Column: Controls & Product Selection (7 cols) -->
      <div class="lg:col-span-7 space-y-6">
        
        <!-- Step 1: Target Product -->
        <div class="obsidian-card p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-[#22262a] pb-3">
            <h2 class="text-base font-extrabold text-white flex items-center gap-2">
              <span class="w-6 h-6 rounded bg-[#fe3442] text-white flex items-center justify-center text-xs">1</span>
              <span>Select Product from Catalog</span>
            </h2>
            <button onclick="loadStoreCatalog()" class="text-xs text-[#facc15] hover:underline font-bold">
              🔄 Refresh Catalog
            </button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-[#9ca3af] uppercase mb-1.5">Search or Select Product</label>
              <select id="ad-product-select" onchange="onProductSelected()" class="w-full bg-[#0b0d0f] border border-[#262a30] rounded-lg p-2.5 text-xs text-white focus:border-[#fe3442] focus:outline-none">
                <option value="">Loading live products...</option>
              </select>
            </div>

            <!-- Selected Product Card Preview -->
            <div id="selected-product-card" class="p-3 rounded-lg bg-[#0d0f12] border border-[#22262a] flex items-center gap-3">
              <img id="sel-prod-img" src="/official-logo.jpg" alt="Product" class="w-14 h-14 rounded-md object-cover bg-[#171a1d] border border-[#22262a]" />
              <div class="flex-1 min-w-0">
                <div id="sel-prod-title" class="text-xs font-bold text-white truncate">Select a product above</div>
                <div class="flex items-center gap-2 mt-1">
                  <span id="sel-prod-price" class="text-xs font-black text-[#fe3442]">A$24.95 AUD</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-[#22c55e]/15 text-[#22c55e] font-bold">In Stock · Fast AU Post</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Campaign Format & Tone -->
        <div class="obsidian-card p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-[#22262a] pb-3">
            <h2 class="text-base font-extrabold text-white flex items-center gap-2">
              <span class="w-6 h-6 rounded bg-[#fe3442] text-white flex items-center justify-center text-xs">2</span>
              <span>Campaign &amp; Platform Specs</span>
            </h2>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-[#9ca3af] uppercase mb-1.5">Platform Target</label>
              <select id="ad-platform" class="w-full bg-[#0b0d0f] border border-[#262a30] rounded-lg p-2.5 text-xs text-white focus:border-[#fe3442] focus:outline-none">
                <option value="TikTok Ads (9:16 UGC Vertical)">TikTok Ads (9:16 UGC Vertical)</option>
                <option value="Instagram Reels & Stories (9:16)">Instagram Reels & Stories (9:16)</option>
                <option value="Meta Feed & Carousel (1:1 Square)">Meta Feed & Carousel (1:1 Square)</option>
                <option value="YouTube Shorts (9:16)">YouTube Shorts (9:16)</option>
                <option value="Google Performance Max (Multi-asset)">Google Performance Max (Multi-asset)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#9ca3af] uppercase mb-1.5">Creative Angle / Hook Tone</label>
              <select id="ad-tone" class="w-full bg-[#0b0d0f] border border-[#262a30] rounded-lg p-2.5 text-xs text-white focus:border-[#fe3442] focus:outline-none">
                <option value="Viral TikTok Hook (POV / Wait for it)">Viral TikTok Hook (POV / Wait for it)</option>
                <option value="Problem -> Solution -> Bargain Reveal">Problem -> Solution -> Bargain Reveal</option>
                <option value="Aussie Bargain Alert (Under A$32.95)">Aussie Bargain Alert (Under A$32.95)</option>
                <option value="Unboxing & Honest Reaction UGC">Unboxing & Honest Reaction UGC</option>
                <option value="Flash Drop Urgency (Selling Fast)">Flash Drop Urgency (Selling Fast)</option>
              </select>
            </div>
          </div>

          <div class="pt-2">
            <button onclick="generateAdCreative()" id="btn-generate-main" class="w-full py-3 rounded-lg text-sm font-extrabold btn-red flex items-center justify-center gap-2">
              <span>✨</span>
              <span>Generate Multi-Asset Ad Pack (Hooks + Storyboard + Copy)</span>
            </button>
          </div>
        </div>

        <!-- Generated Ad Copy Results -->
        <div class="obsidian-card p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-[#22262a] pb-3">
            <h2 class="text-base font-extrabold text-white flex items-center gap-2">
              <span class="w-6 h-6 rounded bg-[#22c55e] text-white flex items-center justify-center text-xs">✓</span>
              <span>Generated Ad Assets &amp; Hooks</span>
            </h2>
            <button onclick="copyGeneratedAd()" class="text-xs text-[#22c55e] hover:underline font-bold flex items-center gap-1">
              <span>📋</span> Copy Full Ad Pack
            </button>
          </div>

          <div class="space-y-4 text-xs">
            <div>
              <div class="font-extrabold uppercase text-[#facc15] mb-1">5 Scroll-Stopping 3-Second Hooks</div>
              <div id="gen-hooks" class="space-y-1.5 p-3 rounded-lg bg-[#0b0d0f] border border-[#262a30] font-mono-code text-[#dedede]">
                Generating high-converting hooks...
              </div>
            </div>

            <div>
              <div class="font-extrabold uppercase text-[#3b82f6] mb-1">Primary Ad Caption &amp; Hashtags</div>
              <textarea id="gen-caption" rows="4" class="w-full p-3 rounded-lg bg-[#0b0d0f] border border-[#262a30] text-[#dedede] focus:border-[#3b82f6] focus:outline-none"></textarea>
            </div>

            <div>
              <div class="font-extrabold uppercase text-[#22c55e] mb-1">High-CTR Headline &amp; Call to Action</div>
              <div class="flex gap-2">
                <input id="gen-headline" type="text" class="flex-1 p-2.5 rounded-lg bg-[#0b0d0f] border border-[#262a30] text-[#dedede]" />
                <button onclick="copyElementText('gen-headline')" class="px-3 py-2 rounded-lg bg-[#15181b] border border-[#262a30] text-white font-bold hover:bg-[#202429]">
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Right Column: Interactive Phone Mockup Preview (5 cols) -->
      <div class="lg:col-span-5 flex flex-col items-center">
        <div class="text-xs font-extrabold text-[#9ca3af] uppercase tracking-wider mb-2 flex items-center gap-2">
          <span>📱 Real-Time 9:16 Video Ad Mockup</span>
          <span class="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></span>
        </div>

        <div class="phone-mockup flex flex-col justify-between p-4 relative text-white">
          <div class="phone-notch"></div>

          <!-- Video Background Layer (Simulated) -->
          <div class="absolute inset-0 z-0">
            <img id="mock-video-bg" src="/official-logo.jpg" alt="Ad Video" class="w-full h-full object-cover filter brightness-[0.7]" />
            <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90"></div>
          </div>

          <!-- Top Phone Bar -->
          <div class="relative z-10 flex items-center justify-between pt-3 text-[10px] font-bold text-white/80">
            <div class="flex items-center gap-2">
              <span class="text-[11px]">9:41</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span>● LIVE</span>
              <span>5G</span>
            </div>
          </div>

          <!-- Right Sidebar Icons (TikTok Style) -->
          <div class="relative z-10 self-end flex flex-col items-center gap-4 text-center mr-1">
            <div class="flex flex-col items-center">
              <div class="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-lg">❤️</div>
              <span class="text-[9px] font-bold mt-0.5">24.8K</span>
            </div>
            <div class="flex flex-col items-center">
              <div class="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-lg">💬</div>
              <span class="text-[9px] font-bold mt-0.5">412</span>
            </div>
            <div class="flex flex-col items-center">
              <div class="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-lg">↗️</div>
              <span class="text-[9px] font-bold mt-0.5">Share</span>
            </div>
          </div>

          <!-- Bottom Ad Overlay Details -->
          <div class="relative z-10 space-y-2 pb-2">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-full bg-[#fe3442] flex items-center justify-center text-xs font-black">BD</div>
              <div class="text-xs font-black">@bargaindrop.au</div>
              <span class="text-[10px] px-1.5 py-0.2 rounded bg-white/20 font-bold">Sponsored</span>
            </div>

            <p id="mock-caption" class="text-[11px] leading-tight text-white/90 line-clamp-2">
              Stop overpaying in Australia! Every everyday essential strictly under A$32.95 with locked .95 pricing.
            </p>

            <!-- Bottom CTA Button (Shop Now) -->
            <a id="mock-cta-btn" href="https://bargain-drop.online" target="_blank" class="w-full py-2.5 rounded-lg btn-red flex items-center justify-between px-3 text-xs font-black tracking-wide">
              <span id="mock-cta-text">Shop Now · Under A$32.95</span>
              <span>➔</span>
            </a>
          </div>
        </div>

        <div class="mt-4 text-center">
          <p class="text-[11px] text-[#818181]">
            Simulated 9:16 mobile view for TikTok Ads, Instagram Reels, and YouTube Shorts.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================== TAB 2: STORYBOARD SCRIPT CREATOR ==================== -->
    <section id="panel-storyboard" class="hidden obsidian-card p-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#22262a] pb-4">
        <div>
          <h2 class="text-xl font-black text-white font-display">
            Timestamped Video Storyboard &amp; Scene Director
          </h2>
          <p class="text-xs text-[#9ca3af] mt-0.5">
            Full 25-second script breakdown ready to hand to UGC creators or video editors.
          </p>
        </div>
        <button onclick="copyStoryboard()" class="px-4 py-2 rounded-lg text-xs font-extrabold btn-red">
          📋 Copy Storyboard Script
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <!-- Scene 1 -->
        <div class="p-4 rounded-lg bg-[#0b0d0f] border border-[#262a30] space-y-2">
          <div class="flex items-center justify-between text-[11px] font-extrabold text-[#fe3442]">
            <span>SCENE 1</span>
            <span>0s – 3s</span>
          </div>
          <div class="font-bold text-white text-xs">Visual Hook</div>
          <p id="sb-scene-1" class="text-xs text-[#9ca3af]">
            Creator looks shocked at camera holding ordinary expensive product, then smashes cut to Bargain Drop unboxing.
          </p>
          <div class="text-[10px] text-[#facc15] font-mono-code">Audio: "I was today years old when..."</div>
        </div>

        <!-- Scene 2 -->
        <div class="p-4 rounded-lg bg-[#0b0d0f] border border-[#262a30] space-y-2">
          <div class="flex items-center justify-between text-[11px] font-extrabold text-[#3b82f6]">
            <span>SCENE 2</span>
            <span>3s – 8s</span>
          </div>
          <div class="font-bold text-white text-xs">The Problem</div>
          <p id="sb-scene-2" class="text-xs text-[#9ca3af]">
            Highlighting why retail prices in Australia are ridiculous, showing store receipt or frustrated user.
          </p>
          <div class="text-[10px] text-[#3b82f6] font-mono-code">Text overlay: "Why is everything $80?!"</div>
        </div>

        <!-- Scene 3 -->
        <div class="p-4 rounded-lg bg-[#0b0d0f] border border-[#262a30] space-y-2">
          <div class="flex items-center justify-between text-[11px] font-extrabold text-[#22c55e]">
            <span>SCENE 3</span>
            <span>8s – 15s</span>
          </div>
          <div class="font-bold text-white text-xs">Bargain Drop Solution</div>
          <p id="sb-scene-3" class="text-xs text-[#9ca3af]">
            Close-up product demonstration, showing high build quality, durability, and practical everyday use.
          </p>
          <div class="text-[10px] text-[#22c55e] font-mono-code">Voiceover: "Found this on Bargain Drop..."</div>
        </div>

        <!-- Scene 4 -->
        <div class="p-4 rounded-lg bg-[#0b0d0f] border border-[#262a30] space-y-2">
          <div class="flex items-center justify-between text-[11px] font-extrabold text-[#facc15]">
            <span>SCENE 4</span>
            <span>15s – 20s</span>
          </div>
          <div class="font-bold text-white text-xs">Locked Price Reveal</div>
          <p id="sb-scene-4" class="text-xs text-[#9ca3af]">
            Camera zooms in on the price tag: strictly under A$32.95 AUD with Free Express Shipping over A$29.
          </p>
          <div class="text-[10px] text-[#facc15] font-mono-code">Sticker: "Under A$32.95 AUD!"</div>
        </div>

        <!-- Scene 5 -->
        <div class="p-4 rounded-lg bg-[#0b0d0f] border border-[#262a30] space-y-2">
          <div class="flex items-center justify-between text-[11px] font-extrabold text-[#ec4899]">
            <span>SCENE 5</span>
            <span>20s – 25s</span>
          </div>
          <div class="font-bold text-white text-xs">Call To Action</div>
          <p id="sb-scene-5" class="text-xs text-[#9ca3af]">
            Finger points to the link below: "Stock drops daily, grab yours before it sells out at bargain-drop.online!"
          </p>
          <div class="text-[10px] text-[#ec4899] font-mono-code">CTA: "Tap Shop Now ➔"</div>
        </div>
      </div>
    </section>

    <!-- ==================== TAB 3: LIVE STORE CATALOG ==================== -->
    <section id="panel-catalog" class="hidden obsidian-card p-6 space-y-6">
      <div class="flex items-center justify-between border-b border-[#22262a] pb-4">
        <div>
          <h2 class="text-xl font-black text-white font-display">
            Live Store Catalog &amp; Ad Launcher
          </h2>
          <p class="text-xs text-[#9ca3af] mt-0.5">
            Pick any product from the Bargain Drop 14-department catalog to generate targeted ad creatives.
          </p>
        </div>
        <div class="text-xs text-[#facc15] font-bold font-mono-code" id="catalog-count-badge">
          Loaded 0 products
        </div>
      </div>

      <div id="catalog-grid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <!-- Injected via loadStoreCatalog() -->
        <div class="p-4 text-center text-xs text-[#818181] col-span-full">Loading catalog...</div>
      </div>
    </section>

    <!-- ==================== TAB 4: SOURCE CONTAINER CLONE & BRIDGE ==================== -->
    <section id="panel-source-clone" class="hidden space-y-6">
      <div class="obsidian-card p-6 space-y-4 border-[#facc15]/40">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#22262a] pb-4">
          <div>
            <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#facc15] mb-1">
              <span>⚡ Source Applet Container Bridge</span>
            </div>
            <h2 class="text-xl font-black text-white font-display">
              Connect to https://ais-dev-wrs5hmf4cczk23rjbcfxrw-128115771016.asia-east1.run.app/
            </h2>
            <p class="text-xs text-[#9ca3af] mt-1 max-w-3xl">
              Because Google AI Studio dev containers require your authenticated Google session cookie, you can open the source app directly in a browser tab or embed it below. If you want to deploy any custom HTML or bundle directly to <code class="text-[#22c55e]">bargain-drop.online/adstudio</code>, paste the code below and hit <strong>Deploy Live</strong>.
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <a href="https://ais-dev-wrs5hmf4cczk23rjbcfxrw-128115771016.asia-east1.run.app/" target="_blank" rel="noopener noreferrer" class="px-4 py-2 rounded-lg text-xs font-extrabold bg-[#facc15] text-[#08090a] hover:bg-[#fde047] transition-colors flex items-center gap-1">
              <span>↗️</span>
              <span>Open Source Dev App</span>
            </a>
          </div>
        </div>

        <!-- 1-Click Code Overwrite & Edge Deployer -->
        <div class="space-y-3 pt-2">
          <label class="block text-xs font-extrabold text-white uppercase">
            🚀 1-Click Custom Code Deployer to <span class="text-[#22c55e]">bargain-drop.online/adstudio</span>
          </label>
          <textarea id="custom-source-code" rows="8" placeholder="Paste custom <!DOCTYPE html> or bundle code here to instantly replace bargain-drop.online/adstudio..." class="w-full p-3 rounded-lg bg-[#0b0d0f] border border-[#262a30] text-xs font-mono-code text-[#dedede] focus:border-[#facc15] focus:outline-none"></textarea>
          
          <div class="flex items-center justify-between gap-3">
            <div id="deploy-status" class="text-xs font-mono-code text-[#22c55e] hidden"></div>
            <button onclick="deployCustomSource()" id="btn-deploy-source" class="ml-auto px-5 py-2.5 rounded-lg text-xs font-extrabold btn-red flex items-center gap-2">
              <span>⚡</span>
              <span>Deploy Live to bargain-drop.online/adstudio</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Live Embed Frame -->
      <div class="obsidian-card p-4 space-y-3">
        <div class="flex items-center justify-between text-xs font-bold text-[#9ca3af]">
          <span>Integrated Browser Viewport</span>
          <button onclick="reloadSourceIframe()" class="text-[#facc15] hover:underline">
            🔄 Reload Frame
          </button>
        </div>
        <div class="w-full h-[600px] rounded-lg bg-[#000] border border-[#262a30] overflow-hidden relative">
          <iframe id="source-iframe" src="https://ais-dev-wrs5hmf4cczk23rjbcfxrw-128115771016.asia-east1.run.app/" class="w-full h-full border-0"></iframe>
        </div>
      </div>
    </section>

  </main>

  <!-- Footer -->
  <footer class="border-t border-[#22262a] bg-[#090b0d] py-6 px-4 text-center text-xs text-[#818181] mt-auto">
    <div class="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-[#dedede] mb-2">
      <a href="/" class="hover:text-white">Storefront</a>
      <span>·</span>
      <a href="/admin.html" class="hover:text-white">Admin Hub</a>
      <span>·</span>
      <a href="/adpulse" class="hover:text-white">AdPulse</a>
      <span>·</span>
      <a href="/adstudio" class="text-[#fe3442]">AdStudio</a>
    </div>
    <div>&copy; 2026 Bargain Drop. AI Studio &amp; Edge Ad Engine. Free Shipping in Australia A$29+.</div>
  </footer>

  <!-- Toast Notification -->
  <div id="toast" class="fixed bottom-6 right-6 px-4 py-2.5 rounded-lg bg-[#15181b] border border-[#22c55e] text-[#22c55e] text-xs font-extrabold shadow-2xl transition-all duration-300 opacity-0 pointer-events-none z-50">
    Notification
  </div>

  <script>
    // Global State
    let storeProducts = [];
    let currentSelectedProduct = null;

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.style.opacity = '1';
      t.style.pointerEvents = 'auto';
      setTimeout(() => {
        t.style.opacity = '0';
        t.style.pointerEvents = 'none';
      }, 3000);
    }

    function switchStudioTab(tab) {
      ['builder', 'storyboard', 'catalog', 'source-clone'].forEach(t => {
        const panel = document.getElementById(`panel-${t}`);
        const btn = document.getElementById(`tab-${t}`);
        if (panel) panel.classList.toggle('hidden', t !== tab);
        if (btn) {
          if (t === tab) {
            btn.className = 'px-3 py-1.5 rounded-md btn-red';
          } else {
            btn.className = 'px-3 py-1.5 rounded-md text-[#dedede] hover:text-white hover:bg-[#15181b]';
          }
        }
      });
    }

    async function loadStoreCatalog() {
      const select = document.getElementById('ad-product-select');
      const grid = document.getElementById('catalog-grid');
      const badge = document.getElementById('catalog-count-badge');

      select.innerHTML = '<option value="">Loading catalog products...</option>';

      try {
        const res = await fetch('/products-slim.json').catch(() => null);
        let prods = [];
        if (res && res.ok) {
          prods = await res.json();
        } else {
          // fallback to featured
          const fRes = await fetch('/featured.json');
          prods = await fRes.json();
        }

        storeProducts = Array.isArray(prods) ? prods.slice(0, 60) : [];
        if (badge) badge.textContent = `Loaded ${storeProducts.length} products`;

        select.innerHTML = '';
        storeProducts.forEach((p, idx) => {
          const opt = document.createElement('option');
          opt.value = idx;
          opt.textContent = `${p.title || p.name} — A$${p.price || '24.95'}`;
          select.appendChild(opt);
        });

        if (storeProducts.length > 0) {
          select.value = '0';
          onProductSelected();
        }

        // Render Catalog Grid
        if (grid) {
          grid.innerHTML = storeProducts.map((p, idx) => `
            <div onclick="selectProductFromGrid(${idx})" class="obsidian-card p-3 cursor-pointer hover:border-[#fe3442] transition-all flex flex-col justify-between">
              <img src="${p.image || p.featured_image || '/official-logo.jpg'}" alt="${p.title}" class="w-full h-32 object-cover rounded-md bg-[#171a1d] mb-2" onerror="this.src='/official-logo.jpg'" />
              <div>
                <div class="text-xs font-bold text-white line-clamp-2">${p.title || p.name}</div>
                <div class="flex items-center justify-between mt-2">
                  <span class="text-xs font-black text-[#fe3442]">A$${p.price || '24.95'}</span>
                  <span class="text-[10px] text-[#22c55e] font-extrabold">Ad Ready</span>
                </div>
              </div>
            </div>
          `).join('');
        }

      } catch (e) {
        select.innerHTML = '<option value="">Bargain Drop Multi-Tool Outdoor Kit — A$32.95</option>';
        storeProducts = [{
          title: 'Bargain Drop Multi-Tool Outdoor Kit',
          price: '32.95',
          image: '/official-logo.jpg',
          category: 'Outdoor & Survival'
        }];
        onProductSelected();
      }
    }

    function onProductSelected() {
      const idx = document.getElementById('ad-product-select').value;
      const prod = storeProducts[idx] || storeProducts[0];
      if (!prod) return;

      currentSelectedProduct = prod;
      document.getElementById('sel-prod-title').textContent = prod.title || prod.name;
      document.getElementById('sel-prod-price').textContent = `A$${prod.price || '24.95'} AUD`;
      if (prod.image || prod.featured_image) {
        document.getElementById('sel-prod-img').src = prod.image || prod.featured_image;
        document.getElementById('mock-video-bg').src = prod.image || prod.featured_image;
      }

      document.getElementById('mock-cta-text').textContent = `Shop Now · A$${prod.price || '24.95'}`;
      generateAdCreative();
    }

    function selectProductFromGrid(idx) {
      document.getElementById('ad-product-select').value = idx;
      onProductSelected();
      switchStudioTab('builder');
    }

    function generateAdCreative() {
      const prod = currentSelectedProduct || {
        title: 'Bargain Drop Everyday Essential',
        price: '24.95'
      };
      const title = prod.title || prod.name || 'Essential Drop';
      const price = prod.price || '24.95';
      const platform = document.getElementById('ad-platform').value;
      const tone = document.getElementById('ad-tone').value;

      // Dynamic Hooks
      const hooks = [
        `1. "POV: You refused to pay retail price in Australia and found this for A$${price}..."`,
        `2. "Wait... how is this only A$${price} with free Australian shipping?!"`,
        `3. "Stop buying this from big retail stores. Get the exact same quality for under A$32.95."`,
        `4. "Things TikTok made me buy in Australia that were actually 100% worth it (Day 42)."`,
        `5. "I almost paid $80 for this yesterday until my friend sent me this link..."`
      ];
      document.getElementById('gen-hooks').innerHTML = hooks.map(h => `<div class="p-1">${h}</div>`).join('');

      // Dynamic Primary Text
      const caption = `Stop overpaying retail prices! 🇦🇺 The ${title} is officially restocked at Bargain Drop for just A$${price} AUD.\n\n✨ Premium everyday build\n📦 Fast Australian dispatch from warehouse\n🚚 FREE Express Shipping on orders over A$29\n🔒 30-Day Money-Back Guarantee\n\nTap "Shop Now" before this batch sells out! 👇 #BargainDrop #AustraliaDeals #ViralFinds`;
      document.getElementById('gen-caption').value = caption;
      document.getElementById('mock-caption').textContent = caption.slice(0, 120) + '...';

      // Dynamic Headline
      const headline = `🔥 Capped under A$32.95: ${title} (Free AU Shipping A$29+)`;
      document.getElementById('gen-headline').value = headline;

      // Dynamic Storyboard
      document.getElementById('sb-scene-1').textContent = `Creator holds ${title} up to the lens with shock: "I almost spent $70 on this in Melbourne!"`;
      document.getElementById('sb-scene-2').textContent = `B-roll of Australian retail price tags vs everyday living expenses.`;
      document.getElementById('sb-scene-3').textContent = `Hands-on unboxing and testing of the ${title}, showing smooth functionality and sleek finish.`;
      document.getElementById('sb-scene-4').textContent = `Price graphic pop-up: locked at A$${price} with free shipping threshold at A$29.`;
      document.getElementById('sb-scene-5').textContent = `Creator taps phone screen showing bargain-drop.online checkout: "Link is right below!"`;

      showToast('✨ Generated viral ad creative pack!');
    }

    function copyGeneratedAd() {
      const text = `=== BARGAIN DROP AD CREATIVE PACK ===\nProduct: ${document.getElementById('sel-prod-title').textContent}\nPrice: ${document.getElementById('sel-prod-price').textContent}\n\n--- 5 VIRAL HOOKS ---\n${document.getElementById('gen-hooks').innerText}\n\n--- PRIMARY TEXT ---\n${document.getElementById('gen-caption').value}\n\n--- HEADLINE ---\n${document.getElementById('gen-headline').value}\n\nUrl: https://bargain-drop.online`;
      navigator.clipboard.writeText(text);
      showToast('📋 Copied full ad pack to clipboard!');
    }

    function copyStoryboard() {
      const text = `=== BARGAIN DROP 25-SEC VIDEO STORYBOARD ===\nScene 1 (0-3s Hook): ${document.getElementById('sb-scene-1').textContent}\nScene 2 (3-8s Problem): ${document.getElementById('sb-scene-2').textContent}\nScene 3 (8-15s Demo): ${document.getElementById('sb-scene-3').textContent}\nScene 4 (15-20s Price): ${document.getElementById('sb-scene-4').textContent}\nScene 5 (20-25s CTA): ${document.getElementById('sb-scene-5').textContent}`;
      navigator.clipboard.writeText(text);
      showToast('📋 Copied storyboard to clipboard!');
    }

    function copyElementText(id) {
      const val = document.getElementById(id).value;
      navigator.clipboard.writeText(val);
      showToast('📋 Copied headline!');
    }

    function reloadSourceIframe() {
      const ifr = document.getElementById('source-iframe');
      if (ifr) ifr.src = ifr.src;
    }

    async function deployCustomSource() {
      const code = document.getElementById('custom-source-code').value.trim();
      const statusEl = document.getElementById('deploy-status');
      const btn = document.getElementById('btn-deploy-source');

      if (!code) {
        alert('Please paste custom HTML or code first.');
        return;
      }

      btn.disabled = true;
      btn.textContent = '⏳ Deploying to bargain-drop.online/adstudio...';
      statusEl.classList.remove('hidden');
      statusEl.textContent = 'Pushed to Cloudflare Edge & Git repo...';

      try {
        const res = await fetch('/api/adstudio/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': '03091996' },
          body: JSON.stringify({ html: code, pin: '03091996' })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          statusEl.textContent = '✅ Deployed live to bargain-drop.online/adstudio!';
          showToast('✅ Published live to bargain-drop.online/adstudio!');
        } else {
          throw new Error(data.error || 'Deploy failed');
        }
      } catch (e) {
        statusEl.textContent = '⚠️ Error: ' + e.message;
      } finally {
        btn.disabled = false;
        btn.textContent = '⚡ Deploy Live to bargain-drop.online/adstudio';
      }
    }

    // Init
    loadStoreCatalog();
  </script>
</body>
</html>