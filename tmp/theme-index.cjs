const fs = require('fs');

let html = fs.readFileSync('/bargain-drop-repo/index.html', 'utf8');

// Replace CSS styles in index.html
const oldCssStart = '<style>:root{';
const oldCssEnd = '</style>';

const newStyles = `<style>
:root {
  --bg: #0A0A0A;
  --fg: #FFFFFF;
  --surface: #141414;
  --surface-2: #1C1C1C;
  --surface-hover: #222222;
  --muted: #A3A3A3;
  --meta: #737373;
  --line: #262626;
  --line2: #1C1C1C;
  --red: #E50914;
  --red-hover: #FF1E27;
  --red-glow: rgba(229, 9, 20, 0.28);
  --accent: #E50914;
  --gold: #E50914;
  --dark: #0A0A0A;
  --white: #FFFFFF;
  --black: #000000;
  --radius: 14px;
  --pill: 9999px;
  --nav-h: 60px;
  --promo-h: 30px;
}
* { margin:0; padding:0; box-sizing:border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  background: var(--bg);
  color: var(--fg);
  background-image: radial-gradient(1200px 600px at 50% -10%, rgba(229,9,20,0.12), transparent 70%);
  padding-bottom: 88px;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }
img { display: block; max-width: 100%; }

/* Promo Strip */
.promo-strip {
  position: fixed; top: 0; left: 0; right: 0; height: var(--promo-h);
  background: #000000; color: #E5E5E5; display: flex; align-items: center;
  justify-content: center; font-size: 0.65rem; font-weight: 700;
  letter-spacing: 0.4px; z-index: 300; overflow: hidden;
  border-bottom: 1px solid #1F1F1F; padding: 0 16px; white-space: nowrap;
}
.promo-strip b {
  color: var(--red); background: rgba(229,9,20,0.15); padding: 2px 7px;
  border-radius: 4px; border: 1px solid rgba(229,9,20,0.35); font-weight: 800;
}

/* Navbar */
.navbar {
  position: fixed; top: var(--promo-h); left: 0; right: 0; height: var(--nav-h);
  background: rgba(10, 10, 10, 0.96); backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px); display: flex; align-items: center;
  padding: 0 16px; z-index: 299; transition: transform .3s ease, box-shadow .3s ease;
  border-bottom: 1px solid rgba(229, 9, 20, 0.22);
}
.navbar.hidden { transform: translateY(-100%); }
.navbar.scrolled { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6); }

/* Logo & Title */
.nav-logo {
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
  margin-right: auto; text-decoration: none; color: inherit;
}
.logo-icon {
  width: 32px; height: 32px; display: flex; align-items: center;
  justify-content: center; flex-shrink: 0; filter: drop-shadow(0 0 8px rgba(229,9,20,0.35));
}
.logo-text {
  font-size: 0.92rem; font-weight: 900; color: #FFFFFF;
  letter-spacing: -0.3px; text-transform: uppercase; font-family: inherit;
}
.logo-drop {
  color: var(--red); font-weight: 900; text-shadow: 0 0 10px rgba(229,9,20,0.5);
}

.nav-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.nav-btn {
  position: relative; width: 38px; height: 38px; display: flex;
  align-items: center; justify-content: center; border-radius: 10px;
  color: #FFFFFF; transition: all .15s; background: rgba(255,255,255,0.04);
  border: 1px solid #222222; cursor: pointer; text-decoration: none;
}
.nav-btn:hover {
  background: rgba(229,9,20,0.14); border-color: var(--red); color: #FFFFFF;
  transform: translateY(-1px);
}
.nav-badge {
  position: absolute; top: -3px; right: -3px; background: var(--red);
  color: #FFFFFF; font-size: 0.55rem; min-width: 17px; height: 17px;
  border-radius: var(--pill); display: flex; align-items: center;
  justify-content: center; font-weight: 800; padding: 0 4px; border: 1.5px solid #0A0A0A;
}

/* Hero Section */
.hero { position: relative; width: 100%; height: 380px; overflow: hidden; background: #0A0A0A; }
.hero-slide {
  position: absolute; inset: 0; background-size: cover; background-position: center;
  display: flex; align-items: flex-end; padding: 24px 20px 36px; opacity: 0; transition: opacity .8s ease;
}
.hero-slide.active { opacity: 1; }
.hero-content { max-width: 600px; animation: slideUp .6s ease; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.hero-badge {
  display: inline-block; background: var(--red); color: #FFFFFF;
  font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.5px; padding: 4px 12px; border-radius: 6px;
  margin-bottom: 8px; box-shadow: 0 2px 10px rgba(229,9,20,0.4);
}
.hero-content h2 {
  font-size: 1.4rem; font-weight: 900; color: #FFFFFF; line-height: 1.2;
  margin-bottom: 6px; text-shadow: 0 2px 12px rgba(0,0,0,0.8);
}
.hero-price { font-size: 1.1rem; font-weight: 800; color: #FFFFFF; margin-bottom: 12px; }
.hero-cta {
  display: inline-block; background: var(--red); color: #FFFFFF; font-size: 0.8rem;
  font-weight: 800; padding: 11px 26px; border-radius: 8px; transition: all .15s;
  box-shadow: 0 4px 16px var(--red-glow); text-transform: uppercase; letter-spacing: 0.5px;
}
.hero-cta:hover { background: var(--red-hover); transform: translateY(-1px); }
.hero-cta:active { transform: scale(.96); }
.hero-dots { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 10; }
.hero-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.3); border: none; cursor: pointer; transition: all .2s; }
.hero-dot.active { background: var(--red); width: 22px; border-radius: 3px; }

/* Trust Ribbon */
.trust-ribbon {
  display: flex; justify-content: center; gap: 24px; padding: 14px 16px;
  background: #111111; border-bottom: 1px solid #222222; flex-wrap: wrap;
}
.trust-item {
  display: flex; align-items: center; gap: 8px; font-size: 0.72rem;
  font-weight: 700; color: #FFFFFF; letter-spacing: 0.2px;
}
.trust-accent { color: var(--red); font-weight: 800; }

/* Layout & Headings */
.section-wrap { padding: 0 16px; max-width: 1200px; margin: 0 auto; }
.section-title {
  display: flex; align-items: center; justify-content: space-between;
  padding: 24px 0 14px;
}
.section-title h3 {
  font-size: 1.05rem; font-weight: 900; letter-spacing: -0.3px; color: #FFFFFF;
}
.section-title a { font-size: 0.75rem; font-weight: 700; color: var(--red); }
.section-title a:hover { text-decoration: underline; }

/* Category Grid & Cards (Black, Red & White) */
.cat-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding-bottom: 12px;
}
@media (min-width: 600px) { .cat-grid { grid-template-columns: repeat(4, 1fr); } }
@media (min-width: 900px) { .cat-grid { grid-template-columns: repeat(7, 1fr); } }

.cat-card {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  background: #141414; border: 1px solid #262626; border-radius: var(--radius);
  padding: 14px 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  transition: all .2s cubic-bezier(0.16,1,0.3,1); text-align: center; text-decoration: none;
}
.cat-card:hover {
  transform: translateY(-3px); border-color: var(--red);
  box-shadow: 0 8px 24px var(--red-glow); background: #181818;
}
.cat-card:active { transform: scale(.96); }
.cat-card-img-wrap {
  width: 68px; height: 68px; border-radius: 12px; overflow: hidden;
  background: #0A0A0A; flex-shrink: 0; border: 1px solid #2A2A2A;
}
.cat-card-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform .25s ease; }
.cat-card:hover .cat-card-img-wrap img { transform: scale(1.08); }
.cat-card-label {
  font-size: 0.72rem; font-weight: 800; line-height: 1.25; color: #FFFFFF;
  overflow: hidden; text-overflow: ellipsis; display: -webkit-box;
  -webkit-line-clamp: 2; -webkit-box-orient: vertical; min-height: 1.8em;
}
.cat-card-shop {
  font-size: 0.65rem; font-weight: 800; color: var(--red);
  background: rgba(229,9,20,0.12); padding: 2px 8px; border-radius: var(--pill);
}

/* Product Cards (Black, Red & White) */
.product-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding-bottom: 20px;
}
@media (min-width: 768px) { .product-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; } }

.product-card {
  display: block; background: #141414; border: 1px solid #262626;
  border-radius: var(--radius); overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  transition: all .2s cubic-bezier(0.16,1,0.3,1); position: relative; text-decoration: none;
}
.product-card:hover {
  transform: translateY(-3px); border-color: var(--red);
  box-shadow: 0 8px 24px var(--red-glow); background: #181818;
}
.product-card:active { transform: scale(.98); }
.prod-img-wrap { aspect-ratio: 1; overflow: hidden; position: relative; background: #0A0A0A; }
.prod-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .25s ease; }
.product-card:hover .prod-img-wrap img { transform: scale(1.05); }
.prod-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 32px; background: #111111; color: #555; }

.wishlist-btn {
  position: absolute; top: 8px; right: 8px; width: 32px; height: 32px;
  border-radius: 8px; background: rgba(10,10,10,0.85); border: 1px solid #2A2A2A;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  color: #A3A3A3; transition: all .15s; backdrop-filter: blur(4px); z-index: 2;
}
.wishlist-btn:hover, .wishlist-btn.liked { color: var(--red); border-color: var(--red); }
.wishlist-btn.liked path { fill: var(--red); stroke: var(--red); }

.quick-add {
  position: absolute; bottom: 8px; right: 8px; width: 30px; height: 30px;
  border-radius: 8px; background: #000000; border: 1.5px solid #333333;
  color: #FFFFFF; font-size: 1.1rem; font-weight: 800; display: flex;
  align-items: center; justify-content: center; cursor: pointer; opacity: 1;
  z-index: 2; transition: all .2s;
}
.quick-add:hover {
  background: var(--red); border-color: var(--red); color: #FFFFFF;
  transform: scale(1.08); box-shadow: 0 0 12px var(--red-glow);
}

.product-info { padding: 10px 12px; }
.product-stars { font-size: 0.65rem; color: var(--red); margin-bottom: 4px; letter-spacing: 1px; }
.product-title {
  font-size: 0.75rem; font-weight: 700; line-height: 1.35;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; color: #FFFFFF; margin-bottom: 6px;
}
.product-price { font-size: 0.92rem; font-weight: 900; color: var(--red); }
.prod-compare {
  font-size: 0.7rem; color: var(--meta); text-decoration: line-through;
  margin-left: 6px; font-weight: 500;
}

/* Footer (Black, Red & White) */
.site-footer {
  background: #060606; color: rgba(255,255,255,0.7);
  padding: 36px 16px 24px; margin-top: 36px; border-top: 1px solid #1F1F1F;
}
.footer-newsletter { text-align: center; margin: 0 auto 32px; max-width: 440px; }
.footer-newsletter h4 { color: #FFFFFF; font-size: 1.05rem; font-weight: 900; margin-bottom: 4px; }
.footer-newsletter p { font-size: 0.72rem; color: var(--muted); margin-bottom: 14px; }
.newsletter-form { display: flex; gap: 8px; }
.newsletter-form input {
  flex: 1; padding: 12px 16px; border-radius: 8px; border: 1.5px solid #262626;
  font-size: 0.78rem; font-family: inherit; background: #121212; color: #FFFFFF; outline: none;
}
.newsletter-form input:focus { border-color: var(--red); }
.newsletter-form button {
  padding: 12px 22px; border-radius: 8px; border: none; background: var(--red);
  color: #FFFFFF; font-weight: 800; font-size: 0.78rem; cursor: pointer;
  white-space: nowrap; box-shadow: 0 4px 14px var(--red-glow); text-transform: uppercase;
}
.newsletter-form button:hover { background: var(--red-hover); }

.footer-links {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px 16px;
  margin-bottom: 28px; max-width: 520px; margin-left: auto; margin-right: auto;
}
.footer-col h5 {
  color: #FFFFFF; font-size: 0.75rem; font-weight: 800; margin-bottom: 12px;
  text-transform: uppercase; letter-spacing: 0.6px;
}
.footer-col a {
  display: block; font-size: 0.72rem; color: var(--muted); padding: 5px 0; transition: color .15s;
}
.footer-col a:hover { color: var(--red); }
.footer-bottom { border-top: 1px solid #1F1F1F; padding-top: 18px; text-align: center; }
.footer-payments {
  display: flex; justify-content: center; gap: 12px; margin-bottom: 12px;
  font-size: 0.7rem; color: var(--meta);
}
.footer-legal { font-size: 0.65rem; color: var(--meta); }

/* Slide Menu (Black, Red & White) */
.slide-menu { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 500; pointer-events: none; }
.slide-menu.open { pointer-events: auto; }
.slide-backdrop { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); opacity: 0; transition: opacity .25s; }
.slide-menu.open .slide-backdrop { opacity: 1; }
.slide-panel {
  position: absolute; top: 0; right: 0; width: 290px; height: 100%;
  background: #0E0E0E; border-left: 1px solid #222222; padding: 82px 0 20px;
  transform: translateX(100%); transition: transform .25s ease; overflow-y: auto;
  box-shadow: -6px 0 24px rgba(0,0,0,0.8);
}
.slide-menu.open .slide-panel { transform: translateX(0); }
.slide-item {
  display: flex; align-items: center; gap: 12px; padding: 13px 22px;
  font-size: 0.82rem; color: #E5E5E5; text-decoration: none; font-weight: 600;
  transition: all .15s;
}
.slide-item:hover { background: #181818; color: #FFFFFF; }
.slide-ico {
  width: 28px; height: 28px; border-radius: 8px; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
  color: var(--red); background: #181818; border: 1px solid #2A2A2A;
  font-size: 0.65rem; font-weight: 800;
}
.slide-heading {
  font-size: 0.65rem; font-weight: 800; color: var(--meta);
  text-transform: uppercase; letter-spacing: 0.1em; padding: 16px 22px 6px;
}
.slide-divider { height: 1px; background: #1F1F1F; margin: 8px 0; }
.slide-close {
  position: absolute; top: 20px; right: 16px; width: 36px; height: 36px;
  border: none; background: none; font-size: 1.3rem; cursor: pointer; color: #FFFFFF; z-index: 10;
}

/* Search Overlay */
.search-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8); z-index: 400; display: none;
  align-items: flex-start; justify-content: center; padding-top: 100px;
}
.search-overlay.show { display: flex; }
.search-box {
  background: #141414; border: 1.5px solid var(--red); border-radius: 14px;
  padding: 16px; width: 90%; max-width: 500px; box-shadow: 0 8px 32px rgba(0,0,0,0.8);
}
.search-box input {
  width: 100%; padding: 14px 16px; border: 1.5px solid #2A2A2A; border-radius: 10px;
  font-size: 0.9rem; outline: none; font-family: inherit; background: #0A0A0A; color: #FFFFFF;
}
.search-box input:focus { border-color: var(--red); }
.loading-text { text-align: center; padding: 48px; color: var(--meta); grid-column: 1/-1; font-size: 0.85rem; }
.fade-in { animation: fadeIn .35s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>`;

