'use client'

type CommissionItem = {
  id: string
  amount: number
  percentage: number
  status: string
  month: number
  year: number
  created_at: string
  referred?: { email: string; full_name?: string }
}

const statusColors: Record<string, string> = {
  paid: 'text-success',
  pending: 'text-warning',
  failed: 'text-danger',
}

export default function CommissionsHistory({ commissions }: { commissions: CommissionItem[] }) {
  if (!commissions.length) {
    return (
      <div className="glass p-8 rounded-2xl text-center">
        <p className="text-2xl mb-2">💰</p>
        <p className="text-text-muted">Sin comisiones aun</p>
        <p className="text-xs text-text-muted mt-1">Las comisiones se generan mensualmente</p>
      </div>
    )
  }

  const total = commissions.reduce((a, c) => a + Number(c.amount), 0)

  return (
    <div>
      <div className="glass p-4 rounded-xl mb-4 flex items-center justify-between">
        <span className="text-sm text-text-muted">Total comisiones</span>
        <span className="text-xl font-bold text-success">${total.toFixed(2)}</span>
      </div>
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wider">
                <th className="text-left p-4">Usuario</th>
                <th className="text-left p-4">Monto</th>
                <th className="text-left p-4">%</th>
                <th className="text-left p-4">Periodo</th>
                <th className="text-left p-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-card-hover transition">
                  <td className="p-4">{c.referred?.email || 'N/A'}</td>
                  <td className="p-4 text-success font-medium">${Number(c.amount).toFixed(2)}</td>
                  <td className="p-4">{c.percentage}%</td>
                  <td className="p-4 text-text-muted">{c.month}/{c.year}</td>
                  <td className={`p-4 ${statusColors[c.status] || 'text-text-muted'}`}>
                    <span className="capitalize">{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
