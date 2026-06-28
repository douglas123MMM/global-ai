import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    const period = req.nextUrl.searchParams.get('period') || 'all'

    const { data: manualData } = await supabaseAdmin
      .from('commissions')
      .select(`
        amount,
        referrer_id,
        referrer:profiles!commissions_referrer_id_fkey(email, full_name, avatar_url)
      `)

    const leaderboard = new Map<string, { email: string; name: string; total: number; referrals: number }>()

    for (const row of manualData || []) {
      const uid = row.referrer_id
      const existing = leaderboard.get(uid)
      if (existing) {
        existing.total += Number(row.amount)
        existing.referrals++
      } else {
        const ref = row.referrer as any
        leaderboard.set(uid, {
          email: ref?.email || 'N/A',
          name: ref?.full_name || 'Usuario',
          total: Number(row.amount),
          referrals: 1,
        })
      }
    }

    const sorted = Array.from(leaderboard.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 50)
      .map(([userId, data], i) => ({
        rank: i + 1,
        user_id: userId,
        email: data.email,
        full_name: data.name,
        total_earned: data.total,
        total_referrals: data.referrals,
        is_winner: i === 0 && period === 'month',
        prize: i === 0 && period === 'month' ? 200 : 0,
      }))

    return NextResponse.json(sorted)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