const startIdx = html.indexOf(oldCssStart);
const endIdx = html.indexOf(oldCssEnd, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error("Style block not found!");
  process.exit(1);
}

html = html.slice(0, startIdx) + newStyles + html.slice(endIdx + oldCssEnd.length);

// 2. Custom Logo, Title, and Action Icons in Navbar
const oldNav = `<a href="/" class="nav-logo">        <div class="logo-icon">BD</div>        <div class="logo-text">BARGAIN DROP</div>      </a>`;

const newNav = `<a href="/" class="nav-logo">
        <div class="logo-icon">
          <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
            <rect x="1" y="1" width="30" height="30" rx="8" fill="#0A0A0A" stroke="#E50914" stroke-width="2"/>
            <path d="M8 8h7.5c2.5 0 4.5 1.8 4.5 4.2 0 1.6-.9 3-2.3 3.7 2 .7 3.3 2.3 3.3 4.3 0 2.6-2.2 4.8-4.8 4.8H8V8z" fill="#FFFFFF"/>
            <path d="M12 11.5v3.5h3.2c1.1 0 1.8-.7 1.8-1.7s-.7-1.8-1.8-1.8H12zm0 6.5v4h3.6c1.2 0 2-.8 2-2s-.8-2-2-2H12z" fill="#0A0A0A"/>
            <path d="M18.5 13.5l6.5 6.5-6.5 6.5" stroke="#E50914" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="25" cy="20" r="2" fill="#E50914"/>
          </svg>
        </div>
        <div class="logo-text">BARGAIN <span class="logo-drop">DROP</span></div>
      </a>`;

