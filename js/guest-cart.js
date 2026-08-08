// Bargain Drop -- Guest Cart & Migration v2
// Phase 4: Guest session tracking + cart merge on login

(function() {
  'use strict';
  if (window.bdGuest) return;

  window.bdGuest = {
    getCart() {
      try { return JSON.parse(localStorage.getItem('bd_guest_cart') || '[]'); }
      catch(e) { return []; }
    },
    
    setCart(items) {
      localStorage.setItem('bd_guest_cart', JSON.stringify(items));
    },
    
    getSession() {
      try { return JSON.parse(localStorage.getItem('bd_guest_session') || 'null'); }
      catch(e) { return null; }
    },
    
    initSession() {
      if (!this.getSession()) {
        const session = {
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'guest_' + Date.now().toString(36),
          created: Date.now()
        };
        localStorage.setItem('bd_guest_session', JSON.stringify(session));
      }
    },
    
    migrateToUser(userEmail) {
      const guestCart = this.getCart();
      if (!guestCart.length) return;
      
      const userCart = JSON.parse(localStorage.getItem(`bd_cart::${userEmail}`) || '[]');
      const userItems = new Map(userCart.map(i => [i.productId, i]));
      
      for (const guestItem of guestCart) {
        if (userItems.has(guestItem.productId)) {
          userItems.get(guestItem.productId).qty += guestItem.qty;
        } else {
          userCart.push({ ...guestItem, addedFromGuest: true });
        }
      }
      
      userCart.forEach(i => { i.mergedAt = Date.now(); });
      localStorage.setItem(`bd_cart::${userEmail}`, JSON.stringify(userCart));
      localStorage.removeItem('bd_guest_cart');
      return userCart;
    }
  };

  window.bdGuest.initSession();
})();
