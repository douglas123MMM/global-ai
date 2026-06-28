-- PARTE 2: Funciones y Triggers
-- Ejecuta esto SEGUNDO

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''), 'user')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_balance (user_id, available_balance, pending_balance, total_earned, total_withdrawn)
  VALUES (NEW.id, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.generate_referral_code(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE new_code TEXT; code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || user_uuid::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  INSERT INTO public.referral_codes (user_id, code) VALUES (user_uuid, new_code);
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_and_update_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE total_comm DECIMAL(10,2); is_founder BOOLEAN; new_tier TEXT;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_comm FROM public.commissions
  WHERE referrer_id = user_uuid AND status = 'paid' AND created_at >= NOW() - INTERVAL '90 days';
  SELECT EXISTS(SELECT 1 FROM public.founders WHERE user_id = user_uuid) INTO is_founder;
  IF is_founder THEN new_tier := 'founder';
  ELSIF total_comm >= 25.00 THEN new_tier := 'level2';
  ELSE new_tier := 'level1';
  END IF;
  UPDATE public.referrals SET tier = new_tier,
    commission_percentage = CASE WHEN new_tier IN ('founder','level2') THEN 25 ELSE 20 END
  WHERE referrer_id = user_uuid;
  RETURN new_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.assign_founder_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.founder_number := (SELECT COALESCE(MAX(founder_number), 0) + 1 FROM public.founders);
  IF NEW.founder_number > 1000 THEN RAISE EXCEPTION 'Maximo de 1000 fundadores alcanzado'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_assign_founder_number ON public.founders;
CREATE TRIGGER trg_assign_founder_number BEFORE INSERT ON public.founders FOR EACH ROW EXECUTE FUNCTION public.assign_founder_number();

CREATE OR REPLACE FUNCTION public.process_monthly_commissions()
RETURNS TABLE(processed_count INTEGER, total_amount DECIMAL(10,2)) AS $$
DECLARE
  v_referral RECORD; v_count INTEGER := 0; v_total DECIMAL(10,2) := 0;
  v_commission_percentage INTEGER; v_monthly_commission DECIMAL(10,2);
  v_current_month INTEGER; v_current_year INTEGER; v_already_exists BOOLEAN;
BEGIN
  v_current_month := EXTRACT(MONTH FROM NOW())::INTEGER;
  v_current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  FOR v_referral IN
    SELECT r.id, r.referrer_id, r.referred_id, s.tier, s.price, r.commission_percentage AS current_percentage
    FROM public.referrals r JOIN public.subscriptions s ON s.user_id = r.referred_id
    WHERE r.status = 'active' AND s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())
  LOOP
    SELECT EXISTS(SELECT 1 FROM public.commissions WHERE referral_id = v_referral.id AND month = v_current_month AND year = v_current_year) INTO v_already_exists;
    IF v_already_exists THEN CONTINUE; END IF;
    SELECT EXISTS(SELECT 1 FROM public.founders WHERE user_id = v_referral.referrer_id) INTO v_already_exists;
    IF v_already_exists THEN v_commission_percentage := 25;
    ELSE
      v_commission_percentage := COALESCE(v_referral.current_percentage, 20);
      IF v_commission_percentage < 20 THEN v_commission_percentage := 20; END IF;
    END IF;
    v_monthly_commission := v_referral.price * (v_commission_percentage / 100.0);
    INSERT INTO public.commissions (referral_id, referrer_id, referred_id, month, year, amount, percentage, status)
    VALUES (v_referral.id, v_referral.referrer_id, v_referral.referred_id, v_current_month, v_current_year, v_monthly_commission, v_commission_percentage, 'pending');
    UPDATE public.user_balance SET available_balance = available_balance + v_monthly_commission, total_earned = total_earned + v_monthly_commission, last_updated = NOW() WHERE user_id = v_referral.referrer_id;
    INSERT INTO public.transactions (user_id, type, amount, description, reference_id) VALUES (v_referral.referrer_id, 'commission', v_monthly_commission, 'Comision recurrente - ' || TO_CHAR(NOW(), 'Month YYYY'), v_referral.id);
    v_count := v_count + 1; v_total := v_total + v_monthly_commission;
  END LOOP;
  processed_count := v_count; total_amount := v_total; RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Parte 2 completada - funciones y triggers creados' as resultado;
