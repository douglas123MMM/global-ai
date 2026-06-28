import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const ipRequestMap = new Map<string, { count: number; resetAt: number }>()
const MAX_REQUESTS = 100
const WINDOW_MS = 60_000

export function rateLimiter(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const entry = ipRequestMap.get(ip)

  if (entry && now < entry.resetAt) {
    if (entry.count >= MAX_REQUESTS) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }, { status: 429 })
    }
    entry.count++
  } else {
    ipRequestMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
  }
  return null
}

export async function detectFraud(userId: string, ip: string): Promise<string | null> {
  const { data: sameIpUsers } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('signup_ip', ip)

  if (sameIpUsers && sameIpUsers.length > 3) {
    return `Demasiadas cuentas desde la misma IP (${sameIpUsers.length})`
  }

  const { data: recentRefs } = await supabaseAdmin
    .from('referrals')
    .select('referred_id')
    .eq('referrer_id', userId)
    .gte('created_at', new Date(Date.now() - 3600_000).toISOString())

  if (recentRefs && recentRefs.length >= 10) {
    return 'Demasiados referidos en la ultima hora'
  }

  return null
}

export function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         '0.0.0.0'
}
