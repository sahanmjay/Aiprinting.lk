// Order emails via Resend (server-only; folders starting with _ are not routes).
// Failures are logged and swallowed by the callers' emailOnce: an email must never fail a payment or an order.
import { Resend } from 'resend';
import { adminDb } from '../_payhere.js';
import { withDefaults } from '../_pricing.js';

const env = (name) => (process.env[name] || '').trim();
const SITE_URL = (env('SITE_URL') || 'https://www.aiprinting.lk').replace(/\/+$/, '');
const PICKUP_ADDRESS = '11/A Gangarama Rd, Werahara, Boralesgamuwa';
const SEND_TIMEOUT_MS = 5000;

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const lkr = (n) => `Rs. ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (iso) =>
  new Date(iso || Date.now()).toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo', day: 'numeric', month: 'long', year: 'numeric' });

const METHOD = { payhere: 'Card / online payment (PayHere)', bank_transfer: 'Bank transfer', cod: 'Cash on delivery' };
const STATUS = { pending: 'Awaiting payment', verification_needed: 'Slip received – being verified', paid: 'Paid', failed: 'Failed' };

const TYPES = {
  payhere_paid: { subject: (n) => `Payment received – Order ${n} confirmed`, heading: 'Payment received – your order is confirmed', status: 'paid' },
  bank_pending: { subject: (n) => `Order ${n} received – awaiting bank transfer`, heading: 'We have received your order' },
  bank_verified: { subject: (n) => `Payment verified – Order ${n} confirmed`, heading: 'Payment verified – your order is confirmed', status: 'paid' },
};

let client;
const resend = () => (client ??= new Resend(env('RESEND_API_KEY')));

async function loadSettings() {
  const { data } = await adminDb().from('site_settings').select('value').eq('key', 'settings').maybeSingle();
  return withDefaults(data?.value ?? {});
}

// Resend returns { error } instead of throwing; turn it into a throw so callers have one failure path.
async function send(message) {
  if (!env('RESEND_API_KEY') || !env('MAIL_FROM')) throw new Error('RESEND_API_KEY / MAIL_FROM not set');
  const { error } = await resend().emails.send({
    from: env('MAIL_FROM'),
    ...(env('MAIL_REPLY_TO') ? { replyTo: env('MAIL_REPLY_TO') } : {}),
    ...message,
  });
  if (error) throw new Error(`Resend: ${error.name || 'error'} ${error.message || ''}`.trim());
}

const itemLines = (order) =>
  (Array.isArray(order.items) ? order.items : []).map((i) => ({
    name: i.product?.name || 'Print item',
    options: [
      ...(i.selectedOptions ?? []).map((o) => `${o.groupName}: ${o.valueLabel}`),
      ...(i.selectedAddons ?? []).map((a) => a.name).filter(Boolean),
      i.artworkType === 'design' ? 'Design service' : '',
    ].filter(Boolean),
    qty: `${i.quantityCount ?? ''}${i.quantity > 1 ? ` × ${i.quantity}` : ''}`.trim() || '1',
    total: i.lineTotal,
    turnaround: i.product?.deliveryNote,
  }));

const turnaround = (items) =>
  [...new Set(items.map((i) => i.turnaround).filter(Boolean))].join(' · ') ||
  'Usually printed and dispatched within 1–2 working days after proof approval.';

const deliveryText = (o) =>
  o.delivery_method === 'pickup'
    ? `Workshop pickup: ${PICKUP_ADDRESS}`
    : `Courier delivery: ${[o.delivery_address, o.city, o.district].filter(Boolean).join(', ')}`;

const FOOTER =
  'Please do not reply to this email. This is an automated notification sent by AiPrinting.lk PrintShop regarding your order. ' +
  'If you have any questions or require assistance, please contact our customer support team through our official contact ' +
  'details or WhatsApp. Thank you for choosing AiPrinting.lk PrintShop. We appreciate your business!';

const trackUrl = (o) => `${SITE_URL}/account?order=${encodeURIComponent(o.order_number)}`;

const row = (label, value, bold) =>
  `<tr><td style="padding:4px 0;color:#555;">${label}</td><td style="padding:4px 0;text-align:right;${bold ? 'font-weight:bold;color:#D6342C;font-size:16px;' : ''}">${value}</td></tr>`;

function layout(heading, body) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FAF8F5;font-family:Arial,Helvetica,sans-serif;color:#2B2B2B;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;"><tr><td align="center" style="padding:16px 8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #E6E0D6;border-radius:8px;">
<tr><td style="background:#0F1B2D;color:#ffffff;padding:16px 20px;border-bottom:4px solid #D6342C;font-size:18px;font-weight:bold;">AiPrinting.lk PrintShop</td></tr>
<tr><td style="padding:20px;font-size:14px;line-height:1.5;">
<h1 style="margin:0 0 12px;font-size:20px;color:#0F1B2D;">${heading}</h1>
${body}
</td></tr></table></td></tr></table></body></html>`;
}

