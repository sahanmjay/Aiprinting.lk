-- Migration: order confirmation emails (Resend). Safe to re-run.
-- Each column is claimed atomically (UPDATE ... WHERE col IS NULL) before sending, so an email goes out once.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS verified_email_sent_at TIMESTAMP WITH TIME ZONE;
