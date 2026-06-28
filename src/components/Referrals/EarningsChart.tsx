'use client'

type DataPoint = { label: string; value: number }

export default function EarningsChart({ data, height = 200 }: { data: DataPoint[]; height?: number }) {
  if (!data.length) {
    return (
      <div className="card p-8 text-center">
        <p className="text-2xl mb-2">📊</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin datos para mostrar</p>
      </div>
    )
  }

  const max = Math.max(...data.map((d) => d.value), 1)
  const padding = { top: 20, right: 16, bottom: 28, left: 48 }
  const w = 600
  const h = height
  const chartW = w - padding.left - padding.right
  const chartH = h - padding.top - padding.bottom

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding.top + chartH - (d.value / max) * chartH,
    ...d,
  }))

  const areaPath = `
    M ${points[0].x} ${h - padding.bottom}
    ${points.map((p) => `L ${p.x} ${p.y}`).join(' ')}
    L ${points[points.length - 1].x} ${h - padding.bottom} Z
  `

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  const yTicks = 4
  const xStep = Math.max(1, Math.floor(data.length / 6))

  return (
    <div className="card p-4 overflow-x-auto scrollbar-thin">
      <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Ganancias</h3>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ minWidth: '300px' }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-line)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--chart-line)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {Array.from({ length: yTicks }).map((_, i) => {
          const y = padding.top + (i / (yTicks - 1)) * chartH
          const val = Math.round(max * (1 - i / (yTicks - 1)))
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={w - padding.right} y2={y}
                stroke="var(--border)" strokeWidth="1" strokeDasharray="4,4" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end"
                fill="var(--text-muted)" fontSize="10">${val}</text>
            </g>
          )
        })}

        <path d={areaPath} fill="url(#chartGrad)" />
        <path d={linePath} fill="none" stroke="var(--chart-line)" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <g key={i}>
            {i % xStep === 0 && (
              <text x={p.x} y={h - 4} textAnchor="middle" fill="var(--text-muted)" fontSize="9">
                {p.label}
              </text>
            )}
            <circle cx={p.x} cy={p.y} r="4" fill="var(--bg-card)" stroke="var(--chart-line)" strokeWidth="2">
              <title>${p.value.toFixed(2)}</title>
            </circle>
          </g>
        ))}
      </svg>
    </div>
  )
}
