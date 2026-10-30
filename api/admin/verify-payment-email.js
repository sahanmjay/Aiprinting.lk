// POST { orderId } with "Authorization: Bearer <admin's Supabase access token>"
// -> sends the "bank_verified" email once, after the admin has marked a bank-transfer order paid.
import { createClient } from '@supabase/supabase-js';
import { adminDb } from '../_payhere.js';
import { emailOnce, sendOrderEmail } from '../_lib/email.js';

const env = (name) => (process.env[name] || '').trim();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = /^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1];
  if (!token) return res.status(401).json({ error: 'Not signed in' });

  // getUser checks the token with Supabase Auth; is_admin() (run as that user) also requires 2-step (aal2) + admin_users.
  const asUser = createClient(env('VITE_SUPABASE_URL') || 'https://enrdcnhpvpcoiipkfaad.supabase.co', env('VITE_SUPABASE_ANON_KEY'), {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const [{ data: user, error: userError }, { data: isAdmin, error: adminError }] = await Promise.all([
    asUser.auth.getUser(token),
    asUser.rpc('is_admin'),
  ]);
  if (userError || !user?.user || adminError || isAdmin !== true) return res.status(403).json({ error: 'Not allowed' });

  const { orderId } = req.body ?? {};
  if (typeof orderId !== 'string') return res.status(400).json({ error: 'Invalid order' });

  try {
    const { data: order, error } = await adminDb().from('orders').select('*').eq('id', orderId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.payment_method !== 'bank_transfer' || order.payment_status !== 'paid') {
      return res.status(200).json({ sent: false });
    }
    const sent = await emailOnce(order, 'verified_email_sent_at', () => sendOrderEmail(order, 'bank_verified'));
    return res.status(200).json({ sent });
  } catch (e) {
    console.error('verify-payment-email: could not process', e.message);
    return res.status(200).json({ sent: false });
  }
}
