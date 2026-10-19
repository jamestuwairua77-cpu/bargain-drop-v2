import os, re

repo = '/bargain-drop-repo'

print("=== STARTING CART SLIDE MENU UNIFICATION ===")

# 1. Update css/cart-v3.css with slide-menu rules
css_path = os.path.join(repo, 'css/cart-v3.css')
with open(css_path, 'r', encoding='utf-8') as f:
    css_content = f.read()

slide_css = '''
/* SLIDE OUT MENU */
.slide-menu { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 500; pointer-events: none; }
.slide-menu.open { pointer-events: auto; }
.slide-backdrop { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); opacity: 0; transition: opacity .25s; }
.slide-menu.open .slide-backdrop { opacity: 1; }
.slide-panel { position: absolute; top: 0; right: 0; width: 280px; height: 100%; background: #111116; color: #ffffff; padding: 70px 0 20px; transform: translateX(100%); transition: transform .25s ease; overflow-y: auto; box-shadow: -4px 0 16px rgba(0, 0, 0, 0.4); }
.slide-menu.open .slide-panel { transform: translateX(0); }
.slide-item { display: flex; align-items: center; gap: 12px; padding: 13px 22px; font-size: .85rem; color: #f1f5f9; text-decoration: none; font-weight: 600; transition: all .15s; }
.slide-item:hover { background: rgba(255, 255, 255, 0.12); color: #ffffff; padding-left: 26px; }
.slide-ico { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff; font-size: .62rem; font-weight: 800; background: #181818; border: 1px solid #2C2C2C; }
.slide-heading { font-size: .62rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: .08em; padding: 14px 22px 6px; }
.slide-divider { height: 1px; background: rgba(255, 255, 255, 0.15); margin: 8px 0; }
.slide-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 50%; border: none; background: rgba(255, 255, 255, 0.1); font-size: 1.1rem; cursor: pointer; color: #ffffff; display: flex; align-items: center; justify-content: center; z-index: 10; transition: background .15s; }
.slide-close:hover { background: rgba(255, 255, 255, 0.2); }
'''

# Remove old .nmo and .nm rules
if '.nmo' in css_content:
    nm_idx = css_content.find('.nmo')
    if nm_idx != -1:
        css_content = css_content[:nm_idx] + slide_css
else:
    css_content += slide_css

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css_content)

print("Updated css/cart-v3.css with slide-menu styles")

# 2. Update cart.html
cart_path = os.path.join(repo, 'cart.html')
with open(cart_path, 'r', encoding='utf-8') as f:
    cart_content = f.read()

# Replace hamburger menu toggle button
cart_content = cart_content.replace('onclick="tm()" aria-label="Menu"', 'onclick="document.getElementById(\'slide-menu\').classList.toggle(\'open\')" aria-label="Menu"')

# Replace old .nmo and .nm HTML block with standard .slide-menu
old_menu_start = cart_content.find('<div class="nmo" id="nmo"')
if old_menu_start != -1:
    old_menu_end = cart_content.find('<div class="tb">', old_menu_start)
    if old_menu_end != -1:
        new_slide_menu_html = '''<div class="slide-menu" id="slide-menu">
  <div class="slide-backdrop" onclick="document.getElementById('slide-menu').classList.remove('open')"></div>
  <div class="slide-panel">
    <button class="slide-close" onclick="document.getElementById('slide-menu').classList.remove('open')">&times;</button>
    <div class="slide-heading">Shop</div>
    <a href="/" class="slide-item"><span class="slide-ico">H</span>Home</a>
    <a href="category.html" class="slide-item"><span class="slide-ico">C</span>All Categories</a>
    <a href="wishlist.html" class="slide-item"><span class="slide-ico">W</span>Wishlist</a>
    <a href="cart.html" class="slide-item"><span class="slide-ico">C</span>Cart</a>
    <div class="slide-divider"></div>
    <div class="slide-heading">Account</div>
    <div id="bd-slide-auth"></div>
    <div id="bd-slide-guest"></div>
    <div class="slide-divider"></div>
    <div class="slide-heading">Support</div>
    <a href="customer-service.html" class="slide-item"><span class="slide-ico">S</span>Customer Service</a>
    <a href="policy.html" class="slide-item"><span class="slide-ico">P</span>Privacy Policy</a>
  </div>
</div>'''
        cart_content = cart_content[:old_menu_start] + new_slide_menu_html + '\n' + cart_content[old_menu_end:]
        print("Replaced old menu HTML block in cart.html with standard slide-menu")

# Replace inline auth script in cart.html with standard bd-slide-auth script
new_auth_script = '''<script>(function(){try{var sess=null;try{sess=JSON.parse(localStorage.getItem('bd_session')||'null');}catch(e){}var signedIn=!!(sess&&sess.email)||!!localStorage.getItem('bd_user_email');var A=document.getElementById('bd-slide-auth');var G=document.getElementById('bd-slide-guest');if(!A||!G)return;function mi(href,letter,label,bg){return '<a href="'+href+'" class="slide-item"><span class="slide-ico" style="'+(bg||'')+'">'+letter+'</span>'+label+'</a>';}var owned=[["profile.html","P","My Account"],["orders.html","O","Orders"],["account-info.html","I","Profile Info"],["addresses.html","A","Addresses"],["payment-methods.html","P","Payment Methods"],["returns.html","R","Returns"],["wallet.html","W","Wallet"],["gift-cards.html","G","Gift Cards"]];if(signedIn){A.innerHTML=owned.map(function(o){return mi(o[0],o[1],o[2]);}).join('')+mi('#','S','Sign Out','background:#e60023;color:#fff');G.style.display='none';var so=A.querySelector('a[href="#"]');if(so){so.onclick=function(e){e.preventDefault();var ks=[];for(var i=0;i<localStorage.length;i++)ks.push(localStorage.key(i));ks.forEach(function(k){if(k.indexOf('bd_')===0&&k!=='bd_cart')localStorage.removeItem(k);});fetch('/api/auth',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'signout'})}).catch(function(){});location.href='/';};}}else{A.style.display='none';G.innerHTML=mi('sign-in.html','S','Sign In')+mi('register.html','C','Create Account');}}catch(e){}})();if(window.BDIconifySlide){window.BDIconifySlide.iconify();}</script>'''

cart_content = re.sub(r'<script>\(function\(\)\{try\{var s=null;.*?bd-cart-auth.*?\)\(\);</script>', new_auth_script, cart_content, flags=re.DOTALL)

with open(cart_path, 'w', encoding='utf-8') as f:
    f.write(cart_content)

print("Updated cart.html slide menu structure and auth script")
