'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/supabase/provider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type DashboardData = {
  total_referrals: number
  active_referrals: number
  total_earned: number
  available_balance: number
  pending_balance: number
  current_tier: string
  commission_percentage: number
  referrals_this_month: number
  earnings_this_month: number
}

type ReferralItem = {
  id: string
  referrer_id: string
  code: string
  status: string
  tier: string
  commission_percentage: number
  created_at: string
  referred: { email: string; full_name: string }
}

type CommissionItem = {
  id: string
  amount: number
  percentage: number
  status: string
  month: number
  year: number
  created_at: string
  referred: { email: string; full_name: string }
}

type TransactionItem = {
  id: string
  type: string
  amount: number
  description: string
  created_at: string
}

type WithdrawalItem = {
  id: string
  amount: number
  payment_method: string
  status: string
  requested_at: string
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState<DashboardData | null>(null)
  const [referralCode, setReferralCode] = useState('')
  const [referrals, setReferrals] = useState<ReferralItem[]>([])
  const [commissions, setCommissions] = useState<CommissionItem[]>([])
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState('paypal')
  const [withdrawEmail, setWithdrawEmail] = useState('')
  const [withdrawError, setWithdrawError] = useState('')
  const [withdrawSuccess, setWithdrawSuccess] = useState('')
  const [copied, setCopied] = useState(false)

  const getToken = useCallback(async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || ''
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }

      const [statsRes, codeRes, refsRes, commsRes, transRes] = await Promise.all([
        fetch('/api/referral?action=stats', { headers }),
        fetch('/api/referral?action=code', { headers }),
        fetch('/api/referral?action=referrals', { headers }),
        fetch('/api/referral?action=commissions', { headers }),
        fetch('/api/referral?action=transactions', { headers }),
      ])

      if (statsRes.ok) setStats(await statsRes.json())
      if (codeRes.ok) {
        const c = await codeRes.json()
        setReferralCode(c.code?.code || '')
      }
      if (refsRes.ok) setReferrals(await refsRes.json())
      if (commsRes.ok) setCommissions(await commsRes.json())
      if (transRes.ok) setTransactions(await transRes.json())

      const wRes = await fetch('/api/withdrawal', { headers })
      if (wRes.ok) setWithdrawals(await wRes.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard')
      return
    }
    if (user) fetchData()
  }, [user, authLoading, router, fetchData])

  const handleWithdraw = async () => {
    setWithdrawError('')
    setWithdrawSuccess('')
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount < 20) {
      setWithdrawError('Minimo $20 para retirar')
      return
    }
    if (!withdrawEmail) {
      setWithdrawError('Ingresa tu email de PayPal o Stripe')
      return
    }

    try {
      const token = await getToken()
      const res = await fetch('/api/withdrawal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          payment_method: withdrawMethod,
          payment_details: { email: withdrawEmail },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setWithdrawError(data.error)
        return
      }

      setWithdrawSuccess('Solicitud enviada! Sera revisada en 24-48h.')
      setWithdrawAmount('')
      fetchData()
    } catch {
      setWithdrawError('Error de conexion')
    }
  }

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tierLabel = (t: string) => {
    if (t === 'founder') return 'Fundador'
    if (t === 'level2') return 'Experto'
    return 'Basico'
  }

  const statusColor = (s: string) => {
    if (s === 'active' || s === 'approved' || s === 'paid') return 'text-success'
    if (s === 'pending') return 'text-warning'
    if (s === 'rejected') return 'text-danger'
    return 'text-text-muted'
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted">Cargando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <nav className="glass px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <Link href="/" className="text-xl font-bold gradient-text">Global AI</Link>
        <div className="flex gap-3 items-center flex-wrap">
          <Link href="/pricing" className="text-sm hover:text-primary">Planes</Link>
          <span className="text-sm text-text-muted">{user?.email}</span>
          <button
            onClick={async () => {
              const { createClient } = await import('@/lib/supabase/client')
              await createClient().auth.signOut()
              router.push('/')
            }}
            className="text-sm text-danger hover:underline"
          >
            Salir
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Referral Code Section */}
        <div className="glass p-6 rounded-2xl mb-8">
          <h2 className="text-sm text-text-muted mb-2">Tu Codigo de Referido</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <code className="text-3xl font-mono font-bold text-primary tracking-wider">
              {referralCode}
            </code>
            <button
              onClick={copyReferralLink}
              className="bg-primary hover:bg-primary-hover text-white text-sm px-4 py-2 rounded-lg transition"
            >
              {copied ? 'Copiado!' : 'Copiar Enlace'}
            </button>
          </div>
          <p className="text-xs text-text-muted mt-2">
            Comparte: {typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${referralCode}` : ''}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['overview', 'referrals', 'commissions', 'transactions', 'withdraw'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t ? 'bg-primary text-white' : 'glass hover:bg-card-hover'
              }`}
            >
              {t === 'overview' ? 'Resumen' : t === 'referrals' ? 'Referidos' : t === 'commissions' ? 'Comisiones' : t === 'transactions' ? 'Transacciones' : 'Retirar'}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Saldo Disponible', value: `$${stats?.available_balance?.toFixed(2) || '0.00'}`, color: 'text-success' },
                { label: 'Total Ganado', value: `$${stats?.total_earned?.toFixed(2) || '0.00'}`, color: 'text-primary' },
                { label: 'Referidos Activos', value: stats?.active_referrals || 0, color: 'text-warning' },
                { label: 'Nivel', value: `${tierLabel(stats?.current_tier || 'level1')} (${stats?.commission_percentage || 20}%)`, color: 'text-accent' },
              ].map((s, i) => (
                <div key={i} className="glass p-4 rounded-xl">
                  <p className="text-xs text-text-muted mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="glass p-4 rounded-xl">
                <h3 className="text-sm text-text-muted mb-3">Referidos este mes</h3>
                <p className="text-3xl font-bold">{stats?.referrals_this_month || 0}</p>
              </div>
              <div className="glass p-4 rounded-xl">
                <h3 className="text-sm text-text-muted mb-3">Ganancias este mes</h3>
                <p className="text-3xl font-bold text-success">
                  ${stats?.earnings_this_month?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </>
        )}

        {tab === 'referrals' && (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="text-left p-4">Usuario</th>
                    <th className="text-left p-4">Estado</th>
                    <th className="text-left p-4">Nivel</th>
                    <th className="text-left p-4">Comision</th>
                    <th className="text-left p-4">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="p-4">{r.referred?.email || 'N/A'}</td>
                      <td className={`p-4 ${statusColor(r.status)}`}>{r.status}</td>
                      <td className="p-4">{tierLabel(r.tier)}</td>
                      <td className="p-4">{r.commission_percentage}%</td>
                      <td className="p-4 text-text-muted">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {referrals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-text-muted">
                        Sin referidos aun
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'commissions' && (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="text-left p-4">Usuario</th>
                    <th className="text-left p-4">Monto</th>
                    <th className="text-left p-4">%</th>
                    <th className="text-left p-4">Periodo</th>
                    <th className="text-left p-4">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-b border-border/50">
                      <td className="p-4">{c.referred?.email || 'N/A'}</td>
                      <td className="p-4 text-success">${Number(c.amount).toFixed(2)}</td>
                      <td className="p-4">{c.percentage}%</td>
                      <td className="p-4 text-text-muted">{c.month}/{c.year}</td>
                      <td className={`p-4 ${statusColor(c.status)}`}>{c.status}</td>
                    </tr>
                  ))}
                  {commissions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-text-muted">
                        Sin comisiones aun
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'transactions' && (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="text-left p-4">Tipo</th>
                    <th className="text-left p-4">Monto</th>
                    <th className="text-left p-4">Descripcion</th>
                    <th className="text-left p-4">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-border/50">
                      <td className="p-4 capitalize">
                        {t.type === 'commission' ? 'Comision' : t.type === 'bonus' ? 'Bono' : t.type === 'withdrawal' ? 'Retiro' : 'Ajuste'}
                      </td>
                      <td className={`p-4 ${t.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                        {t.amount >= 0 ? '+' : ''}${Math.abs(t.amount).toFixed(2)}
                      </td>
                      <td className="p-4 text-text-muted">{t.description || '-'}</td>
                      <td className="p-4 text-text-muted">{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-text-muted">
                        Sin transacciones
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'withdraw' && (
          <div className="max-w-md">
            <div className="glass p-6 rounded-2xl mb-6">
              <h3 className="text-lg font-semibold mb-4">Solicitar Retiro</h3>
              <p className="text-sm text-text-muted mb-4">
                Saldo disponible: <span className="text-success font-bold">${stats?.available_balance?.toFixed(2) || '0.00'}</span>
                <br />Minimo para retirar: $20.00
              </p>

              {withdrawError && (
                <div className="bg-danger/20 border border-danger/50 text-danger rounded-lg px-4 py-3 mb-4 text-sm">
                  {withdrawError}
                </div>
              )}
              {withdrawSuccess && (
                <div className="bg-success/20 border border-success/50 text-success rounded-lg px-4 py-3 mb-4 text-sm">
                  {withdrawSuccess}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Monto (USD)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Min $20"
                    min={20}
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Metodo de Pago</label>
                  <select
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="paypal">PayPal</option>
                    <option value="stripe">Stripe</option>
                    <option value="bank">Transferencia Bancaria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">
                    {withdrawMethod === 'paypal' ? 'Email de PayPal' : withdrawMethod === 'stripe' ? 'Email de Stripe' : 'Datos Bancarios'}
                  </label>
                  <input
                    type="text"
                    value={withdrawEmail}
                    onChange={(e) => setWithdrawEmail(e.target.value)}
                    placeholder={withdrawMethod === 'bank' ? 'Nombre, Banco, Cuenta' : 'Email'}
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  onClick={handleWithdraw}
                  disabled={!stats || stats.available_balance < 20}
                  className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  Solicitar Retiro
                </button>
              </div>
            </div>

            {withdrawals.length > 0 && (
              <div className="glass rounded-2xl overflow-hidden">
                <h3 className="p-4 text-sm font-semibold border-b border-border">Historial de Retiros</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-text-muted">
                        <th className="text-left p-3">Monto</th>
                        <th className="text-left p-3">Metodo</th>
                        <th className="text-left p-3">Estado</th>
                        <th className="text-left p-3">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((w) => (
                        <tr key={w.id} className="border-b border-border/50">
                          <td className="p-3">${Number(w.amount).toFixed(2)}</td>
                          <td className="p-3 capitalize">{w.payment_method}</td>
                          <td className={`p-3 ${statusColor(w.status)}`}>{w.status}</td>
                          <td className="p-3 text-text-muted">
                            {new Date(w.requested_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
