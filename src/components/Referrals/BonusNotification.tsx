'use client'

import { useState, useEffect } from 'react'

export default function BonusNotification() {
  const [bonus, setBonus] = useState<{ amount: number; description: string } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const bonusStr = params.get('bonus')
    if (bonusStr) {
      try {
        const data = JSON.parse(bonusStr)
        setBonus(data)
        setTimeout(() => setBonus(null), 5000)
      } catch {}
    }
  }, [])

  if (!bonus) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="glass p-4 rounded-xl border border-accent/50 shadow-lg shadow-accent/20 max-w-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎁</span>
          <div>
            <p className="text-sm font-semibold text-accent">Bono Recibido!</p>
            <p className="text-xs text-text-muted">{bonus.description}</p>
            <p className="text-lg font-bold text-success">+${bonus.amount.toFixed(2)}</p>
          </div>
          <button
            onClick={() => setBonus(null)}
            className="text-text-muted hover:text-white ml-auto"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  )
}
