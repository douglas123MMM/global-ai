-- Global AI - Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- 1. REFERRAL CODES
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

CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_codes_user ON public.referral_codes(user_id);

-- 2. REFERRALS
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

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON public.referrals(referred_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);

-- 3. USER PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  referrer_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- 4. SUBSCRIPTIONS
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

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- 5. COMMISSIONS (monthly)
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

CREATE INDEX idx_commissions_referrer ON public.commissions(referrer_id);
CREATE INDEX idx_commissions_month_year ON public.commissions(year, month);
CREATE INDEX idx_commissions_status ON public.commissions(status);

-- 6. USER BALANCE
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

CREATE INDEX idx_user_balance_user ON public.user_balance(user_id);

-- 7. WITHDRAWAL REQUESTS
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

CREATE INDEX idx_withdrawal_user ON public.withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_status ON public.withdrawal_requests(status);

-- 8. TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_created ON public.transactions(created_at);

-- 9. FOUNDERS
CREATE TABLE IF NOT EXISTS public.founders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_number INTEGER NOT NULL,
  badge TEXT DEFAULT 'founder',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(founder_number)
);

CREATE INDEX idx_founders_user ON public.founders(user_id);
CREATE INDEX idx_founders_number ON public.founders(founder_number);

-- 10. REFERRAL TIERS
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

