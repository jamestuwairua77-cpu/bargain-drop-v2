/* Bargain Drop — shared account library
 * Handles session, per-user localStorage, and small helpers so every account page
 * shares the same data model. Storage keys are namespaced by user email so
 * multiple users on the same device stay separate.
 *
 * When you're ready to move data to a real DB, replace the read/write helpers
 * with fetch calls to /api/account/* endpoints — the UI code will not change.
 */
(function (global) {
  var BD = global.BD || {};

  // ---------------------------------------------------------------------------
  // Session
  // ---------------------------------------------------------------------------
  BD.getSession = function () {
    try {
      var s = JSON.parse(localStorage.getItem('bd_session') || 'null');
      if (!s || !s.email) {
        s = {"name":"James Tuwairua","username":"jamestuwairua","email":"jamestuwairua77@gmail.com","picture":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80","tier":"VIP Drop Member","balance":150,"points":2450};
        localStorage.setItem('bd_session', JSON.stringify(s));
      }
      return s;
    } catch (e) {
      return {"name":"James Tuwairua","username":"jamestuwairua","email":"jamestuwairua77@gmail.com","picture":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80","tier":"VIP Drop Member","balance":150,"points":2450};
    }
  };

  BD.requireAuth = function () {
    return BD.getSession();
  };

  BD.logout = function () {
    // Clear all localStorage session keys
    ['bd_session','bd_user_name','bd_user_email','bd_user_pic'].forEach(function(k){ try{localStorage.removeItem(k);}catch(e){} });
    // Clear the REAL server session cookie (same as profile/settings sign out)
    fetch('/api/auth',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'signout'})})
      .then(function(){ location.href='/sign-in.html'; })
      .catch(function(){ location.href='/sign-in.html'; });
  };

  // ---------------------------------------------------------------------------
  // Per-user storage (keyed by email so different accounts don't clash)
  // ---------------------------------------------------------------------------
  function userKey(bucket) {
    var s = BD.getSession();
    var email = (s && s.email) ? s.email.toLowerCase() : 'guest';
    return 'bd_' + bucket + '::' + email;
  }

  BD.read = function (bucket, fallback) {
    try {
      var raw = localStorage.getItem(userKey(bucket));
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  };

  BD.write = function (bucket, value) {
    try { localStorage.setItem(userKey(bucket), JSON.stringify(value)); return true; }
    catch (e) { return false; }
  };

  // ---------------------------------------------------------------------------
  // Domain helpers — orders, addresses, payment methods, wishlist, prefs, profile
  // ---------------------------------------------------------------------------
  BD.orders = {
    list: function () { return BD.read('orders', []); },
    save: function (arr) { return BD.write('orders', arr); },
    add: function (order) {
      var list = BD.orders.list();
      list.unshift(order);
      BD.orders.save(list);
      return order;
    },
    update: function (id, patch) {
      var list = BD.orders.list().map(function (o) {
        return o.id === id ? Object.assign({}, o, patch) : o;
      });
      BD.orders.save(list);
    },
    find: function (id) {
      return BD.orders.list().find(function (o) { return o.id === id; });
    }
  };

  BD.returns = {
    list: function () { return BD.read('returns', []); },
    save: function (arr) { return BD.write('returns', arr); },
    add: function (r) { var list = BD.returns.list(); list.unshift(r); BD.returns.save(list); return r; }
  };

  BD.addresses = {
    list: function () { return BD.read('addresses', []); },
    save: function (arr) { return BD.write('addresses', arr); },
    add: function (a) {
      var list = BD.addresses.list();
      if (a.isDefault) list.forEach(function (x) { x.isDefault = false; });
      if (list.length === 0) a.isDefault = true;
      list.push(a);
      BD.addresses.save(list);
      return a;
    },
    update: function (id, patch) {
      var list = BD.addresses.list();
      if (patch.isDefault) list.forEach(function (x) { x.isDefault = false; });
      list = list.map(function (x) { return x.id === id ? Object.assign({}, x, patch) : x; });
      BD.addresses.save(list);
    },
    remove: function (id) {
      var list = BD.addresses.list().filter(function (x) { return x.id !== id; });
      if (list.length && !list.some(function (x) { return x.isDefault; })) list[0].isDefault = true;
      BD.addresses.save(list);
    }
  };

  BD.payments = {
    list: function () { return BD.read('payments', []); },
    save: function (arr) { return BD.write('payments', arr); },
    add: function (p) {
      var list = BD.payments.list();
      if (p.isDefault) list.forEach(function (x) { x.isDefault = false; });
      if (list.length === 0) p.isDefault = true;
      list.push(p);
      BD.payments.save(list);
      return p;
    },
    update: function (id, patch) {
      var list = BD.payments.list();
      if (patch.isDefault) list.forEach(function (x) { x.isDefault = false; });
      list = list.map(function (x) { return x.id === id ? Object.assign({}, x, patch) : x; });
      BD.payments.save(list);
    },
    remove: function (id) {
      var list = BD.payments.list().filter(function (x) { return x.id !== id; });
      BD.payments.save(list);
    }
  };

  BD.wishlist = {
    list: function () { return BD.read('wishlist', []); },
    save: function (arr) { return BD.write('wishlist', arr); },
    add: function (item) {
      var list = BD.wishlist.list();
      if (list.some(function (x) { return x.id === item.id; })) return;
      list.unshift(item);
      BD.wishlist.save(list);
    },
    remove: function (id) {
      BD.wishlist.save(BD.wishlist.list().filter(function (x) { return x.id !== id; }));
    },
    has: function (id) { return BD.wishlist.list().some(function (x) { return x.id === id; }); }
  };

  BD.prefs = {
    defaults: {
      emailOrders: true, emailPromos: true, emailNewsletter: false, emailPriceDrops: true,
      emailBackInStock: true, emailCart: true, emailReviews: true, emailAccount: true,
      smsOrders: false, smsPromos: false,
      pushOrders: true, pushPromos: false,
      language: 'en', currency: 'AUD'
    },
    get: function () { return Object.assign({}, BD.prefs.defaults, BD.read('prefs', {})); },
    save: function (p) { BD.write('prefs', p); }
  };

  BD.profile = {
    get: function () {
      var s = BD.getSession() || {};
      var extra = BD.read('profile_extra', {});
      return Object.assign({
        name: s.name || '',
        username: s.username || '',
        email: s.email || '',
        picture: s.picture || '',
        phone: '',
        dob: '',
        gender: ''
      }, extra);
    },
    save: function (p) {
      // Update session for name change (email is immutable in this simple flow).
      var s = BD.getSession() || {};
      if (p.name && p.name !== s.name) {
        s.name = p.name;
        localStorage.setItem('bd_session', JSON.stringify(s));
        localStorage.setItem('bd_user_name', p.name);
      }
      if (p.username !== undefined && p.username !== s.username) {
        s.username = p.username;
        localStorage.setItem('bd_session', JSON.stringify(s));
        localStorage.setItem('bd_user_username', p.username);
      }
      BD.write('profile_extra', {
        phone: p.phone || '',
        dob: p.dob || '',
        gender: p.gender || ''
      });
    }
  };

  BD.security = {
    get: function () {
      return Object.assign({
        twoFactor: false,
        loginAlerts: true,
        lastPasswordChange: null,
        sessions: []
      }, BD.read('security', {}));
    },
    save: function (v) { BD.write('security', v); }
  };

  // ---------------------------------------------------------------------------
  // Small utilities
  // ---------------------------------------------------------------------------
  BD.uid = function (prefix) {
    return (prefix || 'id_') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  };

  BD.fmtDate = function (iso) {
    if (!iso) return '—';
    try {
      var d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return iso; }
  };

  BD.fmtMoney = function (amount, currency) {
    var c = currency || 'AUD';
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: c }).format(Number(amount) || 0);
    } catch (e) {
      return (typeof BD !== 'undefined' && BD.formatMoneyCompact) ? BD.formatMoneyCompact(amount || 0) : '$' + (Number(amount) || 0).toFixed(2);
    }
  };

  BD.escape = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  // ---------------------------------------------------------------------------
  // Seed a couple of demo orders on first visit so the UI isn't empty. Users
  // can dismiss / clear from Settings later.
  // ---------------------------------------------------------------------------
  BD.seedIfEmpty = function () {
    if (BD.orders.list().length > 0) return;
    var now = Date.now();
    BD.orders.save([
      {
        id: 'BD-' + (now - 86400000 * 2).toString().slice(-8),
        status: 'shipped',
        placedAt: new Date(now - 86400000 * 3).toISOString(),
        total: 45.98,
        currency: 'AUD',
        tracking: { carrier: 'USPS', number: '9400111899223197428347', url: 'https://tools.usps.com/go/TrackConfirmAction' },
        items: [
          { id: 'p1', name: 'Wireless Earbuds Pro', qty: 1, price: 29.99, img: '' },
          { id: 'p2', name: 'Fast Charging Cable', qty: 2, price: 7.99, img: '' }
        ],
        address: 'Default shipping address'
      },
      {
        id: 'BD-' + (now - 86400000 * 10).toString().slice(-8),
        status: 'review',
        placedAt: new Date(now - 86400000 * 12).toISOString(),
        total: 18.50,
        currency: 'AUD',
        tracking: null,
        items: [{ id: 'p3', name: 'Bluetooth Speaker Mini', qty: 1, price: 18.50, img: '' }],
        address: 'Default shipping address'
      }
    ]);
  };

  global.BD = BD;
})(window);

  // Pre-populate addresses & demo data for James Tuwairua
  try {
    var email = 'jamestuwairua77@gmail.com';
    var addrKey = 'bd_addresses::' + email;
    if (!localStorage.getItem(addrKey)) {
      localStorage.setItem(addrKey, JSON.stringify([
        {
          id: 'addr_default',
          fullName: 'James Tuwairua',
          phone: '+61 400 123 456',
          line1: '123 Monash Road',
          line2: 'Unit 4',
          city: 'Newborough',
          state: 'VIC',
          postcode: '3825',
          country: 'Australia',
          isDefault: true
        }
      ]));
    }
    var orderKey = 'bd_orders::' + email;
    if (!localStorage.getItem(orderKey)) {
      localStorage.setItem(orderKey, JSON.stringify([
        {
          id: 'BD-892401',
          status: 'shipped',
          placedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          total: 48.95,
          currency: 'AUD',
          tracking: { carrier: 'Australia Post Express', number: 'AP948201938AU', url: '#' },
          items: [
            { id: 'p1', name: "Men's Luxury Chronograph Watch", qty: 1, price: 29.95, img: 'https://cdn.shopify.com/s/files/1/0735/9404/4547/files/a5985ca4-0f08-499f-aa93-f82c4c46942c.jpg?v=1787034420' },
            { id: 'p2', name: 'Tactical Nylon Drop Strap', qty: 1, price: 19.00, img: '' }
          ],
          address: '123 Monash Road, Newborough VIC 3825'
        },
        {
          id: 'BD-884120',
          status: 'delivered',
          placedAt: new Date(Date.now() - 86400000 * 9).toISOString(),
          total: 32.50,
          currency: 'AUD',
          tracking: { carrier: 'Australia Post', number: 'AP88129034AU', url: '#' },
          items: [
            { id: 'p3', name: "Summer Blouse & Pant Set", qty: 1, price: 32.50, img: 'https://cdn.shopify.com/s/files/1/0735/9404/4547/files/3e166577-ee92-4099-b9a0-a706f8eebb3f_07a89ea8-3e4c-49c7-bcc1-c0ee0d414b67.jpg?v=1787034377' }
          ],
          address: '123 Monash Road, Newborough VIC 3825'
        }
      ]));
    }
  } catch(e) {}
