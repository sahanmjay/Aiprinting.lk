// POST { orderId } -> the signed form fields for PayHere Checkout.
// The amount comes from the saved order in the database, never from the browser request.
import { CHECKOUT_URL, MERCHANT_ID, SANDBOX, adminDb, checkoutHash, formatAmount, isConfigured } from './_payhere.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isConfigured()) return res.status(500).json({ error: 'PayHere is not configured on the server' });

  const orderId = req.body?.orderId;
  if (typeof orderId !== 'string' || !orderId) return res.status(400).json({ error: 'orderId is required' });

  const { data: order, error } = await adminDb().from('orders').select('*').eq('id', orderId).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.payment_method !== 'payhere') return res.status(400).json({ error: 'Order is not a PayHere order' });
  if (order.payment_status === 'paid') return res.status(409).json({ error: 'Order is already paid' });

  const origin = `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
  const amount = formatAmount(order.total);
  const currency = 'LKR';
  const [firstName, ...rest] = order.customer_name.trim().split(/\s+/);

  res.status(200).json({
    action: CHECKOUT_URL,
    sandbox: SANDBOX,
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
