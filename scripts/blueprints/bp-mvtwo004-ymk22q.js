<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My Orders — Bargain Drop</title>
<script>
/* End-to-end access enabled */
</script>

<style>
:root{--bg: #09090b;--fg: #ffffff;--muted: #a1a1aa;--line: rgba(255, 255, 255, 0.25);--accent: #ff1a3c;--red:#e60023;--green:#10b981;--amber:#f59e0b;--blue:#3b82f6}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--bg);background-image:radial-gradient(1200px 600px at 100% -10%,rgba(230,0,35,.05),transparent 60%),radial-gradient(900px 500px at -10% 12%,rgba(20,20,20,.05),transparent 55%);color:var(--fg);padding-bottom:80px}
a{color:inherit;text-decoration:none}
.top-bar{display:flex;align-items:center;justify-content:space-between;padding:6px 16px;background:#111;color:#fff;font-size:0.7rem;position:sticky;top:0;z-index:110}
.top-bar a{color:#fff}
.page-header{padding:16px}
.page-header h1{font-size:1.1rem;font-weight:800}
.page-header .breadcrumb{font-size:0.7rem;color:var(--muted)}
.tabs{display:flex;overflow-x:auto;border-bottom:1px solid var(--line);padding:0 8px;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{padding:12px 16px;font-size:0.75rem;font-weight:600;color:var(--muted);cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;transition:all .15s;background:none;border-top:none;border-left:none;border-right:none}
.tab.active{color:var(--fg);border-bottom-color:var(--fg)}
.content{padding:16px}
.empty-state{text-align:center;padding:60px 20px;color:var(--muted)}
.empty-state .icon{font-size:4rem;margin-bottom:12px}
.empty-state h2{font-size:1rem;margin-bottom:4px}
.empty-state p{font-size:0.75rem}
.order-card{background: #0e0e14; color: #ffffff;border:1.5px solid var(--line);border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer;transition:all .15s}
.order-card:active{transform:scale(.98);background:#fafafa}
.order-card .order-header{display:flex;justify-content:space-between;font-size:0.7rem;margin-bottom:8px}
.order-card .order-id{font-weight:700}
.order-status{padding:2px 8px;border-radius:10px;font-size:0.62rem;font-weight:600}
.order-status.unpaid{background:#fef2f2;color:var(--red)}
.order-status.processing{background:#fffbeb;color:var(--amber)}
.order-status.shipped{background:#eff6ff;color:var(--blue)}
.order-status.review{background:#ecfdf5;color:var(--green)}
.order-status.return{background:#faf5ff;color:#7c3aed}
.order-card .order-items{display:flex;gap:8px;overflow-x:auto;margin-bottom:8px}
.order-card .order-thumb{width:56px;height:56px;border-radius:8px;background:#f5f5f5;flex-shrink:0;overflow:hidden}
.order-card .order-thumb img{width:100%;height:100%;object-fit:cover}
.order-card .order-total{text-align:right;font-size:0.78rem;font-weight:700}
.order-card .order-delete{position:absolute;top:10px;right:10px;width:28px;height:28px;border-radius:50%;border:none;background:#fee2e2;color:#dc2626;font-size:.8rem;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:1;transition:all .15s}
.order-card .order-delete:hover{background:#fecaca}
.order-card{position:relative}
.modal-delete{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:12px;border:1.5px solid #fecaca;border-radius:10px;background:#fef2f2;color:#dc2626;font-size:.75rem;font-weight:600;cursor:pointer;margin-top:16px;transition:all .15s}
.modal-delete:hover{background:#fee2e2;border-color:#fca5a5}
.toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:10px 20px;border-radius:20px;font-size:.75rem;z-index:300;animation:toastIn .3s ease,toastOut .3s ease 2s forwards}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@keyframes toastOut{from{opacity:1;transform:translateX(-50%) translateY(0)}to{opacity:0;transform:translateX(-50%) translateY(-10px)}}
.bottom-nav{position:fixed;bottom:0;left:0;right:0;background: #0e0e14; color: #ffffff;border-top:1px solid var(--line);display:flex;z-index:120;padding:4px 0}
.bottom-nav a{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px;font-size:0.6rem;color:var(--muted);text-decoration:none}
.bottom-nav a.active{color:var(--fg)}
.nav-icon{width:20px;height:20px;flex-shrink:0}
/* Modal */
.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .2s ease}
.modal-sheet{background: #0e0e14; color: #ffffff;width:100%;max-width:500px;max-height:85vh;border-radius:16px 16px 0 0;overflow-y:auto;padding:0;animation:slideUp .25s ease}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal-handle{width:36px;height:4px;background:#ddd;border-radius:2px;margin:12px auto 0}
.modal-header{display:flex;justify-content:space-between;align-items:center;padding:14px 16px 8px;position:sticky;top:0;background: #0e0e14; color: #ffffff;z-index:1}
.modal-header h2{font-size:.95rem;font-weight:800}
.modal-close{width:32px;height:32px;border-radius:50%;border:none;background:#f5f5f5;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--muted)}
.modal-body{padding:0 16px 24px}
.modal-status-row{display:flex;align-items:center;gap:8px;margin-bottom:16px}
.modal-meta{font-size:.7rem;color:var(--muted);margin-bottom:14px;line-height:1.6}
.modal-meta strong{color:var(--fg);font-weight:600;display:block;font-size:.62rem;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
.modal-section-title{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--line)}
.modal-item{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #f5f5f5}
.modal-item:last-child{border-bottom:none}
.modal-item-img{width:60px;height:60px;border-radius:8px;background:#f5f5f5;flex-shrink:0;overflow:hidden}
.modal-item-img img{width:100%;height:100%;object-fit:cover}
.modal-item-info{flex:1;min-width:0}
.modal-item-title{font-size:.72rem;font-weight:600;line-height:1.3;margin-bottom:2px}
.modal-item-qty{font-size:.65rem;color:var(--muted)}
.modal-item-price{font-size:.78rem;font-weight:700;text-align:right;white-space:nowrap}
.modal-total-row{display:flex;justify-content:space-between;padding:12px 0;font-size:.85rem;font-weight:800;margin-top:4px}

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


/* === 2026-04-21 GLOBAL STOREFRONT LAYOUT & SLIDE-MENU CONTAINMENT === */
html, body {
  overflow-x: hidden !important;
  max-width: 100vw !important;
}
.slide-menu {
  display: none !important;
}
.slide-menu.open {
  display: block !important;
}
.product-grid, .related-grid {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)) !important;
  gap: 16px !important;
  align-items: stretch !important;
}
@media (max-width: 640px) {
  .product-grid, .related-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
  }
}
.product-card, .rel-card {
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
  min-width: 0 !important;
  overflow: hidden !important;
}
.product-card .card-img, .rel-card .rc-img {
  width: 100% !important;
  aspect-ratio: 1 / 1 !important;
  overflow: hidden !important;
  flex-shrink: 0 !important;
}
.product-card .card-img img, .rel-card .rc-img img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
}
.product-card .card-body {
  display: flex !important;
  flex-direction: column !important;
  flex: 1 1 auto !important;
  justify-content: space-between !important;
  min-width: 0 !important;
}
.product-card .card-title, .rel-card .rc-title {
  display: -webkit-box !important;
  -webkit-line-clamp: 2 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
  min-height: 2.7em !important;
  word-break: break-word !important;
}
.desc-body, #desc-body, .desc-overview, .pdesc {
  overflow-x: hidden !important;
  word-break: break-word !important;
  overflow-wrap: anywhere !important;
  max-width: 100% !important;
}
.desc-body *, #desc-body *, .pdesc * {
  max-width: 100% !important;
  box-sizing: border-box !important;
}

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
</style><style id="bd-nav-fit-fix">
/* Responsive Navbar Icon Buttons & Hamburger Menu Fit Fix */
.navbar, .nb, header.navbar {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  min-height: 54px !important;
  padding: 0 10px !important;
  width: 100% !important;
  max-width: 100vw !important;
  box-sizing: border-box !important;
  background: rgba(8, 9, 10, 0.96) !important;
  border-bottom: 1px solid #222425 !important;
}
.nav-logo, .nlogo {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  min-width: 0 !important;
  flex-shrink: 1 !important;
  margin-right: 6px !important;
  text-decoration: none !important;
}
.nav-logo img, .nlogo img, .nav-logo .logo-svg, .nav-logo .logo-icon, .nlogo .li {
  width: 28px !important;
  height: 28px !important;
  flex-shrink: 0 !important;
  border-radius: 6px !important;
}
.nav-logo .logo-text, .nlogo .lt {
  display: inline-flex !important;
  align-items: center !important;
  font-size: 0.86rem !important;
  font-weight: 900 !important;
  gap: 3px !important;
  white-space: nowrap !important;
}
.nav-logo .logo-red, .nlogo .lr { color: #FE3442 !important; }
.nav-logo .logo-white, .nlogo .lw { color: #FFFFFF !important; }
.nav-actions, .nact, .na, .nav-right {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
  flex-shrink: 0 !important;
  margin-left: auto !important;
}
.nav-btn, .nbtn, .hamburger-btn {
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  margin-left: 0 !important;
  padding: 0 !important;
  flex-shrink: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 8px !important;
  background: #111827 !important;
  border: 1px solid #222425 !important;
  color: #FFFFFF !important;
  cursor: pointer !important;
  position: relative !important;
  text-decoration: none !important;
}
.hamburger-btn {
  border-color: #DC2626 !important;
  color: #FACC15 !important;
  font-size: 1.1rem !important;
}
.nav-btn:hover, .nbtn:hover, .hamburger-btn:hover {
  background: #DC2626 !important;
  border-color: #FE3442 !important;
  color: #FFFFFF !important;
}
.nav-btn svg, .nbtn svg, .hamburger-btn svg {
  width: 16px !important;
  height: 16px !important;
}
@media (min-width: 640px) {
  .navbar, .nb, header.navbar { padding: 0 16px !important; }
  .nav-logo, .nlogo { gap: 8px !important; }
  .nav-logo img, .nlogo img, .nav-logo .logo-svg, .nav-logo .logo-icon, .nlogo .li { width: 34px !important; height: 34px !important; }
  .nav-logo .logo-text, .nlogo .lt { font-size: 1.05rem !important; gap: 5px !important; }
  .nav-actions, .nact, .na, .nav-right { gap: 6px !important; }
  .nav-btn, .nbtn, .hamburger-btn { width: 36px !important; height: 36px !important; min-width: 36px !important; }
  .nav-btn svg, .nbtn svg, .hamburger-btn svg { width: 18px !important; height: 18px !important; }
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
<div class="top-bar"><a href="profile.html">← Profile</a><div>Free Shipping $29+</div></div>
<div class="page-header"><div class="breadcrumb"><a href="/">Home</a> → <a href="profile.html">Profile</a> → Orders</div><h1>My Orders</h1></div>
<div class="tabs" id="tabs">
<button class="tab active" data-status="unpaid">Unpaid</button>
<button class="tab" data-status="processing">Processing</button>
<button class="tab" data-status="shipped">Shipped</button>
<button class="tab" data-status="review">To Review</button>
<button class="tab" data-status="return">Returns</button>
</div>
<div class="content" id="content"><div class="empty-state"><div class="icon">📦</div><h2>Loading orders…</h2></div></div>


<div id="order-modal" class="modal-overlay" style="display:none" onclick="if(event.target===this)closeOrderModal()">
  <div class="modal-sheet"><div class="modal-handle"></div>
    <div class="modal-header"><h2 id="modal-title">Order Details</h2><button class="modal-close" onclick="closeOrderModal()">✕</button></div>
    <div class="modal-body" id="modal-body"></div>
  </div>
</div>

<script>
// === Bargain Drop Orders — v4 FINAL ===
var API = location.origin;
var L = {unpaid:"Unpaid",processing:"Processing",shipped:"Shipped",review:"To Review","return":"Return"};
var S = {unpaid:"unpaid",processing:"processing",shipped:"shipped",review:"review","return":"return"};

function esc(s){return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function fmt(p){return "A$"+Number(p||0).toFixed(2);}

// Server-first order loader. _ORDERS is the in-memory cache (source: /api/my-orders),
// localStorage["bd_orders"] is a fallback/optimistic cache updated locally.
var _ORDERS = [];
var _ORDERS_LOADED = 0;

function sessionEmail(){
  try { var s = JSON.parse(localStorage.getItem("bd_session")||"null"); if(s && s.email) return String(s.email).toLowerCase(); } catch(e){}
  var u = localStorage.getItem("bd_user_email");
  return u ? String(u).toLowerCase() : "";
}

function getOrders(){ return _ORDERS; }

function saveOrders(orders){
  _ORDERS = orders;
  try { localStorage.setItem("bd_orders", JSON.stringify(orders)); } catch(e){}
}

// Fetch the user's orders from the server (source of truth), falling back to any
// locally cached orders if the network / endpoint is unavailable.
function loadOrdersFromServer(){
  // Identity is resolved server-side from the __session cookie; do NOT send
  // a client-controlled email (that would let one account read another's orders).
  var url = "/api/my-orders";
  return fetch(url, { credentials: "same-origin" })
    .then(function(r){ if(!r.ok) throw new Error("http "+r.status); return r.json(); })
    .then(function(data){
      var list = (data && data.orders) ? data.orders : [];
      saveOrders(list);
      _ORDERS_LOADED = Date.now();
      renderOrders(currentFilter());
    })
    .catch(function(){
      // Fall back to locally cached orders.
      try { _ORDERS = migrate(JSON.parse(localStorage.getItem("bd_orders")||"[]")); } catch(e){ _ORDERS = []; }
      renderOrders(currentFilter());
    });
}

var _activeFilter = "all";
function currentFilter(){ return _activeFilter; }

// Migrate old statuses
function migrate(orders){
  var ch = false;
  orders.forEach(function(o){
    if(o.status==="pending"){ o.status="unpaid"; ch=true; }
    if(o.status==="paid"){ o.status="processing"; ch=true; }
  });
  if(ch) saveOrders(orders);
  return orders;
}

function renderOrders(filter){
  var orders = migrate(getOrders());
  var ct = document.getElementById("content");
  var filtered = filter && filter!=="all" ? orders.filter(function(o){return o.status===filter}) : orders;

  if(!filtered.length){
    var msg = filter && filter!=="all" ? "No "+L[filter].toLowerCase()+" orders" : "No orders yet";
    ct.innerHTML = '<div class="empty-state"><div class="icon">📦</div><h2>'+msg+'</h2><p>Orders appear here after purchase</p><br><a href="products.html" style="color:var(--fg);font-weight:600;text-decoration:underline">Start Shopping</a></div>';
  } else {
    filtered.sort(function(a,b){return new Date(b.date) - new Date(a.date)});
    var html = "";
    filtered.forEach(function(o){
      var st = o.status||"unpaid";
      var items = o.items||[];
      var thumbs = "";
      for(var i=0; i<Math.min(items.length,4); i++){
        var im = items[i].image||"";
        thumbs += '<div class="order-thumb">'+(im?'<img src="'+esc(im)+'" onerror="this.remove()" alt="">':"")+"</div>";
      }
      if(items.length>4) thumbs += '<div class="order-thumb" style="display:flex;align-items:center;justify-content:center;font-size:.65rem;color:var(--muted)">+'+ (items.length-4) +"</div>";
      var d = new Date(o.date);
      var ds = d.toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"});
      html += '<div class="order-card" onclick="showOrderDetail(\''+esc(o.id)+'\')"><div class="order-header"><div><div class="order-id">'+esc(o.id)+'</div><div style="font-size:.62rem;color:var(--muted)">'+ds+'</div></div><span class="order-status '+S[st]+'">'+L[st]+'</span></div><div class="order-items">'+thumbs+'</div><div class="order-total">'+fmt(o.total)+" &bull; "+items.length+" item"+(items.length!==1?"s":"")+"</div></div>";
    });
    ct.innerHTML = html;
  }
  updateCounts(orders);
}

function updateCounts(orders){
  var counts = {};
  orders.forEach(function(o){ var s=o.status||"unpaid"; counts[s]=(counts[s]||0)+1; });
  var tabs = document.querySelectorAll("#tabs .tab");
  tabs.forEach(function(t){
    var s = t.getAttribute("data-status");
    var c = counts[s]||0;
    t.textContent = L[s] + (c>0?" ("+c+")":"");
  });
}

// Modal
function showOrderDetail(oid){
  var orders = getOrders();
  var o = orders.find(function(x){return x.id===oid}); if(!o) return;
  var st = o.status||"unpaid";
  var items = o.items||[];
  var d = new Date(o.date);
  var ds = d.toLocaleDateString("en-AU",{weekday:"short",day:"numeric",month:"short",year:"numeric"});
  var ts = d.toLocaleTimeString("en-AU",{hour:"2-digit",minute:"2-digit"});

  var itemsHtml = "";
  items.forEach(function(it,i){
    itemsHtml += '<div class="modal-item"><div class="modal-item-img">'+(it.image?'<img src="'+esc(it.image)+'" onerror="this.remove()" alt="">':"")+'</div><div class="modal-item-info"><div class="modal-item-title">'+esc(it.title||"Item #"+(i+1))+'</div><div class="modal-item-qty">Qty: '+(it.qty||it.quantity||1)+'</div></div><div class="modal-item-price">'+fmt((it.price||0)*(it.qty||it.quantity||1))+'</div></div>';
  });

  document.getElementById("modal-title").textContent = "Order #"+esc(o.id);
  document.getElementById("modal-body").innerHTML =
    '<div class="modal-status-row"><span class="order-status '+S[st]+'">'+L[st]+'</span></div>'+
    '<div class="modal-meta"><strong>Order ID</strong>'+esc(o.id)+'</div>'+
    '<div class="modal-meta"><strong>Date</strong>'+ds+' at '+ts+'</div>'+
    (o.name?'<div class="modal-meta"><strong>Customer</strong>'+esc(o.name)+'</div>':"")+
    (o.email?'<div class="modal-meta"><strong>Email</strong>'+esc(o.email)+'</div>':"")+
    (o.payment?'<div class="modal-meta"><strong>Payment Method</strong>'+esc(o.payment)+'</div>':"")+
    '<div class="modal-section-title">Items ('+items.length+')</div>'+itemsHtml+
    '<div class="modal-total-row"><span>Total</span><span>'+fmt(o.total||0)+'</span></div>';
  if(st==='unpaid'){document.getElementById('modal-body').innerHTML+='<button class="modal-delete" onclick="deleteOrder(\''+esc(o.id)+'\',true)">🗑 Remove Unpaid Order</button>';}
document.getElementById("order-modal").style.display = "flex";
}

function deleteOrder(oid,fromModal){
  var orders=getOrders();
  orders=orders.filter(function(o){return o.id!==oid});
  saveOrders(orders);
  if(fromModal) closeOrderModal();
  var active=document.querySelector('#tabs .tab.active');
  renderOrders(active?active.getAttribute('data-status'):'all');
  toast('Order removed');
}
function toast(msg){
  var t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);
  setTimeout(function(){t.remove()},2300);
}
function closeOrderModal(){
  document.getElementById("order-modal").style.display = "none";
}

// Cart count
function updateCart(){
  try { var cart=JSON.parse(localStorage.getItem("bd_cart")||"[]"); var n=cart.reduce(function(s,i){return s+(i.qty||1)},0); var b=document.getElementById("nav-cart-count"); if(b){b.textContent=n;b.style.display=n>0?"":"none"} } catch(e){}
}

// Init
var tabs = document.querySelectorAll("#tabs .tab");
tabs.forEach(function(t){
  t.addEventListener("click", function(){
    tabs.forEach(function(x){x.classList.remove("active")});
    t.classList.add("active");
    _activeFilter = t.getAttribute("data-status");
    renderOrders(_activeFilter);
  });
});
loadOrdersFromServer();
updateCart();
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

<!-- Bargain Drop Support Widget -->
<script>
(function(w,d){
  w.BD_CHAT = w.BD_CHAT || { config: { api: (w.location && w.location.origin) || "https://bargain-drop.online" } };
  var c=d.createElement("link"); c.rel="stylesheet"; c.href=w.BD_CHAT.config.api+"/chat-widget/chat.css?v=0438bd327b"; d.head.appendChild(c);
  var j=d.createElement("script"); j.async=true; j.src=w.BD_CHAT.config.api+"/chat-widget/chat.js?v=b75f42de9c"; d.body.appendChild(j);
})(window,document);
</script><script>
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
<script src="/js/icon-library.js?v=8ebc04a2fb"></script>
<script src="/js/slide-icons.js?v=4ef2e99c17"></script>
<script src="/js/auto-iconify.js?v=49867b897b"></script>
  <script src="/js/logo-handler.js?v=8c0763c579"></script>
</body>
</html>