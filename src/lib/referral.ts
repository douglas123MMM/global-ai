import { supabaseAdmin } from '@/lib/supabase/admin'

export function generateReferralLink(code: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/register?ref=${code}`
}

export async function getOrCreateReferralCode(userId: string) {
  const { data: existing } = await supabaseAdmin
    .from('referral_codes')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing) return existing

  const { error } = await supabaseAdmin.rpc('generate_referral_code', {
    user_uuid: userId,
  })

  if (error) throw error

  const { data: newCode } = await supabaseAdmin
    .from('referral_codes')
    .select('*')
    .eq('user_id', userId)
    .single()

  return newCode
}

export async function processReferral(referredId: string, code: string) {
  const { data: refCode } = await supabaseAdmin
    .from('referral_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()

  if (!refCode) throw new Error('Codigo de referido invalido')
  if (refCode.user_id === referredId) throw new Error('No puedes referirte a ti mismo')

  const maxUses = refCode.max_uses || 999
  if (refCode.uses >= maxUses) throw new Error('Este codigo ya alcanzo el maximo de usos')

  const { data: existingRef } = await supabaseAdmin
    .from('referrals')
    .select('*')
    .eq('referred_id', referredId)
    .single()

  if (existingRef) throw new Error('Este usuario ya fue referido')

  const isFounder = await checkIsFounder(refCode.user_id)
  const tier = isFounder ? 'founder' : 'level1'
  const commissionPercent = isFounder ? 25 : 20

  const { data: referral, error } = await supabaseAdmin
    .from('referrals')
    .insert({
      referrer_id: refCode.user_id,
      referred_id: referredId,
      code: code.toUpperCase(),
      status: 'active',
      tier,
      commission_percentage: commissionPercent,
    })
    .select()
    .single()

  if (error) throw error

  await supabaseAdmin
    .from('referral_codes')
    .update({ uses: refCode.uses + 1, updated_at: new Date().toISOString() })
    .eq('id', refCode.id)

  await processFirstReferralBonus(refCode.user_id)

  return referral
}

export async function checkIsFounder(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('founders')
    .select('*')
    .eq('user_id', userId)
    .single()
  return !!data
}

export async function processFirstReferralBonus(userId: string): Promise<number> {
  const { count: refCount, error } = await supabaseAdmin
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', userId)

  if (error) return 0

  const thresholds = [
    { required: 1, amount: 5, type: 'first_referral' },
    { required: 10, amount: 20, type: 'ten_referrals' },
    { required: 50, amount: 100, type: 'fifty_referrals' },
    { required: 100, amount: 500, type: 'hundred_referrals' },
  ]

  for (const threshold of thresholds) {
    if (refCount! >= threshold.required) {
      const { data: alreadyPaid } = await supabaseAdmin
        .from('bonus_paid')
        .select('*')
        .eq('user_id', userId)
        .eq('bonus_type', threshold.type)
        .single()

      if (!alreadyPaid) {
        await supabaseAdmin.from('bonus_paid').insert({
          user_id: userId,
          bonus_type: threshold.type,
          amount: threshold.amount,
          milestone: threshold.required,
        })

        await supabaseAdmin
          .from('user_balance')
          .update({
            available_balance: supabaseAdmin.rpc('increment', {
              x: threshold.amount,
            }),
          })
          .eq('user_id', userId)

        await supabaseAdmin.from('transactions').insert({
          user_id: userId,
          type: 'bonus',
          amount: threshold.amount,
          description: `Bono por ${threshold.required} referido(s)`,
        })

        return threshold.amount
      }
    }
  }

  return 0
}

export async function getDashboardStats(userId: string) {
  const { data: referrals } = await supabaseAdmin
    .from('referrals')
    .select('*, referred:profiles!referrals_referred_id_fkey(id, email, full_name, created_at)')
    .eq('referrer_id', userId)

  const { data: balance } = await supabaseAdmin
    .from('user_balance')
    .select('*')
    .eq('user_id', userId)
    .single()

  const { data: commissions } = await supabaseAdmin
    .from('commissions')
    .select('*')
    .eq('referrer_id', userId)

  const now = new Date()
  const thisMonth = now.getMonth() + 1
  const thisYear = now.getFullYear()

  const commissionsThisMonth =
    commissions?.filter(
      (c) => c.month === thisMonth && c.year === thisYear
    ) || []

  const referralsThisMonth =
    referrals?.filter((r) => {
      const d = new Date(r.created_at)
      return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear
    }) || []

  const activeReferrals = referrals?.filter((r) => r.status === 'active') || []

  const { data: tierData } = await supabaseAdmin
    .from('referrals')
    .select('tier, commission_percentage')
    .eq('referrer_id', userId)
    .limit(1)
    .single()

  return {
    total_referrals: referrals?.length || 0,
    active_referrals: activeReferrals.length,
    total_earned: balance?.total_earned || 0,
    available_balance: balance?.available_balance || 0,
    pending_balance: balance?.pending_balance || 0,
    current_tier: tierData?.tier || 'level1',
    commission_percentage: tierData?.commission_percentage || 20,
    referrals_this_month: referralsThisMonth.length,
    earnings_this_month: commissionsThisMonth.reduce((a, c) => a + Number(c.amount), 0),
  }
}

export async function getUserReferrals(userId: string) {
  const { data } = await supabaseAdmin
    .from('referrals')
    .select('*, referred:profiles!referrals_referred_id_fkey(id, email, full_name, created_at)')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function getCommissionHistory(userId: string) {
  const { data } = await supabaseAdmin
    .from('commissions')
    .select('*, referred:profiles!commissions_referred_id_fkey(email, full_name)')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function getTransactionHistory(userId: string) {
  const { data } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data || []
}
