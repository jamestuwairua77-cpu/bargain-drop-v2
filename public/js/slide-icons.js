// Bargain Drop — slide menu iconify
// Replaces the legacy single-letter ".slide-ico" badges in the mobile slide
// menu with cohesive custom SVG icons from the Lumi library.
// Matching is done by the item's TEXT LABEL (not the letter), so it works for
// both the static menu and items injected later by page JS.
(function (global) {
  'use strict';

  // label (lowercased, contains-match) → library icon name + accent colour
  var LABEL_MAP = [
    { m: 'home',            icon: 'home',        accent: '#ffd600' },
    { m: 'categor',         icon: 'categories',  accent: '#ffd600' },
    { m: 'wishlist',        icon: 'wishlist',    accent: '#ffd600' },
    { m: 'cart',            icon: 'cart',        accent: '#ffd600' },
    { m: 'checkout',        icon: 'cart',        accent: '#ffd600' },
    { m: 'order',           icon: 'orders',      accent: '#ffd600' },
    { m: 'account',         icon: 'account',     accent: '#ffd600' },
    { m: 'profile',         icon: 'profileInfo', accent: '#ffd600' },
    { m: 'address',         icon: 'addresses',   accent: '#ffd600' },
    { m: 'payment',         icon: 'payment',     accent: '#ffd600' },
    { m: 'return',          icon: 'returns',     accent: '#ffd600' },
    { m: 'wallet',          icon: 'wallet',      accent: '#ffd600' },
    { m: 'gift',            icon: 'gift',        accent: '#ffd600' },
    { m: 'sign out',        icon: 'signOut',     accent: '#ffd600' },
    { m: 'sign in',         icon: 'signIn',      accent: '#ffd600' },
    { m: 'create account',  icon: 'register',    accent: '#ffd600' },
    { m: 'register',        icon: 'register',    accent: '#ffd600' },
    { m: 'service',         icon: 'support',     accent: '#ffd600' },
    { m: 'support',         icon: 'support',     accent: '#ffd600' },
    { m: 'privacy',         icon: 'privacy',     accent: '#ffd600' },
    { m: 'policy',          icon: 'privacy',     accent: '#ffd600' },
    { m: 'setting',         icon: 'settings',    accent: '#ffd600' },
    { m: 'security',        icon: 'security',    accent: '#ffd600' },
    { m: 'notif',           icon: 'notifications', accent: '#ffd600' },
    { m: 'deactivat',       icon: 'warning',     accent: '#ffd600' }
  ];

  function labelOf(item) {
    // text content minus the icon span's own (old) text
    var t = (item.textContent || '').replace(/[0-9]+/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    return t;
  }

  function findMatch(label) {
    for (var i = 0; i < LABEL_MAP.length; i++) {
      if (label.indexOf(LABEL_MAP[i].m) >= 0) return LABEL_MAP[i];
    }
    return null;
  }

  function accentFor(label) {
    var m = findMatch(label);
    return m ? m.accent : '#9b978f';
  }

  
  // Inject Homepage Theme for mobile slide menu
  try {
    var style = document.createElement('style');
    style.textContent = `
      .slide-panel {
        background: #09090b !important;
        border-left: 2px solid rgba(255, 255, 255, 0.3) !important;
        box-shadow: -10px 0 40px rgba(0, 0, 0, 0.9) !important;
      }
      .slide-heading {
        color: #ffd600 !important;
        font-weight: 900 !important;
        font-size: 0.72rem !important;
        letter-spacing: 0.08em !important;
        text-transform: uppercase !important;
      }
      .slide-item {
        color: #ffffff !important;
        font-weight: 700 !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        transition: all 0.15s !important;
      }
      .slide-item:hover {
        background: #14141c !important;
        color: #ffd600 !important;
      }
      .slide-ico {
        background: #000000 !important;
        border: 2px solid #ffffff !important;
        color: #ffd600 !important;
        border-radius: 8px !important;
      }
      .slide-divider {
        background: rgba(255, 255, 255, 0.15) !important;
      }
    `;
    document.head.appendChild(style);
  } catch(e) {}
  
  function iconify() {
    if (!(global.BDIcon && global.BDIcon.svg)) return;
    var items = document.querySelectorAll('.slide-item');
    if (!items.length) return;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var ico = item.querySelector('.slide-ico');
      if (!ico) continue;
      // skip already-converted
      if (ico.getAttribute('data-ic')) continue;
      var label = labelOf(item);
      var m = findMatch(label);
      var name = m ? m.icon : 'menu';
      var accent = m ? m.accent : '#9b978f';

      // soft tinted chip (cohesive, modern) — subtle background + coloured icon
      ico.innerHTML = global.BDIcon.svg(name, { size: 18, color: accent, noAccent: true });
      ico.setAttribute('data-ic', name);
      ico.setAttribute('data-label', label);
      // overwrite the opaque inline background with a soft tint
      ico.style.background = hexToSoftTint(accent);
      ico.style.color = accent;
      ico.style.width = '30px';
      ico.style.height = '30px';
      ico.style.borderRadius = '9px';
    }
  }

  // convert a hex accent to a very soft background tint (same hue, low alpha)
  function hexToSoftTint(hex) {
    try {
      var h = hex.replace('#', '');
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var r = parseInt(h.substr(0, 2), 16);
      var g = parseInt(h.substr(2, 2), 16);
      var b = parseInt(h.substr(4, 2), 16);
      return 'rgba(' + r + ',' + g + ',' + b + ',0.14)';
    } catch (e) { return 'rgba(0,0,0,0.06)'; }
  }

  global.BDIconifySlide = { iconify: iconify, accentFor: accentFor };
  if (typeof document !== 'undefined') {
    function run() { iconify(); }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
