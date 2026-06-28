-- PARTE 3: RLS Policies
-- Ejecuta esto TERCERO

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_paid ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own" ON public.referral_codes;
CREATE POLICY "Users view own" ON public.referral_codes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own" ON public.referrals;
CREATE POLICY "Users view own" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "Users view own" ON public.subscriptions;
CREATE POLICY "Users view own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own" ON public.commissions;
CREATE POLICY "Users view own" ON public.commissions FOR SELECT USING (auth.uid() = referrer_id);

DROP POLICY IF EXISTS "Users view own" ON public.user_balance;
CREATE POLICY "Users view own" ON public.user_balance FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own" ON public.withdrawal_requests;
CREATE POLICY "Users view own" ON public.withdrawal_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users own insert" ON public.withdrawal_requests;
CREATE POLICY "Users own insert" ON public.withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own" ON public.transactions;
CREATE POLICY "Users view own" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own" ON public.founders;
CREATE POLICY "Users view own" ON public.founders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own" ON public.bonus_paid;
CREATE POLICY "Users view own" ON public.bonus_paid FOR SELECT USING (auth.uid() = user_id);

-- profiles policies (solo si no existen)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users view own' AND tablename = 'profiles') THEN
    CREATE POLICY "Users view own" ON public.profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own' AND tablename = 'profiles') THEN
    CREATE POLICY "Users update own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

SELECT 'Parte 3 completada - RLS policies creadas' as resultado;
SELECT 'SCHEMA COMPLETO - Base de datos lista para Global AI' as final;
