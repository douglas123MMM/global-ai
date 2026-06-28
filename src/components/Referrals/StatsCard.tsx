'use client'

type Stat = {
  label: string
  value: string | number
  prefix?: string
  color?: string
  icon?: string
}

export default function StatsCard({ stats }: { stats: Stat[] }) {
  const colorMap: Record<string, string> = {
    green: 'text-success',
    purple: 'text-primary',
    yellow: 'text-warning',
    gold: 'text-accent',
    default: 'text-white',
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <div key={i} className="glass p-4 rounded-xl hover:bg-card-hover transition">
          <div className="flex items-center gap-2 mb-1">
            {s.icon && <span className="text-lg">{s.icon}</span>}
            <p className="text-xs text-text-muted">{s.label}</p>
          </div>
          <p className={`text-xl md:text-2xl font-bold ${colorMap[s.color || 'default'] || 'text-white'}`}>
            {s.prefix || ''}{typeof s.value === 'number' && s.prefix === '$'
              ? Number(s.value).toFixed(2)
              : s.value}
          </p>
        </div>
      ))}
    </div>
  )
}
