// Bargain Drop — "Lumi" icon library (custom, hand-drawn SVG set)
// ---------------------------------------------------------------------------
// A single cohesive icon system used across the whole site (navbar, slide
// menu, notifications, account pages). Every icon is drawn from scratch with
// a consistent visual language:
//   • 24×24 viewBox, 1.9px stroke, rounded caps/joins
//   • two-tone: a primary neutral stroke + one coloured "glint" accent
//   • soft glow accents, no external dependencies, no emoji/letters
//
// Icons are keyed by SEMANTIC name. Rendering helpers accept a monochrome
// colour if you want to override the built-in palette.
(function (global) {
  'use strict';

  // tiny escape helper for attribute values
  function escAttr(s) { return String(s || '').replace(/"/g, '&quot;'); }

  var I = {};

  // Each icon: { v: viewBox, p: [stroke paths], f: [fill shapes], c: [coloured glints] }
  // We use three layers so renderers can tint independently.

  I.home = { p: '<path d="M3 11.4 12 3.6l9 7.8"/><path d="M5.4 10.2v9a1.6 1.6 0 0 0 1.6 1.6h10a1.6 1.6 0 0 0 1.6-1.6v-9"/><path d="M9.6 20.8v-5.2h4.8v5.2"/>', c: '#4A90D9' };
  I.categories = { p: '<rect x="3.2" y="3.2" width="7.6" height="7.6" rx="2.1"/><rect x="13.2" y="3.2" width="7.6" height="7.6" rx="2.1"/><rect x="3.2" y="13.2" width="7.6" height="7.6" rx="2.1"/><path d="M17.4 13.2v5a2.6 2.6 0 0 0 2.6 2.6"/>', c: '#2ECC71' };
  I.wishlist = { p: '<path d="M12 20.6 4.8 13.4a4.6 4.6 0 0 1 0-6.5 4.6 4.6 0 0 1 6.5 0l.7.7.7-.7a4.6 4.6 0 0 1 6.5 6.5z"/>', f: '<path d="M17.2 3.4l.7 1.5 1.6.2-1.1 1.1.3 1.6-1.5-.8-1.5.8.3-1.6-1.1-1.1 1.6-.2z"/>', c: '#E74C3C' };
  I.cart = { p: '<path d="M4 5.4h2.2l1.9 10a2 2 0 0 0 2 1.6h6.6a2 2 0 0 0 2-1.6L20 8.2H6.9"/><circle cx="9.6" cy="19.6" r="1.4"/><circle cx="16.6" cy="19.6" r="1.4"/>', c: '#9B59B6' };
  I.search = { p: '<circle cx="10.8" cy="10.8" r="6.4"/><path d="m15.6 15.6 4.2 4.2"/>', c: '#5D6D7E' };
  I.menu = { p: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>', c: '#34495E' };
  I.account = { p: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20.4a7 7 0 0 1 14 0"/>', c: '#1ABC9C' };
  I.orders = { p: '<path d="M12 3.4 4 7v10l8 3.6 8-3.6V7z"/><path d="M4 7l8 3.6L20 7"/><path d="M12 10.6V20.6"/>', c: '#E67E22' };
  I.profileInfo = { p: '<rect x="3.4" y="5" width="17.2" height="14" rx="2.4"/><circle cx="8.6" cy="10.4" r="1.7"/><path d="M5.6 16.2a3.4 3.4 0 0 1 6 0"/><path d="M15 9.6h3.4M15 12.8h3.4M15 16h2"/>', c: '#8E44AD' };
  I.addresses = { p: '<path d="M12 21s-6.6-5.2-6.6-9.4a6.6 6.6 0 0 1 13.2 0C18.6 15.8 12 21 12 21z"/><circle cx="12" cy="11.4" r="2.2"/>', c: '#4ECDC4' };
  I.payment = { p: '<rect x="3" y="5.6" width="18" height="12.8" rx="2.2"/><path d="M3 9.8h18"/><path d="M6.6 15.2h4"/>', c: '#4ADE80' };
  I.returns = { p: '<path d="M4 9h11a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3H9"/><path d="m12 11 -3 4 3 4"/>', c: '#FF6B6B' };
  I.wallet = { p: '<path d="M4 7.4h15a1.6 1.6 0 0 1 1.6 1.6v9.4a1.6 1.6 0 0 1-1.6 1.6H5.4a1.4 1.4 0 0 1-1.4-1.4V6a1.4 1.4 0 0 1 1.4-1.4H17"/><path d="M15.4 14v-1.6a1.6 1.6 0 0 1 1.6-1.6h3"/>', c: '#F39C12' };
  I.gift = { p: '<rect x="4" y="9" width="16" height="4" rx="1"/><path d="M5.4 13v6.6M18.6 13v6.6M12 9v10.6M4 13h16"/><path d="M12 9C9.4 9 7.6 7.4 7.6 5.6 7.6 4 9 3.2 10.2 3.8c1 .5 1.6 1.8 1.8 3.2M12 9c2.6 0 4.4-1.6 4.4-3.4C16.4 4 15 3.2 13.8 3.8c-1 .5-1.6 1.8-1.8 3.2"/>', c: '#E84393' };
  I.signIn = { p: '<path d="M14 4.6h3.4a2.4 2.4 0 0 1 2.4 2.4v10a2.4 2.4 0 0 1-2.4 2.4H14"/><path d="M9.4 8.2 13 12l-3.6 3.8M3 12h9.6"/>', c: '#4ADE80' };
  I.signOut = { p: '<path d="M10 4.6H6.6a2.4 2.4 0 0 0-2.4 2.4v10a2.4 2.4 0 0 0 2.4 2.4H10"/><path d="M14.6 8.2 11 12l3.6 3.8M21 12h-9.6"/>', c: '#9b978f' };
  I.register = { p: '<circle cx="9.6" cy="8.2" r="3.2"/><path d="M3.4 19.8a6.2 6.2 0 0 1 12.4 0"/><path d="M17.2 6.4v4.4M15 8.6h4.4"/>', c: '#B8A9E8' };
  I.support = { p: '<path d="M4.4 12.4v-1.6a7.6 7.6 0 0 1 15.2 0v1.6"/><rect x="3.2" y="12.4" width="3.6" height="5.4" rx="1.6"/><rect x="17.2" y="12.4" width="3.6" height="5.4" rx="1.6"/><path d="M17.2 16.4c0 1.6-1.4 2.8-3.2 3"/>', c: '#2E86C1' };
  I.privacy = { p: '<path d="M12 3.2 5 6v5.2c0 4.6 3 7.7 7 9.2 4-1.5 7-4.6 7-9.2V6z"/><path d="M9.4 12.2l1.9 1.9 3.4-3.6"/>', c: '#27AE60' };
  I.settings = { p: '<path d="M4 8h7M15 8h5M4 16h5M13 16h7"/><circle cx="13" cy="8" r="2"/><circle cx="11" cy="16" r="2"/>', c: '#7F8C8D' };
  I.security = { p: '<rect x="6" y="10" width="12" height="9.6" rx="2"/><path d="M8.6 10V7.6a3.4 3.4 0 0 1 6.8 0V10"/><circle cx="12" cy="14.8" r="1.4"/>', c: '#E74C3C' };
  I.notifications = { p: '<path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10.4 20a1.8 1.8 0 0 0 3.2 0"/>', c: '#F5A623' };
  I.back = { p: '<path d="M14.6 6 8.6 12l6 6"/>', c: '#34495E' };
  I.priceDrop = { p: '<path d="M3.8 6h13.6l3.4 4-1.2 2.4"/><path d="M6 6 8.8 3.4 11.6 6M3.8 10l2.8 2.8M3.8 10h3.4M12 20l4.4-4.4 2.2 2.2 1.6-3.2-3.2 1.6 1.4 1.4L14 22z" transform="translate(1.5 -3)"/>', c: '#E91E63' };
  I.verifyEmail = { p: '<rect x="3.2" y="5.4" width="17.6" height="13.2" rx="2.2"/><path d="m4 7 8 5.6L20 7"/>', c: '#E67E22' };
  I.phone = { p: '<path d="M6.4 3.6a1.4 1.4 0 0 1 1.4.2l2 1.6a1.2 1.2 0 0 1 .3 1.5L8.9 8.9a12 12 0 0 0 6.2 6.2l2-1.2a1.2 1.2 0 0 1 1.5.3l1.6 2a1.4 1.4 0 0 1 .2 1.4 2 2 0 0 1-2.1 1.2C12.9 18.4 5.6 11.1 5.2 5.7a2 2 0 0 1 1.2-2.1z"/>', c: '#1ABC9C' };
  I.location = { p: '<path d="M12 20.6s-6-4.8-6-8.6a6 6 0 0 1 12 0c0 3.8-6 8.6-6 8.6z"/><circle cx="12" cy="11.6" r="2"/>', c: '#E67E22' };
  I.review = { p: '<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.2-4.1 5.8-.8z"/>', c: '#F1C40F' };
  I.credit = { p: '<circle cx="9.4" cy="9.4" r="5.4"/><circle cx="15.4" cy="15.4" r="4.4"/><path d="M12 12l6.2 6.2"/>', c: '#F39C12' };
  I.warning = { p: '<path d="M12 4 2.8 19.6h18.4z"/><path d="M12 10v4"/><circle cx="12" cy="16.6" r=".6" fill="#000"/>', c: '#E67E22' };
  I.truck = { p: '<rect x="2.4" y="6" width="11" height="9.6" rx="1.6"/><path d="M13.4 9.4h3.4l2.8 3.4v2.8h-6.2"/><circle cx="6.6" cy="17.4" r="1.8"/><circle cx="16.6" cy="17.4" r="1.8"/>', c: '#2E86C1' };
  I.check = { p: '<circle cx="12" cy="12" r="8.6"/><path d="m8 12.4 2.8 2.8 5.2-5.6"/>', c: '#27AE60' };
  I.pending = { p: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3.2 2"/>', c: '#F39C12' };

  // ---- product categories (custom, drawn from scratch) --------------------
  I.womensClothing = { p: '<path d="M8.4 4.2 7 6.4 12 8.4 17 6.4 15.6 4.2z"/><path d="M7 6.4c0 0 0 2 2 2.6 1.6.5 4.4.5 6 0 2-.6 2-2.6 2-2.6"/><path d="M9 10v7M15 10v7M7.6 17c1 2.6 2.4 4.4 4.4 4.4s3.4-1.8 4.4-4.4z"/>', c: '#E91E63' };
  I.mensClothing = { p: '<path d="M9.4 3.8 12 5 14.6 3.8l2.2 2.6-4.8 1.8z"/><path d="M9.6 4.6v4.4l-4.6 2M14.4 4.6v4.4l4.6 2M6 11.2l2.8 2.8-2.8 7h12l-2.8-7 2.8-2.8"/>', c: '#2C3E50' };
  I.bagsShoes = { p: '<path d="M4.4 8.4h15.2L18.2 20a2 2 0 0 1-2 1.8H7.8a2 2 0 0 1-2-1.8z"/><path d="M8.4 8.4V6a3.6 3.6 0 0 1 7.2 0v2.4"/><path d="M5 12.4c0-2 2.6-2 2.6 0M16.4 12.4c0-2 2.6-2 2.6 0"/>', c: '#8E44AD' };
  I.jewelry = { p: '<path d="M8.6 6.4 4.6 8.6h6.8L12 6.4zM15.4 6.4l4-2.2-2.6 2.2zM12 6.4h3.4l-.6 2.2H9.2z"/><path d="M4.6 8.6h14.8l-1.8 7.4L16 20H8l-1.6-4z"/><path d="M7 16l2.2 4h5.6l2.2-4M8.6 18h6.8"/>', c: '#F1C40F' };
  I.homeGarden = { p: '<path d="M4.4 11.4 12 4 19.6 11.4"/><path d="M6.4 9.8v9a1.8 1.8 0 0 0 1.8 1.8h7.6a1.8 1.8 0 0 0 1.8-1.8v-9"/><path d="M9.6 20.4v-4.6h4.8v4.6"/>', c: '#27AE60' };
  I.homeImprovement = { p: '<path d="M14.2 2.6v5.2l6.2 3"/><path d="M20.4 8 12 12.6 3.6 8l8.4-4.6z"/><path d="M12 12.6V20M3.6 8l3 9 5.4-3.2"/>', c: '#E67E22' };
  I.beauty = { p: '<rect x="5.2" y="3.2" width="13.6" height="5.6" rx="2.4"/><path d="M8.4 8.8v9.4a2 2 0 0 0 2 2h3.2a2 2 0 0 0 2-2V8.8"/><path d="M6.4 6h2M15.4 6h2"/>', c: '#E84393' };
  I.sports = { p: '<circle cx="12" cy="12" r="8.4"/><path d="m8.4 6.6 7.2 10.8M6.6 8.4l10.8 7.2M9.4 5.2l-4.6 3 3 4.6M14.6 5.2l4.6 3-3 4.6M14.6 18.8l4.6-3-3-4.6M9.4 18.8l-4.6-3 3-4.6"/>', c: '#2980B9' };
  I.toys = { p: '<circle cx="9.4" cy="8.4" r="2"/><circle cx="14.6" cy="8.4" r="2"/><circle cx="12" cy="12.6" r="5"/><path d="M9.4 11A2.6 2.6 0 0 1 12 9.8a2.6 2.6 0 0 1 2.6 1.2"/><path d="M12 9.4V8"/><circle cx="10.6" cy="14.6" r=".5" fill="#000"/><circle cx="13.4" cy="14.6" r=".5" fill="#000"/>', c: '#F39C12' };
  I.phones = { p: '<rect x="7" y="2.6" width="10" height="18.8" rx="2.4"/><path d="M11 18.6h2"/>', c: '#4A90D9' };
  I.electronics = { p: '<path d="M5.4 14v-1.4a2 2 0 0 1 2-2h1.2V8.4a2.4 2.4 0 0 1 4.8 0v2.2h1.2a2 2 0 0 1 2 2V14a2 2 0 0 1-2 2h-7.2a2 2 0 0 1-2-2z"/><rect x="5.4" y="11.4" width="4" height="5.2" rx="1.8"/><rect x="14.6" y="11.4" width="4" height="5.2" rx="1.8"/>', c: '#3498DB' };
  I.automotive = { p: '<path d="M5.4 11.4 7 7.8A2 2 0 0 1 8.8 6.6h6.4a2 2 0 0 1 1.8 1.2l1.6 3.6"/><rect x="3.4" y="11.2" width="17.2" height="5.2" rx="1.8"/><path d="M6.4 16.4V18M17.6 16.4V18"/><circle cx="8" cy="14.6" r="1" fill="#000"/><circle cx="16" cy="14.6" r="1" fill="#000"/>', c: '#E74C3C' };
  I.pets = { p: '<ellipse cx="12" cy="16" rx="3.2" ry="2.6"/><circle cx="5.8" cy="10.6" r="1.5"/><circle cx="9.6" cy="7.6" r="1.5"/><circle cx="14.4" cy="7.6" r="1.5"/><circle cx="18.2" cy="10.6" r="1.5"/>', c: '#8E44AD' };
  I.computer = { p: '<rect x="3.4" y="4.4" width="17.2" height="11" rx="2"/><path d="M9.4 20.4h5.2M12 15.4v5M3.4 18.2h17.2M9 8h6"/>', c: '#16A085' };
  I.flash = { p: '<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>', c: '#F39C12' };
  I.star = { p: '<path d="m12 3.4 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 17.2l-5.2 2.8 1-5.8-4.2-4.1 5.8-.8z"/>', c: '#F1C40F' };
  I.sparkles = { p: '<path d="M12 4.6l1.6 4.2 4.2 1.6-4.2 1.6L12 16.2l-1.6-4.2-4.2-1.6 4.2-1.6z"/><path d="M18.6 6.6l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>', c: '#F39C12' };
  I.mail = { p: '<rect x="3.2" y="5.4" width="17.6" height="13.2" rx="2.2"/><path d="m4 7 8 5.6L20 7"/>', c: '#E67E22' };
  I.box = { p: '<path d="M12 3.4 4 7v10l8 3.6 8-3.6V7z"/><path d="M4 7l8 3.6L20 7M12 10.6V20.6"/>', c: '#E67E22' };
  I.chartBar = { p: '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>', c: '#3498DB' };
  I.chartLine = { p: '<path d="M4 4v16h16"/><path d="m6 14 4-4 3 3 5-6"/>', c: '#16A085' };
  I.gear = { p: '<circle cx="12" cy="12" r="3"/><path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/>', c: '#7F8C8D' };
  I.download = { p: '<path d="M12 3.6v10.6M7 9.8l5 5 5-5"/><path d="M5 19.6h14"/>', c: '#3498DB' };
  I.factory = { p: '<path d="M3 20V9l6 4V9l6 4V9l6 4v7z"/><path d="M9 20v-3h6v3"/>', c: '#E67E22' };
  I.clipboard = { p: '<rect x="5.4" y="4.4" width="13.2" height="16.2" rx="2"/><rect x="8.4" y="2.6" width="7.2" height="4" rx="1.2"/><path d="M8.6 11h6.8M8.6 15h4.6"/>', c: '#3498DB' };
  I.money = { p: '<rect x="3.4" y="6" width="17.2" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M5 8.6h.01M19 15.4h.01"/>', c: '#27AE60' };
  I.database = { p: '<ellipse cx="12" cy="5.4" rx="7.6" ry="2.8"/><path d="M4.4 5.4v13.2c0 1.5 3.4 2.8 7.6 2.8s7.6-1.3 7.6-2.8V5.4"/><path d="M4.4 12c0 1.5 3.4 2.8 7.6 2.8s7.6-1.3 7.6-2.8"/>', c: '#8E44AD' };
  I.key = { p: '<circle cx="8" cy="8.4" r="4.2"/><path d="m11 11.4 8.4 8.4M16.6 16.2l2.8-2.8M13.4 13.4 16 11"/>', c: '#E67E22' };
  I.target = { p: '<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r=".6" fill="#000"/>', c: '#E91E63' };
  I.laptop = { p: '<rect x="4" y="5" width="16" height="10.4" rx="1.8"/><path d="M2.4 18.6h19.2M12 7.4h6M12 11h4"/>', c: '#3498DB' };
  I.mobile = { p: '<rect x="7.4" y="2.6" width="9.2" height="18.8" rx="2.4"/><path d="M10.8 18.4h2.4"/>', c: '#4A90D9' };
  I.refresh = { p: '<path d="M20 12a8 8 0 1 1-2.3-5.7L20 8.6"/><path d="M20 4v4.6h-4.6"/>', c: '#2E86C1' };
  I.close = { p: '<path d="M6 6l12 12M18 6 6 18"/>', c: '#E74C3C' };
  I.trash = { p: '<path d="M4 7h16M9 7V4.6A1.6 1.6 0 0 1 10.6 3h2.8A1.6 1.6 0 0 1 15 4.6V7"/><path d="M6 7l1 13.4a1.6 1.6 0 0 0 1.6 1.5h6.8a1.6 1.6 0 0 0 1.6-1.5L18 7"/><path d="M10 11v6M14 11v6"/>', c: '#E74C3C' };
  I.chat = { p: '<path d="M21 12a8 8 0 0 1-8 8H4.6L2 21l1-3.6A8 8 0 1 1 21 12z"/><path d="M8 10.5h8M8 13.5h5"/>', c: '#2E86C1' };
  I.stethoscope = { p: '<path d="M5 4v5.4a7 7 0 0 0 7 7 7 7 0 0 0 7-7V4"/><path d="M5 6.4a2.4 2.4 0 0 1 0 4.8M19 6.4a2.4 2.4 0 0 0 0 4.8"/><path d="M19 15.4a3.2 3.2 0 0 1-3.2 3.2 3.2 3.2 0 0 1-3.2-3.2"/>', c: '#27AE60' };
  I.receipt = { p: '<path d="M6 3h12v18l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="M9 8h6M9 12h6M9 16h3"/>', c: '#8E44AD' };
  I.discount = { p: '<path d="M20.6 11.4 12.6 3.4a1.6 1.6 0 0 0-1.1-.5H4.8A1.8 1.8 0 0 0 3 4.7v6.7c0 .4.2.8.5 1.1l8 8a1.7 1.7 0 0 0 2.4 0l6.7-6.7a1.7 1.7 0 0 0 0-2.4z"/><circle cx="7.8" cy="7.8" r="1.4"/><path d="M13 13l3.2 3.2"/>', c: '#E91E63' };
  I.dress = I.womensClothing;
  I.shirt = I.mensClothing;
  I.handbag = I.bagsShoes;
  I.ring = I.jewelry;
  I.house = I.homeGarden;
  I.headphones = I.electronics;
  I.ball = I.sports;
  I.lipstick = I.beauty;
  I.teddy = I.toys;
  I.car = I.automotive;
  I.paw = I.pets;
  I.phoneIcon = I.phones;
  I.folder = I.clipboard;
  I.heart = I.wishlist;
  I.help = I.support;

  // Build an SVG string from an icon def + optional size/colour overrides.
  function svg(name, opts) {
    opts = opts || {};
    var d = I[name];
    if (!d) return '';
    var sz = opts.size || 20;
    var stroke = opts.color || 'currentColor';
    var accent = opts.accent || d.c || '#34495E';
    var s = '<svg class="bd-ic" data-ic="' + escAttr(name) + '" viewBox="0 0 24 24" width="' + sz + '" height="' + sz + '" fill="none" stroke="' + escAttr(stroke) + '" stroke-width="' + (opts.strokeWidth || 1.9) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    if (d.p) s += '<g stroke="' + escAttr(stroke) + '">' + d.p + '</g>';
    if (d.f) s += '<g fill="' + escAttr(accent) + '" stroke="none">' + d.f + '</g>';
    if (d.c && !d.f && !opts.noAccent) {
      // add a single coloured glint: re-stroke the first stroke path in accent
      // intentionally minimal — the primary shape stays monochrome for cohesion.
      s += '<g stroke="' + escAttr(accent) + '" stroke-width="' + (opts.strokeWidth || 1.9) + '"><circle cx="19" cy="5" r="1.6" fill="' + escAttr(accent) + '" stroke="none"/></g>';
    }
    s += '</svg>';
    return s;
  }

  global.BDIcon = { icons: I, svg: svg };
  if (typeof window !== 'undefined') { window.BDIcon = global.BDIcon; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