-- 11. BONUS PAID TRACKING
CREATE TABLE IF NOT EXISTS public.bonus_paid (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bonus_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  milestone INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bonus_paid_user ON public.bonus_paid(user_id);

-- TRIGGER: Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'user'
  );
  
  INSERT INTO public.user_balance (user_id, available_balance, pending_balance, total_earned, total_withdrawn)
  VALUES (NEW.id, 0, 0, 0, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- FUNCTION: Generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || user_uuid::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (user_uuid, new_code);
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION: Check and update tier
CREATE OR REPLACE FUNCTION public.check_and_update_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  total_comm DECIMAL(10,2);
  is_founder BOOLEAN;
  current_tier TEXT;
  new_tier TEXT;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_comm
  FROM public.commissions
  WHERE referrer_id = user_uuid AND status = 'paid'
    AND created_at >= NOW() - INTERVAL '90 days';

  SELECT EXISTS(SELECT 1 FROM public.founders WHERE user_id = user_uuid) INTO is_founder;

  IF is_founder THEN
    new_tier := 'founder';
  ELSIF total_comm >= 25.00 THEN
    new_tier := 'level2';
  ELSE
    new_tier := 'level1';
  END IF;

  UPDATE public.referrals
  SET tier = new_tier,
      commission_percentage = CASE 
        WHEN new_tier = 'founder' THEN 25
        WHEN new_tier = 'level2' THEN 25
        ELSE 20
      END
  WHERE referrer_id = user_uuid;

  RETURN new_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION: Founders counter
CREATE OR REPLACE FUNCTION public.assign_founder_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.founder_number := (SELECT COALESCE(MAX(founder_number), 0) + 1 FROM public.founders);
  IF NEW.founder_number > 1000 THEN
    RAISE EXCEPTION 'Ya se alcanzaron los 1000 fundadores';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_assign_founder_number ON public.founders;
CREATE TRIGGER trg_assign_founder_number
  BEFORE INSERT ON public.founders
  FOR EACH ROW EXECUTE FUNCTION public.assign_founder_number();

-- RLS Policies
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_paid ENABLE ROW LEVEL SECURITY;

-- Basic RLS: users see their own data, admins see all
CREATE POLICY "Users view own" ON public.referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Users view own" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users view own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own" ON public.commissions FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Users view own" ON public.user_balance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own" ON public.withdrawal_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users own insert" ON public.withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own" ON public.founders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own" ON public.bonus_paid FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- FUNCIONES AVANZADAS: Procesamiento de suscripciones y comisiones
-- ============================================================

-- FUNCTION: Generar codigo simple (sin insertar en DB)
CREATE OR REPLACE FUNCTION public.generate_referral_code_simple()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION: Procesar suscripcion y crear comision automatica
CREATE OR REPLACE FUNCTION public.process_subscription_with_referral(
  p_user_id UUID,
  p_tier TEXT,
  p_price DECIMAL(10,2)
)
RETURNS VOID AS $$
DECLARE
  v_referral RECORD;
  v_commission_percentage INTEGER;
  v_monthly_commission DECIMAL(10,2);
  v_is_founder BOOLEAN;
BEGIN
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referred_id = p_user_id AND status = 'active';

  IF FOUND THEN
    SELECT EXISTS(SELECT 1 FROM public.founders WHERE user_id = v_referral.referrer_id) INTO v_is_founder;

    IF v_is_founder THEN
      v_commission_percentage := 25;
    ELSE
      v_commission_percentage := v_referral.commission_percentage;
      IF v_commission_percentage IS NULL OR v_commission_percentage < 20 THEN
        v_commission_percentage := 20;
      END IF;
    END IF;

    v_monthly_commission := p_price * (v_commission_percentage / 100.0);

    UPDATE public.referrals
    SET tier = CASE
          WHEN v_is_founder THEN 'founder'
          WHEN v_commission_percentage >= 25 THEN 'level2'
          ELSE 'level1'
        END,
        commission_percentage = v_commission_percentage,
        completed_at = NOW()
    WHERE id = v_referral.id;

    INSERT INTO public.commissions (
      referral_id, referrer_id, referred_id,
      month, year, amount, percentage, status
    ) VALUES (
      v_referral.id, v_referral.referrer_id, p_user_id,
      EXTRACT(MONTH FROM NOW())::INTEGER,
      EXTRACT(YEAR FROM NOW())::INTEGER,
      v_monthly_commission, v_commission_percentage, 'pending'
    );

    INSERT INTO public.user_balance (user_id, available_balance, total_earned)
    VALUES (v_referral.referrer_id, v_monthly_commission, v_monthly_commission)
    ON CONFLICT (user_id) DO UPDATE
    SET available_balance = public.user_balance.available_balance + v_monthly_commission,
        total_earned = public.user_balance.total_earned + v_monthly_commission,
        last_updated = NOW();

    INSERT INTO public.transactions (user_id, type, amount, description, reference_id)
    VALUES (
      v_referral.referrer_id, 'commission', v_monthly_commission,
      'Comision por suscripcion de ' || p_user_id, v_referral.id
    );
  END IF;

  INSERT INTO public.subscriptions (user_id, tier, price, status, started_at, expires_at)
  VALUES (p_user_id, p_tier, p_price, 'active', NOW(), NOW() + INTERVAL '1 month');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION: Procesar comisiones mensuales (CRON JOB)
CREATE OR REPLACE FUNCTION public.process_monthly_commissions()
RETURNS TABLE(processed_count INTEGER, total_amount DECIMAL(10,2)) AS $$
DECLARE
  v_referral RECORD;
  v_count INTEGER := 0;
  v_total DECIMAL(10,2) := 0;
  v_commission_percentage INTEGER;
  v_monthly_commission DECIMAL(10,2);
  v_current_month INTEGER;
  v_current_year INTEGER;
  v_already_exists BOOLEAN;
BEGIN
  v_current_month := EXTRACT(MONTH FROM NOW())::INTEGER;
  v_current_year := EXTRACT(YEAR FROM NOW())::INTEGER;

  FOR v_referral IN
    SELECT r.id, r.referrer_id, r.referred_id,
           s.tier, s.price, r.commission_percentage AS current_percentage
    FROM public.referrals r
    JOIN public.subscriptions s ON s.user_id = r.referred_id
    WHERE r.status = 'active'
      AND s.status = 'active'
      AND (s.expires_at IS NULL OR s.expires_at > NOW())
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.commissions
      WHERE referral_id = v_referral.id
        AND month = v_current_month
        AND year = v_current_year
    ) INTO v_already_exists;

    IF v_already_exists THEN
      CONTINUE;
    END IF;

    SELECT EXISTS(
      SELECT 1 FROM public.founders WHERE user_id = v_referral.referrer_id
    ) INTO v_already_exists;

    IF v_already_exists THEN
      v_commission_percentage := 25;
    ELSE
      v_commission_percentage := COALESCE(v_referral.current_percentage, 20);
      IF v_commission_percentage < 20 THEN
        v_commission_percentage := 20;
      END IF;
    END IF;

    v_monthly_commission := v_referral.price * (v_commission_percentage / 100.0);

    INSERT INTO public.commissions (
      referral_id, referrer_id, referred_id,
      month, year, amount, percentage, status
    ) VALUES (
      v_referral.id, v_referral.referrer_id, v_referral.referred_id,
      v_current_month, v_current_year,
      v_monthly_commission, v_commission_percentage, 'pending'
    );

    UPDATE public.user_balance
    SET available_balance = available_balance + v_monthly_commission,
        total_earned = total_earned + v_monthly_commission,
        last_updated = NOW()
    WHERE user_id = v_referral.referrer_id;

    INSERT INTO public.transactions (user_id, type, amount, description, reference_id)
    VALUES (
      v_referral.referrer_id, 'commission', v_monthly_commission,
      'Comision recurrente - ' || TO_CHAR(NOW(), 'Month YYYY'),
      v_referral.id
    );

    v_count := v_count + 1;
    v_total := v_total + v_monthly_commission;
  END LOOP;

  processed_count := v_count;
  total_amount := v_total;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION: Solicitar retiro (validacion de saldo)
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_user_id UUID,
  p_amount DECIMAL(10,2),
  p_method TEXT,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_balance DECIMAL(10,2);
  v_request_id UUID;
