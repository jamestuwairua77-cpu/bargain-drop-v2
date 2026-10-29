/* Bargain Drop — Global Layout, Product Grid, Supplier Text Containment & Tri-Tone UI Architecture */
:root {
  --bg: #121515;
  --fg: #FFFFFF;
  --surface: #08090A;
  --surface-2: #111827;
  --muted: #DEDEDE;
  --meta: #818181;
  --line: #222425;
  --line-2: #333333;
  --red: #DC2626;
  --red-hover: #FE3442;
  --yellow: #FACC15;
  --midnight: #111827;
  --red-glow: rgba(220, 38, 38, 0.28);
  --paper: #08090A;
  --white: #FFFFFF;
  --black: #000000;
  --gold: #FACC15;
  --accent: #DC2626;
  --radius: 8px;
  --pill: 9999px;
}

*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  background: var(--bg);
  color: var(--fg);
  background-image: radial-gradient(1200px 600px at 50% -10%, rgba(220, 38, 38, 0.14), transparent 70%);
  padding-bottom: 80px;
  -webkit-font-smoothing: antialiased;
  line-height: 1.5;
}

a { color: inherit; text-decoration: none; }
img, video, iframe, table { max-width: 100%; height: auto; }

/* 1. GLOBAL RESPONSIVE CARD & PRODUCT GRID ALIGNMENT */
.product-grid, .related-grid {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 12px !important;
  align-items: stretch !important;
  width: 100% !important;
  max-width: 1200px !important;
  margin-left: auto !important;
  margin-right: auto !important;
  padding: 12px 16px 24px !important;
}

@media (min-width: 640px) {
  .product-grid, .related-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 14px !important;
  }
}

@media (min-width: 1024px) {
  .product-grid, .related-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 16px !important;
  }
}

.product-card {
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
  height: 100% !important;
  min-height: 310px !important;
  background: var(--surface) !important;
  border: 1px solid var(--line) !important;
  border-radius: var(--radius) !important;
  overflow: hidden !important;
  position: relative !important;
}

.prod-img-wrap, .product-card .prod-img {
  position: relative !important;
  width: calc(100% - 20px) !important;
  margin: 0 10px !important;
  aspect-ratio: 1 / 1 !important;
  overflow: hidden !important;
  border-radius: 6px !important;
  background: var(--midnight) !important;
  flex-shrink: 0 !important;
}

.prod-img-wrap img, .product-card > img, .product-card .prod-img img {
  width: 100% !important;
  height: 100% !important;
  aspect-ratio: 1 / 1 !important;
  object-fit: cover !important;
  object-position: center !important;
  display: block !important;
}

.product-info, .prod-info {
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
  flex: 1 1 auto !important;
  padding: 10px 12px !important;
  gap: 6px !important;
}

.product-title, .prod-title {
  font-size: 0.78rem !important;
  font-weight: 700 !important;
  line-height: 1.35 !important;
  min-height: 2.7em !important;
  max-height: 2.7em !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 2 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  word-break: break-word !important;
  color: #FFFFFF !important;
}

.product-price, .prod-price-row {
  margin-top: auto !important;
  display: flex !important;
  align-items: baseline !important;
  gap: 6px !important;
  flex-wrap: wrap !important;
}

/* 2. SUPPLIER TEXT PURIFICATION & DESCRIPTION OVERFLOW CONTAINMENT */
.desc-sect, .desc-body, .desc-overview, .desc-block, .desc-text, #product-desc, #desc-body {
  max-width: 100% !important;
  overflow-x: hidden !important;
  word-break: break-word !important;
  overflow-wrap: anywhere !important;
  box-sizing: border-box !important;
}

.desc-body *, .desc-text *, #product-desc *, #desc-body * {
  max-width: 100% !important;
  box-sizing: border-box !important;
  word-break: break-word !important;
  overflow-wrap: anywhere !important;
}

.desc-body table, .desc-text table, #product-desc table {
  width: 100% !important;
  display: block !important;
  overflow-x: auto !important;
  border-collapse: collapse !important;
}

.desc-body img, .desc-text img, #product-desc img {
  max-width: 100% !important;
  height: auto !important;
  object-fit: contain !important;
  border-radius: 8px !important;
}

/* 3. TOP BAR & NAVIGATION RECONCILIATION */
.top-bar, .navbar, .nb {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 0 16px !important;
  background: rgba(8, 9, 10, 0.96) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border-bottom: 1px solid var(--line) !important;
}

.top-bar {
  padding: 12px 16px !important;
  position: sticky;
  top: 0;
  z-index: 109;
}

.top-bar a {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--fg);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.15s;
}
.top-bar a:hover { color: var(--red); }

.page-header { padding: 18px 16px 10px; max-width: 1200px; margin: 0 auto; }
.page-header h1 { font-size: 1.25rem; font-weight: 900; letter-spacing: -0.02em; color: var(--white); }
.page-header p { font-size: 0.75rem; color: var(--muted); margin-top: 4px; }

.breadcrumb { font-size: 0.7rem; color: var(--muted); margin-bottom: 10px; }
.breadcrumb a { color: var(--red); font-weight: 600; }

.section-title {
  font-size: 0.95rem;
  font-weight: 800;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--white);
  letter-spacing: -0.01em;
}

