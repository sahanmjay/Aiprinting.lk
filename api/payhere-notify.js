// PayHere server-to-server payment notification (form POST). This is the ONLY place an order
// gets marked paid: the md5sig proves the message came from PayHere with our merchant secret.
import { MERCHANT_ID, adminDb, formatAmount, isConfigured, notifySignature } from './_payhere.js';

// PayHere status_code -> our payment_status
const STATUS = { '2': 'paid', '0': 'pending', '-1': 'failed', '-2': 'failed', '-3': 'failed' };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!isConfigured()) return res.status(500).end();

  const n = req.body || {};
  const expected = notifySignature(n);
  if (n.merchant_id !== MERCHANT_ID || String(n.md5sig || '').toUpperCase() !== expected) {
    console.warn('PayHere notify: bad signature for order', n.order_id);
    return res.status(400).end();
  }

  const db = adminDb();
  const { data: order } = await db.from('orders').select('id,total,payment_status').eq('order_number', n.order_id).maybeSingle();
  if (!order) return res.status(404).end();

  let paymentStatus = STATUS[String(n.status_code)] ?? 'failed';
  // A "success" for a different amount than the order total is not accepted as paid.
  if (paymentStatus === 'paid' && (n.payhere_currency !== 'LKR' || n.payhere_amount !== formatAmount(order.total))) {
    console.warn('PayHere notify: amount mismatch for order', n.order_id, n.payhere_amount, order.total);
    paymentStatus = 'verification_needed';
  }
  // Never downgrade an order that is already paid (PayHere may retry notifications).
  if (order.payment_status !== 'paid') {
    await db
      .from('orders')
      .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
      .eq('id', order.id);
  }
  res.status(200).end();
}