BEGIN
  SELECT available_balance INTO v_balance
  FROM public.user_balance
  WHERE user_id = p_user_id;

  IF v_balance IS NULL OR v_balance < p_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente. Disponible: %', COALESCE(v_balance, 0);
  END IF;

  IF p_amount < 20 THEN
    RAISE EXCEPTION 'El minimo para retirar es $20.00';
  END IF;

  INSERT INTO public.withdrawal_requests (user_id, amount, payment_method, payment_details)
  VALUES (p_user_id, p_amount, p_method, p_details)
  RETURNING id INTO v_request_id;

  UPDATE public.user_balance
  SET available_balance = available_balance - p_amount,
      pending_balance = pending_balance + p_amount,
      last_updated = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO public.transactions (user_id, type, amount, description, reference_id)
  VALUES (p_user_id, 'withdrawal', -p_amount,
    'Retiro solicitado via ' || p_method, v_request_id);

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION: Aprobar retiro
CREATE OR REPLACE FUNCTION public.approve_withdrawal(
  p_withdrawal_id UUID,
  p_admin_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_withdrawal RECORD;
BEGIN
  SELECT * INTO v_withdrawal
  FROM public.withdrawal_requests
  WHERE id = p_withdrawal_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada o ya procesada';
  END IF;

  UPDATE public.withdrawal_requests
  SET status = 'approved',
      admin_notes = p_notes,
      approved_at = NOW()
  WHERE id = p_withdrawal_id;

  INSERT INTO public.transactions (user_id, type, amount, description, reference_id)
  VALUES (v_withdrawal.user_id, 'withdrawal', v_withdrawal.amount,
    'Retiro aprobado - ' || COALESCE(p_notes, ''), p_withdrawal_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION: Completar pago de retiro
CREATE OR REPLACE FUNCTION public.complete_withdrawal_payment(
  p_withdrawal_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_withdrawal RECORD;
BEGIN
  SELECT * INTO v_withdrawal
  FROM public.withdrawal_requests
  WHERE id = p_withdrawal_id AND status = 'approved';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada o no esta aprobada';
  END IF;

  UPDATE public.withdrawal_requests
  SET status = 'paid', paid_at = NOW()
  WHERE id = p_withdrawal_id;

  UPDATE public.user_balance
  SET pending_balance = pending_balance - v_withdrawal.amount,
      total_withdrawn = total_withdrawn + v_withdrawal.amount,
      last_updated = NOW()
  WHERE user_id = v_withdrawal.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
