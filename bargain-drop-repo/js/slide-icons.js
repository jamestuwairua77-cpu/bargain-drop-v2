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

  function iconify() {
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
    function run() { iconify(); }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
