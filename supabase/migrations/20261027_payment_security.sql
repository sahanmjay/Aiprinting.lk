-- Migration: server-side order pricing + PayHere notification hardening (security audit #1, #4, #5)
-- Safe to re-run.

-- #4: every PayHere notification that passed the signature check, once per payment_id + status_code.
-- A repeated notification finds its row here and is ignored.
CREATE TABLE IF NOT EXISTS public.payment_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payment_id TEXT NOT NULL,
    status_code TEXT NOT NULL,
    order_number TEXT NOT NULL,
    amount TEXT,
    currency TEXT,
    applied_status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (payment_id, status_code)
);

-- #1: an order whose browser-written total differed from the server price (possible tampering).
CREATE TABLE IF NOT EXISTS public.price_mismatches (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_number TEXT NOT NULL,
    client_total NUMERIC(12, 2) NOT NULL,
    server_total NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Written only by the API (service role bypasses RLS); admins can read them.
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_mismatches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can read" ON public.payment_events;
DROP POLICY IF EXISTS "Admin can read" ON public.price_mismatches;
CREATE POLICY "Admin can read" ON public.payment_events FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admin can read" ON public.price_mismatches FOR SELECT TO authenticated USING (public.is_admin());

-- #5: the app keeps order lines in orders.items and never writes these tables; anonymous inserts only allowed junk rows.
DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can upload artwork file references" ON public.artwork_files;