export async function sendOrderEmail(order, type) {
  const t = TYPES[type];
  if (!t) throw new Error(`unknown email type ${type}`);
  const s = await loadSettings();
  const items = itemLines(order);
  const status = STATUS[t.status ?? order.payment_status] ?? order.payment_status;
  const bank = s.bankDetails ?? {};

  const itemsHtml = items
    .map(
      (i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;vertical-align:top;">
<strong>${esc(i.name)}</strong>${i.options.length ? `<br><span style="color:#666;font-size:12px;">${i.options.map(esc).join('<br>')}</span>` : ''}
<br><span style="color:#666;font-size:12px;">Qty: ${esc(i.qty)}</span></td>
<td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;vertical-align:top;white-space:nowrap;">${esc(lkr(i.total))}</td></tr>`
    )
    .join('');

  const bankHtml =
    type === 'bank_pending'
      ? `<div style="margin:16px 0;padding:12px;background:#FFF8E6;border:1px solid #F2D27A;border-radius:6px;">
<strong>Please transfer ${esc(lkr(order.total))} to:</strong><br>
${esc(bank.accountName)}<br>${esc(bank.bankName)} – ${esc(bank.branch)}<br>Account no: <strong>${esc(bank.accountNumber)}</strong><br>
Use <strong>${esc(order.order_number)}</strong> as the payment reference.<br><br>
${
  order.bank_slip_url
    ? 'We have received your payment slip and will verify it shortly.'
    : `<strong>Send your payment slip:</strong> after transferring, send a photo of the slip with your order number on WhatsApp ${esc(s.whatsapp)} or email ${esc(s.email)}. You can check your order status any time using the button below.`
}</div>`
      : '';

  const html = layout(
    esc(t.heading),
    `<p style="margin:0 0 12px;">Hi ${esc(order.customer_name)},</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
${row('Order number', `<strong>${esc(order.order_number)}</strong>`)}
${row('Order date', esc(date(order.created_at)))}
${row('Payment method', esc(METHOD[order.payment_method] ?? order.payment_method))}
${row('Payment status', esc(status))}
</table>
${bankHtml}
<h2 style="font-size:15px;margin:16px 0 4px;color:#0F1B2D;">Items</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">${itemsHtml}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:8px;">
${row('Subtotal', esc(lkr(order.subtotal)))}
${row('Delivery fee', esc(order.delivery_method === 'pickup' ? 'Free (pickup)' : lkr(order.delivery_fee)))}
${row('Total', esc(lkr(order.total)), true)}
</table>
<h2 style="font-size:15px;margin:16px 0 4px;color:#0F1B2D;">Delivery</h2>
<p style="margin:0;">${esc(deliveryText(order))}</p>
${order.special_instructions ? `<p style="margin:8px 0 0;color:#555;"><strong>Your notes:</strong> ${esc(order.special_instructions)}</p>` : ''}
<h2 style="font-size:15px;margin:16px 0 4px;color:#0F1B2D;">Expected turnaround</h2>
<p style="margin:0;">${esc(turnaround(items))}</p>
<p style="margin:24px 0;text-align:center;"><a href="${esc(trackUrl(order))}" style="display:inline-block;background:#D6342C;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:6px;">Track your order</a></p>
<p style="margin:0;">Hotline: <a href="tel:${esc(String(s.hotline).replace(/\s+/g, ''))}" style="color:#D6342C;">${esc(s.hotline)}</a><br>WhatsApp: ${esc(s.whatsapp)}</p>
<hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
<p style="margin:0;font-size:12px;color:#777;">${esc(FOOTER)}</p>
<p style="margin:8px 0 0;font-size:12px;"><a href="${SITE_URL}/terms" style="color:#777;">Terms &amp; Conditions</a> · <a href="${SITE_URL}/refund-policy" style="color:#777;">Refund Policy</a></p>`
  );

  const text = [
    t.heading,
    '',
    `Hi ${order.customer_name},`,
    '',
    `Order number: ${order.order_number}`,
    `Order date: ${date(order.created_at)}`,
    `Payment method: ${METHOD[order.payment_method] ?? order.payment_method}`,
    `Payment status: ${status}`,
    ...(type === 'bank_pending'
      ? [
          '',
          `Please transfer ${lkr(order.total)} to:`,
          bank.accountName,
          `${bank.bankName} – ${bank.branch}`,
          `Account no: ${bank.accountNumber}`,
          `Reference: ${order.order_number}`,
          order.bank_slip_url
            ? 'We have received your payment slip and will verify it shortly.'
            : `After transferring, send a photo of the slip with your order number on WhatsApp ${s.whatsapp} or email ${s.email}.`,
        ]
      : []),
    '',
    'Items:',
    ...items.map((i) => `- ${i.name} (Qty: ${i.qty}) – ${lkr(i.total)}${i.options.length ? `\n  ${i.options.join('\n  ')}` : ''}`),
    '',
    `Subtotal: ${lkr(order.subtotal)}`,
    `Delivery fee: ${order.delivery_method === 'pickup' ? 'Free (pickup)' : lkr(order.delivery_fee)}`,
    `Total: ${lkr(order.total)}`,
    '',
    deliveryText(order),
    ...(order.special_instructions ? [`Your notes: ${order.special_instructions}`] : []),
    `Expected turnaround: ${turnaround(items)}`,
    '',
    `Track your order: ${trackUrl(order)}`,
    `Hotline: ${s.hotline} · WhatsApp: ${s.whatsapp}`,
    '',
    FOOTER,
    `Terms: ${SITE_URL}/terms · Refund Policy: ${SITE_URL}/refund-policy`,
  ].join('\n');

  await send({ to: order.customer_email, subject: t.subject(order.order_number), html, text });
}

export async function sendAdminNewOrder(order) {
  const to = env('MAIL_REPLY_TO');
  if (!to) throw new Error('MAIL_REPLY_TO not set');
  const lines = [
    ['Customer', order.customer_name],
    ['Phone', order.customer_phone],
    ['Total', lkr(order.total)],
    ['Payment', `${METHOD[order.payment_method] ?? order.payment_method} – ${STATUS[order.payment_status] ?? order.payment_status}`],
  ];
  await send({
    to,
    subject: `New order ${order.order_number}`,
    html: layout(
      `New order ${esc(order.order_number)}`,
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">${lines.map(([k, v]) => row(k, esc(v))).join('')}</table>
<p style="margin:20px 0 0;text-align:center;"><a href="${SITE_URL}/admin" style="display:inline-block;background:#0F1B2D;color:#ffffff;text-decoration:none;font-weight:bold;padding:10px 20px;border-radius:6px;">Open admin</a></p>`
    ),
    text: [`New order ${order.order_number}`, ...lines.map(([k, v]) => `${k}: ${v}`), '', `Admin: ${SITE_URL}/admin`].join('\n'),
  });
}

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

// Sends at most once per order + column. The column is claimed atomically first (only one parallel request
// gets the row back); if Resend reports an error the claim is released so a later trigger can retry.
// On timeout the claim is kept, because the email may still have gone out. Never throws.
export async function emailOnce(order, column, task) {
  const db = adminDb();
  try {
    const { data, error } = await db
      .from('orders')
      .update({ [column]: new Date().toISOString() })
      .eq('id', order.id)
      .is(column, null)
      .select('id');
    if (error) throw new Error(`claim: ${error.message}`);
    if (!data?.length) return false;
  } catch (e) {
    console.error('email: could not claim', column, order.order_number, e.message);
    return false;
  }
  try {
    await withTimeout(task(), SEND_TIMEOUT_MS);
    return true;
  } catch (e) {
    console.error('email: send failed', column, order.order_number, e.message);
    if (e.message !== 'timeout') await db.from('orders').update({ [column]: null }).eq('id', order.id);
    return false;
  }
}

// Customer email decides success (and the claim); the admin copy is best-effort.
export const customerAndAdmin = (order, type) => async () => {
  await sendOrderEmail(order, type);
  await sendAdminNewOrder(order).catch((e) => console.error('email: admin copy failed', order.order_number, e.message));
};
