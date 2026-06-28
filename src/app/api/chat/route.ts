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

    const sessionId = req.nextUrl.searchParams.get('id')

    if (sessionId) {
      const { data: session } = await supabaseAdmin
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single()

      if (!session) return NextResponse.json({ error: 'Sesion no encontrada' }, { status: 404 })

      let messages: any[] = []
      try {
        messages = typeof session.messages === 'string' ? JSON.parse(session.messages) : session.messages || []
      } catch { messages = [] }

      return NextResponse.json({ session: { ...session, messages } })
    }

    const { data: sessions } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, title, model, provider, tokens_used, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50)

    const today = new Date().toISOString().split('T')[0]
    const { data: todaySessions } = await supabaseAdmin
      .from('chat_sessions')
      .select('tokens_used')
      .eq('user_id', user.id)
      .gte('updated_at', today)

    const usedToday = (todaySessions || []).length

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const plan = profile?.subscription_tier || 'free'
    const limit = plan === 'pro' ? Infinity : 10

    return NextResponse.json({
      sessions: sessions || [],
      usage: {
        used_today: usedToday,
        limit: limit === Infinity ? 999 : limit,
        plan,
        canChat: plan === 'pro' || usedToday < limit,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
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

    const { sessionId, title } = await req.json()
    if (!sessionId || !title) {
      return NextResponse.json({ error: 'sessionId y title requeridos' }, { status: 400 })
    }

    await supabaseAdmin
      .from('chat_sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
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

    const sessionId = req.nextUrl.searchParams.get('id')
    if (!sessionId) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    await supabaseAdmin
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
