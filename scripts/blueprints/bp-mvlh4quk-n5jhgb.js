// Bargain Drop — Slide Menu Iconify
// Applies color-coded SVG icons identical to the profile page
(function (global) {
  'use strict';

  // Label matching map aligned with profile.html
  var LABEL_MAP = [
    { m: 'home',            icon: 'home',        accent: '#FF6B6B' },
    { m: 'categor',         icon: 'categories',  accent: '#4ECDC4' },
    { m: 'wishlist',        icon: 'wishlist',    accent: '#FF6B6B' },
    { m: 'cart',            icon: 'cart',        accent: '#FF1A3C' },
    { m: 'checkout',        icon: 'cart',        accent: '#FF1A3C' },
    { m: 'order',           icon: 'orders',      accent: '#F5A623' },
    { m: 'account',         icon: 'account',     accent: '#B8A9E8' },
    { m: 'profile',         icon: 'profileInfo', accent: '#B8A9E8' },
    { m: 'address',         icon: 'addresses',   accent: '#4ECDC4' },
    { m: 'payment',         icon: 'payment',     accent: '#4ADE80' },
    { m: 'return',          icon: 'returns',     accent: '#FF6B6B' },
    { m: 'wallet',          icon: 'wallet',      accent: '#4ECDC4' },
    { m: 'gift',            icon: 'gift',        accent: '#B8A9E8' },
    { m: 'sign out',        icon: 'signOut',     accent: '#FF1A3C' },
    { m: 'sign in',         icon: 'signIn',      accent: '#4ADE80' },
    { m: 'create account',  icon: 'register',    accent: '#B8A9E8' },
    { m: 'register',        icon: 'register',    accent: '#B8A9E8' },
    { m: 'service',         icon: 'support',     accent: '#4ADE80' },
    { m: 'support',         icon: 'support',     accent: '#4ADE80' },
    { m: 'privacy',         icon: 'privacy',     accent: '#9B978F' },
    { m: 'policy',          icon: 'privacy',     accent: '#9B978F' },
    { m: 'setting',         icon: 'settings',    accent: '#9B978F' },
    { m: 'security',        icon: 'security',    accent: '#9B978F' },
    { m: 'notif',           icon: 'notifications', accent: '#F5A623' },
    { m: 'deactivat',       icon: 'returns',     accent: '#FF6B6B' }
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

  function accentFor(label) {
    var m = findMatch(label);
    return m ? m.accent : '#9B978F';
  }

  function hexToRgba(hex, alpha) {
    try {
      var h = hex.replace('#', '');
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var r = parseInt(h.substr(0, 2), 16);
      var g = parseInt(h.substr(2, 2), 16);
      var b = parseInt(h.substr(4, 2), 16);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    } catch (e) {
      return 'rgba(255,255,255,0.08)';
    }
  }

  function injectSlideMenuCSS() {
    try {
      if (document.getElementById('bd-slide-menu-core-css')) return;
      var st = document.createElement('style');
      st.id = 'bd-slide-menu-core-css';
      st.textContent =
        '.slide-menu{position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:0!important;z-index:900!important;pointer-events:none!important;}' +
        '.slide-menu.open{pointer-events:auto!important;}' +
        '.slide-backdrop{position:absolute!important;top:0!important;left:0!important;right:0!important;bottom:0!important;background:rgba(0,0,0,0.58)!important;opacity:0!important;transition:opacity .25s ease!important;}' +
        '.slide-menu.open .slide-backdrop{opacity:1!important;}' +
        '.slide-panel{position:absolute!important;top:0!important;right:0!important;width:280px!important;max-width:85vw!important;height:100%!important;background:#08090a!important;color:#ffffff!important;padding:68px 0 24px!important;transform:translateX(100%)!important;transition:transform .25s ease!important;overflow-y:auto!important;box-shadow:-8px 0 28px rgba(0,0,0,0.75)!important;border-left:1px solid #222425!important;}' +
        '.slide-menu.open .slide-panel{transform:translateX(0)!important;}' +
        '.slide-item{display:flex!important;align-items:center!important;gap:12px!important;padding:13px 22px!important;font-size:.85rem!important;color:#dedede!important;text-decoration:none!important;font-weight:700!important;border-bottom:1px solid #202223!important;transition:all .15s ease!important;}' +
        '.slide-item:hover{background:#121515!important;color:#fe3442!important;padding-left:26px!important;}' +
        '.slide-heading{font-size:.65rem!important;font-weight:900!important;color:#fe3442!important;text-transform:uppercase!important;letter-spacing:.08em!important;padding:14px 22px 6px!important;}' +
        '.slide-divider{height:1px!important;background:#202223!important;margin:8px 0!important;}' +
        '.slide-close{position:absolute!important;top:16px!important;right:16px!important;width:34px!important;height:34px!important;border-radius:6px!important;border:1px solid #222425!important;background:#121515!important;font-size:1.25rem!important;cursor:pointer!important;color:#fe3442!important;display:flex!important;align-items:center!important;justify-content:center!important;z-index:10!important;transition:all .15s ease!important;}' +
        '.slide-close:hover{background:#fe3442!important;color:#ffffff!important;}';
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
        sm.innerHTML =
          '<div class="slide-backdrop" onclick="document.getElementById(\'slide-menu\').classList.remove(\'open\')"></div>' +
          '<div class="slide-panel">' +
            '<button class="slide-close" onclick="document.getElementById(\'slide-menu\').classList.remove(\'open\')" aria-label="Close menu">&times;</button>' +
            '<div class="slide-heading">Shop</div>' +
            '<a href="/" class="slide-item"><span class="slide-ico">H</span>Home</a>' +
            '<a href="category.html" class="slide-item"><span class="slide-ico">C</span>All Categories</a>' +
            '<a href="wishlist.html" class="slide-item"><span class="slide-ico">W</span>Wishlist</a>' +
            '<a href="cart.html" class="slide-item"><span class="slide-ico">C</span>Cart</a>' +
            '<div class="slide-divider"></div>' +
            '<div class="slide-heading">Account</div>' +
            '<div id="bd-slide-auth"></div>' +
            '<div id="bd-slide-guest"></div>' +
            '<div class="slide-divider"></div>' +
            '<div class="slide-heading">Support</div>' +
            '<a href="customer-service.html" class="slide-item"><span class="slide-ico">S</span>Customer Service</a>' +
            '<a href="policy.html" class="slide-item"><span class="slide-ico">P</span>Privacy Policy</a>' +
            '<a href="/logos.html" class="slide-item"><span class="slide-ico">L</span>Custom Logos</a>' +
          '</div>';
        document.body.appendChild(sm);
      } else {
        var panel = sm.querySelector('.slide-panel');
        if (panel && !panel.querySelector('.slide-close')) {
          var closeBtn = document.createElement('button');
          closeBtn.className = 'slide-close';
          closeBtn.setAttribute('aria-label', 'Close menu');
          closeBtn.innerHTML = '&times;';
          closeBtn.onclick = function () { sm.classList.remove('open'); };
          panel.insertBefore(closeBtn, panel.firstChild);
        }
      }

      // Ensure auth/guest links are populated if empty
      var A = document.getElementById('bd-slide-auth');
      var G = document.getElementById('bd-slide-guest');
      if (A && G && !A.innerHTML.trim() && !G.innerHTML.trim()) {
        var sess = null;
        try { sess = JSON.parse(localStorage.getItem('bd_session') || 'null'); } catch (e) {}
        var signedIn = !!(sess && sess.email) || !!localStorage.getItem('bd_user_email');
        function mi(href, letter, label) {
          return '<a href="' + href + '" class="slide-item"><span class="slide-ico">' + letter + '</span>' + label + '</a>';
        }
        var owned = [
          ['profile.html', 'P', 'My Account'],
          ['orders.html', 'O', 'Orders'],
          ['account-info.html', 'I', 'Profile Info'],
          ['addresses.html', 'A', 'Addresses'],
          ['payment-methods.html', 'P', 'Payment Methods'],
          ['returns.html', 'R', 'Returns'],
          ['wallet.html', 'W', 'Wallet'],
          ['gift-cards.html', 'G', 'Gift Cards']
        ];
        if (signedIn) {
          A.innerHTML = owned.map(function (o) { return mi(o[0], o[1], o[2]); }).join('') + mi('#', 'S', 'Sign Out');
          G.style.display = 'none';
        } else {
          A.style.display = 'none';
          G.innerHTML = mi('sign-in.html', 'S', 'Sign In') + mi('register.html', 'C', 'Create Account');
        }
      }
    } catch (e) {}
  }

  function iconify() {
    injectSlideMenuCSS();
    ensureSlideMenuDOM();
    if (!(global.BDIcon && global.BDIcon.svg)) return;
    var items = document.querySelectorAll('.slide-item');
    if (!items.length) return;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var ico = item.querySelector('.slide-ico');
      if (!ico) continue;
      if (ico.getAttribute('data-ic')) continue;

      var label = labelOf(item);
      var m = findMatch(label);
      var name = m ? m.icon : 'categories';
      var accent = m ? m.accent : '#9B978F';

      // Render profile-identical SVG icon
      ico.innerHTML = global.BDIcon.svg(name, { size: 18, color: accent, strokeWidth: 1.8 });
      ico.setAttribute('data-ic', name);
      ico.setAttribute('data-label', label);

      // Apply color-coded chip styling matching profile page
      ico.style.background = hexToRgba(accent, 0.12);
      ico.style.border = '1px solid ' + hexToRgba(accent, 0.25);
      ico.style.color = accent;
      ico.style.width = '32px';
      ico.style.height = '32px';
      ico.style.borderRadius = '9px';
      ico.style.display = 'inline-flex';
      ico.style.alignItems = 'center';
      ico.style.justifyContent = 'center';
      ico.style.flexShrink = '0';
    }
  }

  global.BDIconifySlide = { iconify: iconify, accentFor: accentFor };

  if (typeof document !== 'undefined') {
    injectSlideMenuCSS();
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var sm = document.getElementById('slide-menu');
        if (sm) sm.classList.remove('open');
      }
    });
    function run() { iconify(); }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);