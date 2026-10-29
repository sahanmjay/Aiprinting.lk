// POST { orderId, expectedTotal } -> the signed form fields for PayHere Checkout.
// The order is re-priced here from the saved catalogue (api/_pricing.js); browser prices are never trusted.
// If the server price differs from the total the customer saw, nothing is signed: the corrected total is
// returned so the customer can confirm it, then the browser calls again with that total.
import { CHECKOUT_URL, MERCHANT_ID, adminDb, checkoutHash, formatAmount, isConfigured, siteOrigin } from './_payhere.js';
import { buildCatalogue, priceOrder } from './_pricing.js';

const ORDER_ID = /^ord-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const origin = siteOrigin(req);
  if (!isConfigured() || !origin) {
    console.error('payhere-checkout: PAYHERE_MODE, merchant credentials or SITE_URL not set correctly');
    return res.status(500).json({ error: 'Payment temporarily unavailable' });
  }

  const { orderId, expectedTotal } = req.body ?? {};
  if (typeof orderId !== 'string' || !ORDER_ID.test(orderId)) return res.status(400).json({ error: 'Invalid order' });

  const db = adminDb();
  const [{ data: order, error }, { data: rows, error: settingsError }] = await Promise.all([
    db.from('orders').select('*').eq('id', orderId).maybeSingle(),
    db.from('site_settings').select('key, value').in('key', ['price_matrix', 'settings', 'products']),
  ]);
  if (error || settingsError) {
    console.error('payhere-checkout: database error', (error || settingsError).message);
    return res.status(500).json({ error: 'Could not load the order' });
  }
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.payment_method !== 'payhere') return res.status(400).json({ error: 'Order is not a PayHere order' });
  if (order.payment_status === 'paid') return res.status(409).json({ error: 'Order is already paid' });

  let priced;
  try {
    priced = priceOrder(order.items, order.delivery_method, buildCatalogue(rows ?? []));
  } catch (e) {
    console.warn('payhere-checkout: order cannot be priced', order.order_number, e.message);
    return res.status(422).json({ error: 'Some items in this order need a price confirmed by our staff' });
  }
  const amount = formatAmount(priced.total);

  // Saved total (written by the browser) differs from the server price: correct it and keep a record.
  if (formatAmount(order.total) !== amount) {
    console.warn('payhere-checkout: PRICE MISMATCH', order.order_number, 'client', order.total, 'server', priced.total);
    const [{ error: updateError }] = await Promise.all([
      db
        .from('orders')
        .update({
          subtotal: priced.subtotal,
          delivery_fee: priced.deliveryFee,
          addon_total: priced.addonTotal,
          total: priced.total,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)
        .neq('payment_status', 'paid'),
      db
        .from('price_mismatches')
        .insert({ order_number: order.order_number, client_total: order.total, server_total: priced.total })
        .then((r) => (r.error && console.error('payhere-checkout: could not log mismatch', r.error.message), r)),
    ]);
    if (updateError) {
      console.error('payhere-checkout: could not correct total', order.order_number, updateError.message);
      return res.status(500).json({ error: 'Could not update the order total' });
    }
  }

  // Never charge an amount the customer has not seen and confirmed.
  if (typeof expectedTotal !== 'number' || formatAmount(expectedTotal) !== amount) {
    return res.status(200).json({ priceChanged: true, ...priced });
  }

  const currency = 'LKR';
  const [firstName, ...rest] = order.customer_name.trim().split(/\s+/);

  // action is the live or sandbox PayHere URL; the browser just posts the form there, so the mode is server-only.
  res.status(200).json({
    action: CHECKOUT_URL,
    fields: {
      merchant_id: MERCHANT_ID,
      return_url: `${origin}/order-confirmation/${order.id}?payment=return`,
      cancel_url: `${origin}/order-confirmation/${order.id}?payment=cancelled`,
      notify_url: `${origin}/api/payhere-notify`,
      order_id: order.order_number,
      items: `Print order ${order.order_number}`,
      currency,
      amount,
      first_name: firstName,
      last_name: rest.join(' ') || firstName,
      email: order.customer_email,
      phone: order.customer_phone,
      address: order.delivery_address,
      city: order.city,
      country: 'Sri Lanka',
      hash: checkoutHash(order.order_number, amount, currency),
    },
  });
}
