<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<title>Address Book — Bargain Drop</title>
<link rel="icon" href="favicon.svg">
<meta name="theme-color" content="#ffffff">
<script src="/js/account.js?v=a67adad153"></script>
<script>
/* End-to-end access enabled */
</script>

<style>
:root{--bg: #09090b;--fg: #ffffff;--muted: #a1a1aa;--accent: #ff1a3c;--lilac: #ff1a3c;--teal: #ffd600;--dark: #000000;--white: #0e0e14;--green:#10b981;--nav-h:54px;--promo-h:28px;--radius:14px;--pill:999px}
*,::before,::after{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;background:var(--bg);background-image:radial-gradient(1200px 600px at 100% -10%,rgba(230,0,35,.05),transparent 60%),radial-gradient(900px 500px at -10% 12%,rgba(20,20,20,.05),transparent 55%);color:var(--fg);padding-top:calc(var(--nav-h) + var(--promo-h))}
a{color:inherit;text-decoration:none}
.promo-strip{position:fixed;top:0;left:0;right:0;height:var(--promo-h);background:linear-gradient(90deg,var(--accent),#c0392b);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:600;z-index:300;overflow:hidden;white-space:nowrap}
.promo-strip span{display:flex;gap:4px;animation:marquee 20s linear infinite}
@keyframes marquee{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
.promo-strip .sep{width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,.5)}
.navbar{position:fixed;top:var(--promo-h);left:0;right:0;height:var(--nav-h);background:linear-gradient(90deg,#0F0F0F 0%,#1a1013 55%,#26090e 100%);backdrop-filter:blur(14px);display:flex;align-items:center;padding:0 16px;z-index:299;box-shadow:0 1px 0 rgba(255,255,255,.06)}
.nav-logo{display:flex;align-items:center;gap:6px;flex-shrink:0;margin-right:auto;text-decoration:none;color:inherit}
.nav-logo .logo-icon{width:30px;height:30px;background: #000000; border: 3px solid #ffd600;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:900;color:#fff}
.nav-logo .logo-text{font-size:.8rem;font-weight:800;color:#fff}
.nav-actions{display:flex;gap:4px;align-items:center}
.nav-btn{position:relative;width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:50%;color:rgba(255,255,255,.7);background:none;border:none;cursor:pointer;text-decoration:none}
.nav-btn:hover{color:#fff;background:rgba(255,255,255,.08)}
.nav-badge{position:absolute;top:3px;right:3px;background:var(--accent);color:#fff;font-size:.5rem;min-width:15px;height:15px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;padding:0 3px}
.container{max-width:580px;margin:0 auto;padding:20px 16px 100px}
.page-header{margin-bottom:24px}
.breadcrumb{font-size:.7rem;color:var(--muted);margin-bottom:8px}
.breadcrumb a{color:var(--lilac)}
.page-header h1{font-size:1.25rem;font-weight:800;margin-bottom:4px}
.subtitle{font-size:.75rem;color:var(--muted)}
.add-btn{display:flex;align-items:center;gap:8px;width:100%;padding:14px 18px;border:2px dashed #d0ccc5;border-radius:var(--radius);background:transparent;font-size:.78rem;font-weight:700;color:var(--muted);cursor:pointer;margin-bottom:16px;transition:all .15s}
.add-btn:hover{border-color:var(--lilac);color:var(--fg);background:rgba(184,169,232,.05)}
.add-btn .plus{width:28px;height:28px;border-radius:50%;background:var(--lilac);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0}
.address-card{background: #0e0e14; color: #ffffff;border-radius:var(--radius);padding:16px 18px;margin-bottom:10px;border:1.5px solid #e8e5e0;box-shadow:0 1px 3px rgba(0,0,0,.04);position:relative}
.address-card.default{border-color:var(--lilac);background:rgba(184,169,232,.04)}
.address-name{font-size:.82rem;font-weight:800;margin-bottom:2px}
.address-street{font-size:.78rem;color:var(--fg);line-height:1.5}
.address-meta{font-size:.7rem;color:var(--muted);margin-top:8px}
.default-badge{display:inline-block;padding:3px 10px;background:rgba(184,169,232,.15);color:var(--lilac);border-radius:var(--pill);font-size:.62rem;font-weight:700;margin-top:6px}
.address-actions{display:flex;gap:6px;margin-top:10px}
.action-btn{padding:7px 14px;border:1.5px solid #e8e5e0;border-radius:var(--pill);background: #0e0e14; color: #ffffff;font-size:.68rem;font-weight:600;color:var(--muted);cursor:pointer}
.action-btn:hover{border-color:var(--lilac);color:var(--fg)}
.action-btn.danger:hover{border-color:var(--accent);color:var(--accent)}
.empty-state{text-align:center;padding:50px 20px}
.empty-state .empty-icon{font-size:3rem;margin-bottom:12px}
.empty-state h2{font-size:1rem;font-weight:800;margin-bottom:4px}
.empty-state p{font-size:.75rem;color:var(--muted)}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:14px 32px;border-radius:var(--pill);font-size:.78rem;font-weight:700;cursor:pointer;border:none;transition:all .15s}
.btn-primary{background:var(--dark);color:#fff;width:100%}
.btn-primary:hover{opacity:.9}
.btn-secondary{background: #0e0e14; color: #ffffff;color:var(--fg);border:2px solid #1a1a1a}
.btn-back{background:none;color:var(--muted);font-size:.75rem;font-weight:600;padding:12px 0}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(100px);background:var(--dark);color:#fff;padding:12px 28px;border-radius:var(--pill);font-size:.75rem;font-weight:700;z-index:999;transition:.3s;box-shadow:0 4px 16px rgba(0,0,0,.2)}
.toast.show{transform:translateX(-50%) translateY(0)}
/* Modal */
.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:350;display:none;align-items:center;justify-content:center;padding:20px}
.modal-overlay.show{display:flex}
.modal-box{background: #0e0e14; color: #ffffff;border-radius:var(--radius);padding:24px 20px;width:100%;max-width:440px;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.15)}
.modal-box h2{font-size:1.05rem;font-weight:800;margin-bottom:18px}
.modal-close{position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:50%;border:none;background:rgba(0,0,0,.05);cursor:pointer;font-size:1rem;color:var(--muted);z-index:10}
.form-group{margin-bottom:14px}
.form-group label{display:block;font-size:.7rem;font-weight:700;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px}
.form-group input,.form-group select{width:100%;padding:11px 14px;border:1.5px solid #e0dcd5;border-radius:10px;font-size:.85rem;background: #0e0e14; color: #ffffff;font-family:inherit;color:var(--fg);transition:border-color .15s}
.form-group input:focus,.form-group select:focus{border-color:var(--lilac);outline:none}
.form-group input::placeholder{color:#ccc}
.form-row{display:flex;gap:8px}
.form-row .form-group{flex:1}
.checkbox-row{display:flex;align-items:center;gap:8px;margin-top:4px}
.checkbox-row input[type=checkbox]{width:auto}
.checkbox-row label{text-transform:none;letter-spacing:0;margin:0;font-size:.75rem;font-weight:500}
.modal-footer{display:flex;gap:10px;margin-top:20px}
.modal-footer .btn{flex:1}
/* Slide */
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
<div class="promo-strip"><span>🎉 30% OFF SITEWIDE — USE CODE <b>BARGAIN26</b> AT CHECKOUT<span class="sep"></span>Free Shipping A$29+<span class="sep"></span>🔒 SSL Encrypted<span class="sep"></span>✅ Verified Seller<span class="sep"></span>🔄 30-Day Returns</span></div>
<nav class="navbar">
  <a href="/" class="nav-logo" aria-label="Bargain Drop Home" style="display:inline-flex;align-items:center;gap:10px;text-decoration:none;"><img src="/official-logo.jpg" alt="Bargain Drop Logo" style="width:36px;height:36px;object-fit:contain;border-radius:8px;flex-shrink:0;filter:drop-shadow(0 2px 8px rgba(255,26,60,0.45));" /><div class="logo-text" style="font-size:1.12rem;font-weight:900;letter-spacing:-0.4px;text-transform:uppercase;font-family:system-ui,-apple-system,sans-serif;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;color:#ffffff;"><span style="color:#ff1a3c!important;font-weight:900;">BARGAIN</span> <span style="color:#ffffff!important;font-weight:900;">DROP</span></div></a>
  <div class="nav-actions">
    <button class="nav-btn" onclick="document.getElementById('search-overlay').classList.add('show');document.getElementById('search-input').focus()" aria-label="Search"><svg width="18" height="18" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M21 21l-4.35-4.35" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button>
    <a href="wishlist.html" class="nav-btn" aria-label="Wishlist"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></a>
    <a href="cart.html" class="nav-btn" aria-label="Cart"><svg width="18" height="18" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1" fill="currentColor"/><circle cx="20" cy="21" r="1" fill="currentColor"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg><span class="nav-badge" id="nav-cart-count" style="display:none">0</span></a>
    <a href="notification-center.html" class="nav-btn" aria-label="Notifications">

            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>

            <span class="nav-badge" id="nav-notif-count" style="display:none">0</span>

          </a>

    <button class="nav-btn hamburger-btn" onclick="document.getElementById('slide-menu').classList.toggle('open')" aria-label="Menu"><svg width="20" height="20" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
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
<div class="toast" id="toast"></div>

<!-- MODAL -->
<div class="modal-overlay" id="addr-modal">
  <div class="modal-box">
    <h2 id="modal-title">Add New Address</h2>
    <div class="form-group"><label>Full Name</label><input type="text" id="addr-name" placeholder="Recipient name" autocomplete="name"></div>
    <div class="form-group"><label>Phone</label><input type="tel" id="addr-phone" placeholder="+61 4XX XXX XXX" autocomplete="tel"></div>
    <div class="form-group"><label>Street Address</label><input type="text" id="addr-line1" placeholder="House/flat number & street" autocomplete="address-line1"></div>
    <div class="form-group"><label>Apt, Suite, Unit (optional)</label><input type="text" id="addr-line2" placeholder="Building name, floor" autocomplete="address-line2"></div>
    <div class="form-row">
      <div class="form-group"><label>City</label><input type="text" id="addr-city" placeholder="City" autocomplete="address-level2"></div>
      <div class="form-group"><label>State</label><input type="text" id="addr-state" placeholder="State / Province" autocomplete="address-level1"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Postal Code</label><input type="text" id="addr-zip" placeholder="Postcode" autocomplete="postal-code"></div>
      <div class="form-group"><label>Country</label>
        <select id="addr-country"><option value="AU">🇦🇺 Australia</option><option value="US">🇺🇸 United States</option><option value="GB">🇬🇧 United Kingdom</option><option value="CA">🇨🇦 Canada</option><option value="NZ">🇳🇿 New Zealand</option></select>
      </div>
    </div>
    <div class="checkbox-row"><input type="checkbox" id="addr-default"><label for="addr-default">Set as default address</label></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" style="background:var(--dark);color:#fff" onclick="saveAddr()">Save Address</button>
    </div>
  </div>
</div>

<div class="container">
  <div class="page-header">
    <div class="breadcrumb"><a href="profile.html">← My Account</a></div>
    <h1>📍 Address Book</h1>
    <p class="subtitle">Manage your delivery addresses</p>
  </div>
  <button class="add-btn" onclick="openAdd()"><span class="plus">+</span> Add New Address</button>
  <div id="address-list"></div>
  <div class="empty-state" id="empty"><div class="empty-icon">📬</div><h2>No addresses yet</h2><p>Add one to check out faster</p></div>
  <div style="text-align:center;margin-top:24px"><a href="profile.html" class="btn btn-back">← Go Back</a></div>
</div>

<script>
try{var c=JSON.parse(localStorage.getItem("bd_cart")||"[]"),n=c.reduce(function(s,i){return s+(i.qty||1)},0),b=document.getElementById("nav-cart-count");if(b&&n>0){b.textContent=n;b.style.display=""}}catch(e){}

function toast(m){
  var e=document.getElementById("toast");if(!e)return;
  e.textContent=m;e.classList.add("show");
  clearTimeout(e._t);e._t=setTimeout(function(){e.classList.remove("show")},2500);
}

// Address storage — account-backed. Server (users-seed.json via /api/addresses)
// is the source of truth for signed-in users; localStorage is a cache/offline
// fallback. Identity is resolved server-side from the __session cookie.
function getL(){try{return JSON.parse(localStorage.getItem("bd_addresses")||"[]")}catch(e){return[]}}
function setL(l){localStorage.setItem("bd_addresses",JSON.stringify(l))}

// Are we signed in? (client hint only — the server re-verifies the cookie)
function signedIn(){try{var s=JSON.parse(localStorage.getItem("bd_session")||"null");return !!(s&&s.id)}catch(e){return false}}

// Push the full address list to the server for this account.
function persist(list){
  setL(list);
  if(!signedIn()){ return Promise.resolve(); }
  return fetch("/api/addresses", {method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({addresses:list})})
    .catch(function(){ /* offline — stays cached locally */ });
}

// Load addresses from the server on page load (server wins for signed-in users).
function loadServer(){
  if(!signedIn()){ return Promise.resolve(); }
  return fetch("/api/addresses",{credentials:"same-origin"})
    .then(function(r){ return r.ok ? r.json() : {addresses:getL()}; })
    .then(function(d){
      var serverList = Array.isArray(d.addresses) ? d.addresses : [];
      // Merge: prefer server for signed-in; if server empty but local has data,
      // push local up (first-time migration of any previously-local addresses).
      if(serverList.length){ setL(serverList); }
      else if(getL().length){ persist(getL()); }
    })
    .catch(function(){ /* offline — fall back to local */ });
}

var editIdx=-1;

function openAdd(){
  editIdx=-1;
  document.getElementById("modal-title").textContent="Add New Address";
  ["name","phone","line1","line2","city","state","zip"].forEach(function(id){document.getElementById("addr-"+id).value=""});
  document.getElementById("addr-country").value="AU";
  document.getElementById("addr-default").checked=false;
  document.getElementById("addr-modal").classList.add("show");
}

function openEdit(idx){
  var list=getL(),a=list[idx];if(!a)return;
  editIdx=idx;
  document.getElementById("modal-title").textContent="Edit Address";
  document.getElementById("addr-name").value=a.name||"";
  document.getElementById("addr-phone").value=a.phone||"";
  document.getElementById("addr-line1").value=a.line1||"";
  document.getElementById("addr-line2").value=a.line2||"";
  document.getElementById("addr-city").value=a.city||"";
  document.getElementById("addr-state").value=a.state||"";
  document.getElementById("addr-zip").value=a.zip||"";
  document.getElementById("addr-country").value=a.country||"AU";
  document.getElementById("addr-default").checked=!!a.isDefault;
  document.getElementById("addr-modal").classList.add("show");
}

function closeModal(){document.getElementById("addr-modal").classList.remove("show")}

function saveAddr(){
  var a={
    name:document.getElementById("addr-name").value.trim(),
    phone:document.getElementById("addr-phone").value.trim(),
    line1:document.getElementById("addr-line1").value.trim(),
    line2:document.getElementById("addr-line2").value.trim(),
    city:document.getElementById("addr-city").value.trim(),
    state:document.getElementById("addr-state").value.trim(),
    zip:document.getElementById("addr-zip").value.trim(),
    country:document.getElementById("addr-country").value,
    isDefault:document.getElementById("addr-default").checked
  };
  if(!a.name||!a.line1||!a.city){toast("⚠️ Name, street and city required");return}
  
  var list=getL();
  if(a.isDefault)list.forEach(function(x){x.isDefault=false});
  if(editIdx>=0){list[editIdx]=Object.assign(list[editIdx],a)}
  else{if(list.length===0)a.isDefault=true;list.push(a)}
  persist(list).then(function(){closeModal();render();});
  toast(editIdx>=0?"✅ Address updated":"✅ Address added");
}

function removeAddr(idx){
  if(!confirm("Delete this address?"))return;
  var list=getL();list.splice(idx,1);
  if(list.length&&!list.some(function(x){return x.isDefault}))list[0].isDefault=true;
  persist(list).then(function(){render();});toast("🗑️ Address removed");
}

function render(){
  var list=getL(),c=document.getElementById("address-list"),e=document.getElementById("empty");
  if(!list.length){c.innerHTML="";e.style.display="";return}
  e.style.display="none";c.innerHTML="";
  list.forEach(function(a,i){
    var div=document.createElement("div");
    div.className="address-card"+(a.isDefault?" default":"");
    var street=a.line1+(a.line2?", "+a.line2:"")+", "+a.city+" "+a.state+" "+a.zip;
    var meta=(a.phone?"📞 "+a.phone+" · ":"")+(a.country==="AU"?"🇦🇺 Australia":a.country==="US"?"🇺🇸 United States":a.country==="GB"?"🇬🇧 UK":a.country==="CA"?"🇨🇦 Canada":a.country==="NZ"?"🇳🇿 New Zealand":a.country);
    div.innerHTML='<div class="address-name">'+a.name.replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})+'</div><div class="address-street">'+street.replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})+'</div><div class="address-meta">'+meta+'</div>'+(a.isDefault?'<div class="default-badge">⭐ Default</div>':'')+'<div class="address-actions"><button class="action-btn" onclick="openEdit('+i+')">✏️ Edit</button><button class="action-btn danger" onclick="removeAddr('+i+')">🗑️ Delete</button></div>';
    c.appendChild(div);
  });
}

// Close modal on overlay click
document.getElementById("addr-modal").addEventListener("click",function(e){if(e.target===this)closeModal()});

loadServer().then(function(){ render(); });
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