import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const MODELS: Record<string, { provider: string; endpoint: string; defaultModel: string }> = {
  'gpt-4o': { provider: 'openai', endpoint: 'https://api.openai.com/v1/chat/completions', defaultModel: 'gpt-4o' },
  'gpt-4o-mini': { provider: 'openai', endpoint: 'https://api.openai.com/v1/chat/completions', defaultModel: 'gpt-4o-mini' },
  'gpt-4-turbo': { provider: 'openai', endpoint: 'https://api.openai.com/v1/chat/completions', defaultModel: 'gpt-4-turbo' },
  'claude-3-5-sonnet': { provider: 'anthropic', endpoint: 'https://api.anthropic.com/v1/messages', defaultModel: 'claude-3-5-sonnet-20241022' },
  'claude-3-haiku': { provider: 'anthropic', endpoint: 'https://api.anthropic.com/v1/messages', defaultModel: 'claude-3-haiku-20240307' },
  'gemini-2.0-flash': { provider: 'google', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', defaultModel: 'gemini-2.0-flash' },
  'mistral-large': { provider: 'mistral', endpoint: 'https://api.mistral.ai/v1/chat/completions', defaultModel: 'mistral-large-latest' },
  'llama-3.3-70b': { provider: 'groq', endpoint: 'https://api.groq.com/openai/v1/chat/completions', defaultModel: 'llama-3.3-70b-versatile' },
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

async function callOpenAI(apiKey: string, model: string, messages: any[]) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: 4096 }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return { content: data.choices[0].message.content, tokens: data.usage?.total_tokens || 0 }
}

async function callAnthropic(apiKey: string, model: string, messages: any[]) {
  const system = messages.find((m: any) => m.role === 'system')?.content || ''
  const userMsgs = messages.filter((m: any) => m.role !== 'system').map((m: any) => ({ role: m.role, content: m.content }))
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, system, messages: userMsgs, max_tokens: 4096 }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return { content: data.content[0].text, tokens: data.usage?.input_tokens + data.usage?.output_tokens || 0 }
}

async function callGoogle(apiKey: string, model: string, messages: any[]) {
  const contents = messages.map((m: any) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return { content: data.candidates[0].content.parts[0].text, tokens: data.usageMetadata?.totalTokenCount || 0 }
}

async function callMistral(apiKey: string, model: string, messages: any[]) {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: 4096 }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return { content: data.choices[0].message.content, tokens: data.usage?.total_tokens || 0 }
}

async function callGroq(apiKey: string, model: string, messages: any[]) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: 4096 }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return { content: data.choices[0].message.content, tokens: data.usage?.total_tokens || 0 }
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

    const { model, messages, sessionId } = await req.json()
    if (!model || !messages?.length) {
      return NextResponse.json({ error: 'Model y messages requeridos' }, { status: 400 })
    }

    const modelConfig = MODELS[model]
    if (!modelConfig) {
      return NextResponse.json({ error: 'Modelo no soportado' }, { status: 400 })
    }

    const apiKey = await getApiKey(user.id, modelConfig.provider)
    if (!apiKey) {
      return NextResponse.json({
        error: `No tienes configurada una API Key para ${modelConfig.provider}. Agregala en /settings/keys`,
        needsApiKey: true,
        provider: modelConfig.provider,
      }, { status: 402 })
    }

    const providerHandlers: Record<string, (key: string, model: string, messages: any[]) => Promise<{ content: string; tokens: number }>> = {
      openai: callOpenAI,
      anthropic: callAnthropic,
      google: callGoogle,
      mistral: callMistral,
      groq: callGroq,
    }

    const handler = providerHandlers[modelConfig.provider]
    if (!handler) throw new Error(`Provider ${modelConfig.provider} no implementado`)

    const result = await handler(apiKey, modelConfig.defaultModel, messages)

    if (sessionId) {
      const updatedMessages = [...messages, { role: 'assistant', content: result.content }]
      await supabaseAdmin
        .from('chat_sessions')
        .upsert({
          id: sessionId,
          user_id: user.id,
          model,
          provider: modelConfig.provider,
          messages: JSON.stringify(updatedMessages),
          tokens_used: supabaseAdmin.rpc('increment_tokens', { x: result.tokens }),
          updated_at: new Date().toISOString(),
          title: messages[0]?.content?.substring(0, 80) || 'Nueva conversacion',
        })
    }

    return NextResponse.json({ content: result.content, tokens: result.tokens })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
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

    const { data: sessions } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, title, model, provider, tokens_used, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50)

    return NextResponse.json(sessions || [])
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
