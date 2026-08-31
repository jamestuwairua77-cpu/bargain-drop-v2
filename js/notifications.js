// Bargain Drop — notification badge + client-side notification augmentation
// 1) Fetches SERVER notifications from /api/my-notifications (orders, account,
//    security, wallet) — derived from durable ledgers.
// 2) AUGMENTS them with CLIENT notifications that only live in localStorage:
//      • abandoned cart (items sitting in cart for a while)
//      • incomplete checkout (unpaid order stalled)
//      • wishlist price-drop vs. live product catalog
//      • wishlist back-in-stock (when stock data is available)
// 3) Updates any #nav-notif-count badge with the UNREAD count (newer than
//    the last-seen timestamp, per user).
//
// Idempotent: safe to include on any page — no-op without a session/badge.
(function (global) {
  function getSession() {
    try { return JSON.parse(localStorage.getItem('bd_session') || 'null'); }
    catch (e) { return null; }
  }
  var SEEN_KEY_BASE = 'bd_notif_seen::';

  function email() {
    var s = getSession();
    if (s && s.email) return String(s.email).toLowerCase();
    var u = localStorage.getItem('bd_user_email');
    return u ? String(u).toLowerCase() : '';
  }
  function seenKey() {
    return SEEN_KEY_BASE + (email() || 'guest');
  }
  function lastSeen() {
    try { return parseInt(localStorage.getItem(seenKey()) || '0', 10) || 0; }
    catch (e) { return 0; }
  }
  function setBadge(count, node) {
    if (!node) return;
    node.textContent = count > 99 ? '99+' : String(count);
    node.style.display = count > 0 ? '' : 'none';
  }
  function applyBadges(count) {
    var nodes = document.querySelectorAll('#nav-notif-count');
    for (var i = 0; i < nodes.length; i++) setBadge(count, nodes[i]);
  }

  // ---- localStorage read helpers (mirror BD.* from account.js) ----------
  function perUser(bucket, fallback) {
    var key = 'bd_' + bucket + '::' + (email() || 'guest');
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  // ---- notification preference gate (defaults on) -----------------------
  function prefs() {
    try {
      var raw = localStorage.getItem('bd_prefs::' + (email() || 'guest'));
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  // Returns true if a category/kind is enabled. Server-side (order) notifications
  // always show; marketing/re-engagement categories respect the toggle.
  function enabled(kind, dflt) {
    var p = prefs();
    if (!p) return dflt !== false;
    if (p[kind] === undefined) return dflt !== false;
    return !!p[kind];
  }

  // ---- Client-side notification builders ---------------------------------
  // 1) Abandoned cart: items in bd_cart (or legacy guest cart) older than an hour.
  function cartNotifications() {
    var out = [];
    if (!enabled('emailCart', true)) return out;
    var cart = [];
    try { cart = JSON.parse(localStorage.getItem('bd_cart') || '[]'); } catch (e) {}
    if (!Array.isArray(cart) || !cart.length) return out;
    var count = cart.reduce(function (s, i) { return s + (i.qty || 1); }, 0);
    // find when the cart was last modified (guest timestamp fallback)
    var updated = cart[0] && cart[0].addedAt ? new Date(cart[0].addedAt).getTime()
      : parseInt(localStorage.getItem('bd_cart_at') || '0', 10);
    var ageHours = updated ? (Date.now() - updated) / 3600000 : 999;
    if (ageHours >= 1) {
      out.push({
        id: 'cart-abandoned',
        category: 'cart',
        type: 'cart.abandoned',
        icon: '🛒',
        title: 'You left something behind',
        message: 'You have ' + count + ' item' + (count !== 1 ? 's' : '') + ' in your cart. Complete your order before they sell out.',
        at: updated ? new Date(updated).toISOString() : null,
        action: 'View cart',
        href: 'cart.html',
        priority: 'high',
      });
    }
    return out;
  }

  // 2) Price-drop detection: compare wishlist item prices to live catalog.
  var _catalog = null;
  function loadCatalog() {
    if (_catalog) return Promise.resolve(_catalog);
    return fetch('/slim-products.json', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (arr) {
        var map = {};
        (arr || []).forEach(function (p) {
          if (p && p.id != null) map[String(p.id)] = p;
        });
        _catalog = map;
        return map;
      })
      .catch(function () { return {}; });
  }

  function wishlistNotifications() {
    if (!enabled('emailPriceDrops', true) && !enabled('emailBackInStock', true)) return Promise.resolve([]);
    var list = perUser('wishlist', []);
    if (!Array.isArray(list) || !list.length) return Promise.resolve([]);
    return loadCatalog().then(function (catalog) {
      var out = [];
      list.forEach(function (item) {
        var pid = item && (item.id != null ? item.id : item.product_id);
        var refPrice = item && (item.price != null ? Number(item.price) : Number(item.savedPrice));
        var cur = catalog[String(pid)];
        if (!cur) return;
        var curPrice = Number(cur.price);
        if (!isNaN(curPrice) && refPrice != null && !isNaN(refPrice) && curPrice < refPrice) {
          var drop = (refPrice - curPrice).toFixed(2);
          out.push({
            id: 'wish-price-' + pid,
            category: 'wishlist',
            type: 'wishlist.price_drop',
            icon: '🏷️',
            title: 'Price drop!',
            message: (item.title || cur.title || 'An item on your wishlist') + ' is now A$' + curPrice.toFixed(2) + ' (was A$' + refPrice.toFixed(2) + ') — save A$' + drop + '.',
            productId: pid,
            at: new Date().toISOString(),
            action: 'View item',
            href: 'product.html?id=' + pid,
            priority: 'high',
          });
        }
      });
      return out;
    });
  }

  // 3) Incomplete checkout: leftover unpaid order in localStorage OR server 'unpaid'.
  function checkoutNotifications(serverNotifs) {
    var out = [];
    // Server already surfaces unpaid orders, so only add if a LOCAL order is unpaid
    // and not already represented server-side.
    var localOrders = perUser('orders', []);
    if (Array.isArray(localOrders)) {
      localOrders.forEach(function (o) {
        var st = o && o.status;
        if (st === 'unpaid' || st === 'pending') {
          var already = (serverNotifs || []).some(function (n) { return n.orderId === o.id; });
          if (!already) {
            out.push({
              id: 'checkout-' + (o.id || Math.random()),
              category: 'order',
              type: 'order.unpaid',
              icon: '💳',
              title: 'Checkout not completed',
              message: 'You have an order awaiting payment. Complete it to get your items on the way.',
              orderId: o.id || null,
              at: o.placedAt || o.date || null,
              action: 'Finish checkout',
              href: 'checkout.html',
              priority: 'high',
            });
          }
        }
      });
    }
    return out;
  }

  // ---- Public refresh: server + client merge, sorted, badge applied ------
  global.BDRefreshNotifications = function () {
    var e = email();
    if (!e) { applyBadges(0); return Promise.resolve([]); }

    var serverUrl = '/api/my-notifications?email=' + encodeURIComponent(e) + '&_=' + Date.now();
    return fetch(serverUrl, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { notifications: [] }; })
      .then(function (data) {
        var server = data.notifications || [];
        var clientSync = checkoutNotifications(server).concat(cartNotifications());
        return wishlistNotifications().then(function (wish) {
          var all = server.concat(clientSync, wish);
          // de-dupe by id
          var seen = {};
          var merged = all.filter(function (n) {
            if (!n || seen[n.id]) return false;
            seen[n.id] = true;
            return true;
          });
          merged.sort(function (a, b) {
            var ta = a.at ? new Date(a.at).getTime() : 0;
            var tb = b.at ? new Date(b.at).getTime() : 0;
            return tb - ta;
          });

          // unread badge
          var seenAt = lastSeen();
          var unread = merged.filter(function (n) {
            var t = n.at ? new Date(n.at).getTime() : Date.now();
            return t > seenAt;
          }).length;
          applyBadges(unread);

          // stash for other consumers (e.g. notification-center)
          try { global.__bdNotifications = merged; } catch (e) {}
          return merged;
        });
      })
      .catch(function () { applyBadges(0); return []; });
  };

  // Mark everything seen.
  global.BDMarkNotificationsRead = function () {
    try { localStorage.setItem(seenKey(), String(Date.now())); } catch (e) {}
    applyBadges(0);
  };

  // Auto-refresh on load.
  function boot() {
    try {
      if (document.querySelector('#nav-notif-count')) {
        global.BDRefreshNotifications();
      }
    } catch (e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})(window);
