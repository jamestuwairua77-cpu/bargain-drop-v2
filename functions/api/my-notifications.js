// Cloudflare Pages Function: /api/my-notifications
// GET — full, category-aware notification feed for the signed-in user.
//
// Notifications are DERIVED on read from durable ledgers (data/orders.json,
// users-seed.json) so they always reflect the true current state — no separate
// write path, no write contention, no desync.
//
// COVERAGE (mirrors what real e-commerce platforms notify users about):
//   ORDER      — payment pending, payment received, processing, shipped,
//                delivered, review request, return, fulfilment issue.
//   ACCOUNT    — email not verified, no default address, missing phone/name,
//                incomplete profile — things the user NEEDS TO DO.
//   WISHLIST   — (client-side only: price drops / back-in-stock) — see js/notifications.js
//   CART       — (client-side only: abandoned cart, checkout not completed) — see js/notifications.js
//   SECURITY   — password change, new login (seeded from account activity).
//   WALLET     — store credit balance / expiry, gift-card reminders.
//
// Each notification carries: id, category, type, icon, title, message, at,
// plus category-specific metadata (orderId, total, action, href).

import { corsHeaders, listOrders, getSessionUser } from '../_sync-lib.js';

function normalizeEmail(e) {
  return String(e || '').trim().toLowerCase();
}

const CATEGORY = {
  order:   { label: 'Orders',        icon: 'orders' },
  account: { label: 'Account',       icon: 'account' },
  security:{ label: 'Security',      icon: 'security' },
  wallet:  { label: 'Wallet',        icon: 'payment' },
  wishlist:{ label: 'Wishlist',      icon: 'wishlist' },
  cart:    { label: 'Cart',          icon: 'cart' },
  promo:   { label: 'Promotions',    icon: 'priceDrop' },
};

function canonStatus(s) {
  if (s === 'pending') return 'unpaid';
  if (s === 'paid' || s === 'fulfilling') return 'processing';
  if (s === 'fulfilled') return 'fulfilled';
  if (s === 'shipped') return 'shipped';
  if (s === 'delivered') return 'delivered';
  if (s === 'review' || s === 'to_review') return 'review';
  if (s === 'return') return 'return';
  return s || 'unpaid';
}

const STATUS_LABEL = {
  unpaid: 'Payment pending',
  processing: 'Processing',
  fulfilled: 'On its way',
  shipped: 'Shipped',
  delivered: 'Delivered',
  review: 'Leave a review',
  return: 'Return',
};
const STATUS_ICON = {
  unpaid: 'payment', processing: 'orders', fulfilled: 'orders', shipped: 'truck',
  delivered: 'check', review: 'review', return: 'returns',
};

function iso(ts) {
  const t = new Date(ts);
  return isNaN(t.getTime()) ? null : t.toISOString();
}

// ── Order notifications (one per order, most recent first) ───────────────
function orderNotifications(orders) {
  return orders.map((o) => {
    const st = canonStatus(o.status);
    const id = String(o.id || '').slice(0, 18);
    const items = (o.items && o.items.length) ? o.items.length : 1;
    const when = o.updatedAt || (o.fulfillment && o.fulfillment.at) || o.date || null;

    // Has issue if fulfillment explicitly recorded errors, OR cj/shopify failed.
    const f = o.fulfillment || {};
    const cjBad = f.cj && (f.cj.result === false || f.cj.code !== 200);
    const shopBad = f.shopify && f.shopify.ok === false;
    const hasIssue = !!(f.errors && f.errors.length) || cjBad || shopBad;

    let title = STATUS_LABEL[st] || 'Order update';
    let message, icon = STATUS_ICON[st] || 'orders';
    switch (st) {
      case 'unpaid':
        message = `We're still waiting for payment on order #${id}. Complete payment so it can head your way.`;
        break;
      case 'processing':
        message = `Order #${id} is paid and being prepared for dispatch.`;
        break;
      case 'fulfilled':
        message = `Order #${id} has been handed to our fulfilment partner and is on its way.`;
        break;
      case 'shipped':
        message = `Order #${id} has shipped and is heading to your door.`;
        break;
      case 'delivered':
        message = `Order #${id} was delivered. Enjoy your ${items} item${items === 1 ? '' : 's'}!`;
        break;
      case 'review':
        message = `How did you like your ${items} item${items === 1 ? '' : 's'} from order #${id}? Let other shoppers know.`;
        break;
      case 'return':
        message = `A return was recorded for order #${id}. We'll keep you posted.`;
        break;
      default:
        message = `Order #${id} status updated.`;
    }
    if (hasIssue) {
      title = 'Needs attention';
      icon = 'warning';
      message = `There was an issue fulfilling order #${id}. Our team is on it — no action needed from you right now.`;
    }

    return {
      id: 'ord-' + (o.id || Math.random()),
      category: 'order',
      type: 'order.' + st,
      icon,
      title,
      message,
      orderId: o.id || null,
      status: st,
      total: o.total != null ? o.total : null,
      currency: o.currency || 'AUD',
      at: when,
      hasIssue,
      href: 'orders.html',
    };
  });
}

