// Bargain Drop — Frontend Auth Guard v4
// Fail-closed: account routes require a valid server session (__session cookie).
// Uses `/api/auth?action=me` to decide; redirects signed-out visitors to sign-in.
(function () {
  'use strict';
  if (window.__bdAuthGuard) return;
  window.__bdAuthGuard = true;

  var ACCOUNT_ROUTES = [
    '/orders.html','/wallet.html','/wishlist.html','/addresses.html',
    '/gift-cards.html','/settings.html','/security.html','/profile-edit.html',
    '/payment-methods.html','/account-info.html','/communication-preferences.html',
    '/deactivate.html','/order-tracking.html','/returns.html'
  ];

  var serverSession = null;
  var resolved = false;
  var resolvers = [];

  function setServerSession(user) {
    serverSession = user;
    resolved = true;
    resolvers.forEach(function (fn) { try { fn(user); } catch (e) {} });
    resolvers = [];
    if (user) { try { window.dispatchEvent(new CustomEvent('bd:session', { detail: user })); } catch (e) {} }
  }
  function isAuthenticated() { return !!(resolved && serverSession); }
  function getCurrentPath() { return window.location.pathname; }
  function isAccountRoute() {
    var path = getCurrentPath();
    for (var i = 0; i < ACCOUNT_ROUTES.length; i++) {
      if (path.substring(path.length - ACCOUNT_ROUTES[i].length) === ACCOUNT_ROUTES[i]) return true;
    }
    return false;
  }
  function guard() {
    if (isAccountRoute() && !isAuthenticated()) {
      var returnUrl = encodeURIComponent(window.location.href);
      window.location.replace('/sign-in.html?redirect=' + returnUrl);
      return false;
    }
    return true;
  }

  fetch('/api/auth?action=me', { credentials: 'include' })
    .then(function (r) { return r.json(); })
    .then(function (d) { setServerSession(d && d.user ? d.user : null); guard(); })
    .catch(function () { setServerSession(null); guard(); });

  window.__bdIsAuthenticated = isAuthenticated;
  window.__bdGuard = guard;
  window.__bdWhenSession = function (fn) { if (resolved) fn(serverSession); else resolvers.push(fn); };
})();
