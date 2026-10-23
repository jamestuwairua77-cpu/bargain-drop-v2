// Bargain Drop — Slide Menu & Profile Iconify Engine
// Strictly enforces Tri-Tone Palette:
//   Pure Crimson Red:      #DC2626
//   Deep Midnight Black:   #111827
//   Vibrant Accent Yellow: #FACC15
(function (global) {
  'use strict';

  var LABEL_MAP = [
    { m: 'women',           icon: 'womensClothing' },
    { m: 'home & garden',   icon: 'homeGarden' },
    { m: 'home, garden',    icon: 'homeGarden' },
    { m: 'garden',          icon: 'homeGarden' },
    { m: 'pet',             icon: 'pets' },
    { m: 'sale',            icon: 'sale' },
    { m: 'bargain',         icon: 'sale' },
    { m: 'all products',    icon: 'sale' },
    { m: 'home',            icon: 'home' },
    { m: 'categor',         icon: 'categories' },
    { m: 'wishlist',        icon: 'wishlist' },
    { m: 'cart',            icon: 'cart' },
    { m: 'checkout',        icon: 'cart' },
    { m: 'order',           icon: 'orders' },
    { m: 'account',         icon: 'account' },
    { m: 'profile',         icon: 'profileInfo' },
    { m: 'address',         icon: 'addresses' },
    { m: 'payment',         icon: 'payment' },
    { m: 'card',            icon: 'payment' },
    { m: 'return',          icon: 'returns' },
    { m: 'wallet',          icon: 'wallet' },
    { m: 'gift',            icon: 'gift' },
    { m: 'sign out',        icon: 'signOut' },
    { m: 'log out',         icon: 'signOut' },
    { m: 'logout',          icon: 'signOut' },
    { m: 'sign in',         icon: 'signIn' },
    { m: 'create account',  icon: 'register' },
    { m: 'register',        icon: 'register' },
    { m: 'service',         icon: 'support' },
    { m: 'support',         icon: 'support' },
    { m: 'ticket',          icon: 'support' },
    { m: 'privacy',         icon: 'privacy' },
    { m: 'policy',          icon: 'privacy' },
    { m: 'setting',         icon: 'settings' },
    { m: 'security',        icon: 'security' },
    { m: 'notif',           icon: 'notifications' },
    { m: 'logo',            icon: 'sale' },
    { m: 'deactivat',       icon: 'returns' }
  ];

  function labelOf(item) {
    return (item.textContent || '').replace(/[0-9]+/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function findMatch(label) {
    for (var i = 0; i < LABEL_MAP.length; i++) {
      if (label.indexOf(LABEL_MAP[i].m) >= 0) return LABEL_MAP[i];
    }
    return null;
  }

  function injectSlideMenuCSS() {
    try {
      if (document.getElementById('bd-slide-menu-core-css')) return;
      var st = document.createElement('style');
      st.id = 'bd-slide-menu-core-css';
      st.textContent =
        '.slide-menu{position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:0!important;z-index:9999!important;pointer-events:none!important;display:none!important;}' +
        '.slide-menu.open{pointer-events:auto!important;display:block!important;}' +
        '.slide-backdrop{position:absolute!important;top:0!important;left:0!important;right:0!important;bottom:0!important;background:rgba(0,0,0,0.68)!important;opacity:0!important;transition:opacity .25s ease!important;}' +
        '.slide-menu.open .slide-backdrop{opacity:1!important;}' +
        '.slide-panel{position:absolute!important;top:0!important;right:0!important;width:290px!important;max-width:86vw!important;height:100%!important;background:#08090a!important;color:#ffffff!important;padding:64px 0 28px!important;transform:translateX(100%)!important;transition:transform .25s ease!important;overflow-y:auto!important;box-shadow:-10px 0 32px rgba(0,0,0,0.85)!important;border-left:1px solid #DC2626!important;}' +
        '.slide-menu.open .slide-panel{transform:translateX(0)!important;}' +
        '.slide-item{display:flex!important;align-items:center!important;gap:12px!important;padding:12px 20px!important;font-size:.85rem!important;color:#f8fafc!important;text-decoration:none!important;font-weight:700!important;border-bottom:1px solid #1e232a!important;transition:all .15s ease!important;}' +
        '.slide-item:hover{background:#111827!important;color:#FACC15!important;padding-left:24px!important;}' +
        '.slide-ico,.mi-icon{width:34px!important;height:34px!important;border-radius:8px!important;background:#111827!important;border:1px solid rgba(220,38,38,0.45)!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;flex-shrink:0!important;box-shadow:inset 0 1px 0 rgba(250,204,21,0.12),0 2px 6px rgba(0,0,0,0.45)!important;}' +
        '.slide-item:hover .slide-ico,.mi:hover .mi-icon{border-color:#FACC15!important;box-shadow:0 0 10px rgba(250,204,21,0.25)!important;}' +
        '.slide-heading{font-size:.65rem!important;font-weight:900!important;color:#FACC15!important;text-transform:uppercase!important;letter-spacing:.1em!important;padding:14px 20px 6px!important;}' +
        '.slide-divider{height:1px!important;background:#222425!important;margin:6px 0!important;}' +
        '.slide-close{position:absolute!important;top:14px!important;right:14px!important;width:34px!important;height:34px!important;border-radius:8px!important;border:1px solid #DC2626!important;background:#111827!important;font-size:1.25rem!important;cursor:pointer!important;color:#FACC15!important;display:flex!important;align-items:center!important;justify-content:center!important;z-index:10!important;transition:all .15s ease!important;}' +
        '.slide-close:hover{background:#DC2626!important;color:#ffffff!important;}';
      (document.head || document.documentElement).appendChild(st);
    } catch (e) {}
  }

  function ensureSlideMenuDOM() {
    try {
      var sm = document.getElementById('slide-menu');
      if (!sm) {
        sm = document.createElement('div');
        sm.className = 'slide-menu';
        sm.id = 'slide-menu';
        document.body.appendChild(sm);
      }

      // Upgrade the Shop / Account / Support structure so it has the complete Slide-Out Menu Icon Matrix
      var panel = sm.querySelector('.slide-panel');
      if (panel && !panel.getAttribute('data-matrix-upgraded')) {
        panel.setAttribute('data-matrix-upgraded', '1');
        var creditEl = panel.querySelector('#slide-credit');
        var creditHtml = creditEl ? creditEl.outerHTML : '';
        panel.innerHTML =
          creditHtml +
          '<button class="slide-close" onclick="document.getElementById(\'slide-menu\').classList.remove(\'open\')" aria-label="Close menu">&times;</button>' +
          '<div class="slide-heading">Shop</div>' +
          '<a href="/" class="slide-item"><span class="slide-ico"></span>Home</a>' +
          '<a href="category.html?cat=womens-clothing&name=Women\'s%20Clothing" class="slide-item"><span class="slide-ico"></span>Women\'s Clothing</a>' +
          '<a href="category.html?cat=home-garden-furniture&name=Home%2C%20Garden%20%26%20Furniture" class="slide-item"><span class="slide-ico"></span>Home &amp; Garden</a>' +
          '<a href="category.html?cat=pet-supplies&name=Pet%20Supplies" class="slide-item"><span class="slide-ico"></span>Pet Supplies</a>' +
          '<a href="products.html" class="slide-item"><span class="slide-ico"></span>Sale &amp; Bargains</a>' +
          '<a href="category.html" class="slide-item"><span class="slide-ico"></span>All Categories</a>' +
          '<a href="wishlist.html" class="slide-item"><span class="slide-ico"></span>Wishlist</a>' +
          '<a href="cart.html" class="slide-item"><span class="slide-ico"></span>Cart</a>' +
          '<div class="slide-divider"></div>' +
          '<div class="slide-heading">Account</div>' +
          '<div id="bd-slide-auth"></div>' +
          '<div id="bd-slide-guest"></div>' +
          '<div class="slide-divider"></div>' +
          '<div class="slide-heading">Support</div>' +
          '<a href="customer-service.html" class="slide-item"><span class="slide-ico"></span>Customer Support</a>' +
          '<a href="policy.html" class="slide-item"><span class="slide-ico"></span>Privacy Policy</a>';
      }

      var A = document.getElementById('bd-slide-auth') || document.getElementById('slide-auth-items');
      var G = document.getElementById('bd-slide-guest') || document.getElementById('slide-guest-items');
      if (A && G) {
        var sess = null;
        try { sess = JSON.parse(localStorage.getItem('bd_session') || 'null'); } catch (e) {}
        var signedIn = !!(sess && sess.email) || !!localStorage.getItem('bd_user_email');
        function mi(href, label) {
          return '<a href="' + href + '" class="slide-item"><span class="slide-ico"></span>' + label + '</a>';
        }
        var owned = [
          ['profile.html', 'User Profile Settings'],
          ['orders.html', 'Order History'],
          ['addresses.html', 'Saved Address Book'],
          ['payment-methods.html', 'Saved Cards & Wallet'],
          ['wallet.html', 'Store Credit & Wallet'],
          ['returns.html', 'Returns & Exchanges'],
          ['gift-cards.html', 'Gift Cards']
        ];
        if (signedIn) {
          A.style.display = '';
          A.innerHTML = owned.map(function (o) { return mi(o[0], o[1]); }).join('') +
            '<a href="#" class="slide-item" id="bd-slide-signout-link"><span class="slide-ico"></span>Logout / Sign Out</a>';
          G.style.display = 'none';
          var so = document.getElementById('bd-slide-signout-link');
          if (so) {
            so.onclick = function (e) {
              e.preventDefault();
              var ks = [];
              for (var i = 0; i < localStorage.length; i++) ks.push(localStorage.key(i));
              ks.forEach(function (k) {
                if (k.indexOf('bd_') === 0 && k !== 'bd_cart') localStorage.removeItem(k);
              });
              fetch('/api/auth', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'signout' })
              }).catch(function () {});
              location.href = '/';
            };
          }
        } else {
          A.style.display = 'none';
          G.style.display = '';
          G.innerHTML = mi('sign-in.html', 'Sign In') + mi('register.html', 'Create Account');
        }
      }
    } catch (e) {}
  }

  function iconify() {
    injectSlideMenuCSS();
    ensureSlideMenuDOM();
    if (!(global.BDIcon && global.BDIcon.svg)) return;

    // 1. Iconify Slide-Out Menu items
    var items = document.querySelectorAll('.slide-item');
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var ico = item.querySelector('.slide-ico');
      if (!ico) continue;
      var label = labelOf(item);
      var m = findMatch(label);
      var name = m ? m.icon : 'categories';
      ico.innerHTML = global.BDIcon.svg(name, { size: 20 });
      ico.setAttribute('data-ic', name);
      ico.removeAttribute('style');
    }

    // 2. Iconify Customer Profile Dashboard items (.mi .mi-icon)
    var profileRows = document.querySelectorAll('.mi');
    for (var j = 0; j < profileRows.length; j++) {
      var row = profileRows[j];
      var mIcon = row.querySelector('.mi-icon');
      if (!mIcon) continue;
      var rowLabel = labelOf(row);
      var match = findMatch(rowLabel);
      var iconKey = match ? match.icon : 'account';
      mIcon.innerHTML = global.BDIcon.svg(iconKey, { size: 20 });
      mIcon.setAttribute('data-ic', iconKey);
      mIcon.removeAttribute('style');
    }
  }

  global.BDIconifySlide = { iconify: iconify };

  if (typeof document !== 'undefined') {
    injectSlideMenuCSS();
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var sm = document.getElementById('slide-menu');
        if (sm) sm.classList.remove('open');
      }
    });
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', iconify);
    } else {
      iconify();
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);