// Bargain Drop — Tri-Tone Multi-Layer SVG Icon Library
// Palette Specification:
//   Pure Crimson Red:      #DC2626
//   Deep Midnight Black:   #111827
//   Vibrant Accent Yellow: #FACC15
(function (global) {
  'use strict';

  var RED = '#DC2626';
  var BLACK = '#111827';
  var YELLOW = '#FACC15';

  var I = {
    // ─────────────────────────────────────────────────────────────────────────
    // 1. SLIDE-OUT MENU ICON MATRIX
    // ─────────────────────────────────────────────────────────────────────────

    // Home Page: Modern house icon with crimson red silhouette, midnight black framing, and yellow window/door accent
    home: {
      c: RED,
      p:
        '<path d="M4 10.5L12 3.5L20 10.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V10.5z" fill="#DC2626" stroke="#111827" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<path d="M2.2 11.2L12 2.8L21.8 11.2" fill="none" stroke="#FACC15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<rect x="9.5" y="13.5" width="5" height="7.5" rx="0.8" fill="#FACC15" stroke="#111827" stroke-width="1.5"/>' +
        '<circle cx="13.2" cy="17.2" r="0.6" fill="#111827"/>' +
        '<rect x="10.2" y="7.5" width="3.6" height="3.2" rx="0.6" fill="#FACC15" stroke="#111827" stroke-width="1.3"/>'
    },

    // Women's Clothing: Elegant hanger + tailored dress silhouette in crimson red, midnight black frame, and yellow hook/waistband
    womensClothing: {
      c: RED,
      p:
        '<path d="M12 2.5a2 2 0 0 1 2 2c0 1.1-.9 1.6-2 2.2V8" fill="none" stroke="#FACC15" stroke-width="1.9" stroke-linecap="round"/>' +
        '<path d="M4.5 11L12 7.5L19.5 11" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M8.5 9.5L12 11.2L15.5 9.5L18 20.5H6L8.5 9.5z" fill="#DC2626" stroke="#111827" stroke-width="1.7" stroke-linejoin="round"/>' +
        '<line x1="7.6" y1="14" x2="16.4" y2="14" stroke="#FACC15" stroke-width="2" stroke-linecap="round"/>'
    },

    // Home & Garden: Minimalist botanical plant in crimson terracotta pot, midnight black stand, and vibrant yellow foliage
    homeGarden: {
      c: YELLOW,
      p:
        '<path d="M12 13V5.5" fill="none" stroke="#111827" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M12 10.5C12 7 8.5 5 5.5 6C5.5 9 8.5 11 12 10.5z" fill="#FACC15" stroke="#111827" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<path d="M12 8.5C12 5 15.5 3.5 18.5 4.5C18.5 7.5 15.5 9.5 12 8.5z" fill="#FACC15" stroke="#111827" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<path d="M6.5 13h11l-1.4 7a1.2 1.2 0 0 1-1.2 1H9.1a1.2 1.2 0 0 1-1.2-1L6.5 13z" fill="#DC2626" stroke="#111827" stroke-width="1.7" stroke-linejoin="round"/>' +
        '<rect x="5.5" y="11.5" width="13" height="2.4" rx="0.8" fill="#111827" stroke="#FACC15" stroke-width="1.2"/>'
    },

    // Pet Supplies: Stylized paw print with crimson red main pad, midnight black structural outline, and vibrant yellow toe beans
    pets: {
      c: RED,
      p:
        '<path d="M12 11.5c-3.2 0-5.8 2.4-5.8 5.2 0 1.9 1.5 3.3 3.4 3.3 1 0 1.7-.4 2.4-.4s1.4.4 2.4.4c1.9 0 3.4-1.4 3.4-3.3 0-2.8-2.6-5.2-5.8-5.2z" fill="#DC2626" stroke="#111827" stroke-width="1.7" stroke-linejoin="round"/>' +
        '<ellipse cx="6.2" cy="9.5" rx="1.7" ry="2.3" transform="rotate(-18 6.2 9.5)" fill="#FACC15" stroke="#111827" stroke-width="1.5"/>' +
        '<ellipse cx="9.8" cy="6.6" rx="1.7" ry="2.4" transform="rotate(-6 9.8 6.6)" fill="#FACC15" stroke="#111827" stroke-width="1.5"/>' +
        '<ellipse cx="14.2" cy="6.6" rx="1.7" ry="2.4" transform="rotate(6 14.2 6.6)" fill="#FACC15" stroke="#111827" stroke-width="1.5"/>' +
        '<ellipse cx="17.8" cy="9.5" rx="1.7" ry="2.3" transform="rotate(18 17.8 9.5)" fill="#FACC15" stroke="#111827" stroke-width="1.5"/>'
    },

    // Sale / Bargains: Bold discount tag with crimson red body, midnight black framing, and vibrant yellow percentage & grommet
    sale: {
      c: YELLOW,
      p:
        '<path d="M3.5 11.8V4.8a1.3 1.3 0 0 1 1.3-1.3h7l8.7 8.7a1.8 1.8 0 0 1 0 2.5l-6.3 6.3a1.8 1.8 0 0 1-2.5 0L3.5 11.8z" fill="#DC2626" stroke="#111827" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<circle cx="8" cy="8" r="1.6" fill="#FACC15" stroke="#111827" stroke-width="1.3"/>' +
        '<line x1="10.2" y1="15.8" x2="15.8" y2="10.2" stroke="#FACC15" stroke-width="2" stroke-linecap="round"/>' +
        '<circle cx="10.8" cy="11.2" r="1.1" fill="#FACC15"/>' +
        '<circle cx="15.2" cy="14.8" r="1.1" fill="#FACC15"/>'
    },
    priceDrop: null, // alias set below
    discount: null,

    // All Categories: 4-tile grid with alternating crimson red & vibrant yellow tiles framed in midnight black
    categories: {
      c: RED,
      p:
        '<rect x="3" y="3" width="7.5" height="7.5" rx="1.8" fill="#DC2626" stroke="#111827" stroke-width="1.7"/>' +
        '<rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8" fill="#FACC15" stroke="#111827" stroke-width="1.7"/>' +
        '<rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8" fill="#111827" stroke="#FACC15" stroke-width="1.6"/>' +
        '<rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8" fill="#DC2626" stroke="#111827" stroke-width="1.7"/>'
    },

    // Wishlist: Crimson red heart with midnight black contour and vibrant yellow sparkle highlight
    wishlist: {
      c: RED,
      p:
        '<path d="M20.4 4.8a5.3 5.3 0 0 0-7.5 0L12 5.7l-.9-.9a5.3 5.3 0 0 0-7.5 7.5l.9.9L12 20.7l7.5-7.5.9-.9a5.3 5.3 0 0 0 0-7.5z" fill="#DC2626" stroke="#111827" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<path d="M7.2 7.5a2.6 2.6 0 0 1 2.6-1.5" fill="none" stroke="#FACC15" stroke-width="1.8" stroke-linecap="round"/>'
    },

    // Cart: Crimson red basket, midnight black chassis, and vibrant yellow wheels & lightning badge
    cart: {
      c: RED,
      p:
        '<path d="M2 3h3.2l2.2 11.2a1.8 1.8 0 0 0 1.8 1.5h8.8a1.8 1.8 0 0 0 1.7-1.3L21.5 6.5H6" fill="#DC2626" stroke="#111827" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle cx="9.2" cy="19.8" r="1.8" fill="#FACC15" stroke="#111827" stroke-width="1.5"/>' +
        '<circle cx="17.8" cy="19.8" r="1.8" fill="#FACC15" stroke="#111827" stroke-width="1.5"/>' +
        '<line x1="9" y1="10" x2="18" y2="10" stroke="#FACC15" stroke-width="1.6" stroke-linecap="round"/>'
    },

    // ─────────────────────────────────────────────────────────────────────────
    // 2. CUSTOMER PROFILE PAGE UTILITY ICONS
    // ─────────────────────────────────────────────────────────────────────────

    // User Profile Settings: Dual-tone black/red avatar silhouette + vibrant yellow verification shield/gear badge
    account: {
      c: RED,
      p:
        '<path d="M4 20.5c0-3.8 3.6-6.2 8-6.2s8 2.4 8 6.2H4z" fill="#DC2626" stroke="#111827" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<circle cx="12" cy="8" r="4.2" fill="#111827" stroke="#DC2626" stroke-width="1.8"/>' +
        '<path d="M18.2 11.5l3.2 1.2v2.4c0 2.1-1.4 3.5-3.2 4.1-1.8-.6-3.2-2-3.2-4.1v-2.4l3.2-1.2z" fill="#FACC15" stroke="#111827" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<path d="M17.1 15.1l.9.9 1.6-1.7" fill="none" stroke="#111827" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
    },
    profileInfo: null, // alias set below
    settings: null,

    // Saved Address Book: Crimson red map pin marker, midnight black structural lines, and vibrant yellow beacon core
    addresses: {
      c: RED,
      p:
        '<path d="M5 20.5h14" stroke="#111827" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M12 20.5s-6.8-5.6-6.8-10.7a6.8 6.8 0 0 1 13.6 0c0 5.1-6.8 10.7-6.8 10.7z" fill="#DC2626" stroke="#111827" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<circle cx="12" cy="9.8" r="2.8" fill="#FACC15" stroke="#111827" stroke-width="1.6"/>'
    },
    location: null,

    // Order History: Isometric parcel box & receipt seal in crimson red, midnight black structure, and vibrant yellow tape/check
    orders: {
      c: YELLOW,
      p:
        '<rect x="3.5" y="6.5" width="17" height="14" rx="2" fill="#DC2626" stroke="#111827" stroke-width="1.8"/>' +
        '<path d="M3.5 10.5h17" stroke="#111827" stroke-width="1.8"/>' +
        '<rect x="9.8" y="3.5" width="4.4" height="9.5" rx="0.8" fill="#FACC15" stroke="#111827" stroke-width="1.5"/>' +
        '<path d="M7.5 16.5h4.5" stroke="#FACC15" stroke-width="1.8" stroke-linecap="round"/>'
    },
    truck: null,
    receipt: null,

    // Saved Cards / Wallet: Midnight black encrypted card, crimson red magnetic header, and vibrant yellow EMV chip + shield
    payment: {
      c: YELLOW,
      p:
        '<rect x="2" y="4.5" width="20" height="14.5" rx="2.2" fill="#111827" stroke="#DC2626" stroke-width="1.8"/>' +
        '<rect x="2" y="7.5" width="20" height="3.5" fill="#DC2626"/>' +
        '<rect x="5" y="13.2" width="4.2" height="3.2" rx="0.7" fill="#FACC15" stroke="#111827" stroke-width="1.2"/>' +
        '<circle cx="17.2" cy="14.8" r="1.8" fill="#DC2626"/>' +
        '<circle cx="19" cy="14.8" r="1.8" fill="#FACC15" fill-opacity="0.9"/>'
    },
    wallet: null,
    credit: null,

    // Customer Support Tickets: Crimson red speech bubble, midnight black framing, and vibrant yellow support badge
    support: {
      c: RED,
      p:
        '<path d="M4 4.5h16a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H8.5L4 21V6a1.5 1.5 0 0 1 1.5-1.5z" fill="#DC2626" stroke="#111827" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<line x1="8" y1="9.2" x2="16" y2="9.2" stroke="#FACC15" stroke-width="2" stroke-linecap="round"/>' +
        '<line x1="8" y1="13" x2="13.5" y2="13" stroke="#FACC15" stroke-width="2" stroke-linecap="round"/>'
    },
    chat: null,

    // Logout / Sign Out: Midnight black door portal, crimson red panel, and vibrant yellow directional exit arrow
    signOut: {
      c: RED,
      p:
        '<path d="M10 20.5H5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5h5" fill="#111827" stroke="#DC2626" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<rect x="4.5" y="4.5" width="5" height="15" rx="0.8" fill="#DC2626" stroke="#111827" stroke-width="1.4"/>' +
        '<path d="M16 16.5L21 12L16 7.5" fill="none" stroke="#FACC15" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<line x1="20.5" y1="12" x2="10.5" y2="12" stroke="#FACC15" stroke-width="2.2" stroke-linecap="round"/>'
    },

    // Additional Utility Icons in the exact #DC2626 / #111827 / #FACC15 Tri-Tone System
    returns: {
      c: RED,
      p:
        '<circle cx="12" cy="12" r="8.5" fill="#111827" stroke="#DC2626" stroke-width="1.8"/>' +
        '<path d="M8.5 9.5L6 12l2.5 2.5" fill="none" stroke="#FACC15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M6.5 12H14a3 3 0 0 1 0 6h-2" fill="none" stroke="#FACC15" stroke-width="2" stroke-linecap="round"/>'
    },

    gift: {
      c: YELLOW,
      p:
        '<rect x="3.5" y="9.5" width="17" height="11" rx="1.6" fill="#DC2626" stroke="#111827" stroke-width="1.8"/>' +
        '<rect x="2.5" y="6.5" width="19" height="3.5" rx="1" fill="#111827" stroke="#DC2626" stroke-width="1.5"/>' +
        '<rect x="10.6" y="6.5" width="2.8" height="14" fill="#FACC15" stroke="#111827" stroke-width="1.2"/>' +
        '<path d="M12 6.5c-2-2.8-5-2.5-5-.5S9.5 6.5 12 6.5zm0 0c2-2.8 5-2.5 5-.5s-2.5.5-5 .5z" fill="#FACC15" stroke="#111827" stroke-width="1.4"/>'
    },

    security: {
      c: YELLOW,
      p:
        '<path d="M12 2.8l8 3.2v5.8c0 5.2-3.4 8.4-8 9.7-4.6-1.3-8-4.5-8-9.7V6l8-3.2z" fill="#DC2626" stroke="#111827" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<rect x="9" y="10.8" width="6" height="5" rx="1" fill="#FACC15" stroke="#111827" stroke-width="1.4"/>' +
        '<path d="M10.2 10.8V9a1.8 1.8 0 0 1 3.6 0v1.8" fill="none" stroke="#FACC15" stroke-width="1.6" stroke-linecap="round"/>'
    },
    privacy: null,

    notifications: {
      c: YELLOW,
      p:
        '<path d="M18 8.5a6 6 0 1 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17S18 15 18 8.5z" fill="#DC2626" stroke="#111827" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<path d="M13.8 20a2 2 0 0 1-3.6 0" fill="#FACC15" stroke="#FACC15" stroke-width="2" stroke-linecap="round"/>' +
        '<circle cx="17.5" cy="5.5" r="2.5" fill="#FACC15" stroke="#111827" stroke-width="1.3"/>'
    },

    signIn: {
      c: YELLOW,
      p:
        '<path d="M14 3.5h5a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5h-5" fill="#111827" stroke="#DC2626" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M10 16.5L15 12L10 7.5" fill="none" stroke="#FACC15" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<line x1="14.5" y1="12" x2="3.5" y2="12" stroke="#FACC15" stroke-width="2.2" stroke-linecap="round"/>'
    },

    register: {
      c: RED,
      p:
        '<path d="M3.5 20c0-3.3 3-5.5 6.8-5.5s6.8 2.2 6.8 5.5H3.5z" fill="#DC2626" stroke="#111827" stroke-width="1.7" stroke-linejoin="round"/>' +
        '<circle cx="10.3" cy="8" r="3.6" fill="#111827" stroke="#DC2626" stroke-width="1.7"/>' +
        '<line x1="19" y1="7.5" x2="19" y2="13.5" stroke="#FACC15" stroke-width="2.2" stroke-linecap="round"/>' +
        '<line x1="16" y1="10.5" x2="22" y2="10.5" stroke="#FACC15" stroke-width="2.2" stroke-linecap="round"/>'
    }
  };

  // Aliases
  I.profileInfo = I.account;
  I.settings = I.account;
  I.wallet = I.payment;
  I.credit = I.payment;
  I.privacy = I.security;
  I.priceDrop = I.sale;
  I.discount = I.sale;
  I.location = I.addresses;
  I.truck = I.orders;
  I.receipt = I.orders;
  I.chat = I.support;
  I.mensClothing = I.womensClothing;
  I.bagsShoes = I.sale;
  I.jewelry = I.sale;
  I.homeImprovement = I.homeGarden;
  I.beauty = I.wishlist;
  I.sports = I.sale;
  I.toys = I.gift;
  I.phones = I.payment;
  I.electronics = I.payment;
  I.computer = I.payment;
  I.automotive = I.orders;

  function svg(name, opts) {
    opts = opts || {};
    var d = I[name] || I.categories;
    var sz = opts.size || 20;
    return (
      '<svg class="bd-ic w-5 h-5 shrink-0" viewBox="0 0 24 24" width="' +
      sz +
      '" height="' +
      sz +
      '" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      d.p +
      '</svg>'
    );
  }

  global.BDIcon = { icons: I, svg: svg, palette: { red: RED, black: BLACK, yellow: YELLOW } };
  if (typeof window !== 'undefined') {
    window.BDIcon = global.BDIcon;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);