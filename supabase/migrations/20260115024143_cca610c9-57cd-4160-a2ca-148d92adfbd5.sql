-- Add 'admin' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';

-- Create company_admins table to track which users are admins of which "company group"
CREATE TABLE IF NOT EXISTS public.company_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.company_admins ENABLE ROW LEVEL SECURITY;

-- Policies for company_admins
CREATE POLICY "Users can view their own admin status"
  ON public.company_admins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert new admins"
  ON public.company_admins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_admins WHERE user_id = auth.uid()
    ) OR NOT EXISTS (SELECT 1 FROM public.company_admins)
  );

-- Create company_users table to track company members
CREATE TABLE IF NOT EXISTS public.company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.company_admins(id) ON DELETE CASCADE,
  email TEXT,
  upgraded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- Policies for company_users
CREATE POLICY "Admins can view their company users"
  ON public.company_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.company_admins WHERE user_id = auth.uid() AND id = company_users.admin_id
    )
  );

CREATE POLICY "Users can view their own record"
  ON public.company_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert company users"
  ON public.company_users FOR INSERT
  WITH CHECK (true);

-- Create passkey_settings table for admin to manage passkeys
CREATE TABLE IF NOT EXISTS public.passkey_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.company_admins(id) ON DELETE CASCADE,
  passkey TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.passkey_settings ENABLE ROW LEVEL SECURITY;

-- Policies for passkey_settings
CREATE POLICY "Admins can manage their passkeys"
  ON public.passkey_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.company_admins WHERE user_id = auth.uid() AND id = passkey_settings.admin_id
    )
  );