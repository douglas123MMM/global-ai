'use client'

type WithdrawalItem = {
  id: string
  amount: number
  payment_method: string
  status: string
  requested_at: string
  approved_at?: string
}

const statusStyles: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  approved: 'bg-primary/20 text-primary',
  paid: 'bg-success/20 text-success',
  rejected: 'bg-danger/20 text-danger',
}

export default function WithdrawalsHistory({ withdrawals }: { withdrawals: WithdrawalItem[] }) {
  if (!withdrawals.length) {
    return (
      <div className="glass p-8 rounded-2xl text-center">
        <p className="text-2xl mb-2">💳</p>
        <p className="text-text-muted">Sin retiros solicitados</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wider">
              <th className="text-left p-4">Monto</th>
              <th className="text-left p-4">Metodo</th>
              <th className="text-left p-4">Estado</th>
              <th className="text-left p-4">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w) => (
              <tr key={w.id} className="border-b border-border/50">
                <td className="p-4 font-medium">${Number(w.amount).toFixed(2)}</td>
                <td className="p-4 capitalize">{w.payment_method}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyles[w.status] || 'bg-secondary text-text-muted'}`}>
                    {w.status}
                  </span>
                </td>
                <td className="p-4 text-text-muted text-xs">
                  {new Date(w.requested_at).toLocaleDateString('es', {
                    day: 'numeric', month: 'short', year: 'numeric',
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