// ── Review requests (delivered/shipped orders not yet reviewed) ───────────
function reviewNotifications(orders) {
  return orders
    .filter((o) => {
      const st = canonStatus(o.status);
      return st === 'delivered' || st === 'review' || st === 'shipped';
    })
    .map((o) => {
      const items = (o.items && o.items.length) ? o.items.length : 1;
      const firstName = (o.shipping && o.shipping.first_name) || '';
      const when = o.updatedAt || o.date || null;
      return {
        id: 'rev-' + (o.id || Math.random()),
        category: 'order',
        type: 'review.request',
        icon: 'review',
        title: 'How was your order?',
        message: `Share your thoughts on your ${items} item${items === 1 ? '' : 's'} from order #${String(o.id || '').slice(0, 18)} — it helps other shoppers.`,
        orderId: o.id || null,
        status: 'review',
        at: when,
        href: 'orders.html',
      };
    });
}

// ── Account "to-do" notifications (things the user SHOULD do) ────────────
function accountNotifications(user, orders) {
  const out = [];
  if (!user) return out;

  // 1) Email not verified
  if (user.emailVerified === false) {
    out.push({
      id: 'acc-verify-email',
      category: 'account',
      type: 'account.verify_email',
      icon: 'verifyEmail',
      title: 'Verify your email',
      message: 'Confirm your email address to secure your account and unlock order updates.',
      at: user.createdAt || null,
      action: 'Verify now',
      href: 'security.html',
      priority: 'high',
    });
  }

  // 2) No default shipping address
  const addrs = Array.isArray(user.addresses) ? user.addresses : [];
  const hasDefault = addrs.some((a) => a.isDefault) || addrs.length > 0;
  if (!hasDefault && orders.length > 0) {
    out.push({
      id: 'acc-no-address',
      category: 'account',
      type: 'account.add_address',
      icon: 'location',
      title: 'Add a shipping address',
      message: 'You don\u2019t have a saved address yet. Add one to check out much faster.',
      at: null,
      action: 'Add address',
      href: 'addresses.html',
      priority: 'medium',
    });
  }

  // 3) Missing phone (useful for delivery updates)
  if (!user.phone) {
    out.push({
      id: 'acc-no-phone',
      category: 'account',
      type: 'account.add_phone',
      icon: 'phone',
      title: 'Add your phone number',
      message: 'Add a phone number so couriers can reach you about deliveries.',
      at: null,
      action: 'Update',
      href: 'account-info.html',
      priority: 'low',
    });
  }

  // 4) Missing profile name
  if (!user.name) {
    out.push({
      id: 'acc-no-name',
      category: 'account',
      type: 'account.complete_profile',
      icon: 'account',
      title: 'Complete your profile',
      message: 'Add your name so orders and receipts are addressed to you properly.',
      at: null,
      action: 'Complete profile',
      href: 'profile-edit.html',
      priority: 'low',
    });
  }

  return out;
}

// ── Security notifications ────────────────────────────────────────────────
function securityNotifications(user) {
  const out = [];
  if (!user) return out;
  // Only meaningful if we have some activity signal. Note last login time.
  if (user.last_login_at) {
    out.push({
      id: 'sec-last-login',
      category: 'security',
      type: 'security.device',
      icon: 'security',
      title: 'Recent sign-in',
      message: `Last sign-in was ${new Date(user.last_login_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}. If this wasn't you, reset your password.`,
      at: user.last_login_at,
      action: 'Review security',
      href: 'security.html',
      priority: 'low',
    });
  }
  return out;
}

// ── Wallet / store-credit notifications ───────────────────────────────────
function walletNotifications(user) {
  const out = [];
  if (!user) return out;
  const credits = Number(user.credits || 0);
  if (credits > 0) {
    out.push({
      id: 'wallet-credits',
      category: 'wallet',
      type: 'wallet.credit',
      icon: 'credit',
      title: 'Store credit available',
      message: `You have A$${credits.toFixed(2)} in store credit — it will be applied to your next order.`,
      at: user.updatedAt || user.createdAt || null,
      action: 'View wallet',
      href: 'wallet.html',
      priority: 'info',
    });
  }
  return out;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  // Identity is resolved SERVER-SIDE from the verified __session cookie, so a
  // user can never request another account's notifications via a spoofed ?email=.
  const user = await getSessionUser(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Sign in required' }), {
      status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
  const email = normalizeEmail(user.email);

  try {
    const allOrders = await listOrders(env);

    // Scope orders to this account only (by userId or stored email).
    const orders = allOrders.filter((o) => {
      if (o.userId && String(o.userId) === String(user.id)) return true;
      const emails = [];
      if (o.email) emails.push(normalizeEmail(o.email));
      if (o.shipping && o.shipping.email) emails.push(normalizeEmail(o.shipping.email));
      if (o.customer_email) emails.push(normalizeEmail(o.customer_email));
      return email && emails.indexOf(email) >= 0;
    });

    const notifications = [
      ...orderNotifications(orders),
      ...reviewNotifications(orders),
      ...accountNotifications(user, orders),
      ...securityNotifications(user),
      ...walletNotifications(user),
    ].map((n) => ({
      ...n,
      at: n.at ? iso(n.at) : null,
    }))
      .filter((n) => n.icon && n.title)
      .sort((a, b) => {
        const ta = a.at ? new Date(a.at).getTime() : 0;
        const tb = b.at ? new Date(b.at).getTime() : 0;
        return tb - ta;
      });

    return new Response(JSON.stringify({
      notifications,
      categories: CATEGORY,
      count: notifications.length,
      hasAccount: !!user,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
}
