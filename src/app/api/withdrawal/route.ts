import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendWithdrawalApproved } from '@/lib/email'

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
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false })

    return NextResponse.json(data || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
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

    const { amount, payment_method, payment_details } = await req.json()

    const minWithdrawal = parseFloat(process.env.MIN_WITHDRAWAL_AMOUNT || '20')
    if (amount < minWithdrawal) {
      return NextResponse.json(
        { error: `El retiro minimo es $${minWithdrawal}` },
        { status: 400 }
      )
    }

    const { data: balance } = await supabaseAdmin
      .from('user_balance')
      .select('available_balance')
      .eq('user_id', user.id)
      .single()

    const available = parseFloat(balance?.available_balance || '0')
    if (amount > available) {
      return NextResponse.json(
        { error: 'Saldo insuficiente' },
        { status: 400 }
      )
    }

    const { data: request, error } = await supabaseAdmin
      .from('withdrawal_requests')
      .insert({
        user_id: user.id,
        amount,
        payment_method,
        payment_details,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabaseAdmin
      .from('user_balance')
      .update({
        available_balance: available - amount,
        pending_balance: supabaseAdmin.rpc('increment_pending', { x: amount }),
      })
      .eq('user_id', user.id)

    await supabaseAdmin.from('transactions').insert({
      user_id: user.id,
      type: 'withdrawal',
      amount: -amount,
      description: `Retiro solicitado via ${payment_method}`,
      reference_id: request.id,
    })

    return NextResponse.json(request)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
