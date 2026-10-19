const fs = require('fs');
const tree = JSON.parse(fs.readFileSync('/bargain-drop-repo/cj-categories.json', 'utf8'));

// Format tree as clean client JSON
const categoriesClientJson = JSON.stringify(tree);

const updatedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>All Categories — Bargain Drop</title>
<meta name="description" content="Shop all 14 official product categories on Bargain Drop. High-quality products at unbeatable wholesale dropshipping prices.">
<style>
:root{--bg:#f6f1ea;--fg:#1A1A1A;--muted:#6B6B6B;--meta:#9B9B9B;--line:#E8E5E0;--lilac:#B8A9E8;--teal:#4ECDC4;--coral:#FF6B6B;--radius:16px;--pill:9999px;--nav-h:60px;--promo-h:28px}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--bg);background-image:radial-gradient(1200px 600px at 100% -10%,rgba(230,0,35,.05),transparent 60%),radial-gradient(900px 500px at -10% 12%,rgba(20,20,20,.05),transparent 55%);color:var(--fg);padding-top:calc(var(--promo-h) + var(--nav-h));padding-bottom:88px;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
img{display:block;max-width:100%}

.promo-strip{position:fixed;top:0;left:0;right:0;height:var(--promo-h);background:#0F0F0F;color:#fff;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:600;letter-spacing:.3px;z-index:300;overflow:hidden;border-bottom:1px solid rgba(255,255,255,.08);padding:0 12px;white-space:nowrap}
.promo-strip b{color:var(--coral)}

.navbar{position:fixed;top:var(--promo-h);left:0;right:0;height:var(--nav-h);background:rgba(15,15,15,.97);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;align-items:center;padding:0 16px;z-index:299;box-shadow:0 1px 0 rgba(255,255,255,.06)}
.nav-logo{display:flex;align-items:center;gap:6px;flex-shrink:0;margin-right:auto;text-decoration:none;color:inherit}
.nav-logo .logo-icon{width:30px;height:30px;background:linear-gradient(135deg,var(--lilac),var(--teal));border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:900;color:#fff}
.nav-logo .logo-text{font-size:.8rem;font-weight:800;color:#fff;letter-spacing:-.3px}
.nav-actions{display:flex;align-items:center;gap:4px;flex-shrink:0}
.nav-btn{position:relative;width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:50%;color:rgba(255,255,255,.7);transition:all .15s;background:none;border:none;cursor:pointer;font-family:inherit;text-decoration:none}
.nav-btn:hover{color:#fff;background:rgba(255,255,255,.08)}
.nav-badge{position:absolute;top:3px;right:3px;background:var(--coral);color:#fff;font-size:.5rem;min-width:15px;height:15px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;padding:0 3px}

.top-bar{display:flex;align-items:center;padding:12px 16px;background:#fff;position:sticky;top:calc(var(--promo-h) + var(--nav-h));z-index:100;border-bottom:1px solid var(--line);gap:14px}
.top-bar a.back{font-size:.82rem;font-weight:700;color:var(--fg);display:flex;align-items:center;gap:6px}

.page-container{max-width:1100px;margin:0 auto;padding:24px 16px}
.page-header{margin-bottom:20px}
.page-header h1{font-size:1.4rem;font-weight:800;letter-spacing:-.02em}
.page-header p{font-size:.78rem;color:var(--muted);margin-top:4px}

.search-box-wrap{margin-bottom:24px;position:relative}
.search-box-wrap input{width:100%;padding:14px 16px 14px 42px;border:2px solid #1A1A1A;border-radius:14px;background:#fff;font-size:.85rem;font-family:inherit;outline:none;box-shadow:0 2px 0 rgba(20,20,20,.06)}
.search-box-wrap svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#9B9B9B;pointer-events:none}

.cats-list{display:flex;flex-direction:column;gap:18px}
.cat-group-card{background:#fff;border:2px solid #1a1a1a;border-radius:var(--radius);padding:18px;box-shadow:0 2px 0 rgba(20,20,20,.06);transition:box-shadow .2s}
.cat-group-card:hover{box-shadow:0 4px 14px rgba(0,0,0,.08)}
.cat-group-head{display:flex;align-items:center;gap:16px;text-decoration:none;color:inherit;padding-bottom:14px;border-bottom:1px solid var(--line)}
.cat-group-img-wrap{width:70px;height:70px;border-radius:14px;overflow:hidden;flex-shrink:0;background:#f5f5f5;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)}
.cat-group-img-wrap img{width:100%;height:100%;object-fit:cover;transition:transform .2s}
.cat-group-card:hover .cat-group-img-wrap img{transform:scale(1.06)}
.cat-group-meta{flex:1;min-width:0}
.cat-group-title{font-size:1.05rem;font-weight:800;color:#1A1A1A;display:flex;align-items:center;gap:8px}
.cat-badge{font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:var(--pill);background:#F0EEFF;color:#6C5CE7}
.cat-sub-count{font-size:.72rem;color:var(--muted);margin-top:4px}
.cat-group-arrow{font-size:1.1rem;font-weight:800;color:var(--muted);padding-right:4px;transition:transform .15s}
.cat-group-card:hover .cat-group-arrow{transform:translateX(3px);color:#1A1A1A}

.subcat-pill-grid{display:flex;flex-wrap:wrap;gap:8px;padding-top:14px}
.subcat-pill{display:inline-flex;align-items:center;gap:6px;background:#f7f6f3;border:1px solid #e2ded8;border-radius:var(--pill);padding:6px 12px;font-size:.72rem;font-weight:600;color:#333;text-decoration:none;transition:all .15s}
.subcat-pill:hover{background:#1A1A1A;color:#fff;border-color:#1A1A1A}
.subcat-pill-count{font-size:.62rem;opacity:.7;font-weight:500}
.empty-msg{padding:40px 16px;text-align:center;font-size:.85rem;color:var(--muted);display:none}

.slide-menu{position:fixed;top:0;left:0;right:0;bottom:0;z-index:500;pointer-events:none}
.slide-menu.open{pointer-events:auto}
.slide-backdrop{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.4);opacity:0;transition:opacity .25s}
.slide-menu.open .slide-backdrop{opacity:1}
.slide-panel{position:absolute;top:0;right:0;width:280px;height:100%;background:#fff;padding:82px 0 20px;transform:translateX(100%);transition:transform .25s ease;overflow-y:auto;box-shadow:-4px 0 16px rgba(0,0,0,.1)}
.slide-menu.open .slide-panel{transform:translateX(0)}
.slide-item{display:flex;align-items:center;gap:12px;padding:13px 22px;font-size:.8rem;color:#222;text-decoration:none;font-weight:500}
.slide-item:hover{background:#f6f4f0}
.slide-ico{width:20px;height:20px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:.62rem;font-weight:800}
.slide-heading{font-size:.62rem;font-weight:800;color:#9b978f;text-transform:uppercase;letter-spacing:.08em;padding:14px 22px 6px}
.slide-divider{height:1px;background:#e8e5e0;margin:8px 0}
</style>
</head>
<body>
<div class="promo-strip"><span>🎉 30% OFF SITEWIDE — USE CODE <b>BARGAIN26</b> AT CHECKOUT &nbsp;·&nbsp; Free Shipping A$29+ · SSL Encrypted · 30-Day Returns</span></div>
<nav class="navbar">
  <a href="/" class="nav-logo">
    <div class="logo-icon">BD</div>
    <div class="logo-text">BARGAIN DROP</div>
  </a>
  <div class="nav-actions">
    <a href="wishlist.html" class="nav-btn" aria-label="Wishlist">
      <svg width="18" height="18" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
    </a>
    <a href="cart.html" class="nav-btn" aria-label="Cart">
      <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1" fill="currentColor"/><circle cx="20" cy="21" r="1" fill="currentColor"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>
      <span class="nav-badge" id="nav-cart-count" style="display:none">0</span>
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
    <a href="/" class="slide-item"><span class="slide-ico" style="background:#4ECDC4">H</span>Home</a>
    <a href="categories.html" class="slide-item"><span class="slide-ico" style="background:#B8A9E8">C</span>All Categories</a>
    <a href="products.html" class="slide-item"><span class="slide-ico" style="background:#F5A623">P</span>All Products</a>
    <a href="wishlist.html" class="slide-item"><span class="slide-ico" style="background:#FF6B6B">W</span>Wishlist</a>
    <a href="cart.html" class="slide-item"><span class="slide-ico" style="background:#4ADE80">C</span>Cart</a>
    <div class="slide-divider"></div>
    <div class="slide-heading">Support</div>
    <a href="customer-service.html" class="slide-item"><span class="slide-ico" style="background:#4ADE80">S</span>Customer Service</a>
    <a href="policy.html" class="slide-item"><span class="slide-ico" style="background:#9b978f">P</span>Privacy Policy</a>
  </div>
</div>

<div class="top-bar">
  <a class="back" href="/">← Back to Home</a>
</div>

<div class="page-container">
  <div class="page-header">
    <h1>All Categories</h1>
    <p>Browse our complete catalog organized by official CJ Dropshipping categories and subcategories.</p>
  </div>

  <div class="search-box-wrap">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <input type="text" id="cat-search" placeholder="Search categories or subcategories..." oninput="filterCats(this.value)">
  </div>

  <div class="cats-list" id="cats-list"></div>
  <div class="empty-msg" id="empty-msg">No categories match your search.</div>
</div>

<script>
var CJ_TREE = ${categoriesClientJson};

function fmtCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\\.0$/, '') + 'k';
  return String(n);
}

function renderTree(list) {
  var container = document.getElementById('cats-list');
  var emptyMsg = document.getElementById('empty-msg');
  if (!list.length) {
    container.innerHTML = '';
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';

  var html = '';
  list.forEach(function(c) {
    var subPills = (c.children || []).map(function(sub) {
      return '<a class="subcat-pill" href="category.html?cat=' + encodeURIComponent(sub.key) + '&name=' + encodeURIComponent(sub.name) + '">' +
        sub.name + ' <span class="subcat-pill-count">(' + fmtCount(sub.count) + ')</span></a>';
    }).join('');

    html += '<div class="cat-group-card" data-name="' + c.name.toLowerCase() + '">' +
      '<a class="cat-group-head" href="category.html?cat=' + encodeURIComponent(c.slug) + '&name=' + encodeURIComponent(c.name) + '">' +
        '<div class="cat-group-img-wrap"><img src="' + c.image + '" alt="' + c.name + '" loading="lazy" onerror="this.outerHTML=\\'<div class=cat-group-img-wrap style=display:flex;align-items:center;justify-content:center;font-size:28px>📦</div>\\'"></div>' +
        '<div class="cat-group-meta">' +
          '<div class="cat-group-title">' + c.name + ' <span class="cat-badge">' + fmtCount(c.count) + ' items</span></div>' +
          '<div class="cat-sub-count">' + (c.children || []).length + ' populated subcategories</div>' +
        '</div>' +
        '<span class="cat-group-arrow">Shop →</span>' +
      '</a>' +
      (subPills ? '<div class="subcat-pill-grid">' + subPills + '</div>' : '') +
    '</div>';
  });

  container.innerHTML = html;
}

renderTree(CJ_TREE);

function filterCats(q) {
  q = (q || '').trim().toLowerCase();
  if (!q) {
    renderTree(CJ_TREE);
    return;
  }
  var filtered = [];
  CJ_TREE.forEach(function(c) {
    var matchL1 = c.name.toLowerCase().includes(q);
    var matchingChildren = (c.children || []).filter(function(sub) {
      return sub.name.toLowerCase().includes(q);
    });
    if (matchL1 || matchingChildren.length > 0) {
      var copy = Object.assign({}, c);
      copy.children = matchingChildren.length > 0 ? matchingChildren : c.children;
      filtered.push(copy);
    }
  });
  renderTree(filtered);
}

// Cart badge
(function(){
  try{
    var c=JSON.parse(localStorage.getItem("bd_cart")||"[]");
    var n=c.reduce(function(s,i){return s+(i.qty||1)},0);
    var b=document.getElementById("nav-cart-count");
    if(b&&n>0){b.textContent=n;b.style.display=""}
  }catch(e){}
})();
</script>
</body>
</html>`;

fs.writeFileSync('/bargain-drop-repo/categories.html', updatedHtml);
console.log('Successfully updated categories.html with full CJ Dropshipping taxonomy');
