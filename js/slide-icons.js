// Bargain Drop — slide menu iconify
// Replaces the legacy single-letter ".slide-ico" badges in the mobile slide
// menu with cohesive custom SVG icons from the Lumi library.
// Matching is done by the item's TEXT LABEL (not the letter), so it works for
// both the static menu and items injected later by page JS.
(function (global) {
  'use strict';

  // label (lowercased, contains-match) → library icon name + accent colour
  var LABEL_MAP = [
    { m: 'home',            icon: 'home',        accent: '#4ECDC4' },
    { m: 'categor',         icon: 'categories',  accent: '#B8A9E8' },
    { m: 'wishlist',        icon: 'wishlist',    accent: '#FF6B6B' },
    { m: 'cart',            icon: 'cart',        accent: '#F5A623' },
    { m: 'checkout',        icon: 'cart',        accent: '#F5A623' },
    { m: 'order',           icon: 'orders',      accent: '#F5A623' },
    { m: 'account',         icon: 'account',     accent: '#B8A9E8' },
    { m: 'profile',         icon: 'profileInfo', accent: '#B8A9E8' },
    { m: 'address',         icon: 'addresses',   accent: '#4ECDC4' },
    { m: 'payment',         icon: 'payment',     accent: '#4ADE80' },
    { m: 'return',          icon: 'returns',     accent: '#FF6B6B' },
    { m: 'wallet',          icon: 'wallet',      accent: '#4ECDC4' },
    { m: 'gift',            icon: 'gift',        accent: '#B8A9E8' },
    { m: 'sign out',        icon: 'signOut',     accent: '#9b978f' },
    { m: 'sign in',         icon: 'signIn',      accent: '#4ADE80' },
    { m: 'create account',  icon: 'register',    accent: '#B8A9E8' },
    { m: 'register',        icon: 'register',    accent: '#B8A9E8' },
    { m: 'service',         icon: 'support',     accent: '#4ADE80' },
    { m: 'support',         icon: 'support',     accent: '#4ADE80' },
    { m: 'privacy',         icon: 'privacy',     accent: '#9b978f' },
    { m: 'policy',          icon: 'privacy',     accent: '#9b978f' },
    { m: 'setting',         icon: 'settings',    accent: '#7F8C8D' },
    { m: 'security',        icon: 'security',    accent: '#E74C3C' },
    { m: 'notif',           icon: 'notifications', accent: '#F5A623' },
    { m: 'deactivat',       icon: 'warning',     accent: '#E67E22' }
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
