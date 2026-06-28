'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/supabase/provider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Leaderboard from '@/components/Referrals/Leaderboard'
import StatsCard from '@/components/Referrals/StatsCard'

export default function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [topStats, setTopStats] = useState<any>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/referrals/leaderboard')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    fetch('/api/referrals/leaderboard?period=all')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const totalReferrals = data.reduce((a: number, e: any) => a + (e.total_referrals || 0), 0)
          const totalEarned = data.reduce((a: number, e: any) => a + (e.total_earned || 0), 0)
          setTopStats({ totalReferrals, totalEarned, participants: data.length })
        }
      })
  }, [])

  return (
    <div className="min-h-screen">
      <nav className="glass px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold gradient-text">Global AI</Link>
        <div className="flex gap-3 items-center">
          <Link href="/dashboard" className="text-sm hover:text-primary">Dashboard</Link>
          <Link href="/referrals" className="text-sm hover:text-primary">Referidos</Link>
          <span className="text-sm text-text-muted">{user?.email}</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Ranking de Referidores</h1>
          <p className="text-text-muted">Top referidor del mes gana <span className="text-accent font-bold">$200</span></p>
        </div>

        {topStats && (
          <div className="mb-8">
            <StatsCard
              stats={[
                { label: 'Participantes', value: topStats.participants, icon: '👥' },
                { label: 'Total Referidos', value: topStats.totalReferrals, icon: '🔗' },
                { label: 'Total Pagado', value: topStats.totalEarned, prefix: '$', color: 'green', icon: '💰' },
              ]}
            />
          </div>
        )}

        <Leaderboard />

        <div className="mt-8 glass p-6 rounded-2xl text-center">
          <h3 className="text-lg font-semibold mb-2">Como aparecer en el ranking?</h3>
          <p className="text-text-muted text-sm">
            Comparte tu enlace de referido. Cada persona que se registre y se suscriba te genera comisiones.
            Mientras mas referidos activos tengas, mas alto estaras en el ranking.
          </p>
          <Link
            href="/referrals"
            className="inline-block mt-4 bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg text-sm font-medium transition"
          >
            Ir a Mis Referidos
          </Link>
        </div>
      </div>
    </div>
  )
}
