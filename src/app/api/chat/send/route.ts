import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

async function callProvider(provider: string, apiKey: string, model: string, messages: any[]) {
  const headers = { 'Content-Type': 'application/json' }
  let url = ''
  let body: any = {}

  switch (provider) {
    case 'openai':
    case 'groq': {
      url = provider === 'openai'
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://api.groq.com/openai/v1/chat/completions'
      body = { model, messages, max_tokens: 4096 }
      const r = await fetch(url, {
        method: 'POST',
        headers: { ...headers, 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error.message)
      return { content: d.choices[0].message.content, tokens: d.usage?.total_tokens || 0 }
    }

    case 'anthropic': {
      const system = messages.find((m: any) => m.role === 'system')?.content || ''
      const msgs = messages.filter((m: any) => m.role !== 'system').map((m: any) => ({ role: m.role, content: m.content }))
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { ...headers, 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model, system, messages: msgs, max_tokens: 4096 }),
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error.message)
      return { content: d.content[0].text, tokens: (d.usage?.input_tokens || 0) + (d.usage?.output_tokens || 0) }
    }

    case 'google': {
      const contents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST', headers, body: JSON.stringify({ contents }),
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error.message)
      return { content: d.candidates[0].content.parts[0].text, tokens: d.usageMetadata?.totalTokenCount || 0 }
    }

    case 'mistral': {
      const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { ...headers, 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, max_tokens: 4096 }),
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error.message)
      return { content: d.choices[0].message.content, tokens: d.usage?.total_tokens || 0 }
    }

    case 'nvidia': {
      const r = await fetch(`https://integrate.api.nvidia.com/v1/chat/completions`, {
        method: 'POST',
        headers: { ...headers, 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, max_tokens: 4096, temperature: 0.7 }),
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error.message)
      return { content: d.choices[0].message.content, tokens: d.usage?.total_tokens || 0 }
    }

    default:
      throw new Error(`Provider ${provider} no implementado`)
  }
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

    const today = new Date().toISOString().split('T')[0]
    const { data: todaySessions } = await supabaseAdmin
      .from('chat_sessions')
      .select('id')
      .eq('user_id', user.id)
      .gte('updated_at', today)

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const plan = profile?.subscription_tier || 'free'
    const usedToday = (todaySessions || []).length

    if (plan !== 'pro' && usedToday >= 10) {
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

    const result = await callProvider(modelConfig.provider, apiKey, modelConfig.model, messages)

    const updatedMessages = [...messages, { role: 'assistant', content: result.content }]
    const title = messages[0]?.content?.substring(0, 80) || 'Nueva conversacion'

    let sid = sessionId
    if (sid) {
      await supabaseAdmin
        .from('chat_sessions')
        .update({
          messages: JSON.stringify(updatedMessages),
          model: modelId,
          provider: modelConfig.provider,
          tokens_used: supabaseAdmin.rpc('increment_tokens', { x: result.tokens }),
          title,
          updated_at: new Date().toISOString(),
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

    return NextResponse.json({
      content: result.content,
      tokens: result.tokens,
      sessionId: sid,
      usage: {
        used_today: usedToday + 1,
        limit: plan === 'pro' ? 999 : 10,
        plan,
        canChat: plan === 'pro' || usedToday + 1 < 10,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
