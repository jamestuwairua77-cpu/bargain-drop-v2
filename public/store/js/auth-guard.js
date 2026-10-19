// Bargain Drop — Frontend Auth Guard (Preview Gate Disabled)
// Allows previewing account routes (/profile, /orders, /wallet, etc.) seamlessly as James Tuwairua.
(function () {
  'use strict';
  if (window.__bdAuthGuard) return;
  window.__bdAuthGuard = true;

  var previewUser = {"id":"usr_preview_james","name":"James Tuwairua","username":"jamestuwairua","email":"jamestuwairua77@gmail.com","picture":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80","tier":"VIP Drop Member","role":"customer","verified":true,"createdAt":"2024-01-15T08:00:00Z"};

  // Ensure local session is pre-seeded for any legacy check
  try {
    if (!localStorage.getItem('bd_session')) {
      localStorage.setItem('bd_session', JSON.stringify(previewUser));
      localStorage.setItem('bd_user_name', previewUser.name);
      localStorage.setItem('bd_user_email', previewUser.email);
    }
  } catch (e) {}

  var serverSession = previewUser;
  var resolved = true;
  var resolvers = [];

  function setServerSession(user) {
    serverSession = user || previewUser;
    resolved = true;
    resolvers.forEach(function (fn) { try { fn(serverSession); } catch (e) {} });
    resolvers = [];
    try { window.dispatchEvent(new CustomEvent('bd:session', { detail: serverSession })); } catch (e) {}
  }

  function isAuthenticated() { return true; }
  function guard() { return true; }

  // Still attempt fetch if backend exists, but fall back cleanly to previewUser
  try {
    fetch('/api/auth?action=me', { credentials: 'include' })
      .then(function (r) { return r.json(); })
      .then(function (d) { setServerSession(d && d.user ? d.user : previewUser); })
      .catch(function () { setServerSession(previewUser); });
  } catch(e) {
    setServerSession(previewUser);
  }

  window.__bdIsAuthenticated = isAuthenticated;
  window.__bdGuard = guard;
  window.__bdWhenSession = function (fn) { fn(serverSession); };
})();
