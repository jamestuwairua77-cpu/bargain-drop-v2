<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<title>Sign In — Bargain Drop</title>
<script src="https://accounts.google.com/gsi/client" async defer></script>
<style>
:root{--bg: #09090b;--fg: #ffffff;--muted: #a1a1aa;--line: rgba(255, 255, 255, 0.25);--red:#e60023;--accent: #ff1a3c}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--bg);background-image:radial-gradient(1200px 600px at 100% -10%,rgba(230,0,35,.05),transparent 60%),radial-gradient(900px 500px at -10% 12%,rgba(20,20,20,.05),transparent 55%);color:var(--fg);display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.auth-card{width:100%;max-width:380px;padding:32px 24px;border:1px solid var(--line);border-radius:16px;text-align:center}
.auth-card h1{font-size:1.3rem;font-weight:800;margin-bottom:4px}
.auth-card .sub{font-size:.75rem;color:var(--muted);margin-bottom:20px}
.auth-card input{width:100%;padding:12px;border:1.5px solid var(--line);border-radius:10px;font-size:.82rem;margin-bottom:10px;outline:none;transition:border-color .15s}
.auth-card input:focus{border-color:var(--fg)}
.auth-card .primary-btn{width:100%;padding:12px;background:var(--fg);color:#fff;border:none;border-radius:10px;font-size:.84rem;font-weight:700;cursor:pointer;margin-top:4px;transition:opacity .15s}
.auth-card .primary-btn:disabled{opacity:.5;cursor:default}
.auth-card a{font-size:.7rem;color:var(--muted);text-decoration:underline}
.google-btn{width:100%;padding:11px 12px;background: #0e0e14; color: #ffffff;color:#444;border:1.5px solid #ddd;border-radius:10px;font-size:.82rem;font-weight:600;cursor:pointer;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .15s}
.google-btn:hover{background:#f8f8f8;border-color:#ccc}
.google-btn:disabled{opacity:.6;cursor:default}
.google-btn svg{flex-shrink:0}
.separator{display:flex;align-items:center;gap:10px;margin:16px 0 6px;color:var(--muted);font-size:.65rem}
.separator::before,.separator::after{content:'';flex:1;height:1px;background:var(--line)}
.toggle-msg{margin-top:16px;font-size:.72rem;color:var(--muted)}
.toggle-msg a{font-weight:700;color:var(--accent)}
.error-msg{color:var(--red);font-size:.72rem;margin-top:6px;display:none}
.profile-box{display:none;padding:16px;background:#f9f9f9;border-radius:12px;margin-top:16px}
.profile-box img{border-radius:50%;width:48px;height:48px}
.profile-box .name{font-weight:700;margin-top:8px;font-size:.9rem}
.profile-box .email{font-size:.72rem;color:var(--muted)}
.logout-btn{background:var(--red);color:#fff;border:none;padding:8px 20px;border-radius:8px;font-size:.75rem;cursor:pointer;margin-top:10px}
.loading-dots{display:inline-flex;gap:4px}
.loading-dots span{width:6px;height:6px;border-radius:50%;background: #0e0e14; color: #ffffff;animation:bounce 1.4s infinite}
.loading-dots span:nth-child(2){animation-delay:.2s}
.loading-dots span:nth-child(3){animation-delay:.4s}
@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
#g_id_onload{display:none}

    .promo-strip{position:fixed;top:0;left:0;right:0;height:28px;background:linear-gradient(90deg,#e60023,#c0392b);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:600;z-index:300;overflow:hidden}
    .promo-strip span{display:flex;gap:4px;animation:marquee 20s linear infinite}
    @keyframes marquee{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
    .promo-strip .sep{width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,.5)}
    .navbar{position:fixed;top:28px;left:0;right:0;height:54px;background:rgba(15,15,15,.97);backdrop-filter:blur(14px);display:flex;align-items:center;padding:0 16px;z-index:299;box-shadow:0 1px 0 rgba(255,255,255,.06)}
    .nav-logo{display:flex;align-items:center;gap:6px;flex-shrink:0;margin-right:auto;text-decoration:none;color:inherit}
    .nav-logo .logo-icon{width:30px;height:30px;background:linear-gradient(135deg,#B8A9E8,#4ECDC4);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:900;color:#fff}
    .nav-logo .logo-text{font-size:.8rem;font-weight:800;color:#fff;letter-spacing:-.3px}
    .nav-actions{display:flex;gap:4px;align-items:center}
    .nav-btn{position:relative;width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:50%;color:rgba(255,255,255,.7);background:none;border:none;cursor:pointer;text-decoration:none}
    .nav-btn:hover{color:#fff;background:rgba(255,255,255,.08)}
    .nav-badge{position:absolute;top:3px;right:3px;background:#e60023;color:#fff;font-size:.5rem;min-width:15px;height:15px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;padding:0 3px}
    body{padding-top:82px}
    .search-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:400;display:none;align-items:flex-start;justify-content:center;padding-top:100px}
    .search-overlay.show{display:flex}
    .search-box{background: #0e0e14; color: #ffffff;border-radius:14px;padding:16px;width:90%;max-width:500px;box-shadow:0 4px 24px rgba(0,0,0,.2)}
    .search-box input{width:100%;padding:14px;border:1.5px solid rgba(255,255,255,.25);border-radius:10px;font-size:.9rem;outline:none;font-family:inherit;background:#1a1a24;color:#ffffff}.search-box input::placeholder{color:rgba(255,255,255,.6)}
    .search-box input:focus{border-color:#B8A9E8}
    
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
    .pw-wrap{position:relative;display:block}
.pw-wrap input{width:100%;padding-right:42px}
.pw-eye{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:34px;height:34px;border:none;background:none;cursor:pointer;color:#999;display:flex;align-items:center;justify-content:center;border-radius:8px;padding:0}
.pw-eye:hover{color:#333}
.pw-eye svg{width:20px;height:20px}

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
        <div class="promo-strip"><span>🎉 30% OFF SITEWIDE — USE CODE <b>BARGAIN26</b> AT CHECKOUT &nbsp;·&nbsp; Free Shipping A$29+ · SSL Encrypted · Verified Seller · 30-Day Returns</span></div>
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
    <div class="slide-menu" id="slide-menu"><div class="slide-backdrop" onclick="document.getElementById('slide-menu').classList.remove('open')"></div><div class="slide-panel">
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
    </div></div>
  <div class="search-overlay" id="search-overlay" onclick="this.classList.remove('show')"><div class="search-box" onclick="event.stopPropagation()"><input id="search-input" type="text" placeholder="Search products..." onkeydown="if(event.key==='Enter'){location.href='category.html?search='+encodeURIComponent(this.value)}"></div></div>
  
<div id="g_id_onload" data-client_id="489382559871-vp4q2enpqf5f8avj8hadjabatn27la7k.apps.googleusercontent.com" data-auto_select="false" data-login_uri="https://bargain-drop.online/api/google-callback" data-cancel_on_tap_outside="false"></div>

<div class="auth-card" id="auth-card">
  <div id="signin-view">
    <h1>Welcome Back</h1>
    <p class="sub">Sign in to your account</p>
    <label for="email" style="display:block;font-size:.8rem;font-weight:600;margin-bottom:4px;color:#333">Email</label><input id="email" type="email" id="signin-email" placeholder="Email" autocomplete="email">
    <label for="signin-password" style="display:block;font-size:.8rem;font-weight:600;margin-bottom:4px;color:#333">Password</label><span class="pw-wrap"><input id="signin-password" type="password" placeholder="Password" autocomplete="current-password"><button type="button" class="pw-eye" onclick="togglePw('signin-password',this)" aria-label="Show password"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button></span>
    <div class="error-msg" id="signin-error"></div>
    <button class="primary-btn" id="signin-btn" onclick="handleSignIn()">Sign In</button>
    <div class="separator">or</div>
    <button class="google-btn" id="google-btn-signin" onclick="handleGoogleSignIn()"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.95 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.88-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>Sign in with Google</button>
    <p class="toggle-msg">Don't have an account? <a href="#" onclick="toggleView('register')">Register</a></p>
  </div>

  <div id="register-view" style="display:none">
    <h1>Create Account</h1>
    <p class="sub">Join Bargain Drop today</p>
    <input type="text" id="reg-username" placeholder="Username" autocomplete="username">
    <label for="email" style="display:block;font-size:.8rem;font-weight:600;margin-bottom:4px;color:#333">Email</label><input id="email" type="email" id="reg-email" placeholder="Email" autocomplete="email">
    <label for="reg-password" style="display:block;font-size:.8rem;font-weight:600;margin-bottom:4px;color:#333">Password</label><span class="pw-wrap"><input id="reg-password" type="password" placeholder="Password" autocomplete="new-password"><button type="button" class="pw-eye" onclick="togglePw('reg-password',this)" aria-label="Show password"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button></span>
    <div class="error-msg" id="reg-error"></div>
    <button class="primary-btn" id="reg-btn" onclick="handleRegister()">Create Account</button>
    <div class="separator">or</div>
    <button class="google-btn" id="google-btn-reg" onclick="handleGoogleSignIn()"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.95 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.88-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>Register with Google</button>
    <p class="toggle-msg">Already have an account? <a href="#" onclick="toggleView('signin')">Sign In</a></p>
  </div>

  <div id="profile-view" style="display:none">
    <h1>My Account</h1>
    <div class="profile-box"><img id="profile-pic" src="" alt="Profile" onerror="this.style.display='none'"><div class="name" id="profile-name"></div><div class="email" id="profile-email"></div><button class="logout-btn" onclick="handleLogout()">Sign Out</button></div>
    <p style="margin-top:14px"><a href="/">← Back to Home</a></p>
  </div>

  <p style="margin-top:12px"><a href="/">← Back to Home</a></p>
</div>

<script>
var API_BASE = 'https://bargain-drop.online';
var GOOGLE_CLIENT_ID = '489382559871-vp4q2enpqf5f8avj8hadjabatn27la7k.apps.googleusercontent.com';
(function(){
  if(location.hash.includes('google-auth=')){
    try { var raw = location.hash.split('google-auth=')[1]; var user = JSON.parse(decodeURIComponent(raw)); finishLogin(user); history.replaceState(null,null,location.pathname); } catch(e){ console.error('Google auth parse error',e) }
  }
  var sess = JSON.parse(localStorage.getItem('bd_session')||'null');
  if(sess && sess.email){ showProfile(sess) }
})();

function togglePw(id,btn){
  var el=document.getElementById(id);
  if(!el) return;
  var show = el.type==='password';
  el.type = show?'text':'password';
  btn.innerHTML = show
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
}

function toggleView(v){ document.getElementById('signin-view').style.display = v==='register'?'none':''; document.getElementById('register-view').style.display = v==='register'?'':'none'; document.getElementById('profile-view').style.display='none'; history.replaceState(null,null,v==='register'?'register.html':'sign-in.html'); }
function showError(view,msg){ var el = document.getElementById(view+'-error'); el.textContent=msg;el.style.display=msg?'block':'none'; }
function setBtnLoading(id,loading){ var btn=document.getElementById(id); if(loading){btn.disabled=true;btn.dataset.orig=btn.textContent;btn.innerHTML='<span class="loading-dots"><span></span><span></span><span></span></span>'} else{btn.disabled=false;btn.textContent=btn.dataset.orig||btn.textContent} }
function saveSession(user){ localStorage.setItem('bd_session',JSON.stringify(user)); localStorage.setItem('bd_user_name',user.name||''); localStorage.setItem('bd_user_email',user.email||''); localStorage.setItem('bd_user_pic',user.picture||''); }
function redirectTarget(){ try { var m = location.search.match(/[?&]redirect=([^&]+)/); if (m) { var url = decodeURIComponent(m[1]); if (url.charAt(0)==='/' && url.indexOf('//')!==0) return url; } } catch(e){} return null; }
function finishLogin(user){ saveSession(user); var to = redirectTarget(); if (to) { location.href = to; return; } showProfile(user); }
function showProfile(user){ document.getElementById('signin-view').style.display='none'; document.getElementById('register-view').style.display='none'; document.getElementById('profile-view').style.display=''; document.getElementById('profile-name').textContent=user.name||'User'; document.getElementById('profile-email').textContent=user.email||''; if(user.picture) document.getElementById('profile-pic').src=user.picture; }
function handleLogout(){ ['bd_session','bd_user_name','bd_user_email','bd_user_pic'].forEach(function(k){try{localStorage.removeItem(k)}catch(e){}}); fetch(API_BASE+'/api/auth',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'signout'})}).then(function(){ location.href='/sign-in.html'; }).catch(function(){ location.href='/sign-in.html'; }); }
function handleSignIn(){
  var email=document.getElementById('signin-email').value.trim();
  var pass=document.getElementById('signin-password').value;
  if(!email||!pass){showError('signin','Please fill in all fields');return}
  showError('signin',''); setBtnLoading('signin-btn',true);
  fetch(API_BASE+'/api/auth',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'signin',email:email,password:pass})})
    .then(function(r){return r.json()}).then(function(d){ setBtnLoading('signin-btn',false); if(d.success){finishLogin(d.user)} else{showError('signin',d.error||'Sign in failed')} }).catch(function(e){setBtnLoading('signin-btn',false);showError('signin','Network error')});
}
function handleRegister(){
  var username=document.getElementById('reg-username').value.trim();
  var email=document.getElementById('reg-email').value.trim();
  var pass=document.getElementById('reg-password').value;
  if(!username||!email||!pass){showError('reg','Please fill in all fields');return}
  if(pass.length<6){showError('reg','Password must be at least 6 characters');return}
  showError('reg',''); setBtnLoading('reg-btn',true);
  fetch(API_BASE+'/api/auth',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'register',username:username,email:email,password:pass})})
    .then(function(r){return r.json()}).then(function(d){ setBtnLoading('reg-btn',false); if(d.success){finishLogin(d.user)} else{showError('reg',d.error||'Registration failed')} }).catch(function(e){setBtnLoading('reg-btn',false);showError('reg','Network error')});
}
function handleGoogleSignIn(){
  setBtnLoading('google-btn-signin',true); setBtnLoading('google-btn-reg',true);
  var authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + 'client_id=' + encodeURIComponent('489382559871-vp4q2enpqf5f8avj8hadjabatn27la7k.apps.googleusercontent.com') + '&redirect_uri=' + encodeURIComponent('https://bargain-drop.online/api/google-callback') + '&response_type=code' + '&scope=' + encodeURIComponent('openid email profile') + '&access_type=offline' + '&prompt=select_account' + '&state=' + encodeURIComponent('https://bargain-drop.online/profile.html');
  window.location.href = authUrl;
}
</script>
<script>
(function(){try{var c=JSON.parse(localStorage.getItem("bd_cart")||"[]"),n=c.reduce(function(s,i){return s+(i.qty||1)},0),b=document.getElementById("nav-cart-count");if(b&&n>0){b.textContent=n;b.style.display=""}}catch(e){}})();
</script>
  <script>try{var c=JSON.parse(localStorage.getItem("bd_cart")||"[]"),n=c.reduce(function(s,i){return s+(i.qty||1)},0),b=document.getElementById("nav-cart-count");if(b&&n>0){b.textContent=n;b.style.display=""}}catch(e){}</script>
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