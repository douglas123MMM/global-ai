'use client'

const BONUS_THRESHOLDS = [
  { name: 'Primer Referido', required: 1, amount: 5, type: 'first_referral', icon: '🎉' },
  { name: '10 Referidos', required: 10, amount: 20, type: 'ten_referrals', icon: '⭐' },
  { name: '50 Referidos', required: 50, amount: 100, type: 'fifty_referrals', icon: '🔥' },
  { name: '100 Referidos', required: 100, amount: 500, type: 'hundred_referrals', icon: '👑' },
]

export default function LevelProgress({
  totalReferrals,
  currentTier,
  commissionPercentage,
  bonusesClaimed,
}: {
  totalReferrals: number
  currentTier: string
  commissionPercentage: number
  bonusesClaimed: string[]
}) {
  const tierLabel = (t: string) => {
    if (t === 'founder') return { name: 'Fundador', color: 'text-accent', bg: 'bg-accent' }
    if (t === 'level2') return { name: 'Experto', color: 'text-primary', bg: 'bg-primary' }
    return { name: 'Basico', color: 'text-text-muted', bg: 'bg-text-muted' }
  }

  const tier = tierLabel(currentTier)
  const nextMilestone = BONUS_THRESHOLDS.find((b) => totalReferrals < b.required)

  return (
    <div className="glass p-6 rounded-2xl">
      <h3 className="text-sm text-text-muted mb-4">Progreso y Bonos</h3>

      <div className="flex items-center gap-3 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${tier.bg}/20 ${tier.color}`}>
          {tier.name}
        </span>
        <span className="text-sm text-text-muted">{commissionPercentage}% comision</span>
      </div>

      <div className="space-y-3">
        {BONUS_THRESHOLDS.map((b) => {
          const unlocked = totalReferrals >= b.required
          const claimed = bonusesClaimed.includes(b.type)
          const isNext = nextMilestone?.type === b.type

          return (
            <div
              key={b.type}
              className={`flex items-center justify-between p-3 rounded-lg transition ${
                unlocked && claimed
                  ? 'bg-success/10 border border-success/30'
                  : unlocked
                  ? 'bg-primary/10 border border-primary/30'
                  : isNext
                  ? 'bg-card-hover border border-border'
                  : 'bg-secondary/30 opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{b.icon}</span>
                <div>
                  <p className={`text-sm font-medium ${unlocked ? 'text-white' : 'text-text-muted'}`}>
                    {b.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {totalReferrals}/{b.required} referidos
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${unlocked ? 'text-success' : 'text-text-muted'}`}>
                  +${b.amount}
                </p>
                {unlocked && claimed && (
                  <span className="text-xs text-success">Reclamado</span>
                )}
                {unlocked && !claimed && (
                  <span className="text-xs text-primary">Disponible</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {nextMilestone && (
        <div className="mt-4 p-3 bg-card-hover rounded-lg">
          <p className="text-xs text-text-muted">
            Proximo bono: <span className="text-white">{nextMilestone.name}</span>
          </p>
          <div className="mt-1 bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (totalReferrals / nextMilestone.required) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
