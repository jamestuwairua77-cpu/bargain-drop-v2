<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bargain Drop — 55 Creative Logos</title>
  <style>
    :root { --bg: #0a0a0f; --card: #121218; --red: #ff1a3c; --yellow: #ffd600; --text: #fff; }
    body { background: var(--bg); color: var(--text); font-family: sans-serif; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { text-align: center; margin-bottom: 40px; border-bottom: 1px solid #333; padding-bottom: 20px; }
    h1 { font-size: 32px; font-weight: 900; margin-bottom: 10px; }
    h1 span { color: var(--red); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
    .logo-card { background: var(--card); border: 2px solid #222; border-radius: 12px; padding: 15px; position: relative; transition: 0.2s; }
    .logo-card:hover { border-color: var(--red); transform: translateY(-3px); }
    .logo-card.active { border-color: var(--yellow); }
    .selected-tag { position: absolute; top: 10px; right: 10px; background: var(--yellow); color: #000; font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 4px; }
    .logo-preview-box { background: #000; border-radius: 8px; padding: 20px; display: flex; justify-content: center; margin-bottom: 12px; }
    .logo-info h3 { font-size: 14px; margin-bottom: 4px; }
    .logo-info p { font-size: 11px; color: #888; margin-bottom: 12px; }
    .btn-apply { width: 100%; background: #222; color: #fff; border: 1px solid #444; padding: 8px; border-radius: 6px; font-weight: 700; cursor: pointer; }
    .btn-apply:hover { background: var(--red); }
  
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
<nav class="navbar">
  <a href="/" class="nav-logo"><img src="/official-logo.jpg" class="logo-icon" style="width:36px;height:36px;border-radius:8px;object-fit:contain;flex-shrink:0;" alt="Bargain Drop Logo"><span class="logo-text"><span class="logo-red">BARGAIN</span> <span class="logo-white">DROP</span></span></a>
  <div class="nav-actions">
    <a href="wishlist.html" class="nav-btn" aria-label="Wishlist">&#9825;<span class="nav-badge" id="wl-badge" style="display:none">0</span></a>
    <a href="cart.html" class="nav-btn" aria-label="Cart">&#128722;<span class="nav-badge" id="nav-cart-badge" style="display:none">0</span></a>
    <a href="profile.html" class="nav-btn" id="nav-user-btn" aria-label="Account">&#128100;</a>
    <button class="nav-btn hamburger-btn" onclick="document.getElementById('slide-menu').classList.add('open')" aria-label="Open menu">&#9776;</button>
  </div>
</nav>

  <div class="container">
    <header>
      <h1>BARGAIN<span>DROP</span> CREATIVE GALLERY</h1>
      <p>55 Custom Variations: White B Outline, Red Outer Tracing, Yellow Arrow</p>
    </header>
    <div class="grid">
      <div class="logo-card active" id="card-opt_official">
        <div class="selected-tag" style="display:block;">Official Logo</div>
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;background:#000;border-radius:8px;overflow:hidden;border:1px solid #fff;">
            <img src="/official-logo.jpg" alt="Official Logo" style="width:100%;height:100%;object-fit:cover;transform:scale(1.1);">
          </div>
        </div>
        <div class="logo-info">
          <h3>Official Store Logo</h3>
          <p>The authentic Bargain Drop "B" with red outline and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt_official', 'Official Store Logo')">Apply Official Logo</button>
      </div>      <div class="logo-card" id="card-opt1">
        <div class="selected-tag">Active</div>
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="13,2 27,2 38,11 38,25 20,38 2,25 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M10 6.5H18.5C22.5 6.5 25 8.8 25 12.2C25 14.8 23 16.6 20.2 17.3C24 18 26 20.6 26 23.8C26 27.8 22.5 30.5 17.5 30.5H10Z" fill="none" stroke="#ff1a3c" stroke-width="9.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6.5H18.5C22.5 6.5 25 8.8 25 12.2C25 14.8 23 16.6 20.2 17.3C24 18 26 20.6 26 23.8C26 27.8 22.5 30.5 17.5 30.5H10Z" fill="none" stroke="#0a0a0f" stroke-width="4.8" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6.5H18.5C22.5 6.5 25 8.8 25 12.2C25 14.8 23 16.6 20.2 17.3C24 18 26 20.6 26 23.8C26 27.8 22.5 30.5 17.5 30.5H10Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 34L14.5 25H17.8V13.5H22.2V25H25.5L20 34Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>1. Classic Curved B Shield</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt1', 'Classic Curved B Shield')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt2">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="13,2 27,2 38,11 38,25 20,38 2,25 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><polygon points="14,4 26,4 36,12 36,24 20,36 4,24 4,12" stroke="#ffffff" stroke-width="1" opacity="0.4" fill="none"/><path d="M9 6.5H20L26 12.5L21 17L27 23L20 30.5H9Z" fill="none" stroke="#ff1a3c" stroke-width="10.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H20L26 12.5L21 17L27 23L20 30.5H9Z" fill="none" stroke="#0a0a0f" stroke-width="5.1" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H20L26 12.5L21 17L27 23L20 30.5H9Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M22 12L14 24H19V36L27 24H22V12Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>2. Sharp Geometric B Octagon</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt2', 'Sharp Geometric B Octagon')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt3">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="18" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M10 6H21C25 6 27 8 27 12C27 14.5 25.5 16.5 23 17.2C26.5 18 28 21 28 24C28 28.5 25 31H10Z" fill="none" stroke="#ff1a3c" stroke-width="10.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6H21C25 6 27 8 27 12C27 14.5 25.5 16.5 23 17.2C26.5 18 28 21 28 24C28 28.5 25 31H10Z" fill="none" stroke="#0a0a0f" stroke-width="5.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6H21C25 6 27 8 27 12C27 14.5 25.5 16.5 23 17.2C26.5 18 28 21 28 24C28 28.5 25 31H10Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 35L17 30H19V12H21V30H23L20 35Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="0.8"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>3. Futuro Tech B Badge</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt3', 'Futuro Tech B Badge')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt4">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,2 38,11 38,29 20,38 2,29 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M12 6.5H22C26 6.5 27 8.5 26 12.2C25 14.8 23 16.6 20 17.3C23.5 18 25 20.6 24 23.8C23 27.8 19.5 30.5 14.5 30.5H9L12 6.5Z" fill="none" stroke="#ff1a3c" stroke-width="9.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6.5H22C26 6.5 27 8.5 26 12.2C25 14.8 23 16.6 20 17.3C23.5 18 25 20.6 24 23.8C23 27.8 19.5 30.5 14.5 30.5H9L12 6.5Z" fill="none" stroke="#0a0a0f" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6.5H22C26 6.5 27 8.5 26 12.2C25 14.8 23 16.6 20 17.3C23.5 18 25 20.6 24 23.8C23 27.8 19.5 30.5 14.5 30.5H9L12 6.5Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 35L14 27H26L20 35ZM20 28L14 20H26L20 28Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="0.8"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>4. Speed Slanted B Crest</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt4', 'Speed Slanted B Crest')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt5">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="34" height="34" rx="8" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M8 6H19C23 6 25 8 25 12.5C25 14.5 23.5 16 21 16.8C24 17.5 26 19.5 26 23.5C26 28 23 31H8V6Z" fill="none" stroke="#ff1a3c" stroke-width="9.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M8 6H19C23 6 25 8 25 12.5C25 14.5 23.5 16 21 16.8C24 17.5 26 19.5 26 23.5C26 28 23 31H8V6Z" fill="none" stroke="#0a0a0f" stroke-width="4.8" stroke-linejoin="round" stroke-linecap="round"/><path d="M8 6H19C23 6 25 8 25 12.5C25 14.5 23.5 16 21 16.8C24 17.5 26 19.5 26 23.5C26 28 23 31H8V6Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 36L12 24H28L20 36Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1.2"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>5. Block Heavy B Frame</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt5', 'Block Heavy B Frame')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt6">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,2 24,10 32,10 28,18 36,24 28,26 30,34 20,30 10,34 12,26 4,24 12,18 8,10 16,10" stroke="#ff1a3c" stroke-width="2" fill="#0a0a0f"/><path d="M12 6H19C22 6 24 8 24 11.5C24 14 22.5 15.8 20.5 16.2C23 16.8 24.5 19 24.5 23C24.5 27.5 22 31H12V6Z" fill="none" stroke="#ff1a3c" stroke-width="10.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6H19C22 6 24 8 24 11.5C24 14 22.5 15.8 20.5 16.2C23 16.8 24.5 19 24.5 23C24.5 27.5 22 31H12V6Z" fill="none" stroke="#0a0a0f" stroke-width="5.1" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6H19C22 6 24 8 24 11.5C24 14 22.5 15.8 20.5 16.2C23 16.8 24.5 19 24.5 23C24.5 27.5 22 31H12V6Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 20L20 28L28 20V14L20 22L12 14V20Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>6. Slim Tall B Spiked</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt6', 'Slim Tall B Spiked')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt7">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 10V5H10 M30 5H35V10 M35 30V35H30 M10 35H5V30" stroke="#ffd600" stroke-width="2" fill="none"/><polygon points="13,2 27,2 38,11 38,25 20,38 2,25 2,11" stroke="#ff1a3c" stroke-width="1.5" fill="#0a0a0f" opacity="0.8"/><path d="M11 6.5H18C22 6.5 25 9.5 25 12.5C25 14.8 23 16.8 20.5 17.2C23.5 17.8 26 20 26 23.5C26 27.5 22.5 30.5 18 30.5H11Z" fill="none" stroke="#ff1a3c" stroke-width="10.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H18C22 6.5 25 9.5 25 12.5C25 14.8 23 16.8 20.5 17.2C23.5 17.8 26 20 26 23.5C26 27.5 22.5 30.5 18 30.5H11Z" fill="none" stroke="#0a0a0f" stroke-width="5.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H18C22 6.5 25 9.5 25 12.5C25 14.8 23 16.8 20.5 17.2C23.5 17.8 26 20 26 23.5C26 27.5 22.5 30.5 18 30.5H11Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M16 12H24V24H28L20 32L12 24H16V12Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>7. Rounded Bubble B Hex</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt7', 'Rounded Bubble B Hex')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt8">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="11,2 29,2 38,11 38,29 29,38 11,38 2,29 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M9 6.5H19C22 6.5 24 8.5 24 12C24 14 22.5 15.5 20 16.5L24.5 17.5C27 18.5 27 21 27 24C27 28.5 24 30.5 19 30.5H9V18L11 17L9 16V6.5Z" fill="none" stroke="#ff1a3c" stroke-width="9.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H19C22 6.5 24 8.5 24 12C24 14 22.5 15.5 20 16.5L24.5 17.5C27 18.5 27 21 27 24C27 28.5 24 30.5 19 30.5H9V18L11 17L9 16V6.5Z" fill="none" stroke="#0a0a0f" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H19C22 6.5 24 8.5 24 12C24 14 22.5 15.5 20 16.5L24.5 17.5C27 18.5 27 21 27 24C27 28.5 24 30.5 19 30.5H9V18L11 17L9 16V6.5Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 34L14.5 25H17.8V13.5H22.2V25H25.5L20 34Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>8. Notched Combat B Square</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt8', 'Notched Combat B Square')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt9">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5V18C5 28 20 36 20 36C20 36 35 28 35 18V5H5Z" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M10 7H20C24 7 26 9 26 12.5C26 14.5 24 16.5 21 17.2C24.5 18 26.5 21 26.5 24.5C26.5 28.5 23.5 30.5 19 30.5H10V24H12V13H10V7Z" fill="none" stroke="#ff1a3c" stroke-width="9.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 7H20C24 7 26 9 26 12.5C26 14.5 24 16.5 21 17.2C24.5 18 26.5 21 26.5 24.5C26.5 28.5 23.5 30.5 19 30.5H10V24H12V13H10V7Z" fill="none" stroke="#0a0a0f" stroke-width="4.8" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 7H20C24 7 26 9 26 12.5C26 14.5 24 16.5 21 17.2C24.5 18 26.5 21 26.5 24.5C26.5 28.5 23.5 30.5 19 30.5H10V24H12V13H10V7Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M22 12L14 24H19V36L27 24H22V12Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>9. Cyber Slit B Diamond</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt9', 'Cyber Slit B Diamond')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt10">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,2 38,20 20,38 2,20" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M7 7H21C26 7 28 9.5 28 13C28 15.5 26 17.5 23 18.2C27 19 29 22 29 25C29 29.5 26 31H7V7Z" fill="none" stroke="#ff1a3c" stroke-width="10.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M7 7H21C26 7 28 9.5 28 13C28 15.5 26 17.5 23 18.2C27 19 29 22 29 25C29 29.5 26 31H7V7Z" fill="none" stroke="#0a0a0f" stroke-width="5.1" stroke-linejoin="round" stroke-linecap="round"/><path d="M7 7H21C26 7 28 9.5 28 13C28 15.5 26 17.5 23 18.2C27 19 29 22 29 25C29 29.5 26 31H7V7Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 35L17 30H19V12H21V30H23L20 35Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="0.8"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>10. Wide Impact B Tech</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt10', 'Wide Impact B Tech')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt11">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="13,2 27,2 38,11 38,25 20,38 2,25 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M11 6.5H17.5C21.5 6.5 24.5 9 24.5 12.5C24.5 15 22.5 16.8 19.5 17.3C23.5 18 25.5 21 25.5 24.5C25.5 28.5 22.5 31H11Z" fill="none" stroke="#ff1a3c" stroke-width="10.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H17.5C21.5 6.5 24.5 9 24.5 12.5C24.5 15 22.5 16.8 19.5 17.3C23.5 18 25.5 21 25.5 24.5C25.5 28.5 22.5 31H11Z" fill="none" stroke="#0a0a0f" stroke-width="5.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H17.5C21.5 6.5 24.5 9 24.5 12.5C24.5 15 22.5 16.8 19.5 17.3C23.5 18 25.5 21 25.5 24.5C25.5 28.5 22.5 31H11Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 35L14 27H26L20 35ZM20 28L14 20H26L20 28Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="0.8"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>11. Organic Fluid B Octagon</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt11', 'Organic Fluid B Octagon')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt12">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="13,2 27,2 38,11 38,25 20,38 2,25 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><polygon points="14,4 26,4 36,12 36,24 20,36 4,24 4,12" stroke="#ffffff" stroke-width="1" opacity="0.4" fill="none"/><path d="M10 6.5H18.5C22.5 6.5 25 8.8 25 12.2C25 14.8 23 16.6 20.2 17.3C24 18 26 20.6 26 23.8C26 27.8 22.5 30.5 17.5 30.5H10Z" fill="none" stroke="#ff1a3c" stroke-width="9.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6.5H18.5C22.5 6.5 25 8.8 25 12.2C25 14.8 23 16.6 20.2 17.3C24 18 26 20.6 26 23.8C26 27.8 22.5 30.5 17.5 30.5H10Z" fill="none" stroke="#0a0a0f" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6.5H18.5C22.5 6.5 25 8.8 25 12.2C25 14.8 23 16.6 20.2 17.3C24 18 26 20.6 26 23.8C26 27.8 22.5 30.5 17.5 30.5H10Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 36L12 24H28L20 36Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1.2"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>12. Classic Radiant Shield</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt12', 'Classic Radiant Shield')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt13">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="18" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M9 6.5H20L26 12.5L21 17L27 23L20 30.5H9Z" fill="none" stroke="#ff1a3c" stroke-width="9.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H20L26 12.5L21 17L27 23L20 30.5H9Z" fill="none" stroke="#0a0a0f" stroke-width="4.8" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H20L26 12.5L21 17L27 23L20 30.5H9Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 20L20 28L28 20V14L20 22L12 14V20Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>13. Sharp Alloy Octagon</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt13', 'Sharp Alloy Octagon')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt14">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,2 38,11 38,29 20,38 2,29 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M10 6H21C25 6 27 8 27 12C27 14.5 25.5 16.5 23 17.2C26.5 18 28 21 28 24C28 28.5 25 31H10Z" fill="none" stroke="#ff1a3c" stroke-width="10.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6H21C25 6 27 8 27 12C27 14.5 25.5 16.5 23 17.2C26.5 18 28 21 28 24C28 28.5 25 31H10Z" fill="none" stroke="#0a0a0f" stroke-width="5.1" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6H21C25 6 27 8 27 12C27 14.5 25.5 16.5 23 17.2C26.5 18 28 21 28 24C28 28.5 25 31H10Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M16 12H24V24H28L20 32L12 24H16V12Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>14. Futuro Neon Badge</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt14', 'Futuro Neon Badge')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt15">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="34" height="34" rx="8" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M12 6.5H22C26 6.5 27 8.5 26 12.2C25 14.8 23 16.6 20 17.3C23.5 18 25 20.6 24 23.8C23 27.8 19.5 30.5 14.5 30.5H9L12 6.5Z" fill="none" stroke="#ff1a3c" stroke-width="10.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6.5H22C26 6.5 27 8.5 26 12.2C25 14.8 23 16.6 20 17.3C23.5 18 25 20.6 24 23.8C23 27.8 19.5 30.5 14.5 30.5H9L12 6.5Z" fill="none" stroke="#0a0a0f" stroke-width="5.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6.5H22C26 6.5 27 8.5 26 12.2C25 14.8 23 16.6 20 17.3C23.5 18 25 20.6 24 23.8C23 27.8 19.5 30.5 14.5 30.5H9L12 6.5Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 34L14.5 25H17.8V13.5H22.2V25H25.5L20 34Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>15. Speed Pulse Crest</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt15', 'Speed Pulse Crest')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt16">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,2 24,10 32,10 28,18 36,24 28,26 30,34 20,30 10,34 12,26 4,24 12,18 8,10 16,10" stroke="#ff1a3c" stroke-width="2" fill="#0a0a0f"/><path d="M8 6H19C23 6 25 8 25 12.5C25 14.5 23.5 16 21 16.8C24 17.5 26 19.5 26 23.5C26 28 23 31H8V6Z" fill="none" stroke="#ff1a3c" stroke-width="9.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M8 6H19C23 6 25 8 25 12.5C25 14.5 23.5 16 21 16.8C24 17.5 26 19.5 26 23.5C26 28 23 31H8V6Z" fill="none" stroke="#0a0a0f" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M8 6H19C23 6 25 8 25 12.5C25 14.5 23.5 16 21 16.8C24 17.5 26 19.5 26 23.5C26 28 23 31H8V6Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M22 12L14 24H19V36L27 24H22V12Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>16. Block Titan Frame</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt16', 'Block Titan Frame')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt17">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 10V5H10 M30 5H35V10 M35 30V35H30 M10 35H5V30" stroke="#ffd600" stroke-width="2" fill="none"/><polygon points="13,2 27,2 38,11 38,25 20,38 2,25 2,11" stroke="#ff1a3c" stroke-width="1.5" fill="#0a0a0f" opacity="0.8"/><path d="M12 6H19C22 6 24 8 24 11.5C24 14 22.5 15.8 20.5 16.2C23 16.8 24.5 19 24.5 23C24.5 27.5 22 31H12V6Z" fill="none" stroke="#ff1a3c" stroke-width="9.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6H19C22 6 24 8 24 11.5C24 14 22.5 15.8 20.5 16.2C23 16.8 24.5 19 24.5 23C24.5 27.5 22 31H12V6Z" fill="none" stroke="#0a0a0f" stroke-width="4.8" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6H19C22 6 24 8 24 11.5C24 14 22.5 15.8 20.5 16.2C23 16.8 24.5 19 24.5 23C24.5 27.5 22 31H12V6Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 35L17 30H19V12H21V30H23L20 35Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="0.8"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>17. Slim Aero Spiked</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt17', 'Slim Aero Spiked')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt18">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="11,2 29,2 38,11 38,29 29,38 11,38 2,29 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M11 6.5H18C22 6.5 25 9.5 25 12.5C25 14.8 23 16.8 20.5 17.2C23.5 17.8 26 20 26 23.5C26 27.5 22.5 30.5 18 30.5H11Z" fill="none" stroke="#ff1a3c" stroke-width="10.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H18C22 6.5 25 9.5 25 12.5C25 14.8 23 16.8 20.5 17.2C23.5 17.8 26 20 26 23.5C26 27.5 22.5 30.5 18 30.5H11Z" fill="none" stroke="#0a0a0f" stroke-width="5.1" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H18C22 6.5 25 9.5 25 12.5C25 14.8 23 16.8 20.5 17.2C23.5 17.8 26 20 26 23.5C26 27.5 22.5 30.5 18 30.5H11Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 35L14 27H26L20 35ZM20 28L14 20H26L20 28Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="0.8"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>18. Rounded Zenith Hex</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt18', 'Rounded Zenith Hex')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt19">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5V18C5 28 20 36 20 36C20 36 35 28 35 18V5H5Z" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M9 6.5H19C22 6.5 24 8.5 24 12C24 14 22.5 15.5 20 16.5L24.5 17.5C27 18.5 27 21 27 24C27 28.5 24 30.5 19 30.5H9V18L11 17L9 16V6.5Z" fill="none" stroke="#ff1a3c" stroke-width="10.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H19C22 6.5 24 8.5 24 12C24 14 22.5 15.5 20 16.5L24.5 17.5C27 18.5 27 21 27 24C27 28.5 24 30.5 19 30.5H9V18L11 17L9 16V6.5Z" fill="none" stroke="#0a0a0f" stroke-width="5.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H19C22 6.5 24 8.5 24 12C24 14 22.5 15.5 20 16.5L24.5 17.5C27 18.5 27 21 27 24C27 28.5 24 30.5 19 30.5H9V18L11 17L9 16V6.5Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 36L12 24H28L20 36Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1.2"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>19. Notched Vengeance Square</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt19', 'Notched Vengeance Square')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt20">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,2 38,20 20,38 2,20" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M10 7H20C24 7 26 9 26 12.5C26 14.5 24 16.5 21 17.2C24.5 18 26.5 21 26.5 24.5C26.5 28.5 23.5 30.5 19 30.5H10V24H12V13H10V7Z" fill="none" stroke="#ff1a3c" stroke-width="9.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 7H20C24 7 26 9 26 12.5C26 14.5 24 16.5 21 17.2C24.5 18 26.5 21 26.5 24.5C26.5 28.5 23.5 30.5 19 30.5H10V24H12V13H10V7Z" fill="none" stroke="#0a0a0f" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 7H20C24 7 26 9 26 12.5C26 14.5 24 16.5 21 17.2C24.5 18 26.5 21 26.5 24.5C26.5 28.5 23.5 30.5 19 30.5H10V24H12V13H10V7Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 20L20 28L28 20V14L20 22L12 14V20Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>20. Cyber Matrix Diamond</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt20', 'Cyber Matrix Diamond')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt21">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="13,2 27,2 38,11 38,25 20,38 2,25 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M7 7H21C26 7 28 9.5 28 13C28 15.5 26 17.5 23 18.2C27 19 29 22 29 25C29 29.5 26 31H7V7Z" fill="none" stroke="#ff1a3c" stroke-width="9.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M7 7H21C26 7 28 9.5 28 13C28 15.5 26 17.5 23 18.2C27 19 29 22 29 25C29 29.5 26 31H7V7Z" fill="none" stroke="#0a0a0f" stroke-width="4.8" stroke-linejoin="round" stroke-linecap="round"/><path d="M7 7H21C26 7 28 9.5 28 13C28 15.5 26 17.5 23 18.2C27 19 29 22 29 25C29 29.5 26 31H7V7Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M16 12H24V24H28L20 32L12 24H16V12Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>21. Wide Overdrive Tech</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt21', 'Wide Overdrive Tech')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt22">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="13,2 27,2 38,11 38,25 20,38 2,25 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><polygon points="14,4 26,4 36,12 36,24 20,36 4,24 4,12" stroke="#ffffff" stroke-width="1" opacity="0.4" fill="none"/><path d="M11 6.5H17.5C21.5 6.5 24.5 9 24.5 12.5C24.5 15 22.5 16.8 19.5 17.3C23.5 18 25.5 21 25.5 24.5C25.5 28.5 22.5 31H11Z" fill="none" stroke="#ff1a3c" stroke-width="10.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H17.5C21.5 6.5 24.5 9 24.5 12.5C24.5 15 22.5 16.8 19.5 17.3C23.5 18 25.5 21 25.5 24.5C25.5 28.5 22.5 31H11Z" fill="none" stroke="#0a0a0f" stroke-width="5.1" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H17.5C21.5 6.5 24.5 9 24.5 12.5C24.5 15 22.5 16.8 19.5 17.3C23.5 18 25.5 21 25.5 24.5C25.5 28.5 22.5 31H11Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 34L14.5 25H17.8V13.5H22.2V25H25.5L20 34Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>22. Organic Flow Octagon</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt22', 'Organic Flow Octagon')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt23">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="18" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M10 6.5H18.5C22.5 6.5 25 8.8 25 12.2C25 14.8 23 16.6 20.2 17.3C24 18 26 20.6 26 23.8C26 27.8 22.5 30.5 17.5 30.5H10Z" fill="none" stroke="#ff1a3c" stroke-width="10.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6.5H18.5C22.5 6.5 25 8.8 25 12.2C25 14.8 23 16.6 20.2 17.3C24 18 26 20.6 26 23.8C26 27.8 22.5 30.5 17.5 30.5H10Z" fill="none" stroke="#0a0a0f" stroke-width="5.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6.5H18.5C22.5 6.5 25 8.8 25 12.2C25 14.8 23 16.6 20.2 17.3C24 18 26 20.6 26 23.8C26 27.8 22.5 30.5 17.5 30.5H10Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M22 12L14 24H19V36L27 24H22V12Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>23. Classic Horizon Shield</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt23', 'Classic Horizon Shield')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt24">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,2 38,11 38,29 20,38 2,29 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M9 6.5H20L26 12.5L21 17L27 23L20 30.5H9Z" fill="none" stroke="#ff1a3c" stroke-width="9.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H20L26 12.5L21 17L27 23L20 30.5H9Z" fill="none" stroke="#0a0a0f" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H20L26 12.5L21 17L27 23L20 30.5H9Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 35L17 30H19V12H21V30H23L20 35Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="0.8"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>24. Sharp Precision Octagon</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt24', 'Sharp Precision Octagon')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt25">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="34" height="34" rx="8" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M10 6H21C25 6 27 8 27 12C27 14.5 25.5 16.5 23 17.2C26.5 18 28 21 28 24C28 28.5 25 31H10Z" fill="none" stroke="#ff1a3c" stroke-width="9.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6H21C25 6 27 8 27 12C27 14.5 25.5 16.5 23 17.2C26.5 18 28 21 28 24C28 28.5 25 31H10Z" fill="none" stroke="#0a0a0f" stroke-width="4.8" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6H21C25 6 27 8 27 12C27 14.5 25.5 16.5 23 17.2C26.5 18 28 21 28 24C28 28.5 25 31H10Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 35L14 27H26L20 35ZM20 28L14 20H26L20 28Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="0.8"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>25. Futuro Digital Badge</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt25', 'Futuro Digital Badge')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt26">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,2 24,10 32,10 28,18 36,24 28,26 30,34 20,30 10,34 12,26 4,24 12,18 8,10 16,10" stroke="#ff1a3c" stroke-width="2" fill="#0a0a0f"/><path d="M12 6.5H22C26 6.5 27 8.5 26 12.2C25 14.8 23 16.6 20 17.3C23.5 18 25 20.6 24 23.8C23 27.8 19.5 30.5 14.5 30.5H9L12 6.5Z" fill="none" stroke="#ff1a3c" stroke-width="10.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6.5H22C26 6.5 27 8.5 26 12.2C25 14.8 23 16.6 20 17.3C23.5 18 25 20.6 24 23.8C23 27.8 19.5 30.5 14.5 30.5H9L12 6.5Z" fill="none" stroke="#0a0a0f" stroke-width="5.1" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6.5H22C26 6.5 27 8.5 26 12.2C25 14.8 23 16.6 20 17.3C23.5 18 25 20.6 24 23.8C23 27.8 19.5 30.5 14.5 30.5H9L12 6.5Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 36L12 24H28L20 36Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1.2"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>26. Speed Velocity Crest</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt26', 'Speed Velocity Crest')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt27">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 10V5H10 M30 5H35V10 M35 30V35H30 M10 35H5V30" stroke="#ffd600" stroke-width="2" fill="none"/><polygon points="13,2 27,2 38,11 38,25 20,38 2,25 2,11" stroke="#ff1a3c" stroke-width="1.5" fill="#0a0a0f" opacity="0.8"/><path d="M8 6H19C23 6 25 8 25 12.5C25 14.5 23.5 16 21 16.8C24 17.5 26 19.5 26 23.5C26 28 23 31H8V6Z" fill="none" stroke="#ff1a3c" stroke-width="10.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M8 6H19C23 6 25 8 25 12.5C25 14.5 23.5 16 21 16.8C24 17.5 26 19.5 26 23.5C26 28 23 31H8V6Z" fill="none" stroke="#0a0a0f" stroke-width="5.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M8 6H19C23 6 25 8 25 12.5C25 14.5 23.5 16 21 16.8C24 17.5 26 19.5 26 23.5C26 28 23 31H8V6Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 20L20 28L28 20V14L20 22L12 14V20Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>27. Block Iron Frame</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt27', 'Block Iron Frame')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt28">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="11,2 29,2 38,11 38,29 29,38 11,38 2,29 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M12 6H19C22 6 24 8 24 11.5C24 14 22.5 15.8 20.5 16.2C23 16.8 24.5 19 24.5 23C24.5 27.5 22 31H12V6Z" fill="none" stroke="#ff1a3c" stroke-width="9.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6H19C22 6 24 8 24 11.5C24 14 22.5 15.8 20.5 16.2C23 16.8 24.5 19 24.5 23C24.5 27.5 22 31H12V6Z" fill="none" stroke="#0a0a0f" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6H19C22 6 24 8 24 11.5C24 14 22.5 15.8 20.5 16.2C23 16.8 24.5 19 24.5 23C24.5 27.5 22 31H12V6Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M16 12H24V24H28L20 32L12 24H16V12Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>28. Slim Raptor Spiked</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt28', 'Slim Raptor Spiked')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt29">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5V18C5 28 20 36 20 36C20 36 35 28 35 18V5H5Z" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M11 6.5H18C22 6.5 25 9.5 25 12.5C25 14.8 23 16.8 20.5 17.2C23.5 17.8 26 20 26 23.5C26 27.5 22.5 30.5 18 30.5H11Z" fill="none" stroke="#ff1a3c" stroke-width="9.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H18C22 6.5 25 9.5 25 12.5C25 14.8 23 16.8 20.5 17.2C23.5 17.8 26 20 26 23.5C26 27.5 22.5 30.5 18 30.5H11Z" fill="none" stroke="#0a0a0f" stroke-width="4.8" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H18C22 6.5 25 9.5 25 12.5C25 14.8 23 16.8 20.5 17.2C23.5 17.8 26 20 26 23.5C26 27.5 22.5 30.5 18 30.5H11Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 34L14.5 25H17.8V13.5H22.2V25H25.5L20 34Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>29. Rounded Orbit Hex</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt29', 'Rounded Orbit Hex')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt30">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,2 38,20 20,38 2,20" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M9 6.5H19C22 6.5 24 8.5 24 12C24 14 22.5 15.5 20 16.5L24.5 17.5C27 18.5 27 21 27 24C27 28.5 24 30.5 19 30.5H9V18L11 17L9 16V6.5Z" fill="none" stroke="#ff1a3c" stroke-width="10.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H19C22 6.5 24 8.5 24 12C24 14 22.5 15.5 20 16.5L24.5 17.5C27 18.5 27 21 27 24C27 28.5 24 30.5 19 30.5H9V18L11 17L9 16V6.5Z" fill="none" stroke="#0a0a0f" stroke-width="5.1" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H19C22 6.5 24 8.5 24 12C24 14 22.5 15.5 20 16.5L24.5 17.5C27 18.5 27 21 27 24C27 28.5 24 30.5 19 30.5H9V18L11 17L9 16V6.5Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M22 12L14 24H19V36L27 24H22V12Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>30. Notched Sentinel Square</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt30', 'Notched Sentinel Square')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt31">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="13,2 27,2 38,11 38,25 20,38 2,25 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M10 7H20C24 7 26 9 26 12.5C26 14.5 24 16.5 21 17.2C24.5 18 26.5 21 26.5 24.5C26.5 28.5 23.5 30.5 19 30.5H10V24H12V13H10V7Z" fill="none" stroke="#ff1a3c" stroke-width="10.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 7H20C24 7 26 9 26 12.5C26 14.5 24 16.5 21 17.2C24.5 18 26.5 21 26.5 24.5C26.5 28.5 23.5 30.5 19 30.5H10V24H12V13H10V7Z" fill="none" stroke="#0a0a0f" stroke-width="5.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 7H20C24 7 26 9 26 12.5C26 14.5 24 16.5 21 17.2C24.5 18 26.5 21 26.5 24.5C26.5 28.5 23.5 30.5 19 30.5H10V24H12V13H10V7Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 35L17 30H19V12H21V30H23L20 35Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="0.8"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>31. Cyber Grid Diamond</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt31', 'Cyber Grid Diamond')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt32">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="13,2 27,2 38,11 38,25 20,38 2,25 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><polygon points="14,4 26,4 36,12 36,24 20,36 4,24 4,12" stroke="#ffffff" stroke-width="1" opacity="0.4" fill="none"/><path d="M7 7H21C26 7 28 9.5 28 13C28 15.5 26 17.5 23 18.2C27 19 29 22 29 25C29 29.5 26 31H7V7Z" fill="none" stroke="#ff1a3c" stroke-width="9.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M7 7H21C26 7 28 9.5 28 13C28 15.5 26 17.5 23 18.2C27 19 29 22 29 25C29 29.5 26 31H7V7Z" fill="none" stroke="#0a0a0f" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M7 7H21C26 7 28 9.5 28 13C28 15.5 26 17.5 23 18.2C27 19 29 22 29 25C29 29.5 26 31H7V7Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 35L14 27H26L20 35ZM20 28L14 20H26L20 28Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="0.8"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>32. Wide Colossus Tech</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt32', 'Wide Colossus Tech')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt33">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="18" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M11 6.5H17.5C21.5 6.5 24.5 9 24.5 12.5C24.5 15 22.5 16.8 19.5 17.3C23.5 18 25.5 21 25.5 24.5C25.5 28.5 22.5 31H11Z" fill="none" stroke="#ff1a3c" stroke-width="9.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H17.5C21.5 6.5 24.5 9 24.5 12.5C24.5 15 22.5 16.8 19.5 17.3C23.5 18 25.5 21 25.5 24.5C25.5 28.5 22.5 31H11Z" fill="none" stroke="#0a0a0f" stroke-width="4.8" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H17.5C21.5 6.5 24.5 9 24.5 12.5C24.5 15 22.5 16.8 19.5 17.3C23.5 18 25.5 21 25.5 24.5C25.5 28.5 22.5 31H11Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 36L12 24H28L20 36Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1.2"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>33. Organic Wave Octagon</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt33', 'Organic Wave Octagon')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt34">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,2 38,11 38,29 20,38 2,29 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M10 6.5H18.5C22.5 6.5 25 8.8 25 12.2C25 14.8 23 16.6 20.2 17.3C24 18 26 20.6 26 23.8C26 27.8 22.5 30.5 17.5 30.5H10Z" fill="none" stroke="#ff1a3c" stroke-width="10.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6.5H18.5C22.5 6.5 25 8.8 25 12.2C25 14.8 23 16.6 20.2 17.3C24 18 26 20.6 26 23.8C26 27.8 22.5 30.5 17.5 30.5H10Z" fill="none" stroke="#0a0a0f" stroke-width="5.1" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6.5H18.5C22.5 6.5 25 8.8 25 12.2C25 14.8 23 16.6 20.2 17.3C24 18 26 20.6 26 23.8C26 27.8 22.5 30.5 17.5 30.5H10Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 20L20 28L28 20V14L20 22L12 14V20Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>34. Classic Eternal Shield</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt34', 'Classic Eternal Shield')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt35">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="34" height="34" rx="8" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M9 6.5H20L26 12.5L21 17L27 23L20 30.5H9Z" fill="none" stroke="#ff1a3c" stroke-width="10.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H20L26 12.5L21 17L27 23L20 30.5H9Z" fill="none" stroke="#0a0a0f" stroke-width="5.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H20L26 12.5L21 17L27 23L20 30.5H9Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M16 12H24V24H28L20 32L12 24H16V12Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>35. Sharp Obsidian Octagon</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt35', 'Sharp Obsidian Octagon')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt36">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,2 24,10 32,10 28,18 36,24 28,26 30,34 20,30 10,34 12,26 4,24 12,18 8,10 16,10" stroke="#ff1a3c" stroke-width="2" fill="#0a0a0f"/><path d="M10 6H21C25 6 27 8 27 12C27 14.5 25.5 16.5 23 17.2C26.5 18 28 21 28 24C28 28.5 25 31H10Z" fill="none" stroke="#ff1a3c" stroke-width="9.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6H21C25 6 27 8 27 12C27 14.5 25.5 16.5 23 17.2C26.5 18 28 21 28 24C28 28.5 25 31H10Z" fill="none" stroke="#0a0a0f" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6H21C25 6 27 8 27 12C27 14.5 25.5 16.5 23 17.2C26.5 18 28 21 28 24C28 28.5 25 31H10Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 34L14.5 25H17.8V13.5H22.2V25H25.5L20 34Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>36. Futuro Genesis Badge</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt36', 'Futuro Genesis Badge')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt37">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 10V5H10 M30 5H35V10 M35 30V35H30 M10 35H5V30" stroke="#ffd600" stroke-width="2" fill="none"/><polygon points="13,2 27,2 38,11 38,25 20,38 2,25 2,11" stroke="#ff1a3c" stroke-width="1.5" fill="#0a0a0f" opacity="0.8"/><path d="M12 6.5H22C26 6.5 27 8.5 26 12.2C25 14.8 23 16.6 20 17.3C23.5 18 25 20.6 24 23.8C23 27.8 19.5 30.5 14.5 30.5H9L12 6.5Z" fill="none" stroke="#ff1a3c" stroke-width="9.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6.5H22C26 6.5 27 8.5 26 12.2C25 14.8 23 16.6 20 17.3C23.5 18 25 20.6 24 23.8C23 27.8 19.5 30.5 14.5 30.5H9L12 6.5Z" fill="none" stroke="#0a0a0f" stroke-width="4.8" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6.5H22C26 6.5 27 8.5 26 12.2C25 14.8 23 16.6 20 17.3C23.5 18 25 20.6 24 23.8C23 27.8 19.5 30.5 14.5 30.5H9L12 6.5Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M22 12L14 24H19V36L27 24H22V12Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>37. Speed Nitro Crest</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt37', 'Speed Nitro Crest')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt38">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="11,2 29,2 38,11 38,29 29,38 11,38 2,29 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M8 6H19C23 6 25 8 25 12.5C25 14.5 23.5 16 21 16.8C24 17.5 26 19.5 26 23.5C26 28 23 31H8V6Z" fill="none" stroke="#ff1a3c" stroke-width="10.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M8 6H19C23 6 25 8 25 12.5C25 14.5 23.5 16 21 16.8C24 17.5 26 19.5 26 23.5C26 28 23 31H8V6Z" fill="none" stroke="#0a0a0f" stroke-width="5.1" stroke-linejoin="round" stroke-linecap="round"/><path d="M8 6H19C23 6 25 8 25 12.5C25 14.5 23.5 16 21 16.8C24 17.5 26 19.5 26 23.5C26 28 23 31H8V6Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 35L17 30H19V12H21V30H23L20 35Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="0.8"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>38. Block Fortress Frame</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt38', 'Block Fortress Frame')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt39">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5V18C5 28 20 36 20 36C20 36 35 28 35 18V5H5Z" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M12 6H19C22 6 24 8 24 11.5C24 14 22.5 15.8 20.5 16.2C23 16.8 24.5 19 24.5 23C24.5 27.5 22 31H12V6Z" fill="none" stroke="#ff1a3c" stroke-width="10.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6H19C22 6 24 8 24 11.5C24 14 22.5 15.8 20.5 16.2C23 16.8 24.5 19 24.5 23C24.5 27.5 22 31H12V6Z" fill="none" stroke="#0a0a0f" stroke-width="5.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6H19C22 6 24 8 24 11.5C24 14 22.5 15.8 20.5 16.2C23 16.8 24.5 19 24.5 23C24.5 27.5 22 31H12V6Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 35L14 27H26L20 35ZM20 28L14 20H26L20 28Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="0.8"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>39. Slim Phantom Spiked</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt39', 'Slim Phantom Spiked')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt40">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,2 38,20 20,38 2,20" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M11 6.5H18C22 6.5 25 9.5 25 12.5C25 14.8 23 16.8 20.5 17.2C23.5 17.8 26 20 26 23.5C26 27.5 22.5 30.5 18 30.5H11Z" fill="none" stroke="#ff1a3c" stroke-width="9.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H18C22 6.5 25 9.5 25 12.5C25 14.8 23 16.8 20.5 17.2C23.5 17.8 26 20 26 23.5C26 27.5 22.5 30.5 18 30.5H11Z" fill="none" stroke="#0a0a0f" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H18C22 6.5 25 9.5 25 12.5C25 14.8 23 16.8 20.5 17.2C23.5 17.8 26 20 26 23.5C26 27.5 22.5 30.5 18 30.5H11Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 36L12 24H28L20 36Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1.2"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>40. Rounded Nebula Hex</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt40', 'Rounded Nebula Hex')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt41">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="13,2 27,2 38,11 38,25 20,38 2,25 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M9 6.5H19C22 6.5 24 8.5 24 12C24 14 22.5 15.5 20 16.5L24.5 17.5C27 18.5 27 21 27 24C27 28.5 24 30.5 19 30.5H9V18L11 17L9 16V6.5Z" fill="none" stroke="#ff1a3c" stroke-width="9.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H19C22 6.5 24 8.5 24 12C24 14 22.5 15.5 20 16.5L24.5 17.5C27 18.5 27 21 27 24C27 28.5 24 30.5 19 30.5H9V18L11 17L9 16V6.5Z" fill="none" stroke="#0a0a0f" stroke-width="4.8" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H19C22 6.5 24 8.5 24 12C24 14 22.5 15.5 20 16.5L24.5 17.5C27 18.5 27 21 27 24C27 28.5 24 30.5 19 30.5H9V18L11 17L9 16V6.5Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 20L20 28L28 20V14L20 22L12 14V20Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>41. Notched Vanguard Square</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt41', 'Notched Vanguard Square')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt42">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="13,2 27,2 38,11 38,25 20,38 2,25 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><polygon points="14,4 26,4 36,12 36,24 20,36 4,24 4,12" stroke="#ffffff" stroke-width="1" opacity="0.4" fill="none"/><path d="M10 7H20C24 7 26 9 26 12.5C26 14.5 24 16.5 21 17.2C24.5 18 26.5 21 26.5 24.5C26.5 28.5 23.5 30.5 19 30.5H10V24H12V13H10V7Z" fill="none" stroke="#ff1a3c" stroke-width="10.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 7H20C24 7 26 9 26 12.5C26 14.5 24 16.5 21 17.2C24.5 18 26.5 21 26.5 24.5C26.5 28.5 23.5 30.5 19 30.5H10V24H12V13H10V7Z" fill="none" stroke="#0a0a0f" stroke-width="5.1" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 7H20C24 7 26 9 26 12.5C26 14.5 24 16.5 21 17.2C24.5 18 26.5 21 26.5 24.5C26.5 28.5 23.5 30.5 19 30.5H10V24H12V13H10V7Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M16 12H24V24H28L20 32L12 24H16V12Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>42. Cyber Void Diamond</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt42', 'Cyber Void Diamond')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt43">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="18" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M7 7H21C26 7 28 9.5 28 13C28 15.5 26 17.5 23 18.2C27 19 29 22 29 25C29 29.5 26 31H7V7Z" fill="none" stroke="#ff1a3c" stroke-width="10.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M7 7H21C26 7 28 9.5 28 13C28 15.5 26 17.5 23 18.2C27 19 29 22 29 25C29 29.5 26 31H7V7Z" fill="none" stroke="#0a0a0f" stroke-width="5.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M7 7H21C26 7 28 9.5 28 13C28 15.5 26 17.5 23 18.2C27 19 29 22 29 25C29 29.5 26 31H7V7Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 34L14.5 25H17.8V13.5H22.2V25H25.5L20 34Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>43. Wide Behemoth Tech</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt43', 'Wide Behemoth Tech')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt44">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,2 38,11 38,29 20,38 2,29 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M11 6.5H17.5C21.5 6.5 24.5 9 24.5 12.5C24.5 15 22.5 16.8 19.5 17.3C23.5 18 25.5 21 25.5 24.5C25.5 28.5 22.5 31H11Z" fill="none" stroke="#ff1a3c" stroke-width="9.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H17.5C21.5 6.5 24.5 9 24.5 12.5C24.5 15 22.5 16.8 19.5 17.3C23.5 18 25.5 21 25.5 24.5C25.5 28.5 22.5 31H11Z" fill="none" stroke="#0a0a0f" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H17.5C21.5 6.5 24.5 9 24.5 12.5C24.5 15 22.5 16.8 19.5 17.3C23.5 18 25.5 21 25.5 24.5C25.5 28.5 22.5 31H11Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M22 12L14 24H19V36L27 24H22V12Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>44. Organic Spirit Octagon</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt44', 'Organic Spirit Octagon')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt45">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="34" height="34" rx="8" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M10 6.5H18.5C22.5 6.5 25 8.8 25 12.2C25 14.8 23 16.6 20.2 17.3C24 18 26 20.6 26 23.8C26 27.8 22.5 30.5 17.5 30.5H10Z" fill="none" stroke="#ff1a3c" stroke-width="9.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6.5H18.5C22.5 6.5 25 8.8 25 12.2C25 14.8 23 16.6 20.2 17.3C24 18 26 20.6 26 23.8C26 27.8 22.5 30.5 17.5 30.5H10Z" fill="none" stroke="#0a0a0f" stroke-width="4.8" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6.5H18.5C22.5 6.5 25 8.8 25 12.2C25 14.8 23 16.6 20.2 17.3C24 18 26 20.6 26 23.8C26 27.8 22.5 30.5 17.5 30.5H10Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 35L17 30H19V12H21V30H23L20 35Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="0.8"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>45. Classic Legend Shield</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt45', 'Classic Legend Shield')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt46">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,2 24,10 32,10 28,18 36,24 28,26 30,34 20,30 10,34 12,26 4,24 12,18 8,10 16,10" stroke="#ff1a3c" stroke-width="2" fill="#0a0a0f"/><path d="M9 6.5H20L26 12.5L21 17L27 23L20 30.5H9Z" fill="none" stroke="#ff1a3c" stroke-width="10.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H20L26 12.5L21 17L27 23L20 30.5H9Z" fill="none" stroke="#0a0a0f" stroke-width="5.1" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H20L26 12.5L21 17L27 23L20 30.5H9Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 35L14 27H26L20 35ZM20 28L14 20H26L20 28Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="0.8"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>46. Sharp Granite Octagon</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt46', 'Sharp Granite Octagon')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt47">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 10V5H10 M30 5H35V10 M35 30V35H30 M10 35H5V30" stroke="#ffd600" stroke-width="2" fill="none"/><polygon points="13,2 27,2 38,11 38,25 20,38 2,25 2,11" stroke="#ff1a3c" stroke-width="1.5" fill="#0a0a0f" opacity="0.8"/><path d="M10 6H21C25 6 27 8 27 12C27 14.5 25.5 16.5 23 17.2C26.5 18 28 21 28 24C28 28.5 25 31H10Z" fill="none" stroke="#ff1a3c" stroke-width="10.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6H21C25 6 27 8 27 12C27 14.5 25.5 16.5 23 17.2C26.5 18 28 21 28 24C28 28.5 25 31H10Z" fill="none" stroke="#0a0a0f" stroke-width="5.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 6H21C25 6 27 8 27 12C27 14.5 25.5 16.5 23 17.2C26.5 18 28 21 28 24C28 28.5 25 31H10Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 36L12 24H28L20 36Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1.2"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>47. Futuro Core Badge</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt47', 'Futuro Core Badge')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt48">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="11,2 29,2 38,11 38,29 29,38 11,38 2,29 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M12 6.5H22C26 6.5 27 8.5 26 12.2C25 14.8 23 16.6 20 17.3C23.5 18 25 20.6 24 23.8C23 27.8 19.5 30.5 14.5 30.5H9L12 6.5Z" fill="none" stroke="#ff1a3c" stroke-width="9.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6.5H22C26 6.5 27 8.5 26 12.2C25 14.8 23 16.6 20 17.3C23.5 18 25 20.6 24 23.8C23 27.8 19.5 30.5 14.5 30.5H9L12 6.5Z" fill="none" stroke="#0a0a0f" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6.5H22C26 6.5 27 8.5 26 12.2C25 14.8 23 16.6 20 17.3C23.5 18 25 20.6 24 23.8C23 27.8 19.5 30.5 14.5 30.5H9L12 6.5Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 20L20 28L28 20V14L20 22L12 14V20Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>48. Speed Mach Crest</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt48', 'Speed Mach Crest')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt49">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5V18C5 28 20 36 20 36C20 36 35 28 35 18V5H5Z" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M8 6H19C23 6 25 8 25 12.5C25 14.5 23.5 16 21 16.8C24 17.5 26 19.5 26 23.5C26 28 23 31H8V6Z" fill="none" stroke="#ff1a3c" stroke-width="9.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M8 6H19C23 6 25 8 25 12.5C25 14.5 23.5 16 21 16.8C24 17.5 26 19.5 26 23.5C26 28 23 31H8V6Z" fill="none" stroke="#0a0a0f" stroke-width="4.8" stroke-linejoin="round" stroke-linecap="round"/><path d="M8 6H19C23 6 25 8 25 12.5C25 14.5 23.5 16 21 16.8C24 17.5 26 19.5 26 23.5C26 28 23 31H8V6Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M16 12H24V24H28L20 32L12 24H16V12Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>49. Block Bastion Frame</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt49', 'Block Bastion Frame')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt50">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,2 38,20 20,38 2,20" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M12 6H19C22 6 24 8 24 11.5C24 14 22.5 15.8 20.5 16.2C23 16.8 24.5 19 24.5 23C24.5 27.5 22 31H12V6Z" fill="none" stroke="#ff1a3c" stroke-width="10.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6H19C22 6 24 8 24 11.5C24 14 22.5 15.8 20.5 16.2C23 16.8 24.5 19 24.5 23C24.5 27.5 22 31H12V6Z" fill="none" stroke="#0a0a0f" stroke-width="5.1" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 6H19C22 6 24 8 24 11.5C24 14 22.5 15.8 20.5 16.2C23 16.8 24.5 19 24.5 23C24.5 27.5 22 31H12V6Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 34L14.5 25H17.8V13.5H22.2V25H25.5L20 34Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>50. Slim Ghost Spiked</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt50', 'Slim Ghost Spiked')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt51">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="13,2 27,2 38,11 38,25 20,38 2,25 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M11 6.5H18C22 6.5 25 9.5 25 12.5C25 14.8 23 16.8 20.5 17.2C23.5 17.8 26 20 26 23.5C26 27.5 22.5 30.5 18 30.5H11Z" fill="none" stroke="#ff1a3c" stroke-width="10.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H18C22 6.5 25 9.5 25 12.5C25 14.8 23 16.8 20.5 17.2C23.5 17.8 26 20 26 23.5C26 27.5 22.5 30.5 18 30.5H11Z" fill="none" stroke="#0a0a0f" stroke-width="5.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H18C22 6.5 25 9.5 25 12.5C25 14.8 23 16.8 20.5 17.2C23.5 17.8 26 20 26 23.5C26 27.5 22.5 30.5 18 30.5H11Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M22 12L14 24H19V36L27 24H22V12Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>51. Rounded Sphere Hex</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt51', 'Rounded Sphere Hex')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt52">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="13,2 27,2 38,11 38,25 20,38 2,25 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><polygon points="14,4 26,4 36,12 36,24 20,36 4,24 4,12" stroke="#ffffff" stroke-width="1" opacity="0.4" fill="none"/><path d="M9 6.5H19C22 6.5 24 8.5 24 12C24 14 22.5 15.5 20 16.5L24.5 17.5C27 18.5 27 21 27 24C27 28.5 24 30.5 19 30.5H9V18L11 17L9 16V6.5Z" fill="none" stroke="#ff1a3c" stroke-width="9.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H19C22 6.5 24 8.5 24 12C24 14 22.5 15.5 20 16.5L24.5 17.5C27 18.5 27 21 27 24C27 28.5 24 30.5 19 30.5H9V18L11 17L9 16V6.5Z" fill="none" stroke="#0a0a0f" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M9 6.5H19C22 6.5 24 8.5 24 12C24 14 22.5 15.5 20 16.5L24.5 17.5C27 18.5 27 21 27 24C27 28.5 24 30.5 19 30.5H9V18L11 17L9 16V6.5Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 35L17 30H19V12H21V30H23L20 35Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="0.8"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>52. Notched Warden Square</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt52', 'Notched Warden Square')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt53">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="18" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M10 7H20C24 7 26 9 26 12.5C26 14.5 24 16.5 21 17.2C24.5 18 26.5 21 26.5 24.5C26.5 28.5 23.5 30.5 19 30.5H10V24H12V13H10V7Z" fill="none" stroke="#ff1a3c" stroke-width="9.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 7H20C24 7 26 9 26 12.5C26 14.5 24 16.5 21 17.2C24.5 18 26.5 21 26.5 24.5C26.5 28.5 23.5 30.5 19 30.5H10V24H12V13H10V7Z" fill="none" stroke="#0a0a0f" stroke-width="4.8" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 7H20C24 7 26 9 26 12.5C26 14.5 24 16.5 21 17.2C24.5 18 26.5 21 26.5 24.5C26.5 28.5 23.5 30.5 19 30.5H10V24H12V13H10V7Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 35L14 27H26L20 35ZM20 28L14 20H26L20 28Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="0.8"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>53. Cyber Prism Diamond</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt53', 'Cyber Prism Diamond')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt54">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="20,2 38,11 38,29 20,38 2,29 2,11" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M7 7H21C26 7 28 9.5 28 13C28 15.5 26 17.5 23 18.2C27 19 29 22 29 25C29 29.5 26 31H7V7Z" fill="none" stroke="#ff1a3c" stroke-width="10.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M7 7H21C26 7 28 9.5 28 13C28 15.5 26 17.5 23 18.2C27 19 29 22 29 25C29 29.5 26 31H7V7Z" fill="none" stroke="#0a0a0f" stroke-width="5.1" stroke-linejoin="round" stroke-linecap="round"/><path d="M7 7H21C26 7 28 9.5 28 13C28 15.5 26 17.5 23 18.2C27 19 29 22 29 25C29 29.5 26 31H7V7Z" fill="none" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 36L12 24H28L20 36Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1.2"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>54. Wide Titan Tech</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt54', 'Wide Titan Tech')">Apply Logo</button>
      </div>

      <div class="logo-card" id="card-opt55">
        
        <div class="logo-preview-box">
          <div style="width:52px;height:52px;"><svg class="logo-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="34" height="34" rx="8" stroke="#ff1a3c" stroke-width="2.5" fill="#0a0a0f"/><path d="M11 6.5H17.5C21.5 6.5 24.5 9 24.5 12.5C24.5 15 22.5 16.8 19.5 17.3C23.5 18 25.5 21 25.5 24.5C25.5 28.5 22.5 31H11Z" fill="none" stroke="#ff1a3c" stroke-width="10.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H17.5C21.5 6.5 24.5 9 24.5 12.5C24.5 15 22.5 16.8 19.5 17.3C23.5 18 25.5 21 25.5 24.5C25.5 28.5 22.5 31H11Z" fill="none" stroke="#0a0a0f" stroke-width="5.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 6.5H17.5C21.5 6.5 24.5 9 24.5 12.5C24.5 15 22.5 16.8 19.5 17.3C23.5 18 25.5 21 25.5 24.5C25.5 28.5 22.5 31H11Z" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M12 20L20 28L28 20V14L20 22L12 14V20Z" fill="#ffd600" stroke="#0a0a0f" stroke-width="1"/></svg></div>
        </div>
        <div class="logo-info">
          <h3>55. Ultimate BD Outlined Logo</h3>
          <p>Creative white B outline, red outer tracing, and yellow arrow.</p>
        </div>
        <button class="btn-apply" onclick="selectLogo('opt55', 'Ultimate BD Outlined Logo')">Apply Logo</button>
      </div></div>
  </div>
  <script src="/store/js/logo-handler.js"></script>
  <script>
    function selectLogo(key) {
      if (window.BargainDropLogoHandler) window.BargainDropLogoHandler.applyLogo(key);
      document.querySelectorAll('.logo-card').forEach(c => c.classList.remove('active'));
      document.getElementById('card-' + key).classList.add('active');
    }
    document.addEventListener('DOMContentLoaded', () => {
      const current = localStorage.getItem('bd_selected_logo') || 'opt1';
      const el = document.getElementById('card-' + current);
      if (el) el.classList.add('active');
    });
  </script>

<script src="js/icon-library.js"></script>
<script src="js/icon-map.js"></script>
<script src="js/nav-icons.js"></script>
<script src="js/slide-icons.js"></script>
</body>
</html>