html = html.replace(oldNav, newNav);

// 3. Custom Navbar SVGs (Search, Wishlist, Cart, Notifications, Hamburger)
const oldActions = `<button class="nav-btn" onclick="ensureFullCatalog();document.getElementById('search-overlay').classList.add('show');document.getElementById('search-input').focus()" aria-label="Search">          <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M21 21l-4.35-4.35" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>        </button>        <a href="wishlist.html" class="nav-btn" aria-label="Wishlist">          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>        </a>        <a href="cart.html" class="nav-btn" aria-label="Cart">          <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1" fill="currentColor"/><circle cx="20" cy="21" r="1" fill="currentColor"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>          <span class="nav-badge" id="nav-cart-count" style="display:none">0</span>        </a>        <a href="notification-center.html" class="nav-btn" aria-label="Notifications">                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>                <span class="nav-badge" id="nav-notif-count" style="display:none">0</span>              </a>        <button class="nav-btn hamburger-btn" onclick="document.getElementById('slide-menu').classList.toggle('open')" aria-label="Menu">          <svg width="20" height="20" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>        </button>`;

const newActions = `<button class="nav-btn" onclick="ensureFullCatalog();document.getElementById('search-overlay').classList.add('show');document.getElementById('search-input').focus()" aria-label="Search" title="Search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="#FFFFFF" stroke-width="2"/>
            <path d="M16.5 16.5L21.5 21.5" stroke="#E50914" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="11" cy="11" r="2" fill="#E50914"/>
          </svg>
        </button>
        <a href="wishlist.html" class="nav-btn" aria-label="Wishlist" title="Wishlist">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="10" r="1.8" fill="#E50914"/>
          </svg>
        </a>
        <a href="cart.html" class="nav-btn" aria-label="Cart" title="Cart">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M2 3h3.5l2.4 11.5a2 2 0 002 1.6h8.8a2 2 0 002-1.6L22 7H6.5" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="10" cy="20" r="1.8" fill="#E50914"/>
            <circle cx="18" cy="20" r="1.8" fill="#E50914"/>
          </svg>
          <span class="nav-badge" id="nav-cart-count" style="display:none">0</span>
        </a>
        <a href="notification-center.html" class="nav-btn" aria-label="Notifications" title="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#E50914" stroke-width="2" stroke-linecap="round"/>
            <circle cx="18" cy="6" r="2" fill="#E50914"/>
          </svg>
          <span class="nav-badge" id="nav-notif-count" style="display:none">0</span>
        </a>
        <button class="nav-btn hamburger-btn" onclick="document.getElementById('slide-menu').classList.toggle('open')" aria-label="Menu" title="Menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <line x1="3" y1="6" x2="21" y2="6" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="3" y1="12" x2="15" y2="12" stroke="#E50914" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="19" cy="12" r="1.8" fill="#E50914"/>
            <line x1="3" y1="18" x2="21" y2="18" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
        </button>`;

