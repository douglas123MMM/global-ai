import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

    const { bonus_type } = await req.json()

    const bonuses: Record<string, { amount: number; required: number; type: string }> = {
      first_referral: { amount: 5, required: 1, type: 'first_referral' },
      ten_referrals: { amount: 20, required: 10, type: 'ten_referrals' },
      fifty_referrals: { amount: 100, required: 50, type: 'fifty_referrals' },
      hundred_referrals: { amount: 500, required: 100, type: 'hundred_referrals' },
    }

    const bonus = bonuses[bonus_type]
    if (!bonus) {
      return NextResponse.json({ error: 'Tipo de bono invalido' }, { status: 400 })
    }

    const { count } = await supabaseAdmin
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.id)

    if ((count || 0) < bonus.required) {
      return NextResponse.json(
        { error: `Necesitas ${bonus.required} referido(s). Tienes ${count || 0}.` },
        { status: 400 }
      )
    }

    const { data: alreadyClaimed } = await supabaseAdmin
      .from('bonus_paid')
      .select('id')
      .eq('user_id', user.id)
      .eq('bonus_type', bonus.type)
      .single()

    if (alreadyClaimed) {
      return NextResponse.json({ error: 'Ya reclamaste este bono' }, { status: 409 })
    }

    await supabaseAdmin.from('bonus_paid').insert({
      user_id: user.id,
      bonus_type: bonus.type,
      amount: bonus.amount,
      milestone: bonus.required,
    })

    const { data: balance } = await supabaseAdmin
      .from('user_balance')
      .select('available_balance, total_earned')
      .eq('user_id', user.id)
      .single()

    const newAvailable = (balance?.available_balance || 0) + bonus.amount
    const newEarned = (balance?.total_earned || 0) + bonus.amount

    await supabaseAdmin
      .from('user_balance')
      .update({
        available_balance: newAvailable,
        total_earned: newEarned,
        last_updated: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    await supabaseAdmin.from('transactions').insert({
      user_id: user.id,
      type: 'bonus',
      amount: bonus.amount,
      description: `Bono por ${bonus.required} referido(s) reclamado`,
    })

    return NextResponse.json({
      success: true,
      bonus_amount: bonus.amount,
      new_balance: newAvailable,
    })
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

    const { data: bonuses } = await supabaseAdmin
      .from('bonus_paid')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { count } = await supabaseAdmin
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.id)

    const availableBonuses = [
      { type: 'first_referral', name: 'Primer Referido', required: 1, amount: 5 },
      { type: 'ten_referrals', name: '10 Referidos', required: 10, amount: 20 },
      { type: 'fifty_referrals', name: '50 Referidos', required: 50, amount: 100 },
      { type: 'hundred_referrals', name: '100 Referidos', required: 100, amount: 500 },
    ].map((b) => ({
      ...b,
      unlocked: (count || 0) >= b.required,
      claimed: (bonuses || []).some((pb) => pb.bonus_type === b.type),
    }))

    return NextResponse.json({
      total_referrals: count || 0,
      bonuses_claimed: bonuses || [],
      available_bonuses: availableBonuses,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
