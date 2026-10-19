import os, re, glob

repo = '/bargain-drop-repo'

print("=== STARTING PRODUCT CARD UPGRADE ACROSS REPOSITORY ===")

# -------------------------------------------------------------------
# 1. Update index.html
# -------------------------------------------------------------------
index_path = os.path.join(repo, 'index.html')
if os.path.exists(index_path):
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replacement for cat-card & product-card CSS in index.html
    css_old_pattern = re.compile(
        r'\.cat-card\{[^\}]*\}\.cat-card:active\{[^\}]*\}\.cat-card-img-wrap\{[^\}]*\}\.cat-card-img-wrap img\{[^\}]*\}\.cat-card:hover \.cat-card-img-wrap img\{[^\}]*\}\.cat-card-emoji\{[^\}]*\}\.cat-card-label\{[^\}]*\}\.cat-card-shop\{[^\}]*\}\.product-grid\{[^\}]*\}@media\(min-width:768px\)\{\.product-grid\{[^\}]*\}\}\.product-card\{[^\}]*\}\.product-card:active\{[^\}]*\}\.prod-img-wrap\{[^\}]*\}\.prod-img-wrap img\{[^\}]*\}\.prod-placeholder\{[^\}]*\}\.wishlist-btn\{[^\}]*\}\.wishlist-btn:hover,\.wishlist-btn\.liked\{[^\}]*\}\.wishlist-btn\.liked path\{[^\}]*\}\.quick-add\{[^\}]*\}@media\(hover:hover\)\{\.quick-add\{[^\}]*\}\.product-card:hover \.quick-add\{[^\}]*\}\}\.product-info\{[^\}]*\}\.product-stars\{[^\}]*\}\.product-title\{[^\}]*\}\.product-price\{[^\}]*\}\.prod-compare\{[^\}]*\}',
        re.DOTALL
    )

    css_new = '''.cat-card{display:flex;flex-direction:column;align-items:center;gap:8px;background:#12121a;color:#ffffff;border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:12px 8px;box-shadow:0 4px 16px rgba(0,0,0,0.25);transition:all .2s ease;text-align:center;text-decoration:none}.cat-card:hover{transform:translateY(-3px);border-color:rgba(255,26,60,0.4);box-shadow:0 8px 24px rgba(255,26,60,0.15)}.cat-card:active{transform:scale(.96)}.cat-card-img-wrap{width:64px;height:64px;border-radius:12px;overflow:hidden;background:#1a1a24;flex-shrink:0;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.1)}.cat-card-img-wrap img{width:100%;height:100%;object-fit:cover;transition:transform .3s}.cat-card:hover .cat-card-img-wrap img{transform:scale(1.08)}.cat-card-emoji{width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,#1f1f30,#252538);display:flex;align-items:center;justify-content:center;font-size:22px}.cat-card-label{font-size:.72rem;font-weight:700;line-height:1.25;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;color:#f8fafc!important}.cat-card-shop{font-size:.65rem;font-weight:800;color:#f59e0b}.product-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding-bottom:16px}@media(min-width:768px){.product-grid{grid-template-columns:repeat(4,1fr);gap:16px}}.product-card{display:flex;flex-direction:column;background:#12121a;color:#ffffff;border:1px solid rgba(255,255,255,0.12);border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.3);transition:all .2s cubic-bezier(0.16,1,0.3,1);position:relative;text-decoration:none;height:100%}.product-card:hover{transform:translateY(-4px);border-color:rgba(255,26,60,0.4);box-shadow:0 10px 28px rgba(255,26,60,0.2)}.product-card:active{transform:scale(.98)}.prod-img-wrap{aspect-ratio:1;overflow:hidden;position:relative;background:#18182d;width:100%}.prod-img-wrap img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s ease}.product-card:hover .prod-img-wrap img{transform:scale(1.06)}.prod-badge{position:absolute;top:8px;left:8px;z-index:5;background:linear-gradient(135deg,#ff1a3c,#ff4d6d);color:#ffffff;font-size:.62rem;font-weight:800;padding:3px 7px;border-radius:6px;text-transform:uppercase;letter-spacing:.3px;box-shadow:0 2px 6px rgba(255,26,60,.4)}.prod-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:36px;background:#1e1e2d;color:#94a3b8}.wishlist-btn{position:absolute;top:8px;right:8px;width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,0.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#ffffff;transition:all .2s ease;z-index:5;padding:0}.wishlist-btn:hover,.wishlist-btn.liked{background:rgba(255,26,60,0.85);border-color:#ff1a3c;color:#ffffff;transform:scale(1.1)}.wishlist-btn.liked path{fill:#ffffff;stroke:#ffffff}.quick-add{position:absolute;bottom:8px;right:8px;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#ff1a3c,#e60023);color:#ffffff;border:none;font-size:1.1rem;font-weight:800;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:1;transform:translateY(0);z-index:5;box-shadow:0 3px 10px rgba(230,0,35,0.4);transition:all .2s ease}.quick-add:hover{transform:scale(1.1);background:linear-gradient(135deg,#ff3d57,#ff1a3c)}.product-info{padding:10px 12px 12px;display:flex;flex-direction:column;flex:1;justify-content:space-between;background:#12121a;gap:4px}.product-stars{font-size:.68rem;color:#f59e0b;font-weight:700;letter-spacing:1px;margin-bottom:2px;display:flex;align-items:center;gap:3px}.product-title{font-size:.78rem;font-weight:600;line-height:1.35;color:#f8fafc!important;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;text-decoration:none}.product-price{font-size:.95rem;font-weight:800;color:#ff1a3c;display:flex;align-items:baseline;flex-wrap:wrap;gap:6px;margin-top:auto}.prod-compare{font-size:.72rem;color:#94a3b8!important;text-decoration:line-through;text-decoration-color:#f43f5e;font-weight:500;margin-left:4px}'''

    if css_old_pattern.search(content):
        content = css_old_pattern.sub(css_new, content)
        print("Updated CSS in index.html")
    else:
        # Direct string replacements if regex fails
        print("Regex match for index CSS missed, attempting targeted string replacement...")
        content = content.replace("color:var(--fg);margin-bottom:4px}", "color:#f8fafc!important;margin-bottom:4px}")
        content = content.replace("color:var(--fg)}", "color:#f8fafc!important}")
        content = content.replace("color:#1A1A1A}", "color:#f8fafc!important}")

    # BuildCard update in index.html
    old_bc_start = content.find("function buildCard(p){")
    if old_bc_start != -1:
        old_bc_end = content.find("function shuffle", old_bc_start)
        if old_bc_end != -1:
            new_bc = '''function buildCard(p){  var img=p.image||'', id=p.id||'';  var cmp='', badge='';  if(p.compare_at_price&&p.compare_at_price>p.price){    cmp='<span class="prod-compare">'+fmtAUD(p.compare_at_price)+'</span>';    var pct=Math.round(((p.compare_at_price-p.price)/p.compare_at_price)*100);    if(pct>0) badge='<div class="prod-badge">'+pct+'% OFF</div>';  }  var ih=img?'<img src="'+img+'" alt="" loading="lazy" onerror="this.parentElement.innerHTML=\'<div class=prod-placeholder>📦</div>\'">':'<div class="prod-placeholder">📦</div>';  return '<a class="product-card fade-in" href="product.html?id='+id+'"><div class="prod-img-wrap">'+badge+ih+'<button class="wishlist-btn" onclick="event.preventDefault();toggleWish(\''+id+'\')" title="Save"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="none" stroke="currentColor" stroke-width="2"/></svg></button><button class="quick-add" onclick="event.preventDefault();quickAdd(\''+id+'\')" title="Quick Add">+</button></div><div class="product-info"><div class="product-stars">★★★★★ <span style="font-size:0.6rem;color:#94a3b8;font-weight:500;">(4.9)</span></div><div class="product-title">'+(p.title||'')+'</div><div class="product-price">'+fmtAUD(p.price)+cmp+'</div></div></a>';}\n\n'''
            content = content[:old_bc_start] + new_bc + content[old_bc_end:]
            print("Updated buildCard function in index.html")

    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(content)


