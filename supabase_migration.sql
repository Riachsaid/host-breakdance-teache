-- ============================================================
-- Ghost Breakdance Teacher — Supabase Schema Migration
-- Run this in the Supabase SQL Editor (https://supabase.com)
-- ============================================================

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. SUBSCRIPTIONS TABLE (server-authoritative expiry)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL CHECK (plan IN ('monthly','annual','lifetime')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  txid            TEXT,
  payment_method  TEXT CHECK (payment_method IN ('redotpay','binance','changelly')),
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin read all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Insert own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. FUNCTION: get_active_subscription (server-time based)
CREATE OR REPLACE FUNCTION public.get_active_subscription(p_user_id UUID)
RETURNS TABLE (
  plan           TEXT,
  status         TEXT,
  txid           TEXT,
  payment_method TEXT,
  expires_at     TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT s.plan, s.status, s.txid, s.payment_method, s.expires_at
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
    AND (s.expires_at IS NULL OR s.expires_at > now())
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- 4. FUNCTION: sync_premium_status (called after login)
CREATE OR REPLACE FUNCTION public.sync_premium_status(p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  sub_record RECORD;
  result     JSONB;
BEGIN
  SELECT s.plan, s.status, s.txid, s.payment_method, s.expires_at
  INTO sub_record
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
    AND (s.expires_at IS NULL OR s.expires_at > now())
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF sub_record.plan IS NOT NULL THEN
    result := jsonb_build_object(
      'active', true,
      'plan', sub_record.plan,
      'txid', sub_record.txid,
      'payment_method', sub_record.payment_method,
      'expires_at', sub_record.expires_at,
      'server_time', now()
    );
  ELSE
    result := jsonb_build_object(
      'active', false,
      'plan', null,
      'txid', null,
      'payment_method', null,
      'expires_at', null,
      'server_time', now()
    );
  END IF;

  RETURN result;
END;
$$;

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON public.subscriptions(expires_at);
