// POST { order_number, phone } -> sends the "bank_pending" email + admin copy for a bank-transfer order, once.
// Orders are inserted by the browser, so nothing it sends is trusted: the order is re-read with the service
// role and must match the phone. confirmation_email_sent_at makes repeated calls no-ops.
import { adminDb } from './_payhere.js';
import { customerAndAdmin, emailOnce } from './_lib/email.js';

const digits = (v) => String(v ?? '').replace(/\D/g, '');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { order_number: orderNumber, phone } = req.body ?? {};
  if (typeof orderNumber !== 'string' || orderNumber.length > 40 || digits(phone).length < 9) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    const { data: order, error } = await adminDb()
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber.trim())
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (
      order &&
      order.payment_method === 'bank_transfer' &&
      !order.confirmation_email_sent_at &&
      digits(order.customer_phone).slice(-9) === digits(phone).slice(-9)
    ) {
      await emailOnce(order, 'confirmation_email_sent_at', customerAndAdmin(order, 'bank_pending'));
    }
  } catch (e) {
    console.error('order-created: could not process', e.message);
  }
  // Same answer either way: does not reveal whether an order exists.
  res.status(204).end();
}
