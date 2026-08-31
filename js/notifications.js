// Bargain Drop — shared notification badge helper
// Loaded on pages that render the standard toolbar. Fetches the user's order
// notifications from /api/my-notifications and updates any #nav-notif-count badge
// with the number of UNREAD notifications (newer than the last-seen timestamp).
//
// Idempotent and safe to include on any page: if there's no badge element or no
// session, it simply does nothing.
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
    var e = email();
    return SEEN_KEY_BASE + (e || 'guest');
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
    // Multiple badges may exist (desktop navbar + bottom nav) — update all.
    var nodes = document.querySelectorAll('#nav-notif-count');
    for (var i = 0; i < nodes.length; i++) setBadge(count, nodes[i]);
  }

  // Mark everything seen (called when the notification centre page opens).
  global.BDMarkNotificationsRead = function () {
    try { localStorage.setItem(seenKey(), String(Date.now())); } catch (e) {}
    applyBadges(0);
  };

  // Public refresh — returns a promise resolving to the notifications array.
  global.BDRefreshNotifications = function () {
    var e = email();
    if (!e) { applyBadges(0); return Promise.resolve([]); }
    var url = '/api/my-notifications?email=' + encodeURIComponent(e) + '&_=' + Date.now();
    return fetch(url, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { notifications: [] }; })
      .then(function (data) {
        var notifs = data.notifications || [];
        var seen = lastSeen();
        var unread = notifs.filter(function (n) {
          var t = n.at ? new Date(n.at).getTime() : Date.now();
          return t > seen;
        }).length;
        applyBadges(unread);
        return notifs;
      })
      .catch(function () { applyBadges(0); return []; });
  };

  // Auto-refresh on load once the DOM is ready.
  function boot() {
    try {
      if (document.querySelector('#nav-notif-count')) {
        global.BDRefreshNotifications();
      }
    } catch (e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
