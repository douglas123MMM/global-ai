'use client'

type ReferralItem = {
  id: string
  code: string
  status: string
  tier: string
  commission_percentage: number
  created_at: string
  referred: { email: string; full_name?: string }
}

const tierLabels: Record<string, string> = {
  founder: 'Fundador',
  level2: 'Experto',
  level1: 'Basico',
}

const statusColors: Record<string, string> = {
  active: 'text-success',
  pending: 'text-warning',
  completed: 'text-primary',
  canceled: 'text-danger',
}

export default function ReferralsList({ referrals }: { referrals: ReferralItem[] }) {
  if (!referrals.length) {
    return (
      <div className="glass p-8 rounded-2xl text-center">
        <p className="text-2xl mb-2">🔗</p>
        <p className="text-text-muted">Aun no tienes referidos</p>
        <p className="text-xs text-text-muted mt-1">Comparte tu enlace para empezar a ganar</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wider">
              <th className="text-left p-4">Usuario</th>
              <th className="text-left p-4">Estado</th>
              <th className="text-left p-4">Nivel</th>
              <th className="text-left p-4">%</th>
              <th className="text-left p-4">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((r) => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-card-hover transition">
                <td className="p-4">
                  <div>
                    <p className="text-white">{r.referred?.email || 'N/A'}</p>
                    {r.referred?.full_name && (
                      <p className="text-xs text-text-muted">{r.referred.full_name}</p>
                    )}
                  </div>
                </td>
                <td className={`p-4 ${statusColors[r.status] || 'text-text-muted'}`}>
                  <span className="capitalize">{r.status}</span>
                </td>
                <td className="p-4">{tierLabels[r.tier] || r.tier}</td>
                <td className="p-4">{r.commission_percentage}%</td>
                <td className="p-4 text-text-muted text-xs">
                  {new Date(r.created_at).toLocaleDateString('es', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
