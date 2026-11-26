// Cloudflare Pages Function: /api/crypto-order
// Supports two 100% automated non-Stripe crypto rails (zero discounts applied):
// A) Automated NOWPayments hosted invoice + instant IPN webhook (when NOWPAYMENTS_API_KEY is configured)
// B) Direct non-custodial self-custody wallet transfer + AUTOMATIC on-chain blockchain verification (Tronscan / Blockstream / Public RPC)
//    -> Automatically marks order PAID and triggers fulfillOrder() -> CJ create & auto-pay -> doorstep delivery with ZERO clicks!

import {
  corsHeaders,
  saveOrderRecord,
  updateOrderStatus,
  listOrders,
  lockAndVerifyInventory,
  normalizePhoneE164,
  sendPaymentInstructionsEmail,
  verifyCryptoTxOnChain,
  fulfillOrder,
} from '../_sync-lib.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders() },
  });
}

async function getAudCryptoRate(coin) {
  const c = String(coin || 'USDT').toUpperCase();
  const fallback = c === 'BTC' ? 148000 : 1.54;
  const cgId = c === 'BTC' ? 'bitcoin' : c === 'USDC' ? 'usd-coin' : 'tether';
  try {
    const r = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=aud`,
      { headers: { Accept: 'application/json', 'User-Agent': 'bargain-drop-checkout' } }
    );
    if (!r.ok) return { rateAud: fallback, source: 'fallback' };
    const d = await r.json();
    const val = Number(d?.[cgId]?.aud);
    return { rateAud: val > 0 ? val : fallback, source: val > 0 ? 'coingecko_live' : 'fallback' };
  } catch {
    return { rateAud: fallback, source: 'fallback' };
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders() });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await request.json();
    const action = url.searchParams.get('action') || body.action || 'create';

    // ── Action: Customer submits blockchain TxID -> REAL-TIME ON-CHAIN AUTO-VERIFY & DISPATCH ──
    if (action === 'submit-tx') {
      const orderId = String(body.orderId || body.order_id || '').trim();
      const txHash = String(body.txHash || body.txid || body.hash || '').trim();
      if (!orderId || !txHash || txHash.length < 16) {
        return json({ ok: false, error: 'Valid Order ID and Blockchain Transaction Hash (TxID) are required' }, 400);
      }
      const orders = await listOrders(env);
      const found = orders.find((o) => String(o.id) === orderId);
      if (!found) return json({ ok: false, error: 'Order not found' }, 404);

      const coin = found.cryptoInstructions?.coin || found.payment?.coin || 'USDT';
      const targetAddr = found.cryptoInstructions?.walletAddress || found.payment?.walletAddress || '';
      const expectedAmt = found.cryptoInstructions?.cryptoAmount || found.payment?.cryptoAmount || 0;

      // Immediately check blockchain explorer for instant zero-click confirmation!
      const verification = await verifyCryptoTxOnChain(coin, txHash, targetAddr, expectedAmt);
      if (verification.verified) {
        const paidOrd = await updateOrderStatus(env, orderId, 'paid', {
          cryptoTxHash: txHash,
          cryptoTxSubmittedAt: new Date().toISOString(),
          paymentStatus: 'paid',
          payment_verified: true,
          paidAt: new Date().toISOString(),
          onChainVerification: verification,
          payment: {
            ...(typeof found.payment === 'object' && found.payment ? found.payment : { gateway: 'crypto' }),
            hash: txHash,
            verifiedBy: 'onchain_auto_verifier',
            verifiedAt: new Date().toISOString(),
          },
        });
        const fulfillment = await fulfillOrder(env, paidOrd || found);
        return json({
          ok: true,
          verifiedOnChain: true,
          orderId,
          txHash,
          status: fulfillment?.status || 'fulfilling',
          cjOrderId: fulfillment?.cjOrderId || null,
          message: 'Payment verified on-chain! Your order has been automatically sent to fulfillment for dispatch.',
        });
      }

      // Still confirming in mempool -> save TxID so background autopilot auto-verifies & dispatches on next block
      const updated = await updateOrderStatus(env, orderId, 'awaiting_crypto', {
        cryptoTxHash: txHash,
        cryptoTxSubmittedAt: new Date().toISOString(),
        payment: {
          ...(typeof found.payment === 'object' && found.payment ? found.payment : { gateway: 'crypto' }),
          hash: txHash,
          txSubmittedAt: new Date().toISOString(),
        },
      });
      return json({
        ok: true,
        verifiedOnChain: false,
        orderId,
        txHash,
        status: updated?.status || 'awaiting_crypto',
        verificationReason: verification.reason,
        message: 'Transaction hash saved! Our automated blockchain verifier is watching for confirmation and will dispatch to CJ automatically.',
      });
    }

    // ── Action: Create new Crypto order (zero discounts) ──
    const rawOrder = body.order || body;
    const coin = String(body.coin || rawOrder.coin || 'USDT').toUpperCase();
    if (!['USDT', 'USDC', 'BTC'].includes(coin)) {
      return json({ error: 'Supported coins are USDT, USDC, or BTC' }, 400);
    }

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
        : 'BD-CRY-' + Date.now().toString(36).toUpperCase().slice(-6);

    const subtotal = +items
      .reduce((sum, it) => sum + Math.max(0, Number(it.price || 0)) * Math.max(1, Number(it.qty || it.quantity || 1)), 0)
      .toFixed(2);
    const freeShip = subtotal >= 29;
    const shippingCost = freeShip ? 0 : Math.max(0, Number(rawOrder.shippingCost || 4.95));
    const totalAud = Math.max(0.5, +(subtotal + shippingCost).toFixed(2));

    const inventoryLock = await lockAndVerifyInventory(env, items, orderId);
    if (!inventoryLock.ok) {
      return json(
        { ok: false, error: inventoryLock.message || 'Stock verification failed', code: inventoryLock.code },
        409
      );
    }

    const { rateAud, source: rateSource } = await getAudCryptoRate(coin);
    const cryptoAmount =
      coin === 'BTC' ? +(totalAud / rateAud).toFixed(6) : +(totalAud / rateAud).toFixed(2);

    const networkLabel =
      coin === 'USDT' ? 'TRC20 (Tron)' : coin === 'USDC' ? 'ERC20 / Polygon' : 'Bitcoin Mainnet';
    const directAddress =
      coin === 'USDT'
        ? String((env && env.CRYPTO_USDT_TRC20_ADDRESS) || '').trim()
        : coin === 'USDC'
        ? String((env && env.CRYPTO_USDC_ERC20_ADDRESS) || '').trim()
        : String((env && env.CRYPTO_BTC_ADDRESS) || '').trim();

    let invoiceUrl = null;
    let nowPaymentsId = null;

    if (env && env.NOWPAYMENTS_API_KEY) {
      const origin = String(env.PUBLIC_STORE_ORIGIN || new URL(request.url).origin).replace(/\/+$/, '');
      const payCurrency = coin === 'USDT' ? 'usdttrc20' : coin === 'USDC' ? 'usdcerc20' : 'btc';
      try {
        const npRes = await fetch('https://api.nowpayments.io/v1/invoice', {
          method: 'POST',
          headers: {
            'x-api-key': env.NOWPAYMENTS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            price_amount: totalAud,
            price_currency: 'aud',
            pay_currency: payCurrency,
            order_id: orderId,
            order_description: `Bargain Drop Order #${orderId}`,
            ipn_callback_url: `${origin}/api/crypto-webhook`,
            success_url: `${origin}/order-success.html?id=${encodeURIComponent(orderId)}&method=crypto&verified=1`,
            cancel_url: `${origin}/checkout.html`,
          }),
        });
        if (npRes.ok) {
          const npData = await npRes.json();
          invoiceUrl = npData.invoice_url || null;
          nowPaymentsId = npData.id ? String(npData.id) : null;
        }
      } catch {}
    }

    if (!invoiceUrl && !directAddress) {
      return json(
        {
          ok: false,
          error: `Crypto receiving wallet for ${coin} is not configured yet in Cloudflare Secrets (set CRYPTO_${coin === 'USDT' ? 'USDT_TRC20' : coin === 'USDC' ? 'USDC_ERC20' : 'BTC'}_ADDRESS or NOWPAYMENTS_API_KEY). Please use PayPal or PayID/Osko meanwhile.`,
          code: 'CRYPTO_WALLET_NOT_CONFIGURED',
        },
        400
      );
    }

    const cryptoInstructions = {
      coin,
      network: networkLabel,
      cryptoAmount,
      amountAud: totalAud,
      rateAud,
      rateSource,
      walletAddress: directAddress || null,
      invoiceUrl,
      nowPaymentsId,
      reference: orderId,
      autoVerifyOnChain: true,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
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
      status: 'awaiting_crypto',
      paymentStatus: 'awaiting_crypto',
      payment_verified: false,
      method: `Crypto (${coin})`,
      paymentMethod: `Crypto (${coin})`,
      payment: {
        gateway: 'crypto',
        coin,
        network: networkLabel,
        cryptoAmount,
        walletAddress: directAddress || null,
        invoiceUrl,
        nowPaymentsId,
        amount: totalAud,
        currency: 'AUD',
      },
      cryptoInstructions,
      subtotal,
      shippingCost,
      discount: { code: null, percent: 0, amount: 0 },
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

    try {
      const lines = [
        { label: 'Asset & Network', value: `${coin} (${networkLabel})` },
        { label: 'Exact Crypto Amount', value: `${cryptoAmount} ${coin} (A$${totalAud.toFixed(2)})` },
        ...(directAddress ? [{ label: 'Receiving Wallet Address', value: directAddress }] : []),
        ...(invoiceUrl ? [{ label: 'Hosted Payment Invoice', value: invoiceUrl }] : []),
        { label: 'Order Reference', value: orderId },
      ];
      await sendPaymentInstructionsEmail(env, orderRecord, {
        title: `Crypto Payment Instructions (${coin})`,
        lines,
      });
    } catch {}

    return json({
      ok: true,
      orderId,
      status: 'awaiting_crypto',
      order: orderRecord,
      crypto: cryptoInstructions,
      invoiceUrl,
      successUrl: `/order-success.html?id=${encodeURIComponent(orderId)}&method=crypto`,
    });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