if (html.includes(oldActions)) {
  html = html.replace(oldActions, newActions);
}

// 4. Custom Trust Ribbon SVGs in Black, Red & White
const oldTrust = `<section class="trust-ribbon"><div class="trust-item"><svg viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg><span>Free Shipping <span class="trust-accent">A$29+</span></span></div><div class="trust-item"><svg viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><span>SSL Encrypted</span></div><div class="trust-item"><svg viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg><span>Verified Seller</span></div><div class="trust-item"><svg viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg><span>30-Day Returns</span></div></section>`;

const newTrust = `<section class="trust-ribbon">
  <div class="trust-item">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <rect x="1" y="4" width="15" height="12" rx="2" stroke="#FFFFFF" stroke-width="1.8"/>
      <path d="M16 8h4.5l2.5 3.5V16h-7V8z" stroke="#FFFFFF" stroke-width="1.8"/>
      <circle cx="5.5" cy="18.5" r="2.5" stroke="#E50914" stroke-width="2" fill="#0A0A0A"/>
      <circle cx="18.5" cy="18.5" r="2.5" stroke="#E50914" stroke-width="2" fill="#0A0A0A"/>
      <path d="M5 9h6M5 12h4" stroke="#E50914" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <span>Free Shipping <span class="trust-accent">A$29+</span></span>
  </div>
  <div class="trust-item">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <rect x="4" y="10" width="16" height="11" rx="2.5" stroke="#FFFFFF" stroke-width="1.8"/>
      <path d="M7.5 10V6.5a4.5 4.5 0 0 1 9 0V10" stroke="#FFFFFF" stroke-width="1.8"/>
      <circle cx="12" cy="15" r="1.5" fill="#E50914"/>
      <path d="M12 16.5v2" stroke="#E50914" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
    <span>SSL Encrypted</span>
  </div>
  <div class="trust-item">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path d="M12 2l8 3.5v6c0 5-3.5 9.5-8 10.5-4.5-1-8-5.5-8-10.5v-6L12 2z" stroke="#FFFFFF" stroke-width="1.8"/>
      <path d="M9 12l2 2 4-4" stroke="#E50914" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>Verified Seller</span>
  </div>
  <div class="trust-item">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M3 3v5h5" stroke="#E50914" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="12" r="2" fill="#E50914"/>
    </svg>
    <span>30-Day Returns</span>
  </div>
</section>`;

if (html.includes(oldTrust)) {
  html = html.replace(oldTrust, newTrust);
}

fs.writeFileSync('/bargain-drop-repo/index.html', html);
console.log('Successfully applied Black, Red & White theme and custom icons to index.html');
