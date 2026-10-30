// PayHere server-to-server payment notification (form POST). This is the ONLY place an order
// gets marked paid: the md5sig proves the message came from PayHere with our merchant secret.
import { timingSafeEqual } from 'node:crypto';
import { MERCHANT_ID, adminDb, formatAmount, isConfigured, notifySignature } from './_payhere.js';
import { customerAndAdmin, emailOnce } from './_lib/email.js';

// PayHere status_code -> our payment_status
const STATUS = { '2': 'paid', '0': 'pending', '-1': 'failed', '-2': 'failed', '-3': 'failed' };

const sameText = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!isConfigured()) return res.status(500).end();

  const n = req.body || {};
  if (!sameText(n.merchant_id, MERCHANT_ID) || !sameText(String(n.md5sig || '').toUpperCase(), notifySignature(n))) {
    console.warn('PayHere notify: bad signature for order', n.order_id);
    return res.status(400).end();
  }

  const db = adminDb();
  const paymentId = String(n.payment_id || '');
  const statusCode = String(n.status_code);

  // PayHere retries notifications: the same payment_id + status_code is handled once.
  const { data: seen, error: seenError } = await db
    .from('payment_events')
    .select('id')
    .eq('payment_id', paymentId)
    .eq('status_code', statusCode)
    .maybeSingle();
  if (seenError) return fail(res, 'read event', seenError);
  if (seen) return res.status(200).end();

  const { data: order, error: orderError } = await db
    .from('orders')
    .select('*')
    .eq('order_number', n.order_id)
    .maybeSingle();
  if (orderError) return fail(res, 'read order', orderError);
  if (!order) return res.status(404).end();

  let paymentStatus = STATUS[statusCode] ?? 'failed';
  // A "success" for a different amount than the (server-priced) order total is not accepted as paid.
  if (paymentStatus === 'paid' && (n.payhere_currency !== 'LKR' || n.payhere_amount !== formatAmount(order.total))) {
    console.warn('PayHere notify: amount mismatch for order', n.order_id, n.payhere_amount, order.total);
    paymentStatus = 'verification_needed';
  }

  // Never change an order that is already paid, even if a later cancelled/failed notification arrives.
  const { data: updated, error: updateError } = await db
    .from('orders')
    .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
    .eq('id', order.id)
    .neq('payment_status', 'paid')
    .select('id');
  if (updateError) return fail(res, 'update order', updateError);

  const { error: eventError } = await db.from('payment_events').insert({
    payment_id: paymentId,
    status_code: statusCode,
    order_number: String(n.order_id),
    amount: n.payhere_amount,
    currency: n.payhere_currency,
    applied_status: paymentStatus,
  });
  // 23505 = a parallel retry recorded it first; the update above is idempotent, so that is fine.
  if (eventError && eventError.code !== '23505') return fail(res, 'record event', eventError);

  // Only the notification that turned the order paid sends; emailOnce also blocks parallel retries. Never fails the 200.
  if (paymentStatus === 'paid' && updated?.length) {
    await emailOnce(order, 'confirmation_email_sent_at', customerAndAdmin({ ...order, payment_status: 'paid' }, 'payhere_paid'));
  }

  res.status(200).end();
}

// Non-200 makes PayHere retry the notification later.
function fail(res, step, error) {
  console.error(`PayHere notify: could not ${step}`, error.message);
  return res.status(500).end();
}
