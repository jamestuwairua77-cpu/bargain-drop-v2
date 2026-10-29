<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<meta name="theme-color" content="#ffffff">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<title>Product — Bargain Drop</title>
<meta name="description" content="">
<meta property="og:title" content="">
<meta property="og:description" content="">
<meta property="og:image" content="">
<meta property="og:type" content="product">
<style>
:root{--bg: #09090b;--fg: #ffffff;--muted: #a1a1aa;--meta: #71717a;--line: rgba(255, 255, 255, 0.25);--line2:#e5e5e5;--accent: #ff1a3c;--accent-soft:#ffeeef;--gold: #ffd600;--gold-dk:#f0a700;--green:#0a8f4f;--dark: #000000;--white: #0e0e14;--pill:999px;--nav-h:52px;--bar-h:72px;--card:#fafafa}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:var(--bg);color:var(--fg);background-image:radial-gradient(1200px 600px at 100% -10%,rgba(230,0,35,.05),transparent 60%),radial-gradient(900px 500px at -10% 12%,rgba(20,20,20,.05),transparent 55%);-webkit-font-smoothing:antialiased;padding-top:var(--nav-h);padding-bottom:var(--bar-h);overflow-x:hidden;line-height:1.5}
a{color:inherit;text-decoration:none}img{max-width:100%;display:block;border:0}button{font-family:inherit;cursor:pointer;background:none;border:none;color:inherit}
svg{display:block}
h1,h2,h3,h4{line-height:1.25}
.navbar{position:fixed;top:0;left:0;right:0;height:var(--nav-h);background: #0e0e14; color: #ffffff;display:flex;align-items:center;padding:0 12px;z-index:300;border-bottom:1px solid var(--line)}
.nav-back{width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;color:var(--fg);flex-shrink:0;border-radius:8px}
.nav-back:hover{background:#f4f4f4}
.nav-logo{display:flex;align-items:center;gap:6px;flex:1;justify-content:center}
.nav-logo .li{width:24px;height:24px;background:var(--dark);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:.55rem;font-weight:900;color:#fff}
.nav-logo .lt{font-size:.85rem;font-weight:800;letter-spacing:-.3px}
.nav-right{display:flex;gap:2px;align-items:center}
.nav-btn{position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:var(--fg);border-radius:8px}
.nav-btn:hover{background:#f4f4f4}
.nav-badge{position:absolute;top:4px;right:4px;background:var(--accent);color:#fff;font-size:.5rem;min-width:15px;height:15px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;padding:0 3px;display:none}
.gallery{position:relative;width:100%;aspect-ratio:1/1;background:#f6f6f6;overflow:hidden}
.gallery img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .3s}
.gallery img.active{opacity:1}
.gallery-dots{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:5px;z-index:5}
.gallery-dots span{width:6px;height:6px;border-radius:50%;background:rgba(0,0,0,.25);cursor:pointer}
.gallery-dots span.active{background:var(--dark);width:16px;border-radius:3px}
.gal-nav{position:absolute;top:50%;transform:translateY(-50%);width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.82);border:none;display:flex;align-items:center;justify-content:center;color:#222;cursor:pointer;z-index:6;box-shadow:0 1px 4px rgba(0,0,0,.15);transition:background .12s,transform .12s}
.gal-nav:active{transform:translateY(-50%) scale(.92)}
.gal-nav svg{width:18px;height:18px}
.gal-prev{left:10px}.gal-next{right:10px}
.pdp{padding:0}
.price-row{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.promo-price{font-size:1.65rem;font-weight:800;letter-spacing:-.5px;color:var(--fg)}
.original-price{font-size:.95rem;color:#bbb;text-decoration:line-through}
.discount-badge{background:var(--accent);color:#fff;font-size:.72rem;font-weight:700;padding:3px 9px;border-radius:var(--pill);line-height:1.3}
.p-title{font-size:1.15rem;font-weight:800;line-height:1.32;margin-top:10px;color:#111;letter-spacing:-.2px}
.rating-line{display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap}
.rating-num{font-weight:800;color:var(--fg);font-size:.95rem}
.stars{display:flex;gap:1px;color:var(--gold)}
.stars svg{width:15px;height:15px}
.rating-count-text{font-size:.78rem;color:var(--muted)}
.sect{margin-top:20px}
.sect-title{display:flex;align-items:center;justify-content:space-between;font-size:.82rem;font-weight:700;color:#444}
.sect-title .val{color:var(--fg);font-weight:800}
.chev{color:var(--muted);font-size:1rem}
.swatch-grid{display:flex;gap:12px;margin-top:12px;flex-wrap:wrap}
.swatch{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer}
.swatch-ring{width:44px;height:44px;border-radius:50%;padding:2.5px;border:1.5px solid var(--line2);transition:border-color .15s,transform .15s}
.swatch-inner{width:100%;height:100%;border-radius:50%;overflow:hidden;border:1px solid rgba(0,0,0,.06)}
.swatch-inner img{width:100%;height:100%;object-fit:cover}
.swatch-label{font-size:.66rem;color:var(--muted);max-width:56px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.swatch:hover .swatch-ring{border-color:#bbb;transform:translateY(-1px)}
.swatch.selected .swatch-ring{border-color:var(--dark)}
.swatch.selected .swatch-label{color:var(--fg);font-weight:700}
.pill-grid{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.pill-btn{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border:1.5px solid var(--line2);border-radius:var(--pill);font-size:.8rem;font-weight:600;background: #0e0e14; color: #ffffff;transition:border-color .12s,background .12s,color .12s}
.pill-btn .dot{width:14px;height:14px;border-radius:50%;border:1px solid rgba(0,0,0,.12);flex-shrink:0}
.pill-btn:hover{border-color:var(--dark)}
.pill-btn.selected{border-color:var(--dark);background:var(--dark);color:#fff}
.pill-btn.selected .dot{border-color:rgba(255,255,255,.4)}
.size-title{display:flex;align-items:center;justify-content:space-between;font-size:.82rem;font-weight:700;color:#444}
.size-links{display:flex;gap:16px;font-size:.72rem;color:var(--muted);font-weight:500}
.size-links a{display:inline-flex;align-items:center;gap:4px}
.size-links a:hover{color:var(--fg)}
.size-links svg{width:13px;height:13px}
.size-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}
.size-cell{position:relative}
.size-btn{width:100%;padding:12px 0;border:1.5px solid var(--line2);border-radius:10px;font-size:.85rem;font-weight:600;text-align:center;transition:all .12s;background:#fff}
.size-btn.selected{border-color:var(--dark);background:var(--dark);color:#fff}
.size-btn:hover:not(.selected):not(.oos){border-color:var(--dark)}
.size-btn.oos{opacity:.35;background:#f5f5f5;cursor:not-allowed;text-decoration:line-through;color:#bbb}
.low-stock-badge{position:absolute;top:-8px;left:50%;transform:translateX(-50%);background: #0e0e14; color: #ffffff;border:1px solid var(--gold);color:#b8860b;font-size:.55rem;font-weight:700;padding:1px 6px;border-radius:var(--pill);white-space:nowrap;z-index:2;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.trust-cards{margin-top:22px;border:1px solid var(--line);border-radius:12px;overflow:hidden}
.trust-item{display:flex;align-items:flex-start;gap:12px;padding:13px 14px;border-bottom:1px solid var(--line);font-size:.8rem}
.trust-item:last-child{border-bottom:0}
.ticon{width:20px;height:20px;flex-shrink:0;color:#555;margin-top:1px}
.ticon svg{width:20px;height:20px}
.tbody{flex:1}.tmain{font-weight:600;color:#222}.tsub{font-size:.72rem;color:var(--muted);margin-top:2px}
.tlink{color:#0a7cff;font-weight:700;cursor:pointer}
.desc-sect{margin-top:22px;border-top:1px solid var(--line);padding-top:18px}
.desc-title{font-size:1rem;font-weight:800;margin-bottom:12px;color:#111}
.desc-overview{font-size:.85rem;line-height:1.7;color:#333;margin-bottom:16px;white-space:pre-line}
.desc-sub-title{font-size:.82rem;font-weight:800;color:#111;margin:18px 0 10px;text-transform:uppercase;letter-spacing:.4px}
.desc-body{font-size:.84rem;line-height:1.65;color:#333;word-break:break-word}
.desc-body h4{font-size:.88rem;font-weight:800;margin:16px 0 8px;color:#111}
.desc-body img{max-width:100%;height:auto;border-radius:8px;margin:8px 0}
.desc-body p{margin:6px 0}
.desc-body b,.desc-body strong{font-weight:700}
.desc-empty{font-size:.8rem;color:var(--meta);font-style:italic}
.desc-hl{margin:6px 0 6px 18px}.desc-hl li{margin:4px 0;line-height:1.5}
.desc-specs{list-style:none;margin:6px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--line);border-radius:10px;overflow:hidden}
.desc-specs li{display:flex;flex-direction:column;gap:3px;padding:12px 13px;border-bottom:1px solid var(--line);border-right:1px solid var(--line);background: #0e0e14; color: #ffffff;transition:background .12s}
.desc-specs li:hover{background:#fafafa}
.desc-specs li:nth-child(even){border-right:0}
.desc-specs li .sk{font-size:.66rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.4px}
.desc-specs li .sv{font-size:.82rem;font-weight:600;color:var(--fg)}
.reviews-section{margin-top:24px;border-top:1px solid var(--line);padding-top:18px}
.reviews-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px}
.reviews-head .rh-title{font-size:1rem;font-weight:800}
.reviews-head .rh-total{font-size:.75rem;color:var(--muted)}
.review-summary{display:flex;align-items:center;gap:14px;padding:14px;background:var(--card);border-radius:12px;border:1px solid var(--line);margin-bottom:14px}
.rs-score{font-size:2.2rem;font-weight:800;line-height:1;letter-spacing:-1px;color:#111}
.rs-right{flex:1;min-width:0}.rs-stars-line{display:flex;align-items:center;gap:6px}
.rs-stars{display:flex;gap:1px;color:var(--gold)}.rs-stars svg{width:15px;height:15px}
.rs-based{font-size:.74rem;color:var(--muted);margin-top:4px}
.dist-bars{display:flex;flex-direction:column;gap:5px;margin-bottom:16px}
.dist-row{display:flex;align-items:center;gap:8px;font-size:.68rem;color:var(--muted)}
.dist-row .dr-lbl{width:34px;text-align:right;font-weight:600}
.dist-row .dr-star{color:var(--gold);width:8px}
.dist-track{flex:1;height:6px;background:#e9e9e9;border-radius:3px;overflow:hidden}
.dist-fill{height:100%;background:var(--gold);border-radius:3px}
.dist-row .dr-cnt{width:22px;text-align:right}
.review-sort{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-bottom:12px}
.review-sort label{font-size:.7rem;color:var(--muted)}
.review-sort select{padding:7px 10px;border:1px solid var(--line2);border-radius:8px;font-size:.78rem;background: #0e0e14; color: #ffffff;color:var(--fg);font-family:inherit}
.review-list{display:flex;flex-direction:column;gap:14px}
.review-card{border-bottom:1px solid var(--line);padding-bottom:14px}
.review-card:last-child{border-bottom:0}
.rc-head{display:flex;align-items:flex-start;gap:10px}
.rc-avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#c7b8ee,#4ecdc4);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.85rem;flex-shrink:0}
.rc-who{flex:1;min-width:0}.rc-name{font-size:.82rem;font-weight:700;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.rc-verified{font-size:.6rem;color:var(--green);background:#e7f6ee;padding:1px 6px;border-radius:4px;font-weight:700}
.rc-stars{color:var(--gold);display:inline-flex;align-items:center;gap:1px;line-height:1;margin-top:3px}
.rc-stars svg{width:13px;height:13px}
.rc-title{font-size:.85rem;font-weight:700;margin:8px 0 4px}
.rc-body{font-size:.8rem;line-height:1.55;color:#333}
.rc-meta{display:flex;align-items:center;gap:14px;margin-top:8px;font-size:.7rem;color:var(--muted)}
.rc-helpful{background:none;border:1px solid var(--line2);padding:5px 12px;border-radius:var(--pill);font-size:.7rem;color:var(--muted);cursor:pointer;transition:all .12s}
.rc-helpful:hover{border-color:var(--dark);color:var(--fg)}
.load-more-btn{width:100%;padding:12px;margin-top:14px;border:1.5px dashed var(--line2);border-radius:10px;background:none;font-size:.8rem;font-weight:600;color:var(--muted);cursor:pointer}
.load-more-btn:hover{border-color:var(--dark);color:var(--fg)}
.review-form{margin-top:20px;border:1px solid var(--line);border-radius:12px;padding:16px;background:var(--card)}
.review-form .rf-title{font-size:.9rem;font-weight:800;margin-bottom:4px;color:#111}
.review-form .rf-subtitle{font-size:.72rem;color:var(--muted);margin-bottom:12px}
.review-form .rf-name{width:100%;padding:10px 12px;border:1.5px solid var(--line2);border-radius:10px;font-family:inherit;font-size:.82rem;outline:none;color:var(--fg);margin-bottom:8px;background:#fff}
.review-form textarea{width:100%;min-height:96px;border:1.5px solid var(--line2);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:.82rem;resize:vertical;outline:none;color:var(--fg);background:#fff}
.review-form .rf-name:focus,.review-form textarea:focus{border-color:var(--dark)}
.review-form .rf-name.locked{background:#f0f5f0;border-color:#cfe5cf;color:#2f6b2f;font-weight:600;cursor:not-allowed}
.review-form .rf-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px}
.review-form .rf-note{font-size:.68rem;color:var(--muted)}
.review-form .rf-submit{background:var(--dark);color:#fff;border:none;border-radius:var(--pill);padding:10px 22px;font-size:.8rem;font-weight:700;cursor:pointer;transition:opacity .15s,transform .1s}
.review-form .rf-submit:hover{opacity:.9}.review-form .rf-submit:active{transform:scale(.98)}
.review-form .rf-submit:disabled{opacity:.5;cursor:not-allowed}
.bottom-bar{position:fixed;bottom:0;left:0;right:0;height:var(--bar-h);background: #0e0e14; color: #ffffff;border-top:1px solid var(--line);display:flex;align-items:center;gap:10px;padding:0 12px;z-index:300;padding-bottom:env(safe-area-inset-bottom,0)}
.wish-btn{width:46px;height:46px;border:1.5px solid var(--line2);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--fg);transition:all .15s}
.wish-btn svg{width:22px;height:22px}.wish-btn:hover{border-color:var(--dark)}
.wish-btn.liked{background:var(--accent-soft);border-color:var(--accent);color:var(--accent)}
.wish-btn.liked svg path{fill:var(--accent)}
.atc-btn{flex:1;height:50px;background:var(--dark);color:#fff;border-radius:var(--pill);font-size:.9rem;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px;letter-spacing:-.2px;transition:background .15s}
.atc-btn:hover{background:#1a1a1a}
.atc-btn .flash{background:var(--accent);color:#fff;font-size:.62rem;font-weight:800;padding:2px 8px;border-radius:4px;animation:pulse 1.4s infinite}
.atc-btn svg{width:18px;height:18px}.atc-btn:disabled{opacity:.5}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}
.toast{position:fixed;bottom:calc(var(--bar-h) + 16px);left:50%;transform:translateX(-50%) translateY(20px);background:rgba(0,0,0,.9);color:#fff;padding:11px 22px;border-radius:var(--pill);font-size:.8rem;font-weight:600;z-index:400;opacity:0;pointer-events:none;transition:all .25s}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.skel{background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);background-size:200% 100%;animation:sh 1.3s infinite;border-radius:4px}
@keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}
.hidden{display:none!important}
@media(min-width:768px){.pdp{max-width:620px;margin:0 auto}.gallery{max-width:620px;margin:0 auto;border-radius:12px}}
@media(min-width:1024px){body{padding-bottom:80px}.bottom-bar{max-width:620px;left:50%;transform:translateX(-50%);border-radius:12px 12px 0 0;box-shadow:0 -4px 20px rgba(0,0,0,.06)}}


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
.search-box{width:min(520px,90vw);background: #0e0e14; color: #ffffff;border-radius:14px;padding:12px;box-shadow:0 12px 40px rgba(0,0,0,.3)}
.search-box input{width:100%;padding:12px 14px;border:2px solid var(--line);border-radius:10px;font-size:.85rem;font-family:inherit;outline:none;color:var(--fg);background:#fff}
.search-box input:focus{border-color:var(--accent)}

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
<script src="/js/currency.js?v=282a4853cc"></script>
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
  <button class="nav-back" onclick="history.back()" aria-label="Back"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
  <a href="/" class="nav-logo" aria-label="Bargain Drop Home" style="display:inline-flex;align-items:center;gap:10px;text-decoration:none;"><img src="data:image/jpeg;base64,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" alt="Bargain Drop Logo" style="width:36px;height:36px;object-fit:contain;border-radius:8px;flex-shrink:0;filter:drop-shadow(0 2px 8px rgba(255,26,60,0.45));" /><div class="logo-text" style="font-size:1.12rem;font-weight:900;letter-spacing:-0.4px;text-transform:uppercase;font-family:system-ui,-apple-system,sans-serif;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;color:#ffffff;"><span style="color:#ff1a3c!important;font-weight:900;">BARGAIN</span> <span style="color:#ffffff!important;font-weight:900;">DROP</span></div></a>
  <div class="nav-right">
    <button class="nav-btn" aria-label="Search" onclick="document.getElementById('search-overlay').classList.add('show');document.getElementById('search-input').focus()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.8"/></svg></button>
    <a href="wishlist.html" class="nav-btn" aria-label="Wishlist"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></a>
    <a href="cart.html" class="nav-btn" aria-label="Cart"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="21" r="1" fill="currentColor"/><circle cx="20" cy="21" r="1" fill="currentColor"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" stroke="currentColor" stroke-width="1.8"/></svg><span class="nav-badge" id="nav-cart-count">0</span></a>
    <a href="notification-center.html" class="nav-btn" aria-label="Notifications"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><span class="nav-badge" id="nav-notif-count" style="display:none">0</span></a>
    <button class="nav-btn hamburger-btn" onclick="document.getElementById('slide-menu').classList.toggle('open')" aria-label="Menu"><svg width="20" height="20" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
  </div>
</nav>
<!-- SEARCH OVERLAY -->
<div class="search-overlay" id="search-overlay" onclick="this.classList.remove('show')"><div class="search-box" onclick="event.stopPropagation()"><input id="search-input" type="text" placeholder="Search products..." onkeydown="if(event.key==='Enter'){location.href='category.html?search='+encodeURIComponent(this.value)}"></div></div>

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


<div class="pdp" id="pdp">
  <div id="loading-skel" style="padding:0 0 16px">
    <div class="gallery" style="aspect-ratio:1/1"></div>
    <div style="padding:16px 16px 0">
      <div class="skel" style="height:30px;width:45%;margin-bottom:10px"></div>
      <div class="skel" style="height:22px;width:80%;margin-bottom:14px"></div>
      <div class="skel" style="height:18px;width:55%"></div>
    </div>
  </div>

  <div id="pdp-content" class="hidden">
    <div class="gallery" id="gallery"><div class="gallery-dots" id="gallery-dots"></div></div>
    <div style="padding:16px 16px 0">
      <h1 class="p-title" id="p-title">Loading…</h1>
      <div class="price-row">
        <span class="promo-price" id="promo-price">AU$--</span>
        <span class="original-price" id="original-price"></span>
        <span class="discount-badge" id="discount-badge"></span>
      </div>
      <div class="rating-line">
        <span class="rating-num" id="rating-num">4.7</span>
        <span class="stars" id="rating-stars"></span>
        <span class="rating-count-text" id="rating-count">Based on 1,428 reviews</span>
      </div>
      <div class="sect" id="color-sect">
        <div class="sect-title"><span>Color: <span class="val" id="color-val"></span></span><span class="chev">›</span></div>
        <div id="color-options"></div>
      </div>
      <div class="sect" id="size-sect">
        <div class="size-title"><span>Size <span class="val" id="size-val">AU</span></span>
          <span class="size-links">
            <a href="javascript:void(0)" id="size-guide-link"><svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18M6 6v12M18 6v12M3 12h18" stroke="currentColor" stroke-width="1.5"/></svg> Size Guide</a>
            <a href="javascript:void(0)" id="check-size-link"><svg viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" stroke-width="1.5"/></svg> Check My Size</a>
          </span>
        </div>
        <div class="size-grid" id="size-grid"></div>
      </div>
      <div class="trust-cards">
        <div class="trust-item">
          <span class="ticon"><svg viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.35-7-10a7 7 0 0114 0c0 5.65-7 10-7 10z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="11" r="2.5" stroke="currentColor" stroke-width="1.6"/></svg></span>
          <div class="tbody"><span class="tmain">Shipping to <span class="tlink" id="ship-country">Australia</span></span></div>
        </div>
        <div class="trust-item">
          <span class="ticon"><svg viewBox="0 0 24 24" fill="none"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="5.5" cy="18.5" r="2" stroke="currentColor" stroke-width="1.6"/><circle cx="18.5" cy="18.5" r="2" stroke="currentColor" stroke-width="1.6"/></svg></span>
          <div class="tbody"><div class="tmain" id="ship-promo">Free Shipping (Orders ≥ A$29)</div><div class="tsub" id="ship-eta">Estimated delivery: --</div></div>
        </div>
        <div class="trust-item">
          <span class="ticon"><svg viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3 8-8M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
          <div class="tbody"><div class="tmain">45-Day Free Returns</div></div>
        </div>
        <div class="trust-item">
          <span class="ticon"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
          <div class="tbody"><div class="tmain">Safe Payments · Privacy Protection</div></div>
        </div>
        <div class="trust-item">
          <span class="ticon"><svg viewBox="0 0 24 24" fill="none"><path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
          <div class="tbody"><div class="tmain">Sold by &amp; Ships from: <span id="merchant-name">—</span></div></div>
        </div>
      </div>
      <div class="desc-sect" id="desc-sect">
        <div class="desc-title">Description</div>
        <div class="desc-body" id="desc-body"></div>
      </div>
      <div class="reviews-section" id="reviews-section">
        <div class="reviews-head">
          <span class="rh-title">Customer Reviews</span>
          <span class="rh-total" id="reviews-total"></span>
        </div>
        <div class="review-summary">
          <div class="rs-score" id="rs-score">4.7</div>
          <div class="rs-right">
            <div class="rs-stars-line"><span class="rs-stars" id="rs-stars"></span><span class="rating-num" style="font-size:.88rem" id="rs-num">4.7</span></div>
            <div class="rs-based" id="rs-based">Based on 1,428 reviews</div>
          </div>
        </div>
        <div class="dist-bars" id="dist-bars"></div>
        <div class="review-sort">
          <label for="review-sort-select">Sort by:</label>
          <select id="review-sort-select">
            <option value="recent">Most recent</option>
            <option value="helpful">Most helpful</option>
            <option value="highest">Highest rated</option>
            <option value="lowest">Lowest rated</option>
          </select>
        </div>
        <div class="review-list" id="review-list"></div>
        <div class="review-form" id="review-form">
          <div class="rf-title">Write a Review</div>
          <div class="rf-subtitle">Share your experience to help other shoppers.</div>
          <input type="text" class="rf-name" id="review-name" placeholder="Your name (optional)" maxlength="60">
          <textarea id="review-input" placeholder="Share your experience with this product…" maxlength="2000"></textarea>
          <div class="rf-actions">
            <span class="rf-note">Reviews are shown after moderation.</span>
            <button class="rf-submit" id="review-submit" onclick="submitReview()">Submit Review</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="bottom-bar" id="bottom-bar" style="display:none">
  <button class="wish-btn" id="wish-btn" onclick="toggleWishlist()" aria-label="Add to wishlist"><svg viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></button>
  <button class="atc-btn" id="atc-btn" onclick="addToCart()">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>
    <span class="flash" id="atc-flash"></span>
    <span id="atc-label">Add to Cart</span>
  </button>
</div>

<div class="toast" id="toast"></div>
<script>
/* ============ LOCALIZATION ============ */
var I18N={currency:'AU$',country:'Australia',freeShipThreshold:29,sizeUnit:'AU',returnDays:45,soldByLabel:'Bargain Drop'};
/* Hardcoded social proof (per spec) — shown for ALL products. */
var SOCIAL={rating:4.7,reviewCount:1428};

/* ============ STATE ============ */
var product=null,categorySlug=null,images=[],curImg=0,selectedOpts={},currentColor='';
var reviewsData=null,shownReviews=5,allReviews=[],reviewSort='recent';
var pid=(new URLSearchParams(location.search)).get('id');

/* ============ HELPERS ============ */
function esc(s){s=String(s==null?'':s);return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function fm(n){try{if(window.BD&&BD.formatMoneyCompact)return BD.formatMoneyCompact(n);}catch(e){}return I18N.currency+Number(n||0).toFixed(2)}
function toast(m){var e=document.getElementById('toast');if(!e)return;e.textContent=m;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(function(){e.classList.remove('show')},2200)}
function seedFromId(s){var h=0;for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);h=((h<<5)-h)+c;h|=0}return Math.abs(h)}
function starIcons(r){var out='';for(var i=1;i<=5;i++){var filled=i<=Math.round(r);out+='<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="'+(filled?'currentColor':'none')+'" stroke="'+(filled?'currentColor':'#d0d0d0')+'" stroke-width="1"/></svg>'}return out}

/* ============ CART BADGE ============ */
function updateCartCount(){var c=[];try{c=JSON.parse(localStorage.getItem('bd_cart')||'[]')}catch(e){}var b=document.getElementById('nav-cart-count'),n=c.reduce(function(s,i){return s+(i.qty||1)},0);if(b){b.textContent=n;b.style.display=n>0?'flex':'none'}}

/* ============ GALLERY ============ */
function buildGallery(imgs){
  images=imgs||[];curImg=0;
  var g=document.getElementById('gallery'),dots=document.getElementById('gallery-dots');
  if(!g)return;
  g.querySelectorAll('img').forEach(function(x){x.remove()});if(dots)dots.innerHTML='';
  if(!images.length){var ph=document.createElement('img');ph.className='active';ph.src="data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#eee"/></svg>');g.appendChild(ph);return}
  images.forEach(function(src,i){var im=document.createElement('img');im.src=src;if(product)im.alt=product.title;if(i===0)im.className='active';im.draggable=false;g.appendChild(im)});
  if(images.length>1&&dots){images.forEach(function(_,i){var d=document.createElement('span');if(i===0)d.className='active';d.onclick=function(){setImage(i)};dots.appendChild(d)})}
  // Arrows (desktop) + tap/left-right halves (mobile)
  var prev=document.createElement('button'),next=document.createElement('button');
  prev.className='gal-nav gal-prev';prev.innerHTML='<svg viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  next.className='gal-nav gal-next';next.innerHTML='<svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  prev.onclick=function(e){e.stopPropagation();if(images.length>1){setImage((curImg-1+images.length)%images.length)}};
  next.onclick=function(e){e.stopPropagation();if(images.length>1){setImage((curImg+1)%images.length)}};
  g.appendChild(prev);g.appendChild(next);
  // Tap left/right halves to navigate
  g.onclick=function(e){if(images.length<=1)return;var r=g.getBoundingClientRect();var x=(e.clientX-r.left)/r.width;if(x<0.35)setImage((curImg-1+images.length)%images.length);else if(x>0.65)setImage((curImg+1)%images.length)};
  // Swipe support
  var sx=0,sy=0;
  g.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
  g.addEventListener('touchend',function(e){if(images.length<=1)return;var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)){if(dx<0)setImage((curImg+1)%images.length);else setImage((curImg-1+images.length)%images.length)}},{passive:true});
}
function setImage(i){curImg=i;document.querySelectorAll('#gallery img').forEach(function(x,j){x.classList.toggle('active',j===i)});document.querySelectorAll('#gallery-dots span').forEach(function(x,j){x.classList.toggle('active',j===i)})}

/* ============ OPTION HELPERS ============ */
var LETTER_SIZES=['XS','S','M','L','XL','XXL','XXXL','2XL','3XL','4XL','5XL','6XL','7XL','8XL','1X','2X','3X','4X','5X'];
function looksLikeSizeVal(v){
  var s=String(v==null?'':v).trim();
  if(!s)return false;
  var u=s.toUpperCase();
  // classic letter sizes
  if(LETTER_SIZES.indexOf(u)>=0)return true;
  if(/^(SM|MED|MEDIUM|LARGE|XLARGE|XXLARGE|ONE SIZE|ONE-SIZE|FREE SIZE|FREE-SIZE|FREESIZE|FITS ALL|O\/S|OS)$/i.test(s))return true;
  // numeric shoe/clothing sizes (34-60) possibly with dot (e.g. 38.5)
  if(/^\d{1,2}(\.\d)?$/.test(s)){var nn=parseFloat(s);return nn>=20&&nn<=60}
  // measurements: 80cm, 13.3inch, 100x50cm, 38cm etc.
  if(/\d+(cm|inch|in|mm|\"|")$/i.test(s)&&(!/oe|or|mm$/i.test(s)||/\d+mm$/i.test(s)))return true;
  // watch band / small variation like "42oe44or45or49mm" NOT a simple size -> skip
  if(/oe| or /i.test(s))return false;
  return false;
}
function isSizeOpt(n,vals){
  var l=(n||'').toLowerCase();
  if(l==='size'||l.indexOf('size')>=0)return true;
  if(!vals||!vals.length)return false;
  var hits=0,total=vals.length;
  for(var i=0;i<vals.length;i++){if(looksLikeSizeVal(vals[i]))hits++}
  return hits>=Math.max(2,Math.min(total,2))&&hits>=Math.ceil(total*0.6);
}
function isColorOpt(n){var l=(n||'').toLowerCase();return l==='color'||l==='colour'||l.indexOf('color')>=0}
function getNameOfColorOpt(){var opts=product?product.options||[]:[];for(var i=0;i<opts.length;i++){if(isColorOpt(opts[i].name||'')||i===0)return opts[i].name}return 'Color'}
function getSizeOptName(){var opts=product?product.options||[]:[];for(var i=0;i<opts.length;i++){if(isSizeOpt(opts[i].name||'',opts[i].values))return opts[i].name}return 'Size'}

/* ============ COLOR MAP (name -> hex for swatches) ============ */
var COLOR_HEX={black:'#111111',white:'#ffffff',grey:'#9e9e9e',gray:'#9e9e9e',red:'#d32f2f',blue:'#1976d2',green:'#388e3c',yellow:'#fbc02d',orange:'#f57c00',pink:'#ec407a',purple:'#7b1fa2',brown:'#6d4c41',beige:'#d7ccc8',navy:'#1a237e',gold:'#c9a227',silver:'#bdbdbd',khaki:'#8d8b6f',maroon:'#800000',teal:'#008080',cream:'#f5f0df',ivory:'#fffff0',tan:'#d2b48c',charcoal:'#36454f',olive:'#808000',coral:'#ff7f50',burgundy:'#800020',lavender:'#e6e6fa',mint:'#98ff98',skin:'#f4c6a3',nude:'#eac7a8','multi':'#c8c8c8',multicolor:'#c8c8c8',multicolour:'#c8c8c8','wine red':'#722f37','dark blue':'#0d1b4c','light blue':'#add8e6','dark green':'#006400','light green':'#90ee90','royal blue':'#4169e1','sky blue':'#87ceeb','hot pink':'#ff69b4','rose red':'#c21e56','rose gold':'#b76e79','champagne':'#f7e7ce','coffee':'#6f4e37','chocolate':'#7b3f00','apricot':'#fbceb1','khaki green':'#8a864e','army green':'#4b5320','forest green':'#228b22','emerald green':'#50c878','midnight blue':'#191970','wine':'#722f37'};
var CMYK_FALLBACK={'wood color':'#b08968','walnut color':'#6d4c41','wood':'#b08968','walnut':'#6d4c41','dark wood':'#5c4033','light wood':'#c9a26e','maple':'#d9b382','oak':'#c8a56a','redwood':'#a45a52'};
function colorToHex(name){
  var n=String(name||'').toLowerCase().trim().replace(/\s+/g,' ');
  if(COLOR_HEX[n])return COLOR_HEX[n];
  if(CMYK_FALLBACK[n])return CMYK_FALLBACK[n];
  // try stripping common filler words to find a base colour
  var parts=n.split(/[\/,\s]+/);
  for(var i=0;i<parts.length;i++){
    var w=parts[i];
    if(COLOR_HEX[w])return COLOR_HEX[w];
  }
  // match trailing color word in phrases like "Purple electroplated white"
  var m=n.match(/\b(black|white|grey|gray|red|blue|green|yellow|orange|pink|purple|brown|beige|navy|gold|silver|khaki|maroon|teal|cream|ivory|tan|charcoal|olive|coral|burgundy|lavender|mint|nude|apricot)\b/);
  if(m&&COLOR_HEX[m[1]])return COLOR_HEX[m[1]];
  // deterministic hue from name hash for truly unknown colors
  var h=seedFromId(n)%360;
  return 'hsl('+h+',55%,62%)';
}

/* ============ RENDER COLORS ============ */
function looksLikeColorName(name){
  var n=String(name||'').toLowerCase().trim();
  if(COLOR_HEX[n]||CMYK_FALLBACK[n])return true;
  // phrase that clearly mentions a base colour word
  if(/\b(black|white|grey|gray|red|blue|green|yellow|orange|pink|purple|brown|beige|navy|gold|silver|khaki|maroon|teal|cream|ivory|tan|charcoal|olive|coral|burgundy|lavender|mint|nude|apricot|rose|wood|walnut|maple|oak|wine|coffee|chocolate|skin)\b/.test(n))return true;
  return false;
}
function renderColors(){
  var c=document.getElementById('color-sect'),box=document.getElementById('color-options');
  if(!c||!box)return;
  var vals=[],seen={};
  (product?product.variants||[]:[]).forEach(function(v){if(v.option1&&!seen[v.option1]){seen[v.option1]=true;vals.push(v.option1)}});
  if(!vals.length){c.classList.add('hidden');return;}
  if(!currentColor||vals.indexOf(currentColor)<0)currentColor=vals[0];
  if(vals.length<=1){c.classList.add('hidden');return;}
  c.classList.remove('hidden');

  var colorLike=0;vals.forEach(function(x){if(looksLikeColorName(x))colorLike++});
  var isSwatch = colorLike >= Math.ceil(vals.length * 0.4);

  var imgByColor={};
  (product?product.variants||[]:[]).forEach(function(v){
    if(v.option1&&!imgByColor[v.option1]){
      var im=null;
      if(v.image_id!=null&&images[v.image_id])im=images[v.image_id];
      else if(v.image&&String(v.image).length>4)im=v.image;
      if(im)imgByColor[v.option1]=im;
    }
  });
  vals.forEach(function(name,i){
    if(!imgByColor[name]&&images[i])imgByColor[name]=images[i];
  });
  var imgIdxByColor={};
  vals.forEach(function(name){var u=imgByColor[name];if(u){var j=images.indexOf(u);if(j>=0)imgIdxByColor[name]=j;}});
  window.__colorImg=imgByColor;

  box.innerHTML='';
  var wrap=document.createElement('div');wrap.className='swatch-grid';
  vals.forEach(function(name){
    var sw=document.createElement('div');
    sw.className='swatch'+(name===currentColor?' selected':'');
    var hex=colorToHex(name);
    var img=imgByColor[name];
    var inner;
    if(img){inner='<div class="swatch-inner"><img src="'+esc(img)+'" alt="'+esc(name)+'"></div>'}
    else if(isSwatch){inner='<div class="swatch-inner" style="background:'+hex+'"></div>'}
    else{inner='<div class="swatch-inner" style="background:#f0eeff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#333">'+esc(name).substring(0,3)+'</div>'}
    sw.innerHTML='<div class="swatch-ring">'+inner+'</div><span class="swatch-label">'+esc(name)+'</span>';
    sw.onclick=function(){
      currentColor=name;selectedOpts[getNameOfColorOpt()]=name;
      renderColors();updatePricing();
      var idx=imgIdxByColor[name];
      if(idx==null)idx=images.indexOf(imgByColor[name]);
      if(idx>=0)setImage(idx);
    };
    wrap.appendChild(sw);
  });
  box.appendChild(wrap);
  var cv=document.getElementById('color-val');if(cv)cv.textContent=currentColor;
}
/* ============ SIZES ============ */
var SIZE_ORDER=['XS','S','M','L','XL','XXL','XXXL','2XL','3XL','4XL','5XL','6XL','7XL','8XL','1X','2X','3X','4X','5X','FREE SIZE','ONE SIZE'];
function sizeSortKey(a){
  var s=String(a==null?'':a).trim();var u=s.toUpperCase();
  var li=SIZE_ORDER.indexOf(u);if(li>=0)return li;
  // numeric sizes sort by number
  if(/^\d+(\.\d+)?$/.test(s))return 100+parseFloat(s);
  // measurements sort by leading number
  var m=s.match(/^(\d+(\.\d+)?)/);if(m)return 200+parseFloat(m[1]);
  return 500; // unknown / free-size at end
}
function getSizeVals(){
  var opts=product?product.options||[]:[];var out=[];
  opts.forEach(function(o){if(isSizeOpt(o.name||'',o.values)){o.values.forEach(function(v){if(looksLikeSizeVal(v)&&out.indexOf(v)<0)out.push(v)})}});
  // fallback: collect plausible size values from option2/option3
  if(!out.length){
    var seen={};
    (product?product.variants||[]:[]).forEach(function(v){
      [v.option2,v.option3].forEach(function(val){
        if(val&&!seen[val]&&looksLikeSizeVal(val)){seen[val]=true;out.push(val)}
      });
    });
  }
  out.sort(function(a,b){return sizeSortKey(a)-sizeSortKey(b)||String(a).localeCompare(String(b))});
  return out;
}
function sizeAvailable(sizeVal){
  var vs=product?product.variants||[]:[];
  if(vs.length){
    var matches=vs.filter(function(v){return v.option2===sizeVal||v.option1===sizeVal});
    if(matches.length&&matches.every(function(v){return v.available===false})){
      var anyAvail=vs.some(function(v){return v.available!==false});
      return anyAvail?false:true;
    }
  }
  return true;
}
function renderSizes(){
  var sec=document.getElementById('size-sect'),grid=document.getElementById('size-grid');
  if(!sec||!grid)return;
  var vals=getSizeVals();
  if(!vals.length){sec.classList.add('hidden');return}
  sec.classList.remove('hidden');
  grid.innerHTML='';
  vals.forEach(function(size){
    var avail=sizeAvailable(size);
    var cell=document.createElement('div');cell.className='size-cell';
    var btn=document.createElement('button');
    btn.className='size-btn'+(selectedOpts[getSizeOptName()]===size?' selected':'')+(avail?'':' oos');
    btn.textContent=size;
    if(avail){btn.onclick=function(){selectedOpts[getSizeOptName()]=size;renderSizes();updatePricing()}}
    cell.appendChild(btn);grid.appendChild(cell);
  });
}

/* ============ PRICING ============ */
function updatePricing(){
  if(!product)return;
  var selCol = currentColor;
  var selSz = selectedOpts[getSizeOptName()];
  var vs = product.variants || [];
  var match = null;
  for (var i = 0; i < vs.length; i++) {
    var v = vs[i];
    var cMatch = !selCol || v.option1 === selCol;
    var sMatch = !selSz || v.option2 === selSz || v.option1 === selSz;
    if (cMatch && sMatch) { match = v; break; }
  }
  if (!match && vs.length) match = vs[0];
  var base = match && Number(match.price) ? Number(match.price) : Number(product.price || 0);
  var comp = match && Number(match.compare_at_price) ? Number(match.compare_at_price) : Number(product.compare_at_price || (base * 1.45).toFixed(2));

  var promoEl = document.getElementById('promo-price');
  if (promoEl) promoEl.textContent = fm(base);

  var origEl = document.getElementById('original-price');
  if (origEl) {
    origEl.textContent = comp > base ? fm(comp) : '';
  }

  var discEl = document.getElementById('discount-badge');
  if (discEl) {
    if (comp > base) {
      var pct = Math.round(((comp - base) / comp) * 100);
      discEl.textContent = 'SAVE ' + pct + '%';
      discEl.style.display = 'inline-block';
    } else {
      discEl.style.display = 'none';
    }
  }

  var sp=document.getElementById('ship-promo');if(sp)sp.textContent='Free Shipping (Orders ≥ '+fm(I18N.freeShipThreshold)+')';
  var sc=document.getElementById('ship-country');if(sc)sc.textContent=I18N.country;
  var de=new Date();de.setDate(de.getDate()+7);var de2=new Date(de);de2.setDate(de.getDate()+12);
  var se=document.getElementById('ship-eta');if(se)se.textContent='Estimated delivery: '+de.toLocaleDateString('en-US',{month:'short',day:'numeric'})+' – '+de2.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  var mn=document.getElementById('merchant-name');if(mn)mn.textContent=I18N.soldByLabel;
}
/* Re-render price after currency auto-detection resolves (geo-based) */
(function initCurrencyRefresh(){
  if(!window.BD||!BD.initCurrency)return;
  BD.initCurrency().then(function(){
    try{ if(typeof updatePricing==='function')updatePricing(); }catch(e){}
  });
})();

/* ============ SOCIAL PROOF (hardcoded 4.7 / 1,428) ============ */
function renderSocial(){
  var avg=SOCIAL.rating,count=SOCIAL.reviewCount;
  var num=document.getElementById('rating-num');if(num)num.textContent=avg.toFixed(1);
  var stars=document.getElementById('rating-stars');if(stars)stars.innerHTML=starIcons(avg);
  var cnt=document.getElementById('rating-count');if(cnt)cnt.textContent='Based on '+count.toLocaleString()+' reviews';
  var rs=document.getElementById('rs-score');if(rs)rs.textContent=avg.toFixed(1);
  var rsNum=document.getElementById('rs-num');if(rsNum)rsNum.textContent=avg.toFixed(1);
  var rsStars=document.getElementById('rs-stars');if(rsStars)rsStars.innerHTML=starIcons(avg);
  var rsBased=document.getElementById('rs-based');if(rsBased)rsBased.textContent='Based on '+count.toLocaleString()+' reviews';
  var rt=document.getElementById('reviews-total');if(rt)rt.textContent=avg.toFixed(1)+' out of 5 · '+count.toLocaleString()+' reviews';
  // Deterministic distribution that sums to reviewCount and averages ~4.7
  var dist={5:0,4:0,3:0,2:0,1:0};
  dist[5]=Math.round(count*0.72);dist[4]=Math.round(count*0.22);dist[3]=Math.round(count*0.04);dist[2]=Math.round(count*0.01);dist[1]=count-dist[5]-dist[4]-dist[3]-dist[2];
  var db=document.getElementById('dist-bars');
  if(db){var h='';for(var s=5;s>=1;s--){var c=dist[s],pct=count?Math.round(c/count*100):0;h+='<div class="dist-row"><span class="dr-lbl">'+s+'</span><span class="dr-star">★</span><div class="dist-track"><div class="dist-fill" style="width:'+pct+'%"></div></div><span class="dr-cnt">'+c+'</span></div>'};db.innerHTML=h}
}

/* ============ REVIEWS ============ */
function renderReviews(){
  var list=document.getElementById('review-list');if(!list)return;
  var rv=window.reviewsData;
  if(rv&&rv.reviews&&rv.reviews.length){allReviews=rv.reviews.slice()}
  if(!allReviews.length){
    list.innerHTML='<div class="review-card"><div class="rc-body" style="color:#8a8a8a;font-style:italic">No written reviews yet — be the first to share your experience.</div></div>';
    return;
  }
  var sorted=allReviews.slice();
  if(reviewSort==='highest')sorted.sort(function(a,b){return (b.rating||0)-(a.rating||0)});
  else if(reviewSort==='lowest')sorted.sort(function(a,b){return (a.rating||0)-(b.rating||0)});
  else if(reviewSort==='recent')sorted.reverse();
  var shown=sorted.slice(0,shownReviews);
  function randDate(r){var h=seedFromId((r.name||'')+(r.body||''));var days=3+(h%60);var d=new Date();d.setDate(d.getDate()-days);return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
  var hh='';
  shown.forEach(function(r){
    hh+='<div class="review-card"><div class="rc-head"><span class="rc-avatar">'+esc((r.name||'A').charAt(0).toUpperCase())+'</span><div class="rc-who"><div class="rc-name">'+esc(r.name||'Anonymous')+'<span class="rc-verified">✓ Verified</span></div><div class="rc-stars">'+starIcons(r.rating||5)+'</div></div></div>';
    if(r.title)hh+='<div class="rc-title">'+esc(r.title)+'</div>';
    if(r.body)hh+='<div class="rc-body">'+esc(r.body)+'</div>';
    hh+='<div class="rc-meta"><span>'+randDate(r)+'</span><span>Verified purchase</span></div></div>';
  });
  list.innerHTML=hh;
  if(sorted.length>shownReviews){
    list.innerHTML+='<button class="load-more-btn" onclick="shownReviews+=5;renderReviews()">Load more reviews ('+(sorted.length-shown)+' remaining)</button>';
  }
}
function onSortChange(){var s=document.getElementById('review-sort-select');if(s)reviewSort=s.value;renderReviews()}

/* ============ REVIEWER NAME (signed-in users) ============ */
function currentUser(){
  try { var sess = JSON.parse(localStorage.getItem('bd_session')||'null'); if (sess && sess.email) return sess; } catch(e){}
  var email = localStorage.getItem('bd_user_email');
  var name = localStorage.getItem('bd_user_name');
  if (email) return { email: email, name: name||'', username: localStorage.getItem('bd_user_username')||null };
  return null;
}
function prefilledReviewerName(){
  var u = currentUser();
  if (!u) return null;
  // Prefer username, then name, then email prefix.
  if (u.username) return '@' + u.username;
  if (u.name) return u.name;
  if (u.email) return u.email.split('@')[0];
  return null;
}
function setupReviewName(){
  var nm = document.getElementById('review-name');
  if (!nm) return;
  var fixed = prefilledReviewerName();
  if (fixed) {
    nm.value = fixed;
    nm.readOnly = true;
    nm.disabled = true;
    nm.placeholder = '';
    nm.title = 'Signed in as ' + fixed;
    nm.classList.add('locked');
  }
}

/* ============ SUBMIT REVIEW ============ */
function submitReview(){
  var ta=document.getElementById('review-input');var btn=document.getElementById('review-submit');var nm=document.getElementById('review-name');
  if(!ta||!btn)return;
  var txt=(ta.value||'').trim();
  if(txt.length<10){toast('Please write a few words first');ta.focus();return}
  var name=(nm&&nm.value?nm.value.trim():'You');
  var mine=[];try{mine=JSON.parse(localStorage.getItem('bd_user_reviews')||'[]')}catch(e){}
  mine.push({pid:String(pid||''),name:name,title:(product?product.title:''),body:txt,ts:Date.now()});
  localStorage.setItem('bd_user_reviews',JSON.stringify(mine));
  // optimistically prepend to visible list
  var rc={name:name,title:'',body:txt,rating:5};
  if(allReviews.length)allReviews.unshift(rc);else {allReviews=[rc];window.reviewsData={reviews:[rc]}}
  renderReviews();
  btn.disabled=true;btn.textContent='Submitted ✓';ta.value='';if(nm&&!nm.readOnly)nm.value='';
  toast('Thanks! Your review has been submitted.');
  setTimeout(function(){btn.disabled=false;btn.textContent='Submit Review'},2500);
}

/* ============ WISHLIST ============ */
function toggleWishlist(){
  if(!product)return;
  var W=(window.BDWishlist||{});
  var has=W.has?W.has(product.id):false;
  var btn=document.getElementById('wish-btn');
  if(has){
    if(W.remove)W.remove(product.id);
    toast('Removed from wishlist');if(btn)btn.classList.remove('liked');
  }else{
    if(W.add)W.add({id:product.id,title:product.title,price:product.price,image:images.length?images[0]:'',category:categorySlug});
    toast('❤️ Saved to wishlist');if(btn)btn.classList.add('liked');
  }
}

/* ============ ADD TO CART ============ */
function addToCart(){
  if(!product){toast('Product loading…');return}
  var sz=getSizeVals();
  if(sz.length&&!selectedOpts[getSizeOptName()]){toast('Please select a size');return}
  var colorOpt=getNameOfColorOpt();
  if(currentColor&&!selectedOpts[colorOpt])selectedOpts[colorOpt]=currentColor;
  var cart=[];try{cart=JSON.parse(localStorage.getItem('bd_cart')||'[]')}catch(e){}
  var variant=null;
  var vs=product?product.variants||[]:[];
  if(vs.length){
    var sizeOpt=getSizeOptName(),selsz=selectedOpts[sizeOpt],selcol=selectedOpts[colorOpt]||currentColor;
    for(var i=0;i<vs.length;i++){var v=vs[i];if(v.available){if(selsz&&v.option2!==selsz&&v.option1!==selsz)continue;variant={id:v.id,price:v.price,sku:v.sku||''};break}}
  }
  var price=variant?Number(variant.price):Number(product.price||0);
  var key=(variant?variant.id:product.id)+'|'+(selsz||'')+'|'+(selcol||'');
  var idx=cart.findIndex(function(c){return c._key===key});
  if(idx>=0)cart[idx].qty+=1;
  else cart.push({_key:key,variant_id:variant?variant.id:null,product_id:product.id,title:product.title,price:price,qty:1,image:(selcol&&window.__colorImg&&window.__colorImg[selcol])||(images.length?images[0]:''),size:selsz||'',color:selcol||'',sku:(variant?variant.sku:'')||''});
  localStorage.setItem('bd_cart',JSON.stringify(cart));updateCartCount();
  toast('✅ Added to cart');
}

/* ============ DESCRIPTION ============ */
function renderDescription(){
  var el=document.getElementById('desc-body');if(!el)return;
  var ov=getProductOverview();
  var vars=collectProductVariables();
  var h='';
  if(ov){
    h+='<div class="desc-overview" style="overflow-x:hidden;word-break:break-word;overflow-wrap:anywhere;max-width:100%;">'+esc(ov)+'</div>';
  }
  if(vars.length){
    h+='<h4 class="desc-sub-title">Specifications</h4><ul class="desc-specs">';
    vars.forEach(function(row){h+='<li><span class="sk">'+esc(row[0])+'</span><span class="sv">'+esc(row[1])+'</span></li>'});
    h+='</ul>';
  }
  if(!ov&&!vars.length){
    h='<span class="desc-empty">No product details available.</span>';
  }
  el.innerHTML=h;
}

// Extract the plain "Overview" marketing description from body_html,
// stripping the Specification / Packing list / Product Image boilerplate.
function getProductOverview(){
  var html=String(product.body_html||product.description||'');
  if(!html)return '';
  var text=html
    .replace(/<img[^>]*>/gi,'')
    .replace(/<[^>]+>/g,'\n')
    .replace(/&nbsp;/g,' ')
    .replace(/&amp;/g,'&')
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/\n+/g,'\n');
  // Grab the "Overview:" section (after Product information / before Specification)
  var m=text.match(/Overview\s*:?\s*([\s\S]*?)(?=Specification|Packing list|Product Image|Product information|$)/i);
  var ov=(m?m[1]:'').trim();
  // Fallback: first meaningful paragraph if no "Overview:" label
  if(!ov){
    var first=text.split(/\n+/).map(function(l){return l.trim()}).filter(function(l){return l.length>40})[0];
    ov=first||'';
  }
  // Clean up residual labels
  ov=ov.replace(/^(Overview|Product information)\s*:?\s*/i,'').trim();
  // If the "overview" is just the product title repeated (no real description), drop it.
  var t=(product.title||'').replace(/\s+/g,' ').trim().toLowerCase();
  if(t&&ov&&(ov.toLowerCase().indexOf(t)===0&&ov.length<t.length+60)){ov='';}
  return ov;
}

// Build the list of product "variables"/attributes to show under Product Details.
// Sources: body_html "Specification" section (Material/Style/Shape/Craft...),
// vendor, product_type, tags, and the option values (Color/Size). Weight is excluded.
function collectProductVariables(){
  var rows=[];
  var push=function(k,v){k=(k||'').trim();v=(v==null?'' : String(v)).trim();if(!k||!v)return;if(/weight|grams|\u91cd\u91cf|\u514b/i.test(k))return;rows.push([k,v])};

  // Brand / Type / Category from product fields
  if(product.product_type)push('Type',product.product_type);
  if(product.category)push('Category',product.category);

  // Option values (Color / Size / Select) from the resolved options
  (product.options||[]).forEach(function(o){
    var n=(o.name||'').trim();
    if(!n||n==='Title'||n==='Default'||n==='Default Title')return;
    // Skip colour / size / generic option rows — these are shown as interactive
    // swatches & size buttons above, so don't duplicate them in the spec sheet.
    if(/^(color|colour|size|options?|select|variant|default title)$/i.test(n))return;
    if(o.values&&o.values.length){
      push(n,o.values.filter(Boolean).join(', '));
    }
  });

  // Tags (colon key:value, or plain)
  var tags=Array.isArray(product.tags)?product.tags.join(','):(product.tags||'');
  tags.split(',').map(function(t){return t.trim()}).filter(Boolean).forEach(function(t){
    var idx=t.indexOf(':');
    if(idx>0)push(t.slice(0,idx),t.slice(idx+1));
  });

  // Parse "Specification:" block from body_html into "Key: Value" pairs.
  var html=String(product.body_html||product.description||'');
  // Strip all tags, keep text; split on <br>/newlines/pipes
  var text=html.replace(/<[^>]+>/g,'\n').replace(/&nbsp;/g,' ').replace(/<br\s*\/?>/gi,'\n');
  // Find the "Specification" section
  var m=text.match(/Specification\s*:?\s*([\s\S]*?)(?=Packing|Product Image|Product information|Overview|$)/i);
  var specText=m?m[1]:'';
  // Each line like "Material: Engineered Wood"
  var lines=specText.split(/\n+/);
  lines.forEach(function(line){
    var s=line.trim();if(!s)return;
    var ci=s.indexOf(':');
    if(ci>0){
      var k=s.slice(0,ci).trim(),v=s.slice(ci+1).trim();
      push(k,v);
    }
  });

  // If nothing meaningful parsed, fall back to nothing (not the raw description).
  return rows;
}

/* ============ RENDER PRODUCT ============ */
function renderProduct(raw){
  var p={id:raw.id,title:raw.title||raw.name||'',price:parseFloat(raw.price)||0,compare_at_price:parseFloat(raw.compare_at_price)||0,description:raw.description||raw.body_html||'',body_html:raw.body_html||'',vendor:raw.vendor||'',product_type:raw.product_type||'',tags:raw.tags||'',category:raw.category||''};
  p.images=[];if(raw.images)raw.images.forEach(function(i){var src=typeof i==='string'?i:(i.src||'');if(src)p.images.push(src)});if(!p.images.length&&raw.image)p.images=[raw.image];
  p.options=[];if(raw.options)raw.options.forEach(function(o){p.options.push({name:o.name||o,values:Array.isArray(o.values)?o.values:[o.value||o]})});
  p.variants=[];if(raw.variants)raw.variants.forEach(function(v){p.variants.push({id:v.id,title:v.title||'',price:parseFloat(v.price)||0,compare_at_price:parseFloat(v.compare_at_price)||0,available:v.available!==undefined?v.available:true,option1:v.option1||'',option2:v.option2||'',option3:v.option3||'',sku:v.sku||'',image_id:v.image_id})});
  if(!p.options.length&&p.variants.length){
    var o1=[],o2=[],o3=[],s1={},s2={},s3={};
    p.variants.forEach(function(v){if(v.option1&&!s1[v.option1]){s1[v.option1]=1;o1.push(v.option1)}if(v.option2&&!s2[v.option2]){s2[v.option2]=1;o2.push(v.option2)}if(v.option3&&!s3[v.option3]){s3[v.option3]=1;o3.push(v.option3)}});
    // Name each option by WHAT its values actually are (not just position).
    function nameFor(vals){
      if(!vals||!vals.length)return null;
      // colour-looking values
      var colorHits=0;vals.forEach(function(x){if(colorToHex(String(x))!== 'hsl('+(seedFromId(String(x).toLowerCase())%360)+',55%,62%)')colorHits++;else{/*unknown*/}});
      // simpler: check if all values resolve to a known colour name
      var knownColors=0;vals.forEach(function(x){var n=String(x).toLowerCase();if(COLOR_HEX[n]||CMYK_FALLBACK[n]||/\b(black|white|red|blue|green|yellow|orange|pink|purple|brown|beige|navy|gold|silver|khaki|gray|grey|rose)\b/.test(n))knownColors++});
      if(knownColors>=Math.ceil(vals.length*0.5)&&vals.length>1)return 'Color';
      // size-looking values
      var sizeHits=0;vals.forEach(function(x){if(looksLikeSizeVal(x))sizeHits++});
      if(sizeHits>=Math.ceil(vals.length*0.6))return 'Size';
      return 'Select';
    }
    if(o1.length)p.options.push({name:nameFor(o1)||'Color',values:o1});
    if(o2.length)p.options.push({name:nameFor(o2)||'Select',values:o2});
    if(o3.length)p.options.push({name:nameFor(o3)||'Select',values:o3});
  }
  product=p;
  document.title=p.title+' — Bargain Drop';
  document.getElementById('p-title').textContent=p.title;
  buildGallery(p.images);
  renderColors();
  renderSizes();
  updatePricing();
  renderSocial();
  renderReviews();
  renderDescription();
  var W=(window.BDWishlist||{});
  if(W.has&&W.has(p.id))document.getElementById('wish-btn').classList.add('liked');
  if(W.pull)W.pull();
  // reveal content
  document.getElementById('loading-skel').classList.add('hidden');
  document.getElementById('pdp-content').classList.remove('hidden');
  document.getElementById('bottom-bar').style.display='flex';
}

/* ============ LOAD ============ */
function loadProduct(){
  if(!pid){document.getElementById('p-title').textContent='No product ID';document.getElementById('loading-skel').classList.add('hidden');document.getElementById('pdp-content').classList.remove('hidden');return}
  var x=new XMLHttpRequest();x.open('GET','/api/product-lookup?id='+encodeURIComponent(pid),true);x.timeout=15000;
  x.onload=function(){
    if(x.status===200){
      try{var r=JSON.parse(x.responseText);
        if(r.product){categorySlug=r.category||'';window.reviewsData=r.reviews||null;renderProduct(r.product)}
        else{showError('Product data empty')}
      }catch(e){showError('Failed to parse product')}
    }else{
      /* Static fallback: API unavailable (Functions down). Load direct from bundled JSON. */
      loadProductStatic();
    }
  };
  x.onerror=function(){loadProductStatic();};
  x.ontimeout=function(){loadProductStatic();};
  x.send();
}

/* Static fallback replicating /api/product-lookup using bundled JSON files. */
window.__staticProductCache=null;
function loadProductStatic(){
  var done=function(err){ if(err){ showError(err); } };
  var render=function(prod){
    if(!prod){ done('Product not found'); return; }
    var category='';
    if(prod.product_type){ category=String(prod.product_type).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
    categorySlug=category||'';
    window.reviewsData=null;
    renderProduct(prod);
  };

  fetch('/featured.json?v=63fb05aa07').then(function(r){ return r.json(); }).then(function(feat){
    var p = Array.isArray(feat) ? feat.find(function(x){ return String(x.id) === String(pid); }) : null;
    if (p) { render(p); return; }
    fetch('/products-index.json?v=03597f28e1').then(function(r){ return r.json(); }).then(function(idx){
      var entry = idx[String(pid)];
      if (entry && entry.s !== undefined) {
        fetch('/all-products-' + entry.s + '.json').then(function(r){ return r.json(); }).then(function(shard){
          var sp = Array.isArray(shard) ? shard.find(function(x){ return String(x.id) === String(pid); }) : null;
          if (sp) render(sp);
          else done('Product not found');
        }).catch(function(){ done('Product not found'); });
      } else {
        done('Product not found');
      }
    }).catch(function(){ done('Product index unavailable'); });
  }).catch(function(){ done('Product not available'); });
}
function showError(m){
  document.getElementById('loading-skel').classList.add('hidden');
  document.getElementById('pdp-content').classList.remove('hidden');
  document.getElementById('p-title').textContent=m;
}

/* ============ AUX LINKS & INIT ============ */
document.addEventListener('DOMContentLoaded',function(){
  var sg=document.getElementById('size-guide-link');if(sg)sg.onclick=function(){toast('Size guide: measure chest & waist (coming soon)')};
  var cs=document.getElementById('check-size-link');if(cs)cs.onclick=function(){toast('Fit finder coming soon')};
  var sl=document.getElementById('review-sort-select');if(sl)sl.onchange=onSortChange;
});
updateCartCount();
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',loadProduct)}else{loadProduct()}

</script>
<!-- Bargain Drop Support Widget -->
<script>
(function(w,d){
  w.BD_CHAT = w.BD_CHAT || { config: { api: (w.location && w.location.origin) || "https://bargain-drop.online" } };
  var c=d.createElement("link"); c.rel="stylesheet"; c.href=w.BD_CHAT.config.api+"/chat-widget/chat.css?v=0438bd327b"; d.head.appendChild(c);
  var j=d.createElement("script"); j.async=true; j.src=w.BD_CHAT.config.api+"/chat-widget/chat.js?v=b75f42de9c"; d.body.appendChild(j);
})(window,document);
</script><script>if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',setupReviewName)}else{setupReviewName()}</script>

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
<script src="/js/wishlist.js?v=62082f1254"></script>
<script src="/js/notifications.js?v=bd20261029v4"></script>
<script src="/js/catalog-loader.js?v=3542132177"></script>
<script src="/js/icon-library.js?v=bd20261029v4"></script>
<script src="/js/slide-icons.js?v=bd20261029v4"></script>
<script src="/js/auto-iconify.js?v=bd20261029v4"></script>
  <script src="/js/logo-handler.js?v=bd20261029v4"></script>
</body>
</html>