// Shared PayHere + Supabase helpers for the Vercel functions (files starting with _ are not routes).
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// Trimmed: a stray space/newline pasted into Vercel silently breaks the hash ("Unauthorized payment request").
const env = (name) => (process.env[name] || '').trim();

// The mode comes ONLY from PAYHERE_MODE. Missing or unknown = no payments at all, never a silent fallback.
const CHECKOUT_URLS = {
  live: 'https://www.payhere.lk/pay/checkout',
  sandbox: 'https://sandbox.payhere.lk/pay/checkout',
};
const MODE = env('PAYHERE_MODE').toLowerCase();
export const CHECKOUT_URL = Object.hasOwn(CHECKOUT_URLS, MODE) ? CHECKOUT_URLS[MODE] : '';
export const MERCHANT_ID = env('PAYHERE_MERCHANT_ID');
const MERCHANT_SECRET = env('PAYHERE_MERCHANT_SECRET');
const SITE_URL = env('SITE_URL').replace(/\/+$/, '');

// Base for return/cancel/notify URLs. Live: only the fixed SITE_URL (the final, non-redirecting https
// domain, since PayHere does not follow redirects on its notify POST), never the request's Host header.
// Sandbox falls back to the request host so preview deployments can be tested. '' = not configured.
export function siteOrigin(req) {
  if (/^https:\/\/[^/\s]+$/.test(SITE_URL)) return SITE_URL;
  return MODE === 'sandbox' ? `https://${req.headers['x-forwarded-host'] || req.headers.host}` : '';
}

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
  Boolean(CHECKOUT_URL && MERCHANT_ID && MERCHANT_SECRET && env('SUPABASE_SERVICE_ROLE_KEY'));

// Service-role client: bypasses RLS, so it must only ever run on the server.
export const adminDb = () =>
  createClient(
    env('VITE_SUPABASE_URL') || 'https://enrdcnhpvpcoiipkfaad.supabase.co',
    env('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } }
  );
