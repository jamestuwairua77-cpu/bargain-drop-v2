// Bargain Drop — Frontend Auth Guard v4.1
// Fail-closed: account routes require a valid server session (__session cookie).
// Uses `/api/auth?action=me` to decide; redirects signed-out visitors to sign-in.
// NOTE: Cloudflare Pages auto-resolves "foo.html" -> "/foo" (308), so the browser's
// location.pathname is EXTENSIONLESS. We normalize by stripping any trailing ".html"
// before matching, and the route list uses extensionless paths.
(function () {
  'use strict';
  if (window.__bdAuthGuard) return;
  window.__bdAuthGuard = true;

  var ACCOUNT_ROUTES = [
    '/profile','/orders','/wallet','/wishlist','/addresses',
    '/gift-cards','/settings','/security','/profile-edit',
    '/payment-methods','/account-info','/communication-preferences',
    '/deactivate','/order-tracking','/returns'
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
  function getCurrentPath() {
    var path = window.location.pathname || '/';
    if (path.length > 1 && path.charAt(path.length - 1) === '/') path = path.slice(0, -1);
    if (path.length > 5 && path.slice(-5).toLowerCase() === '.html') path = path.slice(0, -5);
    return path.toLowerCase();
  }
  function isAccountRoute() {
    var path = getCurrentPath();
    for (var i = 0; i < ACCOUNT_ROUTES.length; i++) {
      var route = ACCOUNT_ROUTES[i];
      if (path === route || path.substring(path.length - route.length) === route) return true;
    }
    return false;
  }
  function guard() {
    if (isAccountRoute() && !isAuthenticated()) {
      var returnUrl = encodeURIComponent(window.location.href);
      window.location.replace('/sign-in?redirect=' + returnUrl);
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
