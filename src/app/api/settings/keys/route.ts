import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

    const { data } = await supabaseAdmin
      .from('user_api_keys')
      .select('id, provider, is_valid, created_at, last_validated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json(data || [])
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
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

    const { provider, api_key } = await req.json()
    if (!provider || !api_key) {
      return NextResponse.json({ error: 'Provider y api_key requeridos' }, { status: 400 })
    }

    const validProviders = ['openai', 'anthropic', 'google', 'mistral', 'groq']
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: 'Proveedor no valido' }, { status: 400 })
    }

    let isValid = false
    try {
      if (provider === 'openai') {
        const r = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${api_key}` } })
        isValid = r.ok
      } else if (provider === 'anthropic') {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': api_key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }),
        })
        isValid = r.ok || r.status === 429
      } else if (provider === 'google') {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${api_key}`)
        isValid = r.ok
      } else if (provider === 'mistral') {
        const r = await fetch('https://api.mistral.ai/v1/models', { headers: { Authorization: `Bearer ${api_key}` } })
        isValid = r.ok
      } else if (provider === 'groq') {
        const r = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${api_key}` } })
        isValid = r.ok
      }
    } catch {
      isValid = false
    }

    const { data: existing } = await supabaseAdmin
      .from('user_api_keys')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single()

    if (existing) {
      await supabaseAdmin
        .from('user_api_keys')
        .update({ api_key, is_valid: isValid, last_validated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabaseAdmin
        .from('user_api_keys')
        .insert({ user_id: user.id, provider, api_key, is_valid: isValid, last_validated_at: new Date().toISOString() })
    }

    return NextResponse.json({ success: true, is_valid: isValid })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
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

    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    await supabaseAdmin
      .from('user_api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
