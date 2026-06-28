import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const results: Record<string, string> = {}
  let ok = true

  // 1. Check env vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  results.env_supabase_url = supabaseUrl ? 'OK' : 'MISSING'
  results.env_service_key = supabaseKey ? 'OK' : 'MISSING'
  if (!supabaseUrl || !supabaseKey) ok = false

  // 2. Check tables
  const tables = [
    'profiles', 'referral_codes', 'referrals', 'subscriptions', 'commissions',
    'user_balance', 'withdrawal_requests', 'transactions', 'founders',
    'referral_tiers', 'bonus_paid', 'chat_sessions', 'user_api_keys',
  ]

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    if (error) {
      results.db_connect = `ERROR: ${error.message}`
      ok = false
    } else {
      results.db_connect = 'OK'
    }

    for (const table of tables) {
      try {
        const { error: tableErr } = await supabaseAdmin
          .from(table)
          .select('id', { count: 'exact', head: true })
        results[`table_${table}`] = tableErr ? `ERROR: ${tableErr.message}` : 'OK'
        if (tableErr) ok = false
      } catch { /* */ }
    }
  } catch (e: any) {
    results.db_connect = `FATAL: ${e.message}`
    ok = false
  }

  // 3. Check functions
  const functions = ['handle_new_user', 'generate_referral_code', 'check_and_update_tier', 'process_monthly_commissions']
  for (const fn of functions) {
    try {
      const { error: fnErr } = await supabaseAdmin.rpc(fn, {})
      results[`fn_${fn}`] = fnErr ? `ERROR: ${fnErr.message}` : 'OK'
    } catch {
      results[`fn_${fn}`] = 'EXISTS'
    }
  }

  // 4. Check auth
  try {
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 })
    results.auth = authErr ? `ERROR: ${authErr.message}` : 'OK'
    if (authErr) ok = false
  } catch {
    results.auth = 'CONFIGURED'
  }

  return NextResponse.json({
    status: ok ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: results,
    app_url: process.env.NEXT_PUBLIC_APP_URL || 'not set',
    env: process.env.NODE_ENV || 'development',
  }, { status: ok ? 200 : 500 })
}
