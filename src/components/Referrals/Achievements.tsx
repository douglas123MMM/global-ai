'use client'

type Achievement = {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  progress?: { current: number; target: number }
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

const rarityStyles: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  common:   { border: '#9ca3af', bg: 'rgba(156,163,175,0.1)', text: '#9ca3af', glow: 'none' },
  rare:     { border: '#3b82f6', bg: 'rgba(59,130,246,0.1)', text: '#60a5fa', glow: 'none' },
  epic:     { border: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', text: '#a78bfa', glow: '0 0 8px rgba(139,92,246,0.3)' },
  legendary:{ border: '#f59e0b', bg: 'rgba(245,158,11,0.1)', text: '#fbbf24', glow: '0 0 12px rgba(245,158,11,0.4)' },
}

export default function Achievements({ achievements }: { achievements: Achievement[] }) {
  if (!achievements.length) return null

  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Logros</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {achievements.map((a) => {
          const style = rarityStyles[a.rarity]
          return (
            <div
              key={a.id}
              className={`relative rounded-xl p-3 text-center transition-all duration-300 ${
                a.unlocked ? 'hover:scale-105' : 'opacity-40 grayscale'
              }`}
              style={{
                border: `1px solid ${style.border}`,
                background: style.bg,
                boxShadow: a.unlocked ? style.glow : 'none',
              }}
            >
              <span className="text-2xl block mb-1">{a.unlocked ? a.icon : '🔒'}</span>
              <p className="text-xs font-semibold" style={{ color: a.unlocked ? style.text : 'var(--text-muted)' }}>
                {a.name}
              </p>
              {a.progress && !a.unlocked && (
                <div className="mt-1" style={{ background: 'var(--border)', borderRadius: '4px', height: '3px' }}>
                  <div
                    style={{
                      width: `${Math.min(100, (a.progress.current / a.progress.target) * 100)}%`,
                      height: '100%',
                      borderRadius: '4px',
                      background: style.border,
                    }}
                  />
                </div>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{a.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
