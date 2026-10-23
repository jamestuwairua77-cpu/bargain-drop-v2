<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Settings — Bargain Drop</title>
<style>
:root{--bg: #09090b;--fg: #ffffff;--muted: #a1a1aa;--line: rgba(255, 255, 255, 0.25);--accent: #ff1a3c;--red:#e60023;--shopay:#5a31f4}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--bg);background-image:radial-gradient(1200px 600px at 100% -10%,rgba(230,0,35,.05),transparent 60%),radial-gradient(900px 500px at -10% 12%,rgba(20,20,20,.05),transparent 55%);color:var(--fg);padding-bottom:80px}
a{color:inherit;text-decoration:none}
.top-bar{display:flex;align-items:center;justify-content:space-between;padding:6px 16px;background:#111;color:#fff;font-size:0.7rem;position:sticky;top:0;z-index:110}
.top-bar a{color:#fff}
.page-header{padding:16px;border-bottom:1px solid var(--line)}
.page-header h1{font-size:1.1rem;font-weight:800}
.page-header .breadcrumb{font-size:0.7rem;color:var(--muted)}
.lock-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;align-items:center;justify-content:center}
.lock-overlay.show{display:flex}
.lock-card{background: #0e0e14; color: #ffffff;border-radius:16px;padding:30px 24px;text-align:center;max-width:340px;width:90%;box-shadow:0 8px 30px rgba(0,0,0,.15)}
.lock-card .lock-icon{font-size:3rem;margin-bottom:12px}
.lock-card h2{font-size:1rem;font-weight:800;margin-bottom:6px}
.lock-card p{font-size:.75rem;color:var(--muted);margin-bottom:16px;line-height:1.5}
.lock-card .lock-btns{display:flex;gap:8px}
.lock-card .lock-btns a{flex:1;padding:10px;border-radius:10px;font-size:.75rem;font-weight:700;text-align:center}
.lock-card .btn-signin{background:#111;color:#fff}
.lock-card .btn-register{border:1.5px solid #111;color:#111}
.settings-section{padding:16px}
.section-title{font-size:0.82rem;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;color:var(--fg)}
.section-title .st-icon{width:22px;height:22px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.menu-list{background: #0e0e14; color: #ffffff;border-radius:12px;border:1.5px solid var(--line);overflow:hidden;margin-bottom:16px}
.menu-item{display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;transition:background .15s;border-bottom:1px solid #f5f5f5}
.menu-item:last-child{border-bottom:none}
.menu-item:hover{background:#fafafa}
.menu-item .mi-icon{width:36px;height:36px;border-radius:10px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0}
.menu-item .mi-info{flex:1}
.menu-item .mi-label{font-size:0.78rem;font-weight:600}
.menu-item .mi-desc{font-size:0.66rem;color:var(--muted);margin-top:1px}
.menu-item .mi-arrow{font-size:0.8rem;color:var(--muted)}
.menu-item .mi-value{font-size:0.7rem;color:var(--muted);text-align:right}
.info-section{padding:16px}
.info-card{margin-bottom:8px}
.info-card-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#f9f9f9;border-radius:10px;cursor:pointer;border:1px solid var(--line);transition:all .15s}
.info-card-header:hover{background:#f0f0f0}
.info-card-header h4{font-size:0.78rem;font-weight:700}
.info-card-header .expand{font-size:1.2rem;color:var(--muted);transition:transform .2s}
.info-card-header.open .expand{transform:rotate(45deg)}
.info-card-body{display:none;padding:14px 16px;font-size:0.75rem;line-height:1.7;color:#555;background:#fafafa;border:1px solid var(--line);border-top:none;border-radius:0 0 10px 10px}
.info-card-body.open{display:block}
.info-card-body p{margin-bottom:8px}
.info-card-body b{color:var(--fg)}
.pay-methods{display:flex;flex-direction:column;gap:8px;margin-top:8px}
.pay-method-card{display:flex;align-items:center;gap:10px;padding:12px;background: #0e0e14; color: #ffffff;border-radius:10px;border:1.5px solid var(--line)}
.pay-method-card .pm-icon{width:40px;height:24px;border-radius:4px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.pay-method-card .pm-icon.stripe{background:#635bff}
.pay-method-card .pm-icon.shopay{background:var(--shopay)}
.pay-method-card .pm-icon.paypal{background:#0070ba}
.pay-method-card .pm-icon.apple{background:#000}
.pay-method-card .pm-icon.google{background: #0e0e14; color: #ffffff;border:1px solid #ddd}
.pay-method-card .pm-name{font-size:.75rem;font-weight:700}
.pay-method-card .pm-desc{font-size:.65rem;color:var(--muted);margin-top:1px}
.pay-method-card .pm-badge{font-size:.6rem;font-weight:700;padding:3px 8px;border-radius:20px;margin-left:auto}
.pay-method-card .pm-badge.active{background:#d1fae5;color:#065f46}
.pay-method-card .pm-badge.soon{background:#ede9fe;color:#5b21b6}
.bottom-nav{position:fixed;bottom:0;left:0;right:0;background: #0e0e14; color: #ffffff;border-top:1px solid var(--line);display:flex;z-index:120;padding:4px 0}
.bottom-nav a{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px;font-size:0.6rem;color:var(--muted);text-decoration:none}
.bottom-nav a.active{color:var(--fg)}
.nav-icon{width:20px;height:20px;flex-shrink:0}
.logout-btn{width:100%;padding:12px;margin-top:8px;background: #0e0e14; color: #ffffff;color:var(--red);border:1.5px solid var(--red);border-radius:10px;font-size:.75rem;font-weight:700;cursor:pointer;text-align:center;display:none}
.logout-btn:hover{background:#fef2f2}

    .hamburger-btn svg line{transition:all .2s}
    .slide-menu{position:fixed;top:0;left:0;right:0;bottom:0;z-index:500;pointer-events:none}
    .slide-menu.open{pointer-events:auto}
    .slide-backdrop{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.4);opacity:0;transition:opacity .25s}
    .slide-menu.open .slide-backdrop{opacity:1}
    .slide-panel{position:absolute;top:0;right:0;width:280px;height:100%;background: #0e0e14; color: #ffffff;padding:82px 0 20px;transform:translateX(100%);transition:transform .25s ease;overflow-y:auto;box-shadow:-4px 0 16px rgba(0,0,0,.1)}
    .slide-menu.open .slide-panel{transform:translateX(0)}
    .slide-item{display:flex;align-items:center;gap:12px;padding:13px 22px;font-size:.85rem;color:#f1f5f9;text-decoration:none;font-weight:600;transition:all .15s}
    .slide-item:hover{background:rgba(255,255,255,.12);color:#ffffff;padding-left:26px}
    .slide-ico{width:20px;height:20px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:.62rem;font-weight:800}
    .slide-heading{font-size:.62rem;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;padding:14px 22px 6px}
    
    .slide-divider{height:1px;background:rgba(255,255,255,.15);margin:8px 0}
    .slide-close{position:absolute;top:20px;right:16px;width:36px;height:36px;border:none;background:none;font-size:1.2rem;cursor:pointer;color:#ffffff;opacity:.85;z-index:10}
    .search-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:400;display:none;align-items:flex-start;justify-content:center;padding-top:100px}
    .search-overlay.show{display:flex}
    .search-box{background: #0e0e14; color: #ffffff;border-radius:14px;padding:16px;width:90%;max-width:500px;box-shadow:0 4px 24px rgba(0,0,0,.2)}
    .search-box input{width:100%;padding:14px;border:1.5px solid rgba(255,255,255,.25);border-radius:10px;font-size:.9rem;outline:none;font-family:inherit;background:#1a1a24;color:#ffffff}.search-box input::placeholder{color:rgba(255,255,255,.6)}
    .search-box input:focus{border-color:#B8A9E8}
    
/* STANDARDIZED RED-WHITE BARGAIN DROP LOGO TITLE */
.nav-logo, .nlogo { display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit; flex-shrink: 0; }
.nav-logo .logo-icon, .nav-logo .li, .nlogo .logo-icon, .nlogo .li { width: 32px; height: 32px; background: linear-gradient(135deg, #ff1a3c, #e60023); color: #ffffff!important; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.82rem; font-weight: 900; letter-spacing: -0.5px; box-shadow: 0 2px 8px rgba(255, 26, 60, 0.4); border: 1px solid rgba(255, 255, 255, 0.2); }
.nav-logo .logo-text, .nav-logo .lt, .nlogo .logo-text, .nlogo .lt { font-size: 0.92rem; font-weight: 900; letter-spacing: -0.3px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; color: #ffffff; }
.nav-logo .bd-red, .nlogo .bd-red, .logo-text .bd-red, .lt .bd-red { color: #ff1a3c !important; font-weight: 900; }
.nav-logo .bd-white, .nlogo .bd-white, .logo-text .bd-white, .lt .bd-white { color: #ffffff !important; font-weight: 900; }

</style>
  
<style>
:root{--nav-h:54px;--promo-h:28px;--lilac: #ff1a3c;--teal: #ffd600;--accent: #ff1a3c;--dark: #000000;--pill:9999px}
body{padding-top:calc(var(--nav-h) + var(--promo-h))}
.promo-strip{position:fixed;top:0;left:0;right:0;height:var(--promo-h);background:linear-gradient(90deg,var(--accent),#c0392b);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:600;letter-spacing:.3px;z-index:300;overflow:hidden;white-space:nowrap}
.promo-strip span{display:flex;align-items:center;gap:4px;animation:marquee 20s linear infinite}
.promo-strip .sep{width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,.5)}
@keyframes marquee{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
.navbar{position:fixed;top:var(--promo-h);left:0;right:0;height:var(--nav-h);background:rgba(15,15,15,.97);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;align-items:center;padding:0 16px;z-index:299;transition:transform .3s ease,box-shadow .3s ease;box-shadow:0 1px 0 rgba(255,255,255,.06)}
.navbar.hidden{transform:translateY(-100%)}.navbar.scrolled{box-shadow:0 2px 12px rgba(0,0,0,.3)}
.nav-logo{display:flex;align-items:center;gap:6px;flex-shrink:0;margin-right:auto;text-decoration:none;color:inherit}
.nav-logo .logo-icon{width:30px;height:30px;background: #000000; border: 3px solid #ffd600;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:900;color:#fff}
.nav-logo .logo-text{font-size:.8rem;font-weight:800;color:#fff;letter-spacing:-.3px}
.nav-actions{display:flex;align-items:center;gap:4px;flex-shrink:0}
.nav-btn{position:relative;width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:50%;color:rgba(255,255,255,.7);transition:all .15s;background:none;border:none;cursor:pointer;font-family:inherit;text-decoration:none}
.nav-btn:active,.nav-btn:hover{color:#fff;background:rgba(255,255,255,.08)}
.nav-badge{position:absolute;top:3px;right:3px;background:var(--accent);color:#fff;font-size:.5rem;min-width:15px;height:15px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;padding:0 3px;line-height:1}
.nav-search-wrap{flex:1;display:flex;justify-content:center;margin:0 8px;max-width:300px}
.nav-search{display:flex;align-items:center;background:rgba(255,255,255,.08);border-radius:var(--pill);height:34px;padding:0 12px;gap:6px;border:1px solid transparent;transition:all .25s;width:100%;max-width:34px;overflow:hidden;cursor:pointer}
.nav-search.expanded{max-width:300px;border-color:var(--lilac);background:rgba(255,255,255,.14);cursor:text}.nav-search svg{flex-shrink:0;width:16px;height:16px;color:rgba(255,255,255,.5)}
.nav-search input{border:none;background:none;outline:none;flex:1;font-size:.73rem;font-family:inherit;color:#fff;width:0;opacity:0;transition:all .25s;min-width:0}
.nav-search.expanded input{width:auto;opacity:1}.nav-search input::placeholder{color:rgba(255,255,255,.35)}

    .hamburger-btn svg line{transition:all .2s}
    .slide-menu{position:fixed;top:0;left:0;right:0;bottom:0;z-index:500;pointer-events:none}
    .slide-menu.open{pointer-events:auto}
    .slide-backdrop{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.4);opacity:0;transition:opacity .25s}
    .slide-menu.open .slide-backdrop{opacity:1}
    .slide-panel{position:absolute;top:0;right:0;width:280px;height:100%;background: #0e0e14; color: #ffffff;padding:82px 0 20px;transform:translateX(100%);transition:transform .25s ease;overflow-y:auto;box-shadow:-4px 0 16px rgba(0,0,0,.1)}
    .slide-menu.open .slide-panel{transform:translateX(0)}
    .slide-item{display:flex;align-items:center;gap:12px;padding:13px 22px;font-size:.85rem;color:#f1f5f9;text-decoration:none;font-weight:600;transition:all .15s}
    .slide-item:hover{background:rgba(255,255,255,.12);color:#ffffff;padding-left:26px}
    .slide-ico{width:20px;height:20px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:.62rem;font-weight:800}
    .slide-heading{font-size:.62rem;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;padding:14px 22px 6px}
    
    .slide-divider{height:1px;background:rgba(255,255,255,.15);margin:8px 0}
    .slide-close{position:absolute;top:20px;right:16px;width:36px;height:36px;border:none;background:none;font-size:1.2rem;cursor:pointer;color:#ffffff;opacity:.85;z-index:10}
    .search-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:400;display:none;align-items:flex-start;justify-content:center;padding-top:100px}
    .search-overlay.show{display:flex}
    .search-box{background: #0e0e14; color: #ffffff;border-radius:14px;padding:16px;width:90%;max-width:500px;box-shadow:0 4px 24px rgba(0,0,0,.2)}
    .search-box input{width:100%;padding:14px;border:1.5px solid rgba(255,255,255,.25);border-radius:10px;font-size:.9rem;outline:none;font-family:inherit;background:#1a1a24;color:#ffffff}.search-box input::placeholder{color:rgba(255,255,255,.6)}
    .search-box input:focus{border-color:#B8A9E8}
    </style>
<style id="bd-rwb-theme">
/* === BARGAIN DROP: BLACK UI KIT 2.0 (RAGING RED & OBSIDIAN EDITION) === */
:root {
  --bg: #121515 !important;
  --b: #121515 !important;
  --fg: #ffffff !important;
  --f: #ffffff !important;
  --surface: #08090a !important;
  --surface-2: #121515 !important;
  --paper: #08090a !important;
  --card: #08090a !important;
  --card-bg: #08090a !important;
  --white: #08090a !important;
  --dark: #060708 !important;
  --black: #060708 !important;
  --muted: #dedede !important;
  --m: #dedede !important;
  --meta: #818181 !important;
  --line: #222425 !important;
  --line2: #202223 !important;
  --line-2: #202223 !important;
  --l: #222425 !important;
  --l2: #202223 !important;
  --accent: #fe3442 !important;
  --red: #fe3442 !important;
  --r: #fe3442 !important;
  --lilac: #fe3442 !important;
  --li: #fe3442 !important;
  --a: #fe3442 !important;
  --gold: #fe3442 !important;
  --teal: #49a66a !important;
  --t: #49a66a !important;
  --radius: 8px !important;
}

html, body {
  background-color: #121515 !important;
  background-image: radial-gradient(950px 440px at 88% -6%, rgba(254, 52, 66, 0.16), transparent 65%), radial-gradient(800px 420px at 10% 15%, rgba(211, 43, 63, 0.08), transparent 60%) !important;
  color: #ffffff !important;
}

/* Promo Strip: Obsidian Strip with Raging Red #FE3442 Accent */
.promo-strip, .ps {
  background: #070809 !important;
  color: #dedede !important;
  border-bottom: 1px solid #222425 !important;
}
.promo-strip b, .ps b {
  color: #fe3442 !important;
}

/* Top Navigation & Headers: Pitch Obsidian with Raging Red PSD Header Splatter Texture */
.navbar, .nb, .top-bar, .tb, header.navbar, .header, .site-header {
  background-color: rgba(8, 9, 10, 0.96) !important;
  background-image: url('/bui-hero-texture.png') !important;
  background-repeat: no-repeat !important;
  background-position: right -40px top -30px !important;
  background-size: 260px auto !important;
  color: #ffffff !important;
  border-bottom: 1px solid #222425 !important;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.65) !important;
}

.nav-logo .logo-text, .nlogo .lt, .logo-text {
  color: #ffffff !important;
}
.nav-logo .logo-text span:last-child, .nlogo .lt span:last-child {
  color: #ffffff !important;
}

/* Black UI Kit 2.0 Tactile Obsidian Icon Buttons in Navbar */
.nav-btn, .nbtn, .hamburger-btn, .nav-back {
  color: #fe3442 !important;
  background: #060708 !important;
  border: 1px solid #222425 !important;
  border-radius: 6px !important;
  margin-left: 5px !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 10px rgba(0, 0, 0, 0.5) !important;
  transition: all 0.18s ease !important;
}
.nav-btn:hover, .nbtn:hover, .hamburger-btn:hover, .nav-back:hover {
  background: linear-gradient(180deg, #fe3442 0%, #d32b3f 100%) !important;
  color: #ffffff !important;
  border-color: #fe3442 !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 4px 14px rgba(254, 52, 66, 0.45) !important;
}
.nav-badge {
  background: #fe3442 !important;
  color: #ffffff !important;
  border: 1px solid #08090a !important;
  box-shadow: 0 0 8px rgba(254, 52, 66, 0.6) !important;
}
.top-bar a, .tb a {
  color: #ffffff !important;
  font-weight: 800 !important;
}

/* Recessed PSD Search Bar in Header */
.nav-search {
  background: #222425 !important;
  border: 1px solid #363636 !important;
  border-radius: 6px !important;
  color: #ffffff !important;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.55) !important;
}
.nav-search input {
  color: #ffffff !important;
  background: transparent !important;
  border: none !important;
}

/* Trust Ribbon & Badges */
.trust-ribbon, .tr {
  background: #08090a !important;
  color: #dedede !important;
  border-top: 1px solid #202223 !important;
  border-bottom: 1px solid #202223 !important;
  padding: 12px 16px !important;
}
.trust-item {
  color: #dedede !important;
  font-weight: 700 !important;
  background: #121515 !important;
  border: 1px solid #222425 !important;
  padding: 6px 12px !important;
  border-radius: 6px !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;
}
.trust-accent {
  color: #fe3442 !important;
  font-weight: 800 !important;
}

/* Section Headers with Structural Bottom Dividers */
.section-title, .page-header, .hdr {
  border-bottom: 1px solid #222425 !important;
  padding-bottom: 10px !important;
  margin-bottom: 16px !important;
}
.section-title h3, .page-header h1, .hdr h1, .dashboard-title, h1, h2, h3, h4 {
  color: #ffffff !important;
}
.section-title a {
  color: #ffffff !important;
  background: linear-gradient(180deg, #fe3442 0%, #d32b3f 100%) !important;
  border: 1px solid #fe3442 !important;
  padding: 5px 12px !important;
  border-radius: 6px !important;
  font-weight: 800 !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 4px 12px rgba(254, 52, 66, 0.35) !important;
}
.section-title a:hover {
  background: linear-gradient(180deg, #ff4754 0%, #e7254e 100%) !important;
}

/* Every Card, Box, Panel & Container: Black UI Kit 2.0 Pitch Obsidian + Raging Red Splatter Accent */
.cat-card, .product-card, .card, .card-list, .dash-card, .menu-list, .cit, .sc, .es,
.form-card, .summary-card, .checkout-card, .wishlist-item, .order-card, .addr-card,
.setting-card, .faq-item, .auth-card, .panel, .box, .modal-sheet, .pp-dialog, .search-box, .sobox {
  background-color: #08090a !important;
  background-image: url('/bui-card-texture.png') !important;
  background-repeat: no-repeat !important;
  background-position: right -30px top -25px !important;
  background-size: 190px auto !important;
  color: #ffffff !important;
  border: 1px solid #222425 !important;
  border-radius: 8px !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 14px 32px rgba(0, 0, 0, 0.65) !important;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease !important;
}
.cat-card:hover, .product-card:hover, .dash-card:hover, .cit:hover, .order-card:hover {
  border-color: #fe3442 !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 16px 36px rgba(254, 52, 66, 0.24) !important;
  transform: translateY(-2px) !important;
}

/* Black UI Kit 2.0 Product Card Header, Recessed Image Well & Segmented 3-Cell Footer */
.bui-card-head {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 10px 12px 8px !important;
  gap: 6px !important;
}
.bui-card-cat {
  font-size: 0.64rem !important;
  font-weight: 800 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.06em !important;
  color: #dedede !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}
.bui-card-pill, .prod-badge {
  background: #fe3442 !important;
  color: #ffffff !important;
  font-size: 0.62rem !important;
  font-weight: 800 !important;
  padding: 2px 8px !important;
  border-radius: 9999px !important;
  box-shadow: 0 2px 8px rgba(254, 52, 66, 0.5) !important;
  flex-shrink: 0 !important;
}

.prod-img-wrap, .cat-card-img-wrap, .ciimg, .wishlist-img, .order-thumb, .gallery, .modal-item-img {
  background: #121515 !important;
  border: 1px solid #202223 !important;
  border-radius: 6px !important;
}
.product-card .prod-img-wrap {
  margin: 0 10px !important;
  border-radius: 6px !important;
}
.product-card > img, .product-card > .prod-placeholder {
  width: calc(100% - 20px) !important;
  margin: 10px 10px 0 !important;
  aspect-ratio: 1 / 1 !important;
  object-fit: cover !important;
  border-radius: 6px !important;
  border: 1px solid #202223 !important;
  background: #121515 !important;
}

.product-info {
  padding: 10px 12px !important;
}
.bui-card-foot {
  display: grid !important;
  grid-template-columns: 1fr 1fr 1.8fr !important;
  border-top: 1px solid #202223 !important;
  background: #060708 !important;
}
.bui-foot-btn {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 5px !important;
  padding: 9px 6px !important;
  font-size: 0.68rem !important;
  font-weight: 800 !important;
  color: #dedede !important;
  background: transparent !important;
  border: none !important;
  border-right: 1px solid #202223 !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
}
.bui-foot-btn svg {
  color: #fe3442 !important;
  width: 14px !important;
  height: 14px !important;
  flex-shrink: 0 !important;
}
.bui-foot-btn:hover, .bui-foot-btn.liked {
  background: #121515 !important;
  color: #fe3442 !important;
}
.bui-foot-add {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 5px !important;
  padding: 9px 8px !important;
  font-size: 0.7rem !important;
  font-weight: 800 !important;
  color: #ffffff !important;
  background: linear-gradient(180deg, #fe3442 0%, #d32b3f 100%) !important;
  border: none !important;
  cursor: pointer !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
  transition: all 0.15s ease !important;
}
.bui-foot-add:hover {
  background: linear-gradient(180deg, #ff4754 0%, #e7254e 100%) !important;
}

/* Card Typography & Prices */
.cat-card-label, .product-title, .cititle, .p-title, .wishlist-title, .mi-label, .mi-title, .dc-label, .sect-title, .sect-title .val {
  color: #ffffff !important;
  font-weight: 700 !important;
}
.product-price, .cipp, .promo-price, .wishlist-price, .stv, .cat-card-shop, .product-stars {
  color: #fe3442 !important;
  font-weight: 800 !important;
}
.prod-compare, .cipo, .original-price {
  color: #818181 !important;
}

/* Floating Action Buttons on Cards */
.wishlist-btn, .quick-add {
  background: #060708 !important;
  color: #fe3442 !important;
  border: 1px solid #222425 !important;
  border-radius: 6px !important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6) !important;
}
.wishlist-btn:hover, .wishlist-btn.liked, .quick-add:hover {
  background: linear-gradient(180deg, #fe3442 0%, #d32b3f 100%) !important;
  color: #ffffff !important;
  border-color: #fe3442 !important;
}

/* List Rows & Dividers (Modeled on PSD Weather & Settings Rows) */
.list-row, .menu-item, .summary-row, .sr, .modal-item {
  border-bottom: 1px solid #202223 !important;
  color: #dedede !important;
}
.list-row:last-child, .menu-item:last-child, .modal-item:last-child {
  border-bottom: none !important;
}

/* Inputs, Selects & Textareas: Recessed #222425 Wells Modeled on PSD Sign Up Form */
.search-box input, .sobox input, .pf input, .promo-row input, .form-group input, .form-group select,
input[type="text"], input[type="email"], input[type="password"], input[type="tel"], input[type="number"], input[type="search"], select, textarea {
  background: #222425 !important;
  color: #ffffff !important;
  border: 1px solid #363636 !important;
  border-radius: 6px !important;
  font-weight: 600 !important;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5) !important;
}
input:focus, select:focus, textarea:focus {
  border-color: #fe3442 !important;
  outline: none !important;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(254, 52, 66, 0.25) !important;
}
input::placeholder, textarea::placeholder {
  color: #818181 !important;
}

/* Primary & Secondary Buttons Modeled on Black UI Kit 2.0 */
.btn, .btn-primary, .cc, .pay-btn, .promo-apply, .pf button, .es a, .hero-cta, .newsletter-form button {
  background: linear-gradient(180deg, #fe3442 0%, #d32b3f 100%) !important;
  color: #ffffff !important;
  border: 1px solid #fe3442 !important;
  border-radius: 6px !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 6px 18px rgba(254, 52, 66, 0.38) !important;
  font-weight: 800 !important;
  transition: all 0.18s ease !important;
}
.btn:hover, .btn-primary:hover, .cc:hover, .promo-apply:hover, .hero-cta:hover {
  background: linear-gradient(180deg, #ff4754 0%, #e7254e 100%) !important;
  color: #ffffff !important;
  transform: translateY(-1px) !important;
}
.btn-secondary, .qbtn, .pagination button, .currency-pill, .pbb {
  background: #121515 !important;
  color: #dedede !important;
  border: 1px solid #222425 !important;
  border-radius: 6px !important;
  font-weight: 800 !important;
}
.pagination button.active, .currency-pill.active, .qbtn:hover, .pagination button:hover:not(:disabled) {
  background: linear-gradient(180deg, #fe3442 0%, #d32b3f 100%) !important;
  color: #ffffff !important;
  border-color: #fe3442 !important;
}
.qv, .st {
  color: #ffffff !important;
}

/* Slide-Out Menu & Bottom Navigation */
.slide-panel, .nm {
  background-color: #08090a !important;
  background-image: url('/bui-card-texture.png') !important;
  background-repeat: no-repeat !important;
  background-position: right top !important;
  background-size: 240px auto !important;
  color: #ffffff !important;
  border-left: 1px solid #222425 !important;
}
.slide-item, .nm a {
  color: #dedede !important;
  border-bottom: 1px solid #202223 !important;
  font-weight: 700 !important;
}
.slide-item:hover, .nm a:hover {
  background: #121515 !important;
  color: #fe3442 !important;
}
.slide-heading, .nm h3 {
  color: #fe3442 !important;
  font-weight: 900 !important;
}
.slide-divider {
  background: #202223 !important;
  height: 1px !important;
}
.slide-close, .nmc {
  color: #fe3442 !important;
  background: #121515 !important;
  border: 1px solid #222425 !important;
  border-radius: 6px !important;
}

.bottom-nav {
  background: #08090a !important;
  color: #dedede !important;
  border-top: 1px solid #222425 !important;
}
.bottom-nav a {
  color: #818181 !important;
  font-weight: 700 !important;
}
.bottom-nav a.active, .bottom-nav a:hover {
  color: #fe3442 !important;
}

/* Hero Banner */
.hero {
  background: #08090a !important;
  border-bottom: 1px solid #222425 !important;
}
.hero-content h2 {
  color: #ffffff !important;
}
.hero-badge {
  background: linear-gradient(180deg, #fe3442 0%, #d32b3f 100%) !important;
  color: #ffffff !important;
  border: 1px solid #fe3442 !important;
  border-radius: 6px !important;
}

/* Footer: Obsidian with Raging Red Top Border */
.site-footer {
  background: #070809 !important;
  color: #dedede !important;
  border-top: 2px solid #fe3442 !important;
}
.site-footer h4, .site-footer h5 {
  color: #ffffff !important;
}
.site-footer a, .site-footer p, .footer-payments, .footer-legal {
  color: #818181 !important;
}
.site-footer a:hover {
  color: #fe3442 !important;
}
.newsletter-form input {
  background: #222425 !important;
  color: #ffffff !important;
  border: 1px solid #363636 !important;
  border-radius: 6px !important;
}
</style></head>
<body>
<!-- PROMO STRIP -->
    <div class="promo-strip"><span>🎉 30% OFF SITEWIDE — USE CODE <b>BARGAIN26</b> AT CHECKOUT &nbsp;·&nbsp; Free Shipping A$29+ · SSL Encrypted · Verified Seller · 30-Day Returns</span></div>
    <nav class="navbar">
      <a href="/" class="nav-logo" aria-label="Bargain Drop Home" style="display:inline-flex;align-items:center;gap:10px;text-decoration:none;"><img src="/official-logo.jpg" alt="Bargain Drop Logo" style="width:36px;height:36px;object-fit:contain;border-radius:8px;flex-shrink:0;filter:drop-shadow(0 2px 8px rgba(255,26,60,0.45));" /><div class="logo-text" style="font-size:1.12rem;font-weight:900;letter-spacing:-0.4px;text-transform:uppercase;font-family:system-ui,-apple-system,sans-serif;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;color:#ffffff;"><span style="color:#ff1a3c!important;font-weight:900;">BARGAIN</span> <span style="color:#ffffff!important;font-weight:900;">DROP</span></div></a>
      <div class="nav-actions">
        <button class="nav-btn" onclick="document.getElementById('search-overlay').classList.add('show');document.getElementById('search-input').focus()" aria-label="Search">
          <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M21 21l-4.35-4.35" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>
        </button>
        <a href="wishlist.html" class="nav-btn" aria-label="Wishlist">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
        </a>
        <a href="cart.html" class="nav-btn" aria-label="Cart">
          <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1" fill="currentColor"/><circle cx="20" cy="21" r="1" fill="currentColor"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>
          <span class="nav-badge" id="nav-cart-count" style="display:none">0</span>
        </a>
        <a href="notification-center.html" class="nav-btn" aria-label="Notifications">

                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>

                <span class="nav-badge" id="nav-notif-count" style="display:none">0</span>

              </a>

        <button class="nav-btn hamburger-btn" onclick="document.getElementById('slide-menu').classList.toggle('open')" aria-label="Menu">
          <svg width="20" height="20" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
    </nav>
    <div class="slide-menu" id="slide-menu">
      <div class="slide-backdrop" onclick="document.getElementById('slide-menu').classList.remove('open')"></div>
      <div class="slide-panel">
<div class="slide-heading">Shop</div>
<a href="/" class="slide-item"><span class="slide-ico" style="background:linear-gradient(135deg,#e60023,#ff4d6d);color:#fff;">H</span>Home</a>
<a href="category.html" class="slide-item"><span class="slide-ico" style="#000000;border:1px solid #ffd600">C</span>All Categories</a>
<a href="wishlist.html" class="slide-item"><span class="slide-ico" style="background:linear-gradient(135deg,#e60023,#ff4d6d);color:#fff;">W</span>Wishlist</a>
<a href="cart.html" class="slide-item"><span class="slide-ico" style="#ffd600;color:#000">C</span>Cart</a>
<div class="slide-divider"></div>
<div class="slide-heading">Account</div>
<div id="bd-slide-auth"></div>
<div id="bd-slide-guest"></div>
<div class="slide-divider"></div>
<div class="slide-heading">Support</div>
<a href="customer-service.html" class="slide-item"><span class="slide-ico" style="#ffd600;color:#000">S</span>Customer Service</a>
<a href="policy.html" class="slide-item"><span class="slide-ico" style="background:#9b978f">P</span>Privacy Policy</a>
    <a href="/logos.html" class="slide-item"><span class="slide-ico" style="background:linear-gradient(135deg,#ff1a3c,#e60023);color:#fff;">🎨</span>Custom Logos</a>
    </div>
    </div>
  <div class="search-overlay" id="search-overlay" onclick="this.classList.remove('show')"><div class="search-box" onclick="event.stopPropagation()"><input id="search-input" type="text" placeholder="Search products..." onkeydown="if(event.key==='Enter'){location.href='category.html?search='+encodeURIComponent(this.value)}"></div></div>
<!-- SLIDE-OUT MENU -->
<div class="top-bar"><a href="profile.html">← Profile</a><div>Free Shipping <span id="free-ship-amt">A$41+</span></div></div>
<div class="page-header"><div class="breadcrumb"><a href="/">Home</a> → <a href="profile.html">Profile</a> → Settings</div><h1>Settings</h1></div>
<div class="settings-section">
<div class="section-title"><span class="st-icon"><svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke="#555" stroke-width="1.8" fill="none"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#555" stroke-width="1.8"/></svg></span>Account Settings</div>
<div class="menu-list" id="account-menu">
<div class="menu-item"><div class="mi-icon"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#555" stroke-width="1.8" fill="none"/><circle cx="12" cy="10" r="3" stroke="#555" stroke-width="1.5" fill="none"/></svg></div><div class="mi-info"><div class="mi-label">Address Book</div><div class="mi-desc">Manage shipping &amp; billing addresses</div></div><span class="mi-value" id="addr-count">0 saved</span><span class="mi-arrow">→</span></div>
<div class="menu-item"><div class="mi-icon"><svg width="18" height="18" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" stroke="#555" stroke-width="1.8" fill="none"/><line x1="2" y1="10" x2="22" y2="10" stroke="#555" stroke-width="1.5"/></svg></div><div class="mi-info"><div class="mi-label">My Payment Options</div><div class="mi-desc">Credit cards, PayPal &amp; Stripe</div></div><span class="mi-value" id="pay-count">0 methods</span><span class="mi-arrow">→</span></div>
<div class="menu-item"><div class="mi-icon"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#555" stroke-width="1.8" fill="none"/><circle cx="12" cy="7" r="4" stroke="#555" stroke-width="1.8" fill="none"/></svg></div><div class="mi-info"><div class="mi-label">Manage My Account</div><div class="mi-desc">Edit name, email, password &amp; more</div></div><span class="mi-arrow">→</span></div>
<div class="menu-item"><div class="mi-icon"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#555" stroke-width="1.8" fill="none"/><polyline points="22,6 12,13 2,6" stroke="#555" stroke-width="1.8" fill="none"/></svg></div><div class="mi-info"><div class="mi-label">Contact Preferences</div><div class="mi-desc">Email &amp; push notification settings</div></div><span class="mi-arrow">→</span></div>
</div>
<button class="logout-btn" id="logout-btn" onclick="doLogout()">Sign Out</button>
</div>
<div class="info-section">
<div class="section-title"><span class="st-icon"><svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#555" stroke-width="1.8" fill="none"/><line x1="12" y1="16" x2="12" y2="12" stroke="#555" stroke-width="1.8"/><line x1="12" y1="8" x2="12.01" y2="8" stroke="#555" stroke-width="1.8"/></svg></span>My Info</div>
<div class="info-card" onclick="toggleCard(this)"><div class="info-card-header"><h4>📦 Shipping Info</h4><span class="expand">+</span></div><div class="info-card-body"><p><b>Standard Shipping:</b> 7-15 business days. Orders are processed within 24-48 hours.</p><p><b>Express Shipping:</b> 3-7 business days (additional charges may apply).</p><p><b>Free Shipping:</b> Available on orders over $29. Applied automatically at checkout.</p><p><b>Tracking:</b> A tracking number will be provided within 48 hours of shipment.</p><p><b>International:</b> We ship to most countries worldwide. Delivery times vary by destination.</p></div></div>
<div class="info-card" onclick="toggleCard(this)"><div class="info-card-header"><h4>↩️ Return Policy</h4><span class="expand">+</span></div><div class="info-card-body"><p><b>30-Day Return Window:</b> You have 30 calendar days from the date of delivery to initiate a return.</p><p><b>Eligibility:</b> Items must be unused, in original packaging with all tags attached.</p><p><b>Non-Returnable Items:</b> Intimate apparel, perishable goods, and custom-made items.</p><p><b>Return Process:</b> Contact customer service to obtain a Return Authorization (RA) number.</p><p><b>Refund Processing:</b> Refunds are issued within 5-10 business days after we receive the return.</p></div></div>
<div class="info-card" onclick="toggleCard(this)"><div class="info-card-header"><h4>💰 Refund Policy</h4><span class="expand">+</span></div><div class="info-card-body"><p><b>Full Refunds:</b> Issued when items arrive damaged, defective, or incorrect.</p><p><b>Partial Refunds:</b> May apply for items returned after 15 days or without original packaging.</p><p><b>Refund Method:</b> Refunds are credited to your original payment method.</p><p><b>Processing Time:</b> 5-10 business days after we receive and inspect the returned item.</p><p><b>Shipping Costs:</b> Return shipping is free for defective/damaged items. Buyer pays return shipping for change-of-mind returns.</p></div></div>
<div class="info-card" onclick="toggleCard(this)"><div class="info-card-header"><h4>💳 Payment Methods</h4><span class="expand">+</span></div><div class="info-card-body">
<div class="pay-methods">
<div class="pay-method-card"><div class="pm-icon stripe"><svg width="20" height="12" viewBox="0 0 60 25"><path fill="#fff" d="M55 12.5c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2h-2c-1.1 0-2-.9-2-2v-5z" opacity=".8"/><rect x="1" y="1" width="58" height="23" rx="4" stroke="#fff" stroke-width="1.5"/><path d="M10 8.5v8M10 8.5h2.5c1.4 0 2.5 1.1 2.5 2.5s-1.1 2.5-2.5 2.5H10" stroke="#fff" stroke-width="1.2"/><path d="M20 8.5l3 5.5 3.5-5.5M40 8.5v8M40 8.5h2.5c1.4 0 2.5 1.1 2.5 2.5s-1.1 2.5-2.5 2.5H40" stroke="#fff" stroke-width="1.2"/></svg></div><div><div class="pm-name">Stripe</div><div class="pm-desc">Visa, Mastercard, Amex &amp; more</div></div><span class="pm-badge active">Active</span></div>
<div class="pay-method-card"><div class="pm-icon paypal"><svg width="18" height="12" viewBox="0 0 24 24"><path fill="#fff" d="M7.076 20.069H4.885c-.352 0-.63-.272-.57-.62l1.504-9.559c.042-.27.279-.47.556-.47h3.072c2.767 0 4.666 1.28 5.288 3.71.04.163.074.326.102.49.34 2.235-.063 3.776-1.347 4.846-1.411 1.17-3.518 1.603-5.414 1.603z"/><path fill="#fff" d="M10.935 14.696c-.404 2.547.055 4.64 1.04 5.502.255.224.57.347.912.347h2.426c.354 0 .634-.277.572-.62l-.02-.096c-.49-2.415-1.54-4.593-3.218-5.6-.501-.302-1.09-.47-1.712-.47v.937"/></svg></div><div><div class="pm-name">PayPal</div><div class="pm-desc">Secure online payments</div></div><span class="pm-badge active">Active</span></div>
</div>
<p style="margin-top:12px"><b>Security:</b> All transactions are encrypted with 256-bit SSL technology.</p></div></div>
<div class="info-card" onclick="toggleCard(this)"><div class="info-card-header"><h4>📋 Terms &amp; Conditions</h4><span class="expand">+</span></div><div class="info-card-body"><p><b>Agreement:</b> By using Bargain Drop, you agree to these Terms &amp; Conditions.</p><p><b>Account Responsibility:</b> You are responsible for maintaining the confidentiality of your account credentials.</p><p><b>Product Accuracy:</b> We strive for accuracy but cannot guarantee that product descriptions or images are error-free.</p><p><b>Pricing:</b> Prices are subject to change without notice. The price at checkout is final.</p><p><b>Intellectual Property:</b> All content on Bargain Drop is protected by copyright and trademark laws.</p><p><b>Limitation of Liability:</b> Bargain Drop is not liable for indirect damages arising from product use.</p><p><b>Governing Law:</b> These terms are governed by applicable consumer protection laws.</p></div></div>
</div>

<!-- Sign-in lock overlay -->
<div class="lock-overlay" id="lock-overlay">
<div class="lock-card">
<div class="lock-icon">🔒</div>
<h2>Sign in Required</h2>
<p>You need to sign in to access your account settings, payment methods, and addresses.</p>
<div class="lock-btns"><a href="sign-in.html" class="btn-signin">Sign In</a><a href="register.html" class="btn-register">Register</a></div>
</div>
</div>


<script>
function toggleCard(card){var h=card.querySelector('.info-card-header');var b=card.querySelector('.info-card-body');var o=b.classList.contains('open');b.classList.toggle('open');h.classList.toggle('open')}

(function checkAuth(){
  var u=JSON.parse(localStorage.getItem('bd_user')||'null');
  if(u){
    document.getElementById('lock-overlay').classList.remove('show');
    document.getElementById('logout-btn').style.display='block';
  }else{
    var se=localStorage.getItem('bd_temp_email');
    if(se){
      document.getElementById('lock-overlay').classList.remove('show');
    }else{
      document.getElementById('lock-overlay').classList.add('show');
    }
  }
})();

function doLogout(){
  if(confirm('Are you sure you want to sign out?')){
    localStorage.removeItem('bd_user');
    localStorage.removeItem('bd_temp_email');
    location.reload();
  }
}
</script>



<script>
(function(){try{var cart=JSON.parse(localStorage.getItem("bd_cart")||"[]");var n=cart.reduce(function(s,i){return s+(i.qty||1)},0);var b=document.getElementById("nav-cart-count");if(b){b.textContent=n;b.style.display=n>0?"":"none"}}catch(e){}})();
</script>

<script>
/* === STICKY NAVBAR UNIVERSAL JS === */
var __navLastScroll=0;
window.addEventListener("scroll",function(){
  var n=document.getElementById("navbar"),s=window.scrollY;
  if(!n)return;
  if(s<__navLastScroll||s<100)n.classList.remove("hidden");
  else if(s>__navLastScroll&&s>200)n.classList.add("hidden");
  if(s>10)n.classList.add("scrolled");else n.classList.remove("scrolled");
  __navLastScroll=s;
},{passive:true});
function expandSearch(){
  var s=document.getElementById("nav-search");if(s)s.classList.add("expanded");
  var i=document.getElementById("search-input");if(i)i.focus();
}
function collapseSearch(e){
  var i=document.getElementById("search-input");
  if(!i||!i.value)document.getElementById("nav-search").classList.remove("expanded");
}
/* Cart badge init */
(function(){
  try{
    var c=JSON.parse(localStorage.getItem("bd_cart")||"[]");
    var n=c.reduce(function(s,i){return s+(i.qty||1)},0);
    var b=document.getElementById("nav-cart-count");
    if(b&&n>0){b.textContent=n;b.style.display=""}
  }catch(e){}
})();
</script>

<script>
(function(){
  try{
    var sess = null;
    try{ sess = JSON.parse(localStorage.getItem('bd_session')||'null'); }catch(e){}
    var signedIn = !!(sess && sess.email) || !!localStorage.getItem('bd_user_email');
    var A = document.getElementById('bd-slide-auth');
    var G = document.getElementById('bd-slide-guest');
    function item(href,label,bg,ch){ return '<a href="'+href+'" class="slide-item"><span class="slide-ico" style="background:'+bg+'">'+ch+'</span>'+label+'</a>'; }
    var owned = [
      ['orders.html','Orders','#F5A623','O'],
      ['profile.html','My Account','#B8A9E8','A'],
      ['account-info.html','Profile Information','#B8A9E8','P'],
      ['addresses.html','Addresses','#4ECDC4','A'],
      ['payment-methods.html','Payment Methods','#4ADE80','P'],
      ['returns.html','Returns','#FF6B6B','R'],
      ['wallet.html','Wallet','#4ECDC4','W'],
      ['gift-cards.html','Gift Cards','#B8A9E8','G']
    ];
    if (signedIn && A && G) {
      A.innerHTML = owned.map(function(o){ return item(o[0],o[1],o[2],o[3]); }).join('') +
        '<a href="#" class="slide-item" onclick="event.preventDefault();if(window.signOut){signOut()}else{var ks=[];for(var i=0;i<localStorage.length;i++)ks.push(localStorage.key(i));ks.forEach(function(k){if(k.indexOf("bd_")===0&&k!=="bd_cart")localStorage.removeItem(k)});location.href="/"}"><span class="slide-ico" style="background:#9b978f">X</span>Sign Out</a>';
      G.innerHTML = '';
    } else if (G) {
      A.innerHTML = '';
      G.innerHTML = item('sign-in.html','Sign In','#4ADE80','S') + item('register.html','Create Account','#B8A9E8','R');
    }
  }catch(e){}
})();
</script>
<script src="/js/notifications.js?v=f8b0c71eed"></script>
<script src="/js/icon-library.js?v=4e663589a2"></script>
<script src="/js/slide-icons.js?v=1a760e6595"></script>
<script src="/js/auto-iconify.js?v=49867b897b"></script>
  <script src="/js/logo-handler.js?v=8c0763c579"></script>
</body>
</html>