/* Cards & Lists */
.card-list {
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--line);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}
.list-row, .mi {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  transition: background 0.15s;
}
.list-row:last-child, .mi:last-child { border-bottom: none; }
.list-row:hover, .mi:hover { background: var(--surface-2); }
.mi-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--midnight);
  border: 1px solid rgba(220, 38, 38, 0.45);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.mi-info { flex: 1; min-width: 0; }
.mi-label { font-size: 0.84rem; font-weight: 700; color: var(--white); }
.mi-desc, .mi-sub { font-size: 0.72rem; color: var(--muted); margin-top: 2px; }
.mi-value { font-size: 0.72rem; color: var(--red); font-weight: 600; }
.mi-arrow { color: var(--yellow); font-size: 0.95rem; font-weight: 800; flex-shrink: 0; }

.section { margin-bottom: 16px; padding: 0 16px; max-width: 1200px; margin-left: auto; margin-right: auto; }
.section .section-title { padding: 0; margin-top: 18px; }

/* Buttons */
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 13px 20px;
  border-radius: 8px;
  font-size: 0.84rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
}
.btn-primary {
  background: var(--red);
  color: #FFFFFF;
  box-shadow: 0 4px 14px var(--red-glow);
}
.btn-primary:hover {
  background: var(--red-hover);
  transform: translateY(-1px);
}
.btn-secondary {
  background: var(--surface-2);
  color: #FFFFFF;
  border: 1px solid var(--line-2);
}
.btn-secondary:hover {
  border-color: var(--red);
  color: var(--white);
}
.btn-danger { background: #DC2626; color: #FFFFFF; border: 1px solid #FACC15; }
.btn-block { width: 100%; }

/* Forms */
.form-group { margin-bottom: 14px; }
.form-group label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  margin-bottom: 6px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.form-group input, .form-group select {
  width: 100%;
  padding: 12px 14px;
  background: #111827;
  color: #FFFFFF;
  border: 1.5px solid var(--line);
  border-radius: 8px;
  font-size: 0.82rem;
  outline: none;
  transition: border-color 0.15s;
}
.form-group input:focus, .form-group select:focus {
  border-color: var(--red);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.18);
}

/* Toast */
.toast {
  position: fixed;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: #111827;
  border: 1px solid var(--red);
  color: #FFFFFF;
  padding: 12px 24px;
  border-radius: var(--pill);
  font-size: 0.78rem;
  font-weight: 700;
  opacity: 0;
  transition: all 0.25s;
  z-index: 300;
  pointer-events: none;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.8);
}
.toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}


/* === RESPONSIVE NAVBAR ICON BUTTONS FIT FIX === */
.navbar, .nb, header.navbar {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  min-height: 54px !important;
  padding: 0 10px !important;
  width: 100% !important;
  max-width: 100vw !important;
  box-sizing: border-box !important;
}
.nav-logo, .nlogo {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  min-width: 0 !important;
  flex-shrink: 1 !important;
  margin-right: 6px !important;
}
.nav-logo img, .nlogo img, .nav-logo .logo-svg, .nav-logo .logo-icon, .nlogo .li {
  width: 28px !important;
  height: 28px !important;
  flex-shrink: 0 !important;
}
.nav-logo .logo-text, .nlogo .lt {
  font-size: 0.86rem !important;
  gap: 3px !important;
}
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
}
.nav-btn svg, .nbtn svg, .hamburger-btn svg {
  width: 16px !important;
  height: 16px !important;
}
@media (min-width: 640px) {
  .navbar, .nb, header.navbar {
    padding: 0 16px !important;
  }
  .nav-logo, .nlogo {
    gap: 8px !important;
  }
  .nav-logo img, .nlogo img, .nav-logo .logo-svg, .nav-logo .logo-icon, .nlogo .li {
    width: 34px !important;
    height: 34px !important;
  }
  .nav-logo .logo-text, .nlogo .lt {
    font-size: 1.05rem !important;
    gap: 5px !important;
  }
  .nav-actions, .nact, .na, .nav-right {
    gap: 6px !important;
  }
  .nav-btn, .nbtn, .hamburger-btn {
    width: 36px !important;
    height: 36px !important;
    min-width: 36px !important;
  }
  .nav-btn svg, .nbtn svg, .hamburger-btn svg {
    width: 18px !important;
    height: 18px !important;
  }
}

/* === MODULE 1: FLUID WRAPPERS (320px+) & 44x44px BUTTON INFRASTRUCTURE === */
.bd-container, .container-fluid-safe {
  width: min(100% - 2rem, 1280px);
  margin-inline: auto;
}

@media (min-width: 640px) {
  .bd-container, .container-fluid-safe {
    width: min(100% - 3rem, 1280px);
  }
}

.bd-grid-responsive {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.625rem;
  width: 100%;
}

@media (min-width: 640px) {
  .bd-grid-responsive {
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 1rem;
  }
}

@media (min-width: 1024px) {
  .bd-grid-responsive {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1.25rem;
  }
}

button, a.btn, .bd-btn, .cta-btn, .checkout-btn, .submit-btn {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.bd-btn, a.bd-btn, button.bd-btn, .cta-btn, .checkout-btn, .submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  min-width: 44px;
  max-width: 100%;
  padding: 0.625rem 1.125rem;
  border-radius: var(--radius);
  font-size: clamp(0.8125rem, 1.8vw, 0.9375rem);
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: transform 0.12s ease, background-color 0.15s ease, border-color 0.15s ease;
}

.bd-btn:active:not(:disabled),
.cta-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.bd-btn:focus-visible,
button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--yellow);
  outline-offset: 2px;
}