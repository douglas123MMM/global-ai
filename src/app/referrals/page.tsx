'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/supabase/provider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StatsCard from '@/components/Referrals/StatsCard'
import ReferralLink from '@/components/Referrals/ReferralLink'
import ReferralsList from '@/components/Referrals/ReferralsList'
import CommissionsHistory from '@/components/Referrals/CommissionsHistory'
import WithdrawModal from '@/components/Referrals/WithdrawModal'
import WithdrawalsHistory from '@/components/Referrals/WithdrawalsHistory'
import LevelProgress from '@/components/Referrals/LevelProgress'
import EarningsChart from '@/components/Referrals/EarningsChart'
import Achievements from '@/components/Referrals/Achievements'
import RealtimeNotifications from '@/components/Referrals/RealtimeNotifications'
import ThemeToggle from '@/components/Referrals/ThemeToggle'

export default function ReferralsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState<any>(null)
  const [referrals, setReferrals] = useState<any[]>([])
  const [commissions, setCommissions] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [bonusesClaimed, setBonusesClaimed] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showWithdraw, setShowWithdraw] = useState(false)

  const getToken = useCallback(async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const { data } = await createClient().auth.getSession()
    return data.session?.access_token || ''
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }

      const [statsRes, refsRes, commsRes, transRes, wRes, bonusRes] = await Promise.all([
        fetch('/api/referral?action=stats', { headers }),
        fetch('/api/referral?action=referrals', { headers }),
        fetch('/api/referral?action=commissions', { headers }),
        fetch('/api/referral?action=transactions', { headers }),
        fetch('/api/withdrawal', { headers }),
        fetch('/api/referrals/claim-bonus', { headers }),
      ])

      if (statsRes.ok) setStats(await statsRes.json())
      if (refsRes.ok) setReferrals(await refsRes.json())
      if (commsRes.ok) setCommissions(await commsRes.json())
      if (transRes.ok) setTransactions(await transRes.json())
      if (wRes.ok) setWithdrawals(await wRes.json())
      if (bonusRes.ok) {
        const bonusData = await bonusRes.json()
        setBonusesClaimed((bonusData.bonuses_claimed || []).map((b: any) => b.bonus_type))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/referrals')
      return
    }
    if (user) fetchData()
  }, [user, authLoading, router, fetchData])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <RealtimeNotifications userId={user?.id} />

      <nav className="glass px-4 md:px-6 py-3 md:py-4 flex items-center justify-between flex-wrap gap-2 sticky top-0 z-40"
        style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg md:text-xl font-bold gradient-text">Global AI</Link>
          <ThemeToggle />
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <Link href="/dashboard" className="text-sm hover:text-primary">Dashboard</Link>
          <Link href="/referrals/leaderboard" className="text-sm hover:text-primary">Ranking</Link>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email}</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Programa de Referidos</h1>

        <div className="mb-6">
          <ReferralLink />
        </div>

        <StatsCard
          stats={[
            { label: 'Saldo Disponible', value: stats?.available_balance || 0, prefix: '$', color: 'green', icon: '💵' },
            { label: 'Total Ganado', value: stats?.total_earned || 0, prefix: '$', color: 'purple', icon: '💰' },
            { label: 'Referidos', value: stats?.total_referrals || 0, color: 'yellow', icon: '👥' },
            { label: 'Este Mes', value: stats?.earnings_this_month || 0, prefix: '$', color: 'gold', icon: '📈' },
          ]}
        />

        <div className="flex gap-2 my-6 flex-wrap">
          {[
            { key: 'overview', label: 'Resumen' },
            { key: 'referrals', label: 'Referidos' },
            { key: 'commissions', label: 'Comisiones' },
            { key: 'transactions', label: 'Transacciones' },
            { key: 'withdraw', label: 'Retiros' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t.key ? 'bg-primary text-white' : 'glass hover:bg-card-hover'
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => setShowWithdraw(true)}
            disabled={!stats || stats.available_balance < 20}
            className="ml-auto bg-success hover:bg-success/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            Retirar Dinero
          </button>
        </div>

        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LevelProgress
                totalReferrals={stats?.total_referrals || 0}
                currentTier={stats?.current_tier || 'level1'}
                commissionPercentage={stats?.commission_percentage || 20}
                bonusesClaimed={bonusesClaimed}
              />
              <div className="space-y-4">
                <EarningsChart
                  data={commissions?.length
                    ? commissions.slice(0, 12).reverse().map((c: any) => ({
                        label: `${c.month}/${c.year}`,
                        value: Number(c.amount),
                      }))
                    : []}
                />
              </div>
            </div>
            <Achievements achievements={[
              { id: 'first', name: 'Iniciado', description: 'Primer referido', icon: '🎉', unlocked: (stats?.total_referrals || 0) >= 1, rarity: 'common' },
              { id: 'ten', name: 'Popular', description: '10 referidos', icon: '⭐', unlocked: (stats?.total_referrals || 0) >= 10, rarity: 'rare', progress: { current: stats?.total_referrals || 0, target: 10 } },
              { id: 'level2', name: 'Experto', description: 'Nivel 2 alcanzado', icon: '💎', unlocked: stats?.current_tier === 'level2' || stats?.current_tier === 'founder', rarity: 'epic' },
              { id: 'fifty', name: 'Influencer', description: '50 referidos', icon: '🔥', unlocked: (stats?.total_referrals || 0) >= 50, rarity: 'epic', progress: { current: stats?.total_referrals || 0, target: 50 } },
              { id: 'hundred', name: 'Leyenda', description: '100 referidos', icon: '👑', unlocked: (stats?.total_referrals || 0) >= 100, rarity: 'legendary', progress: { current: stats?.total_referrals || 0, target: 100 } },
              { id: 'founder', name: 'Fundador', description: 'Top 1000', icon: '🏅', unlocked: stats?.current_tier === 'founder' || bonusesClaimed.includes('founder'), rarity: 'legendary' },
              { id: 'earner', name: 'Ganador', description: '$100+ ganados', icon: '💵', unlocked: (stats?.total_earned || 0) >= 100, rarity: 'rare', progress: { current: Math.min(stats?.total_earned || 0, 100), target: 100 } },
              { id: 'big_earner', name: 'Master', description: '$1000+ ganados', icon: '🏆', unlocked: (stats?.total_earned || 0) >= 1000, rarity: 'legendary', progress: { current: Math.min(stats?.total_earned || 0, 1000), target: 1000 } },
            ]} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card p-4">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Acceso Rapido</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { label: 'Ver Ranking', href: '/referrals/leaderboard' },
                    { label: 'Comprar Plan', href: '/pricing' },
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Soporte', href: '#' },
                  ].map((l) => (
                    <Link key={l.label} href={l.href}
                      className="p-2 rounded-lg text-xs text-center transition hover:scale-[1.02]"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'referrals' && <ReferralsList referrals={referrals} />}

        {tab === 'commissions' && <CommissionsHistory commissions={commissions} />}

        {tab === 'transactions' && (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wider">
                    <th className="text-left p-4">Tipo</th>
                    <th className="text-left p-4">Monto</th>
                    <th className="text-left p-4">Descripcion</th>
                    <th className="text-left p-4">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-border/50">
                      <td className="p-4 capitalize text-xs">
                        <span className={`px-2 py-0.5 rounded ${
                          t.type === 'commission' ? 'bg-primary/20 text-primary' :
                          t.type === 'bonus' ? 'bg-accent/20 text-accent' :
                          t.type === 'withdrawal' ? 'bg-danger/20 text-danger' :
                          'bg-secondary text-text-muted'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className={`p-4 font-medium ${t.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                        {t.amount >= 0 ? '+' : ''}{Number(t.amount).toFixed(2)}
                      </td>
                      <td className="p-4 text-text-muted text-xs">{t.description || '-'}</td>
                      <td className="p-4 text-text-muted text-xs">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={4} className="p-4 text-center text-text-muted">Sin transacciones</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'withdraw' && (
          <div>
            <button
              onClick={() => setShowWithdraw(true)}
              className="bg-success hover:bg-success/80 text-white px-6 py-3 rounded-lg font-semibold transition mb-4"
            >
              Solicitar Retiro
            </button>
            <WithdrawalsHistory withdrawals={withdrawals} />
          </div>
        )}
      </div>

      {showWithdraw && (
        <WithdrawModal
          availableBalance={stats?.available_balance || 0}
          onSuccess={() => {
            setShowWithdraw(false)
            fetchData()
          }}
          onClose={() => setShowWithdraw(false)}
        />
      )}
    </div>
  )
}
