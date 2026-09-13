/* Bargain Drop — shared wishlist helper
 * Per-user namespaced localStorage + optional server sync.
 *
 * Guests:  data lives in localStorage key "bd_wishlist::guest" (device-local).
 * Members: data lives in localStorage key "bd_wishlist::<email>" AND is synced
 *          to /api/wishlist (server source of truth, follows the account across
 *          devices).
 */
(function (global) {
  var LEGACY_KEY = 'bd_wishlist';
  function session() { try { return JSON.parse(localStorage.getItem('bd_session') || 'null'); } catch (e) { return null; } }
  function userEmail() {
    var s = session();
    if (s && s.email) return String(s.email).toLowerCase();
    var e = localStorage.getItem('bd_user_email');
    return e ? String(e).toLowerCase() : 'guest';
  }
  function key() { return 'bd_wishlist::' + userEmail(); }
  function readLocal() { try { return JSON.parse(localStorage.getItem(key()) || '[]'); } catch (e) { return []; } }
  function writeLocal(arr) {
    try { localStorage.setItem(key(), JSON.stringify(arr)); } catch (e) {}
    try { global.dispatchEvent(new CustomEvent('bd:wishlist', { detail: arr })); } catch (e) {}
  }
  function isSignedIn() { var s = session(); return !!(s && s.email) || !!localStorage.getItem('bd_user_email'); }
  var WL = {
    read: function () { return readLocal(); },
    write: function (arr) { writeLocal(Array.isArray(arr) ? arr : []); },
    signedIn: isSignedIn,
    add: function (item) {
      var list = readLocal();
      if (list.some(function (x) { return String(x.id) === String(item.id); })) return list;
      list.unshift(item); writeLocal(list); WL.sync(); return list;
    },
    remove: function (id) { var list = readLocal().filter(function (x) { return String(x.id) !== String(id); }); writeLocal(list); WL.sync(); return list; },
    toggle: function (item) { var e = readLocal().some(function (x) { return String(x.id) === String(item.id); }); if (e) { WL.remove(item.id); return false; } WL.add(item); return true; },
    has: function (id) { return readLocal().some(function (x) { return String(x.id) === String(id); }); },
    pull: function () {
      if (!isSignedIn()) return Promise.resolve(readLocal());
      return fetch('/api/wishlist', { credentials: 'include' })
        .then(function (r) { if (r.status === 401) return null; return r.json(); })
        .then(function (d) { if (d && Array.isArray(d.wishlist)) { writeLocal(d.wishlist); return d.wishlist; } return readLocal(); })
        .catch(function () { return readLocal(); });
    },
    push: function () {
      if (!isSignedIn()) return Promise.resolve(false);
      return fetch('/api/wishlist', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wishlist: readLocal() }) })
        .then(function (r) { return r.ok || r.status === 401; }).catch(function () { return false; });
    },
    sync: function () { WL.push(); }
  };
  try {
    var legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      var cur = readLocal(); var parsed = null;
      try { parsed = JSON.parse(legacy); } catch (e) {}
      if (parsed && Array.isArray(parsed) && parsed.length && cur.length === 0) writeLocal(parsed);
      localStorage.removeItem(LEGACY_KEY);
    }
  } catch (e) {}
  global.BD = global.BD || {};
  global.BD.wishlist = { list: WL.read, save: WL.write, add: WL.add, remove: WL.remove, toggle: WL.toggle, has: WL.has, pull: WL.pull, push: WL.push, sync: WL.sync };
  global.BDWishlist = WL;
})(window);
