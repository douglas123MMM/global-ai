'use client'

import { useState, useEffect } from 'react'

type LeaderboardEntry = {
  rank: number
  user_id: string
  email: string
  full_name: string
  total_earned: number
  total_referrals: number
  is_winner?: boolean
  prize?: number
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/referrals/leaderboard?period=${period}`)
      .then((r) => r.json())
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [period])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Ranking de Referidores</h3>
        <div className="flex gap-1">
          {[
            { key: 'month', label: 'Mes' },
            { key: 'year', label: 'Ano' },
            { key: 'all', label: 'Total' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                period === p.key ? 'bg-primary text-white' : 'glass hover:bg-card-hover'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="h-8 w-8 bg-secondary rounded-full" />
              <div className="flex-1 h-4 bg-secondary rounded" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="glass p-8 rounded-2xl text-center">
          <p className="text-2xl mb-2">🏆</p>
          <p className="text-text-muted">Sin datos aun</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          {entries.slice(0, 10).map((e, i) => (
            <div
              key={e.user_id || i}
              className={`flex items-center gap-3 p-3 border-b border-border/50 last:border-0 hover:bg-card-hover transition ${
                e.is_winner ? 'bg-accent/5' : ''
              }`}
            >
              <span className={`w-8 text-center font-bold text-lg ${
                i < 3 ? 'text-2xl' : 'text-text-muted'
              }`}>
                {medals[i] || `#${e.rank}`}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{e.full_name || e.email}</p>
                <p className="text-xs text-text-muted">{e.total_referrals} referidos</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-success">${e.total_earned.toFixed(2)}</p>
                {e.is_winner && e.prize ? (
                  <p className="text-xs text-accent">+${e.prize} premio</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
