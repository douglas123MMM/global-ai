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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const action = req.nextUrl.searchParams.get('action') || 'dashboard'

    switch (action) {
      case 'dashboard': {
        const { data: users } = await supabaseAdmin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
        const { count: refCount } = await supabaseAdmin
          .from('referrals')
          .select('*', { count: 'exact', head: true })
        const { data: commissions } = await supabaseAdmin
          .from('commissions')
          .select('amount')
        const { data: withdrawals } = await supabaseAdmin
          .from('withdrawal_requests')
          .select('amount, status')
          .eq('status', 'pending')
        const { count: founderCount } = await supabaseAdmin
          .from('founders')
          .select('*', { count: 'exact', head: true })

        const totalCommissions = commissions?.reduce((a, c) => a + Number(c.amount), 0) || 0
        const pendingWithdrawals = withdrawals?.reduce((a, w) => a + Number(w.amount), 0) || 0

        return NextResponse.json({
          total_users: users?.count || 0,
          total_referrals: refCount || 0,
          total_commissions: totalCommissions,
          pending_withdrawals: pendingWithdrawals,
          total_founders: founderCount || 0,
          founders_remaining: 1000 - (founderCount || 0),
        })
      }

      case 'referrals': {
        const { data } = await supabaseAdmin
          .from('referrals')
          .select(`
            *,
            referrer:profiles!referrals_referrer_id_fkey(email, full_name),
            referred:profiles!referrals_referred_id_fkey(email, full_name)
          `)
          .order('created_at', { ascending: false })
        return NextResponse.json(data || [])
      }

      case 'withdrawals': {
        const { data } = await supabaseAdmin
          .from('withdrawal_requests')
          .select('*, user:profiles!withdrawal_requests_user_id_fkey(email, full_name)')
          .order('requested_at', { ascending: false })
        return NextResponse.json(data || [])
      }

      case 'founders': {
        const { data } = await supabaseAdmin
          .from('founders')
          .select('*, user:profiles!founders_user_id_fkey(email, full_name)')
          .order('founder_number', { ascending: true })
        return NextResponse.json(data || [])
      }

      case 'users': {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        return NextResponse.json(data || [])
      }

      default:
        return NextResponse.json({ error: 'Accion invalida' }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
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

    const { withdrawal_id, status, admin_notes } = await req.json()

    if (!withdrawal_id || !status) {
      return NextResponse.json(
        { error: 'withdrawal_id y status requeridos' },
        { status: 400 }
      )
    }

    const updateData: any = { status }
    if (status === 'approved') updateData.approved_at = new Date().toISOString()
    if (status === 'paid') updateData.paid_at = new Date().toISOString()
    if (status === 'rejected') updateData.rejected_at = new Date().toISOString()
    if (admin_notes) updateData.admin_notes = admin_notes

    const { data: updated, error } = await supabaseAdmin
      .from('withdrawal_requests')
      .update(updateData)
      .eq('id', withdrawal_id)
      .select('*, user:profiles!withdrawal_requests_user_id_fkey(email, full_name)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (status === 'paid') {
      const { data: balance } = await supabaseAdmin
        .from('user_balance')
        .select('*')
        .eq('user_id', updated.user_id)
        .single()

      if (balance) {
        await supabaseAdmin
          .from('user_balance')
          .update({
            total_withdrawn: Number(balance.total_withdrawn) + Number(updated.amount),
            pending_balance: Math.max(0, Number(balance.pending_balance) - Number(updated.amount)),
          })
          .eq('user_id', updated.user_id)
      }

      if (updated.user?.email) {
        sendWithdrawalApproved(
          updated.user.email,
          updated.user.full_name || 'Usuario',
          Number(updated.amount),
          updated.payment_method
        ).catch(() => {})
      }
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
