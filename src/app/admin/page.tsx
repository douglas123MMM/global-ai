'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/supabase/provider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type AdminDashboard = {
  total_users: number
  total_referrals: number
  total_commissions: number
  pending_withdrawals: number
  total_founders: number
  founders_remaining: number
}

type AdminWithdrawal = {
  id: string
  user_id: string
  amount: number
  payment_method: string
  payment_details: any
  status: string
  requested_at: string
  user: { email: string; full_name: string }
}

type AdminReferral = {
  id: string
  referrer_id: string
  referred_id: string
  code: string
  status: string
  created_at: string
  referrer: { email: string; full_name: string }
  referred: { email: string; full_name: string }
}

type AdminFounder = {
  id: string
  founder_number: number
  created_at: string
  user: { email: string; full_name: string }
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState('dashboard')
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([])
  const [referrals, setReferrals] = useState<AdminReferral[]>([])
  const [founders, setFounders] = useState<AdminFounder[]>([])
  const [loading, setLoading] = useState(true)
  const [noteMap, setNoteMap] = useState<Record<string, string>>({})
  const [processingCommissions, setProcessingCommissions] = useState(false)
  const [commissionsMsg, setCommissionsMsg] = useState('')

  const getToken = useCallback(async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const { data } = await createClient().auth.getSession()
    return data.session?.access_token || ''
  }, [])

  const fetchData = useCallback(async (action: string) => {
    try {
      const token = await getToken()
      const res = await fetch(`/api/admin?action=${action}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        if (res.status === 403) router.push('/dashboard')
        return
      }
      const data = await res.json()
      switch (action) {
        case 'dashboard': setDashboard(data); break
        case 'withdrawals': setWithdrawals(data); break
        case 'referrals': setReferrals(data); break
        case 'founders': setFounders(data); break
      }
    } catch (err) {
      console.error(err)
    }
  }, [getToken, router])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      setLoading(true)
      fetchData('dashboard').finally(() => setLoading(false))
    }
  }, [user, authLoading, router, fetchData])

  const switchTab = (t: string) => {
    setTab(t)
    if (t === 'dashboard') fetchData('dashboard')
    else if (t === 'withdrawals') fetchData('withdrawals')
    else if (t === 'referrals') fetchData('referrals')
    else if (t === 'founders') fetchData('founders')
  }

  const handleWithdrawalAction = async (withdrawalId: string, status: string) => {
    const token = await getToken()
    const note = noteMap[withdrawalId] || ''
    await fetch('/api/admin', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        withdrawal_id: withdrawalId,
        status,
        admin_notes: note,
      }),
    })
    fetchData('withdrawals')
    fetchData('dashboard')
  }

  const handleProcessCommissions = async () => {
    setProcessingCommissions(true)
    setCommissionsMsg('')
    try {
      const token = await getToken()
      const res = await fetch('/api/cron', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setCommissionsMsg(`Comisiones procesadas: ${data.commissions_created || 0} creadas`)
      } else {
        setCommissionsMsg(data.error || 'Error al procesar')
      }
      fetchData('dashboard')
    } catch {
      setCommissionsMsg('Error de conexion')
    } finally {
      setProcessingCommissions(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted">Cargando panel de administracion...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <nav className="glass px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold gradient-text">Global AI</Link>
          <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">Admin</span>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/dashboard" className="text-sm hover:text-primary">Dashboard</Link>
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
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'dashboard', label: 'Panel' },
            { key: 'withdrawals', label: 'Retiros' },
            { key: 'referrals', label: 'Referidos' },
            { key: 'founders', label: 'Fundadores' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t.key ? 'bg-primary text-white' : 'glass hover:bg-card-hover'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && dashboard && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Usuarios', value: dashboard.total_users },
              { label: 'Referidos Totales', value: dashboard.total_referrals },
              { label: 'Comisiones Totales', value: `$${dashboard.total_commissions.toFixed(2)}` },
              { label: 'Retiros Pendientes', value: `$${dashboard.pending_withdrawals.toFixed(2)}`, color: 'text-warning' },
              { label: 'Fundadores', value: dashboard.total_founders },
              { label: 'Cupos Fundador', value: dashboard.founders_remaining, color: 'text-accent' },
            ].map((s, i) => (
              <div key={i} className="glass p-4 rounded-xl">
                <p className="text-xs text-text-muted mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color || ''}`}>{s.value}</p>
              </div>
              ))}
            </div>

            <div className="glass p-4 rounded-xl mb-8">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-semibold text-sm">Procesar Comisiones Mensuales</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Ejecuta el calculo de comisiones para todos los afiliados del mes actual
                  </p>
                </div>
                <button
                  onClick={handleProcessCommissions}
                  disabled={processingCommissions}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                  style={{ background: 'var(--primary)', color: 'white' }}
                >
                  {processingCommissions ? 'Procesando...' : 'Procesar Ahora'}
                </button>
              </div>
              {commissionsMsg && (
                <p className={`text-sm mt-2 font-medium ${commissionsMsg.includes('Error') ? '' : ''}`}
                  style={{ color: commissionsMsg.includes('Error') ? 'var(--danger)' : 'var(--success)' }}>
                  {commissionsMsg}
                </p>
              )}
            </div>
          </>
          )}

        {tab === 'withdrawals' && (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="text-left p-3">Usuario</th>
                    <th className="text-left p-3">Monto</th>
                    <th className="text-left p-3">Metodo</th>
                    <th className="text-left p-3">Estado</th>
                    <th className="text-left p-3">Fecha</th>
                    <th className="text-left p-3">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-border/50">
                      <td className="p-3">{w.user?.email || 'N/A'}</td>
                      <td className="p-3 font-bold">${Number(w.amount).toFixed(2)}</td>
                      <td className="p-3 capitalize">{w.payment_method}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          w.status === 'pending' ? 'bg-warning/20 text-warning' :
                          w.status === 'approved' ? 'bg-primary/20 text-primary' :
                          w.status === 'paid' ? 'bg-success/20 text-success' :
                          'bg-danger/20 text-danger'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="p-3 text-text-muted text-xs">
                        {new Date(w.requested_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        {w.status === 'pending' && (
                          <div className="flex gap-1 flex-col">
                            <input
                              type="text"
                              placeholder="Nota (opcional)"
                              value={noteMap[w.id] || ''}
                              onChange={(e) => setNoteMap({ ...noteMap, [w.id]: e.target.value })}
                              className="bg-secondary border border-border rounded px-2 py-1 text-xs w-28 text-white"
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleWithdrawalAction(w.id, 'approved')}
                                className="bg-success text-white text-xs px-3 py-1 rounded hover:opacity-80"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleWithdrawalAction(w.id, 'rejected')}
                                className="bg-danger text-white text-xs px-3 py-1 rounded hover:opacity-80"
                              >
                                Rechazar
                              </button>
                            </div>
                          </div>
                        )}
                        {w.status === 'approved' && (
                          <button
                            onClick={() => handleWithdrawalAction(w.id, 'paid')}
                            className="bg-primary text-white text-xs px-3 py-1 rounded hover:opacity-80"
                          >
                            Marcar Pagado
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {withdrawals.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-text-muted">
                        Sin solicitudes de retiro
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'referrals' && (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="text-left p-3">Referidor</th>
                    <th className="text-left p-3">Referido</th>
                    <th className="text-left p-3">Codigo</th>
                    <th className="text-left p-3">Estado</th>
                    <th className="text-left p-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="p-3">{r.referrer?.email || 'N/A'}</td>
                      <td className="p-3">{r.referred?.email || 'N/A'}</td>
                      <td className="p-3 font-mono">{r.code}</td>
                      <td className="p-3">{r.status}</td>
                      <td className="p-3 text-text-muted text-xs">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {referrals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-text-muted">
                        Sin referidos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'founders' && (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="text-left p-3">#</th>
                    <th className="text-left p-3">Usuario</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {founders.map((f) => (
                    <tr key={f.id} className="border-b border-border/50">
                      <td className="p-3">
                        <span className="bg-accent/20 text-accent px-2 py-0.5 rounded text-xs font-bold">
                          #{f.founder_number}
                        </span>
                      </td>
                      <td className="p-3">{f.user?.full_name || 'N/A'}</td>
                      <td className="p-3">{f.user?.email || 'N/A'}</td>
                      <td className="p-3 text-text-muted text-xs">
                        {new Date(f.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {founders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-text-muted">
                        Sin fundadores aun
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
