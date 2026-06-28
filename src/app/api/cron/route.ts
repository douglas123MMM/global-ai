import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'cron-secret-global-ai'
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const { data: activeReferrals } = await supabaseAdmin
      .from('referrals')
      .select(`
        id, referrer_id, referred_id, commission_percentage,
        referred:profiles!referrals_referred_id_fkey(id)
      `)
      .eq('status', 'active')

    if (!activeReferrals?.length) {
      return NextResponse.json({ message: 'Sin referidos activos para procesar', processed: 0 })
    }

    let processed = 0
    let totalAmount = 0

    for (const ref of activeReferrals) {
      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('tier, price, status')
        .eq('user_id', ref.referred_id)
        .eq('status', 'active')
        .single()

      if (!subscription) continue

      const { data: existingCommission } = await supabaseAdmin
        .from('commissions')
        .select('id')
        .eq('referral_id', ref.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .single()

      if (existingCommission) continue

      const price = Number(subscription.price)
      const percentage = ref.commission_percentage
      const amount = (price * percentage) / 100

      const { error: commError } = await supabaseAdmin
        .from('commissions')
        .insert({
          referral_id: ref.id,
          referrer_id: ref.referrer_id,
          referred_id: ref.referred_id,
          month: currentMonth,
          year: currentYear,
          amount,
          percentage,
          status: 'pending',
        })

      if (commError) {
        console.error('Error creando comision:', commError.message)
        continue
      }

      const { data: balance } = await supabaseAdmin
        .from('user_balance')
        .select('*')
        .eq('user_id', ref.referrer_id)
        .single()

      if (balance) {
        const newAvailable = Number(balance.available_balance) + amount
        const newTotalEarned = Number(balance.total_earned) + amount

        await supabaseAdmin
          .from('user_balance')
          .update({
            available_balance: newAvailable,
            total_earned: newTotalEarned,
            last_updated: new Date().toISOString(),
          })
          .eq('user_id', ref.referrer_id)
      }

      await supabaseAdmin.from('transactions').insert({
        user_id: ref.referrer_id,
        type: 'commission',
        amount,
        description: `Comision ${currentMonth}/${currentYear} - ${percentage}%`,
        reference_id: ref.id,
      })

      processed++
      totalAmount += amount
    }

    return NextResponse.json({
      success: true,
      processed,
      total_amount: totalAmount,
      month: currentMonth,
      year: currentYear,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
