-- Fix the permissive RLS policy for company_users
DROP POLICY IF EXISTS "System can insert company users" ON public.company_users;

CREATE POLICY "Authenticated users can insert their own company user record"
  ON public.company_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);