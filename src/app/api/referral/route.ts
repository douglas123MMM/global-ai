import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  getOrCreateReferralCode,
  getDashboardStats,
  getUserReferrals,
  getCommissionHistory,
  getTransactionHistory,
} from '@/lib/referral'

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

    const action = req.nextUrl.searchParams.get('action') || 'stats'

    switch (action) {
      case 'code': {
        const code = await getOrCreateReferralCode(user.id)
        return NextResponse.json({ code })
      }
      case 'stats': {
        const stats = await getDashboardStats(user.id)
        return NextResponse.json(stats)
      }
      case 'referrals': {
        const referrals = await getUserReferrals(user.id)
        return NextResponse.json(referrals)
      }
      case 'commissions': {
        const commissions = await getCommissionHistory(user.id)
        return NextResponse.json(commissions)
      }
      case 'transactions': {
        const transactions = await getTransactionHistory(user.id)
        return NextResponse.json(transactions)
      }
      default:
        return NextResponse.json({ error: 'Accion invalida' }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
