-- Migration: admin rights require 2-step verification (TOTP).
-- is_admin() is now true only for a user in admin_users whose session passed the authenticator code (aal2).
-- Every admin RLS policy calls is_admin(), so a stolen password alone no longer opens any admin data.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT COALESCE(auth.jwt() ->> 'aal', '') = 'aal2'
       AND EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid());
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Admins now sign in with any email, so the email-domain check in handle_new_customer() no longer
-- keeps every staff login out of the customer list. Remove the ones already there.
DELETE FROM public.customers WHERE id IN (SELECT id FROM public.admin_users);
