import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { callProvider } from '@/lib/providers'

const MODELS: Record<string, { provider: string; model: string }> = {
  'gpt-4o': { provider: 'openai', model: 'gpt-4o' },
  'gpt-4o-mini': { provider: 'openai', model: 'gpt-4o-mini' },
  'claude-3.5-sonnet': { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  'gemini-1.5-pro': { provider: 'google', model: 'gemini-1.5-pro' },
  'mistral-large': { provider: 'mistral', model: 'mistral-large-latest' },
  'llama-3.1-70b': { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  'mixtral-8x7b': { provider: 'groq', model: 'mixtral-8x7b-32768' },
  'llama-3.1-405b': { provider: 'nvidia', model: 'meta/llama-3.1-405b-instruct' },
}

async function getApiKey(userId: string, provider: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('user_api_keys')
    .select('api_key')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('is_valid', true)
    .single()
  return data?.api_key || null
}

async function countMessagesToday(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0]
  const { data: sessions } = await supabaseAdmin
    .from('chat_sessions')
    .select('messages')
    .eq('user_id', userId)
    .gte('updated_at', today)

  if (!sessions) return 0

  let count = 0
  for (const session of sessions) {
    try {
      const msgs = typeof session.messages === 'string' ? JSON.parse(session.messages) : (session.messages || [])
      for (const m of msgs) {
        if (m.role === 'user' && m.timestamp?.startsWith(today)) count++
      }
    } catch { /* skip malformed messages */ }
  }
  return count
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Sesion invalida' }, { status: 401 })
    }

    const { model: modelId, messages, sessionId } = await req.json()
    if (!modelId || !messages?.length) {
      return NextResponse.json({ error: 'model y messages requeridos' }, { status: 400 })
    }

    const modelConfig = MODELS[modelId]
    if (!modelConfig) {
      return NextResponse.json({ error: 'Modelo no soportado' }, { status: 400 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const plan = profile?.subscription_tier || 'free'
    const messagesToday = await countMessagesToday(user.id)

    if (plan !== 'pro' && messagesToday >= 10) {
      return NextResponse.json({
        error: 'Limite diario alcanzado (10 consultas/dia en plan free). Actualiza a Pro para consultas ilimitadas.',
        limitReached: true,
      }, { status: 429 })
    }

    const apiKey = await getApiKey(user.id, modelConfig.provider)
    if (!apiKey) {
      return NextResponse.json({
        error: `No tienes API Key configurada para ${modelConfig.provider}.`,
        needsApiKey: true,
        provider: modelConfig.provider,
      }, { status: 402 })
    }

    const result = await callProvider(modelConfig.provider, apiKey, messages, modelConfig.model)

    const now = new Date().toISOString()
    const userMessages = messages.filter((m: any) => m.role === 'user')
    const updatedMessages = [
      ...messages,
      { role: 'assistant', content: result.content, timestamp: now },
    ]
    const title = userMessages[0]?.content?.substring(0, 80) || 'Nueva conversacion'

    let sid = sessionId
    if (sid) {
      await supabaseAdmin
        .from('chat_sessions')
        .update({
          messages: JSON.stringify(updatedMessages),
          model: modelId,
          provider: modelConfig.provider,
          tokens_used: result.tokens,
          title,
          updated_at: now,
        })
        .eq('id', sid)
        .eq('user_id', user.id)
    } else {
      const { data: newSession } = await supabaseAdmin
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title,
          model: modelId,
          provider: modelConfig.provider,
          messages: JSON.stringify(updatedMessages),
          tokens_used: result.tokens,
        })
        .select('id')
        .single()
      if (newSession) sid = newSession.id
    }

    const newCount = messagesToday + 1

    return NextResponse.json({
      content: result.content,
      tokens: result.tokens,
      sessionId: sid,
      usage: {
        used_today: newCount,
        limit: plan === 'pro' ? 999 : 10,
        plan,
        canChat: plan === 'pro' || newCount < 10,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
