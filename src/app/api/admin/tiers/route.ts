import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from('referral_tiers')
      .select('*')
      .order('commission_percentage', { ascending: false })
    return NextResponse.json(data || [])
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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { tier_name, commission_percentage, min_commissions, min_referrals, bonus_amount, description } = await req.json()

    if (!tier_name) {
      return NextResponse.json({ error: 'tier_name requerido' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from('referral_tiers')
      .select('id')
      .eq('tier_name', tier_name)
      .single()

    if (existing) {
      const { data: updated, error } = await supabaseAdmin
        .from('referral_tiers')
        .update({
          commission_percentage,
          min_commissions,
          min_referrals,
          bonus_amount,
          description,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (commission_percentage) {
        await supabaseAdmin
          .from('referrals')
          .update({ commission_percentage })
          .eq('tier', tier_name)
      }

      return NextResponse.json(updated)
    }

    const { data: created, error } = await supabaseAdmin
      .from('referral_tiers')
      .insert({
        tier_name,
        commission_percentage: commission_percentage || 20,
        min_commissions,
        min_referrals,
        bonus_amount: bonus_amount || 0,
        description,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(created)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
