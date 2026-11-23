// Cloudflare Pages Function: /api/payid-order
// Creates a real Australian PayID / Osko bank transfer order with atomic inventory lock,
// unique payment reference (BD-PID-XXXXXX), durable order ledger write, and email instructions.
// Once payment arrives in the store bank account, 1-click confirmation in Admin auto-dispatches to CJ (payType=3).

import {
  corsHeaders,
  saveOrderRecord,
  lockAndVerifyInventory,
  normalizePhoneE164,
  sendPaymentInstructionsEmail,
} from '../_sync-lib.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders() },
  });
}

const VALID_PROMOS = {
  BARGAIN26: 30,
  SAVE10: 10,
  WELCOME10: 10,
  COMEBACK10: 10,
  SAVE5AUD: 15,
  FREESHIP: 0,
  FREESHIP29: 0,
};

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await request.json();
    const rawOrder = body.order || body;
    const items = Array.isArray(rawOrder.items) ? rawOrder.items : [];
    if (!items.length) return json({ error: 'Cart is empty' }, 400);

    const ship = rawOrder.shipping || rawOrder.shippingAddress || {};
    const email = String(rawOrder.email || ship.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return json({ error: 'Valid email address is required' }, 400);
    if (!ship.address1 && !ship.addr) return json({ error: 'Shipping street address is required' }, 400);
    if (!ship.city || !ship.zip) return json({ error: 'Shipping city and postcode are required' }, 400);

    const countryCode = String(ship.country_code || ship.countryCode || 'AU').toUpperCase();
    const phoneE164 = normalizePhoneE164(ship.phone || rawOrder.phone || '', countryCode);
    if (!phoneE164) return json({ error: 'Valid phone number is required for courier delivery updates' }, 400);

    const orderId =
      rawOrder.id && String(rawOrder.id).startsWith('BD-')
        ? String(rawOrder.id)
        : 'BD-PID-' + Date.now().toString(36).toUpperCase().slice(-6);

    // Server-side subtotal & promo verification
    const subtotal = +items
      .reduce((sum, it) => sum + Math.max(0, Number(it.price || 0)) * Math.max(1, Number(it.qty || it.quantity || 1)), 0)
      .toFixed(2);
    const promoCode = String(rawOrder.discount?.code || rawOrder.promo_code || '').trim().toUpperCase();
    const discountPct =
      promoCode && Object.prototype.hasOwnProperty.call(VALID_PROMOS, promoCode)
        ? VALID_PROMOS[promoCode]
        : promoCode.startsWith('COMEBACK10')
        ? 10
        : 0;
    const discountAmount = +(subtotal * (discountPct / 100)).toFixed(2);
    const afterDiscount = Math.max(0, +(subtotal - discountAmount).toFixed(2));
    const freeShip = promoCode === 'FREESHIP' || promoCode === 'FREESHIP29' || afterDiscount >= 29;
    const shippingCost = freeShip ? 0 : Math.max(0, Number(rawOrder.shippingCost || 0));
    const totalAud = Math.max(0.5, +(afterDiscount + shippingCost).toFixed(2));

    // Lock stock atomically
    const inventoryLock = await lockAndVerifyInventory(env, items, orderId);
    if (!inventoryLock.ok) {
      return json(
        {
          ok: false,
          error: inventoryLock.message || 'Stock verification failed',
          code: inventoryLock.code || 'STOCK_LOCK_FAILED',
        },
        409
      );
    }

    const payidIdentifier = String((env && env.PAYID_IDENTIFIER) || 'Support@bargain-drop.online').trim();
    const payidAccountName = String((env && env.PAYID_ACCOUNT_NAME) || 'Bargain Drop Australia').trim();
    const payidBsb = String((env && env.PAYID_BSB) || '').trim();
    const payidAccountNumber = String((env && env.PAYID_ACCOUNT_NUMBER) || '').trim();

    const payidInstructions = {
      method: 'PayID / Osko',
      payid: payidIdentifier,
      payidType: payidIdentifier.includes('@') ? 'Email PayID' : 'Mobile / ABN PayID',
      accountName: payidAccountName,
      bsb: payidBsb || null,
      accountNumber: payidAccountNumber || null,
      amountAud: totalAud,
      reference: orderId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const orderRecord = await saveOrderRecord(env, {
      ...rawOrder,
      id: orderId,
      email,
      phone: phoneE164,
      name:
        rawOrder.name ||
        ship.fullName ||
        [ship.first_name, ship.last_name].filter(Boolean).join(' ').trim() ||
        'Customer',
      status: 'awaiting_payid',
      paymentStatus: 'awaiting_payid',
      payment_verified: false,
      method: 'PayID / Osko',
      paymentMethod: 'PayID / Osko',
      payment: {
        gateway: 'payid',
        reference: orderId,
        payid: payidIdentifier,
        amount: totalAud,
        currency: 'AUD',
      },
      payidInstructions,
      subtotal,
      shippingCost,
      discount: { code: promoCode || null, percent: discountPct, amount: discountAmount },
      total: totalAud,
      currency: 'AUD',
      shipping: {
        ...ship,
        phone: phoneE164,
        country_code: countryCode,
      },
      inventory_lock: inventoryLock,
      cartCleared: true,
    });

    // Send customer PayID instructions email (best-effort)
    try {
      const lines = [
        { label: 'PayID', value: payidIdentifier },
        { label: 'Account Name', value: payidAccountName },
        ...(payidBsb && payidAccountNumber ? [{ label: 'BSB / Account', value: `${payidBsb} / ${payidAccountNumber}` }] : []),
        { label: 'Exact Amount', value: `A$${totalAud.toFixed(2)}` },
        { label: 'Payment Reference (Required)', value: orderId },
      ];
      await sendPaymentInstructionsEmail(env, orderRecord, {
        title: 'PayID / Osko Transfer Instructions',
        lines,
      });
    } catch {}

    return json({
      ok: true,
      orderId,
      status: 'awaiting_payid',
      order: orderRecord,
      payid: payidInstructions,
      successUrl: `/order-success.html?id=${encodeURIComponent(orderId)}&method=payid`,
    });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
