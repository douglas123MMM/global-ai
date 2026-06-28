-- PARTE 1: Solo las tablas nuevas (sin conflicto con Platiz)
-- Ejecuta esto PRIMERO

CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  uses INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 999,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON public.referral_codes(user_id);

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  tier TEXT DEFAULT 'level1',
  commission_percentage INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(referred_id)
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  tier TEXT NOT NULL DEFAULT 'basic',
  price DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  percentage INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  stripe_payout_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_commissions_referrer ON public.commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_month_year ON public.commissions(year, month);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);

CREATE TABLE IF NOT EXISTS public.user_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  available_balance DECIMAL(10,2) DEFAULT 0,
  pending_balance DECIMAL(10,2) DEFAULT 0,
  total_earned DECIMAL(10,2) DEFAULT 0,
  total_withdrawn DECIMAL(10,2) DEFAULT 0,
  stripe_connect_id TEXT,
  paypal_email TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_user_balance_user ON public.user_balance(user_id);

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_details JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_withdrawal_user ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON public.withdrawal_requests(status);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions(created_at);

CREATE TABLE IF NOT EXISTS public.founders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_number INTEGER NOT NULL,
  badge TEXT DEFAULT 'founder',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(founder_number)
);
CREATE INDEX IF NOT EXISTS idx_founders_user ON public.founders(user_id);
CREATE INDEX IF NOT EXISTS idx_founders_number ON public.founders(founder_number);

CREATE TABLE IF NOT EXISTS public.referral_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,
  commission_percentage INTEGER NOT NULL,
  min_commissions DECIMAL(10,2),
  min_referrals INTEGER,
  bonus_amount DECIMAL(10,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.referral_tiers (tier_name, commission_percentage, min_commissions, min_referrals, bonus_amount, description)
VALUES 
  ('level1', 20, NULL, NULL, 0, 'Comision base del 20%'),
  ('level2', 25, 25.00, NULL, 0, 'Comision mejorada del 25% ($25+ en comisiones)'),
  ('founder', 25, NULL, NULL, 0, 'Comision del 25% para fundadores')
ON CONFLICT (tier_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.bonus_paid (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bonus_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  milestone INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bonus_paid_user ON public.bonus_paid(user_id);

-- Tabla profiles: solo agregar columnas si no existen
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_ip TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referrer_code TEXT;
  ELSE
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      role TEXT DEFAULT 'user',
      referrer_code TEXT,
      signup_ip TEXT,
      email_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

SELECT 'Parte 1 completada - 11 tablas creadas' as resultado;
