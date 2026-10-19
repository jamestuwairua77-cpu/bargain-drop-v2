// Bargain Drop — Icon Library
// Contains identical SVG icon definitions matching the profile page
(function (global) {
  'use strict';

  function escAttr(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var I = {};

  // Exact icon definitions matching profile.html
  I.account = { p: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>', c: '#B8A9E8' };
  I.profileInfo = I.account;
  I.orders = { p: '<path d="M3 7h18v13H3z"/><path d="M8 7V4h8v3"/>', c: '#F5A623' };
  I.addresses = { p: '<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>', c: '#4ECDC4' };
  I.payment = { p: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>', c: '#4ADE80' };
  I.returns = { p: '<path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 5v4h4"/>', c: '#FF6B6B' };
  I.gift = { p: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M3 13h18M12 8v13"/>', c: '#B8A9E8' };
  I.wallet = { p: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M16 12h2"/>', c: '#4ECDC4' };
  I.security = { p: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>', c: '#9B978F' };
  I.wishlist = { p: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>', c: '#FF6B6B' };
  I.notifications = { p: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>', c: '#F5A623' };
  I.support = { p: '<path d="M4 5h16v11H8l-4 4V5z"/>', c: '#4ADE80' };
  I.privacy = { p: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"/><path d="M14 3v6h6"/>', c: '#9B978F' };
  I.home = { p: '<path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z"/>', c: '#FF6B6B' };
  I.categories = { p: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>', c: '#4ECDC4' };
  I.cart = { p: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>', c: '#FF1A3C' };
  I.signOut = { p: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>', c: '#FF1A3C' };
  I.signIn = { p: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>', c: '#4ADE80' };
  I.register = { p: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/>', c: '#B8A9E8' };
  I.settings = { p: '<circle cx="12" cy="12" r="3"/><path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/>', c: '#9B978F' };

  function svg(name, opts) {
    opts = opts || {};
    var d = I[name];
    if (!d) return '';
    var sz = opts.size || 18;
    var stroke = opts.color || d.c || 'currentColor';
    return '<svg class="bd-ic" viewBox="0 0 24 24" width="' + sz + '" height="' + sz + '" fill="none" stroke="' + escAttr(stroke) + '" stroke-width="' + (opts.strokeWidth || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d.p + '</svg>';
  }

  global.BDIcon = { icons: I, svg: svg };
  if (typeof window !== 'undefined') { window.BDIcon = global.BDIcon; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
