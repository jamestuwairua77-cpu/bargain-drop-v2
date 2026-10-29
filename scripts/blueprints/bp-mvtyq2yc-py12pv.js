<!DOCTYPE html><html lang="en"><head><script>
/* End-to-end access enabled */
</script>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0"><title>Gift Cards — Bargain Drop</title><style>:root{--bg: #09090b;--fg: #ffffff;--muted: #a1a1aa;--accent: #ff1a3c;--lilac: #ff1a3c;--teal: #ffd600;--dark: #000000;--white: #0e0e14;--nav-h:54px;--promo-h:28px}*,::before,::after{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;background:var(--bg);background-image:radial-gradient(1200px 600px at 100% -10%,rgba(230,0,35,.05),transparent 60%),radial-gradient(900px 500px at -10% 12%,rgba(20,20,20,.05),transparent 55%);color:var(--fg);padding-top:calc(var(--nav-h)+var(--promo-h))}a{color:inherit;text-decoration:none}.promo-strip{position:fixed;top:0;left:0;right:0;height:var(--promo-h);background:linear-gradient(90deg,var(--accent),#c0392b);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:600;z-index:300}.navbar{position:fixed;top:var(--promo-h);left:0;right:0;height:var(--nav-h);background:linear-gradient(90deg,#0F0F0F 0%,#1a1013 55%,#26090e 100%);backdrop-filter:blur(14px);display:flex;align-items:center;padding:0 16px;z-index:299}.nav-logo{display:flex;align-items:center;gap:6px;margin-right:auto}.nav-logo .logo-icon{width:30px;height:30px;background: #000000; border: 3px solid #ffd600;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:900;color:#fff}.nav-logo .logo-text{font-size:.8rem;font-weight:800;color:#fff}.nav-actions{display:flex;gap:4px}.nav-btn{width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:50%;color:rgba(255,255,255,.7);background:none;border:none;cursor:pointer;text-decoration:none}.container{max-width:620px;margin:0 auto;padding:16px 14px 100px}.back-link{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;margin-bottom:14px;background: #0e0e14; color: #ffffff;border-radius:9999px;font-size:.7rem;font-weight:700;color:var(--muted);box-shadow:0 1px 3px rgba(0,0,0,.06)}.page-header h1{font-size:1.15rem;font-weight:800}.card{background: #0e0e14; color: #ffffff;border-radius:14px;box-shadow:0 2px 0 rgba(20,20,20,.06);padding:24px 20px;margin-bottom:12px;border: 2px solid rgba(255, 255, 255, 0.25);text-align:center}.gift-preview{max-width:280px;border-radius:16px;margin:0 auto;background:linear-gradient(135deg,#B8A9E8,#4ECDC4);padding:32px 20px;color:#111}.gift-amount{font-size:2rem;font-weight:900}.btn{display:inline-flex;align-items:center;justify-content:center;padding:12px 28px;border-radius:9999px;font-size:.73rem;font-weight:700;cursor:pointer;border:none;width:100%}.btn-primary{background:var(--dark);color:#fff}.amount-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}.amount-btn{padding:14px;border-radius:10px;border:1.5px solid #e8e5e0;background: #0e0e14; color: #ffffff;font-size:.8rem;font-weight:700;cursor:pointer;font-family:inherit;color:var(--fg)}.amount-btn.active{border-color:var(--lilac);background:rgba(184,169,232,.1)}
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

</style><style id="bd-rwb-theme">
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
</style></head><body>    <div class="promo-strip"><span>🎉 30% OFF SITEWIDE — USE CODE <b>BARGAIN26</b> AT CHECKOUT &nbsp;·&nbsp; Free Shipping A$29+ · SSL Encrypted · Verified Seller · 30-Day Returns</span></div>
    <nav class="navbar">
      <a href="/" class="nav-logo" aria-label="Bargain Drop Home" style="display:inline-flex;align-items:center;gap:10px;text-decoration:none;"><img src="data:image/jpeg;base64,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" alt="Bargain Drop Logo" style="width:36px;height:36px;object-fit:contain;border-radius:8px;flex-shrink:0;filter:drop-shadow(0 2px 8px rgba(255,26,60,0.45));" /><div class="logo-text" style="font-size:1.12rem;font-weight:900;letter-spacing:-0.4px;text-transform:uppercase;font-family:system-ui,-apple-system,sans-serif;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;color:#ffffff;"><span style="color:#ff1a3c!important;font-weight:900;">BARGAIN</span> <span style="color:#ffffff!important;font-weight:900;">DROP</span></div></a>
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
  <div class="search-overlay" id="search-overlay" onclick="this.classList.remove('show')"><div class="search-box" onclick="event.stopPropagation()"><input id="search-input" type="text" placeholder="Search products..." onkeydown="if(event.key==='Enter'){location.href='category.html?search='+encodeURIComponent(this.value)}"></div></div><div class="container"><a href="profile.html" class="back-link">← Back to Account</a><div class="page-header"><h1>🎁 Gift Cards</h1><p style="font-size:.72rem;color:var(--muted);margin-bottom:16px">Send a Bargain Drop gift card to anyone.</p></div><div class="card"><div class="gift-preview"><div style="font-size:.6rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Bargain Drop</div><div class="gift-amount">A$50.00</div><div style="font-size:.68rem;opacity:.7;margin-top:4px">GIFT CARD</div></div></div><div class="card" style="text-align:left"><div style="font-size:.78rem;font-weight:700;margin-bottom:12px">Select amount</div><div class="amount-grid"><button class="amount-btn active" onclick="sA(this,'25')">A$25.00</button><button class="amount-btn" onclick="sA(this,'50')">A$50.00</button><button class="amount-btn" onclick="sA(this,'100')">A$100.00</button><button class="amount-btn" onclick="sA(this,'200')">A$200.00</button></div><label style="display:block;font-size:.68rem;font-weight:700;color:var(--muted);margin-bottom:4px">Recipient email</label><input id="ge" type="email" placeholder="friend@example.com" style="width:100%;padding:12px;border:1.5px solid #e8e5e0;border-radius:10px;font-size:.8rem;outline:none;margin-bottom:14px"><button class="btn btn-primary" onclick="buy()">Buy Gift Card</button><p id="gr" style="font-size:.68rem;margin-top:8px;min-height:18px;text-align:center"></p></div><div class="card" style="text-align:center"><a href="wallet.html" class="btn btn-primary" style="display:inline-flex;width:auto">Go to Wallet</a></div></div><script>function sA(e,a){document.querySelectorAll(".amount-btn").forEach(function(b){b.classList.remove("active")});e.classList.add("active");document.querySelector(".gift-amount").textContent="A$"+a+".00"}function buy(){var m=document.getElementById("gr"),e=document.getElementById("ge").value.trim();if(!e||!e.includes("@")){m.textContent="Please enter a valid email";m.style.color="#e60023";return}m.textContent="Purchase flow would open here.";m.style.color="#10b981"}</script><script>
(function(){try{var c=JSON.parse(localStorage.getItem("bd_cart")||"[]"),n=c.reduce(function(s,i){return s+(i.qty||1)},0),b=document.getElementById("nav-cart-count");if(b&&n>0){b.textContent=n;b.style.display=""}}catch(e){}})();
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
<script src="/js/notifications.js?v=bd20261029v4"></script>
<script src="/js/icon-library.js?v=bd20261029v4"></script>
<script src="/js/slide-icons.js?v=bd20261029v4"></script>
<script src="/js/auto-iconify.js?v=bd20261029v4"></script>
  <script src="/js/logo-handler.js?v=bd20261029v4"></script>
</body></html>