# -------------------------------------------------------------------
# 2. Update products.html
# -------------------------------------------------------------------
prod_html = os.path.join(repo, 'products.html')
if os.path.exists(prod_html):
    with open(prod_html, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace("color:#1A1A1A", "color:#f8fafc!important")
    content = content.replace("background: #0e0e14", "background: #12121a")
    content = content.replace("border: 2px solid rgba(255, 255, 255, 0.25)", "border: 1px solid rgba(255, 255, 255, 0.12)")
    content = content.replace("color:#9B9B9B", "color:#94a3b8!important")
    content = content.replace("color:#e60023", "color:#ff1a3c")

    # Add prod-badge style if missing
    if '.prod-badge' not in content:
        content = content.replace(".product-card{", ".prod-badge{position:absolute;top:8px;left:8px;z-index:5;background:linear-gradient(135deg,#ff1a3c,#ff4d6d);color:#ffffff;font-size:.62rem;font-weight:800;padding:3px 7px;border-radius:6px;text-transform:uppercase;letter-spacing:.3px;box-shadow:0 2px 6px rgba(255,26,60,.4)}\n.product-card{")

    with open(prod_html, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated products.html")


# -------------------------------------------------------------------
# 3. Update category.html
# -------------------------------------------------------------------
cat_html = os.path.join(repo, 'category.html')
if os.path.exists(cat_html):
    with open(cat_html, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace("color:#1A1A1A", "color:#f8fafc!important")
    content = content.replace("background:#111116", "background:#12121a")
    content = content.replace("border: 2px solid rgba(255,255,255,0.35)", "border: 1px solid rgba(255, 255, 255, 0.12)")
    content = content.replace("color:#9B9B9B", "color:#94a3b8!important")
    content = content.replace("color:#e60023", "color:#ff1a3c")

    if '.prod-badge' not in content:
        content = content.replace(".product-card{", ".prod-badge{position:absolute;top:8px;left:8px;z-index:5;background:linear-gradient(135deg,#ff1a3c,#ff4d6d);color:#ffffff;font-size:.62rem;font-weight:800;padding:3px 7px;border-radius:6px;text-transform:uppercase;letter-spacing:.3px;box-shadow:0 2px 6px rgba(255,26,60,.4)}\n.product-card{")

    with open(cat_html, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated category.html")


# -------------------------------------------------------------------
# 4. Update homepage.css
# -------------------------------------------------------------------
home_css = os.path.join(repo, 'homepage.css')
if os.path.exists(home_css):
    with open(home_css, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace("background:#fff;\n  border-radius:var(--radius);\n  overflow:hidden;\n  box-shadow:var(--shadow-sm);", "background:#12121a;\n  border-radius:14px;\n  overflow:hidden;\n  border:1px solid rgba(255,255,255,0.12);\n  box-shadow:0 4px 16px rgba(0,0,0,0.3);")
    content = content.replace("color:var(--fg);", "color:#f8fafc!important;")
    content = content.replace("background:#f8f8f8;", "background:#18182d;")
    content = content.replace("color:var(--accent);", "color:#ff1a3c;")
    content = content.replace("color:var(--gold);", "color:#f59e0b;")

    with open(home_css, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated homepage.css")


# -------------------------------------------------------------------
# 5. Update homepage.js
# -------------------------------------------------------------------
home_js = os.path.join(repo, 'homepage.js')
if os.path.exists(home_js):
    with open(home_js, 'r', encoding='utf-8') as f:
        content = f.read()

    old_scroll = '''scroll.innerHTML+='<div class="product-card-z4 fade-in"'+delay+'><div class="img-wrap"><a href="product.html?id='+p.id+'"><img src="'+img+'" alt="" loading="lazy" onerror="this.parentElement.innerHTML=\'<div style=width:100%;aspect-ratio:1;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:2rem>\ud83d\udce6</div>\'"></a><button class="wishlist-btn" data-id="'+p.id+'" onclick="toggleWishlist(this,\''+p.id+'\')">\u2661</button></div><div class="info"><a href="product.html?id='+p.id+'"><div class="title">'+esc(p.title).substring(0,45)+'</div></a><div class="stars">\u2605\u2605\u2605\u2605\u2605</div><div class="price">A$'+(p.price||0).toFixed(2)+'</div></div><a href="product.html?id='+p.id+'" class="quick-add">Quick Add +</a></div>';'''

    new_scroll = '''var cmpHtml='', badgeHtml=''; if(p.compare_at_price&&p.compare_at_price>p.price){ cmpHtml='<span class="prod-compare">A$'+p.compare_at_price.toFixed(2)+'</span>'; var pct=Math.round(((p.compare_at_price-p.price)/p.compare_at_price)*100); if(pct>0) badgeHtml='<div class="prod-badge">'+pct+'% OFF</div>'; } scroll.innerHTML+='<div class="product-card-z4 fade-in"'+delay+'><div class="img-wrap">'+badgeHtml+'<a href="product.html?id='+p.id+'"><img src="'+img+'" alt="" loading="lazy" onerror="this.parentElement.innerHTML=\'<div style=width:100%;aspect-ratio:1;background:#1e1e2d;color:#94a3b8;display:flex;align-items:center;justify-content:center;font-size:2rem>\ud83d\udce6</div>\'"></a><button class="wishlist-btn" data-id="'+p.id+'" onclick="toggleWishlist(this,\''+p.id+'\')">\u2661</button></div><div class="info"><a href="product.html?id='+p.id+'" style="text-decoration:none;"><div class="title">'+esc(p.title).substring(0,45)+'</div></a><div class="stars">★★★★★ <span style="font-size:0.6rem;color:#94a3b8;font-weight:500;">(4.9)</span></div><div class="price">A$'+(p.price||0).toFixed(2)+cmpHtml+'</div></div><a href="product.html?id='+p.id+'" class="quick-add">+</a></div>';'''

    if old_scroll in content:
        content = content.replace(old_scroll, new_scroll)
        print("Updated homepage.js card scroll template")

    with open(home_js, 'w', encoding='utf-8') as f:
        f.write(content)


# -------------------------------------------------------------------
# 6. Update js/product.js (related products)
# -------------------------------------------------------------------
prod_js = os.path.join(repo, 'js/product.js')
if os.path.exists(prod_js):
    with open(prod_js, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update related products rendering
    old_rel = '''if(ri){a.innerHTML='<div class="prod-img"><img src="'+esc(ri)+'" alt="'+esc(p.title)+'" width="200" height="200" loading="lazy" onerror="this.parentElement.innerHTML=\\\'<div class=prod-img-placeholder>📦</div>\\\'"></div><div class="prod-info"><div class="prod-title">'+esc(p.title)+'</div><div class="prod-price-row"><span class="prod-price">'+money(p.price)+'</span>'+pc+'</div></div>\';}else{a.innerHTML='<div class="prod-img"><div class="prod-img-placeholder">📦</div></div><div class="prod-info"><div class="prod-title">'+esc(p.title)+'</div><div class="prod-price-row"><span class="prod-price">'+money(p.price)+'</span>'+pc+'</div></div>\';}'''

    new_rel = '''var badgeRel=''; if(p.compare_at_price&&p.compare_at_price>p.price){ var pct=Math.round(((p.compare_at_price-p.price)/p.compare_at_price)*100); if(pct>0) badgeRel='<div class="prod-badge">'+pct+'% OFF</div>'; } var imgContent = ri ? '<img src="'+esc(ri)+'" alt="'+esc(p.title)+'" width="200" height="200" loading="lazy" onerror="this.parentElement.innerHTML=\\\'<div class=prod-img-placeholder>📦</div>\\\'">' : '<div class="prod-img-placeholder">📦</div>'; a.innerHTML='<div class="prod-img-wrap">'+badgeRel+imgContent+'</div><div class="product-info"><div class="product-stars">★★★★★</div><div class="product-title">'+esc(p.title)+'</div><div class="product-price"><span>'+money(p.price)+'</span>'+pc+'</div></div>';'''

    if old_rel in content:
        content = content.replace(old_rel, new_rel)
        print("Updated related products card template in js/product.js")

    with open(prod_js, 'w', encoding='utf-8') as f:
        f.write(content)


# -------------------------------------------------------------------
# 7. Update Wishlist CSS files (wishlist.css, wishlist-a.css, wishlist-b.css)
# -------------------------------------------------------------------
wishlist_css_files = [os.path.join(repo, 'js/wishlist.css'), os.path.join(repo, 'css/wishlist-a.css'), os.path.join(repo, 'css/wishlist-b.css')]
for w_file in wishlist_css_files:
    if os.path.exists(w_file):
        with open(w_file, 'r', encoding='utf-8') as f:
            w_content = f.read()

        w_content = w_content.replace("background:#fff;", "background:#12121a;border:1px solid rgba(255,255,255,0.12);color:#f8fafc;")
        w_content = w_content.replace("color:var(--red)", "color:#ff1a3c")
        w_content = w_content.replace(".card_title{", ".card_title{color:#f8fafc!important;")
        w_content = w_content.replace(".card_original{font-size:.68rem;color:var(--muted);text-decoration:line-through}", ".card_original{font-size:.72rem;color:#94a3b8!important;text-decoration:line-through;text-decoration-color:#f43f5e}")

        with open(w_file, 'w', encoding='utf-8') as f:
            f.write(w_content)
        print(f"Updated wishlist CSS: {os.path.basename(w_file)}")


# -------------------------------------------------------------------
# 8. Update css/product.css and css/shared.css
# -------------------------------------------------------------------
p_css = os.path.join(repo, 'css/product.css')
if os.path.exists(p_css):
    with open(p_css, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("background:#f0f0f0;", "background:#18182d;")
    content = content.replace("background:#f5f5f5;", "background:#1e1e2d;")
    with open(p_css, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated css/product.css")

s_css = os.path.join(repo, 'css/shared.css')
if os.path.exists(s_css):
    with open(s_css, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("background:var(--paper);", "background:#12121a;color:#f8fafc;")
    with open(s_css, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated css/shared.css")

print("=== COMPLETED PRODUCT CARD UPGRADES ACROSS ALL FILES ===")
