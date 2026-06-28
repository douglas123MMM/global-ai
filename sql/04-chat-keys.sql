-- NUEVAS TABLAS PARA GLOBAL AI: Chat + API Keys
-- Ejecuta ESTE bloque completo en el SQL Editor de Supabase

-- CHAT SESSIONS
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Nueva conversacion',
  model TEXT DEFAULT 'gpt-4o',
  provider TEXT DEFAULT 'openai',
  messages JSONB DEFAULT '[]',
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON public.chat_sessions(updated_at DESC);

-- USER API KEYS
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT false,
  last_validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user ON public.user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON public.user_api_keys(provider);

-- Campos adicionales en profiles (para Stripe y suscripcion)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

-- RLS para chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own chats" ON public.chat_sessions;
CREATE POLICY "Users manage own chats" ON public.chat_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS para user_api_keys
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own keys" ON public.user_api_keys;
CREATE POLICY "Users manage own keys" ON public.user_api_keys
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

SELECT 'Nuevas tablas creadas: chat_sessions, user_api_keys' as resultado;
