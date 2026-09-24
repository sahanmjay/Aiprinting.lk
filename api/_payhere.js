// Shared PayHere + Supabase helpers for the Vercel functions (files starting with _ are not routes).
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export const SANDBOX = process.env.PAYHERE_SANDBOX === 'true';
export const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID;
const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET;

export const CHECKOUT_URL = SANDBOX
  ? 'https://sandbox.payhere.lk/pay/checkout'
  : 'https://www.payhere.lk/pay/checkout';

const md5Upper = (s) => createHash('md5').update(s).digest('hex').toUpperCase();

// PayHere amounts are always formatted with exactly 2 decimals.
export const formatAmount = (n) => Number(n).toFixed(2);

// hash = MD5(merchant_id + order_id + amount + currency + MD5(secret)) — all upper-case hex
export function checkoutHash(orderId, amount, currency) {
  return md5Upper(MERCHANT_ID + orderId + amount + currency + md5Upper(MERCHANT_SECRET));
}

// md5sig = MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(secret))
export function notifySignature({ merchant_id, order_id, payhere_amount, payhere_currency, status_code }) {
  return md5Upper(merchant_id + order_id + payhere_amount + payhere_currency + status_code + md5Upper(MERCHANT_SECRET));
}

export const isConfigured = () =>
  Boolean(MERCHANT_ID && MERCHANT_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY);

// Service-role client: bypasses RLS, so it must only ever run on the server.
export const adminDb = () =>
  createClient(
    process.env.VITE_SUPABASE_URL || 'https://enrdcnhpvpcoiipkfaad.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
