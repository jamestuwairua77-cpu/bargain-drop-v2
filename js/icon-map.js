// Bargain Drop — icon runtime helpers
// Maps semantic keys (used by notifications, slide menu, nav) to the Lumi
// icon library, and provides a robust emoji→key fallback for any legacy
// data that still carries emoji icons.
(function (global) {
  'use strict';

  // ---- semantic key → icon name (library) --------------------------------
  var KEY_TO_ICON = {
    order: 'orders', orders: 'orders', processing: 'orders', fulfilled: 'orders',
    package: 'orders', box: 'orders',
    shipped: 'truck', shipped_out: 'truck', truck: 'truck', transit: 'truck',
    delivered: 'check', delivered_ok: 'check', complete: 'check',
    review: 'review', review_request: 'review',
    'return': 'returns', returned: 'returns',
    unpaid: 'payment', payment_pending: 'pending', pending: 'pending',
    account: 'account', user: 'account', profile: 'profileInfo', profile_info: 'profileInfo',
    verify_email: 'verifyEmail', email: 'verifyEmail',
    address: 'addresses', add_address: 'addresses', addresses: 'addresses', location: 'location', pin: 'location',
    phone: 'phone', add_phone: 'phone',
    wallet: 'wallet', credit: 'credit', credits: 'credit', store_credit: 'credit',
    wishlist: 'wishlist', price_drop: 'priceDrop', back_in_stock: 'wishlist',
    cart: 'cart', cart_abandoned: 'cart',
    promo: 'priceDrop', promotion: 'priceDrop', offer: 'priceDrop',
    security: 'security', device: 'security', login: 'security',
    sign_in: 'signIn', sign_out: 'signOut', register: 'register',
    support: 'support', service: 'support',
    privacy: 'privacy', policy: 'privacy',
    gift: 'gift', gift_card: 'gift', gift_cards: 'gift',
    settings: 'settings', preferences: 'settings',
    warning: 'warning', issue: 'warning', attention: 'warning',
    home: 'home', categories: 'categories', search: 'search', menu: 'menu',
    notifications: 'notifications', bell: 'notifications', back: 'back'
  };

  // ---- legacy emoji → key fallback ---------------------------------------
  var EMOJI_TO_ICON = {
    '📦': 'orders', '🚚': 'truck', '✅': 'check', '⭐': 'review', '↩️': 'returns',
    '💳': 'payment', '👤': 'account', '🔐': 'security', '❤️': 'wishlist',
    '💗': 'wishlist', '💛': 'wishlist', '🛒': 'cart', '🏷️': 'priceDrop',
    '🏷': 'priceDrop', '✉️': 'verifyEmail', '✉': 'verifyEmail',
    '📍': 'location', '📞': 'phone', '⚠️': 'warning', '⚠': 'warning',
    '🔔': 'notifications', '🔕': 'notifications', '🎁': 'gift',
    '💰': 'credit', '🪙': 'credit'
  };

  function normalizeKey(k) {
    return String(k || '').toString().replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  }

  // Resolve any icon value (key, or emoji, or empty) to a library icon name.
  function resolveIconName(value) {
    if (!value) return 'notifications';
    var s = String(value).trim();
    // direct emoji?
    if (EMOJI_TO_ICON[s]) return EMOJI_TO_ICON[s];
    // already a library key? (single lowerCamel token)
    if (global.BDIcon && global.BDIcon.icons[s]) return s;
    if (KEY_TO_ICON[s]) return KEY_TO_ICON[s];
    var k = normalizeKey(s);
    if (KEY_TO_ICON[k]) return KEY_TO_ICON[k];
    if (global.BDIcon && global.BDIcon.icons[k]) return k;
    // multi-part fallback: match longest known suffix
    for (var key in KEY_TO_ICON) {
      if (k.indexOf(key) >= 0) return KEY_TO_ICON[key];
    }
    return 'notifications';
  }

  // Render an icon value to SVG string (uses library when available).
  function renderIcon(value, opts) {
    var name = resolveIconName(value);
    if (global.BDIcon && global.BDIcon.svg) {
      return global.BDIcon.svg(name, opts);
    }
    return '';
  }

  global.BDIconify = {
    resolveIconName: resolveIconName,
    renderIcon: renderIcon,
    KEY_TO_ICON: KEY_TO_ICON,
    EMOJI_TO_ICON: EMOJI_TO_ICON
  };
  if (typeof window !== 'undefined') { window.BDIconify = global.BDIconify; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
