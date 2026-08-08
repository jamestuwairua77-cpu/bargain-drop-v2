// Bargain Drop -- Frontend Auth Guards v2
// Phase 6: Client-side state checks + redirect guards

(function() {
  'use strict';
  if (window.__bdAuthGuard) return;
  window.__bdAuthGuard = true;

  const ACCOUNT_ROUTES = ['/profile.html', '/profile-edit.html', '/settings.html', '/security.html', '/orders.html', '/wishlist.html', '/addresses.html', '/payment-methods.html', '/account-info.html', '/communication-preferences.html', '/deactivate.html', '/order-tracking.html'];

  function isAuthenticated() {
    try {
      const session = JSON.parse(localStorage.getItem('bd_session') || 'null');
      return session && session.email;
    } catch(e) { return false; }
  }

  function getCurrentPath() {
    return window.location.pathname;
  }

  function guard() {
    const path = getCurrentPath();
    const isAccountRoute = ACCOUNT_ROUTES.some(r => path.endsWith(r.replace('/', '')));
    
    if (isAccountRoute && !isAuthenticated()) {
      const returnUrl = encodeURIComponent(window.location.href);
      window.location.href = '/sign-in.html?redirect=' + returnUrl;
      return false;
    }
    return true;
  }

  if (document.readyState !== 'loading') {
    guard();
  } else {
    document.addEventListener('DOMContentLoaded', guard);
  }

  window.__bdIsAuthenticated = isAuthenticated;
  window.__bdGuard = guard;
})();
