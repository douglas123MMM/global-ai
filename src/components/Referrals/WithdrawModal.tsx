'use client'

import { useState } from 'react'

type Props = {
  availableBalance: number
  onSuccess: () => void
  onClose: () => void
}

export default function WithdrawModal({ availableBalance, onSuccess, onClose }: Props) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('paypal')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    const amt = parseFloat(amount)
    if (!amt || amt < 20) {
      setError('Minimo $20.00')
      return
    }
    if (amt > availableBalance) {
      setError('Saldo insuficiente')
      return
    }
    if (!email) {
      setError(method === 'bank' ? 'Ingresa los datos bancarios' : 'Ingresa tu email')
      return
    }

    setLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const { data: authData } = await createClient().auth.getSession()
      const token = authData.session?.access_token || ''

      const res = await fetch('/api/withdrawal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amt,
          payment_method: method,
          payment_details: { email },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }

      onSuccess()
    } catch {
      setError('Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass p-6 rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Retirar Fondos</h3>
          <button onClick={onClose} className="text-text-muted hover:text-white text-xl">&times;</button>
        </div>

        <p className="text-sm text-text-muted mb-4">
          Disponible: <span className="text-success font-bold">${availableBalance.toFixed(2)}</span>
        </p>

        {error && (
          <div className="bg-danger/20 border border-danger/50 text-danger rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">Monto (USD)</label>
            <input
              type="number" min={20} step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Min $20.00"
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Metodo</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
            >
              <option value="paypal">PayPal</option>
              <option value="stripe">Stripe</option>
              <option value="bank">Transferencia Bancaria</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">
              {method === 'bank' ? 'Datos Bancarios' : 'Email'}
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={method === 'bank' ? 'Nombre, Banco, Num Cuenta' : 'tu@email.com'}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Procesando...' : 'Solicitar Retiro'}
          </button>
        </div>
      </div>
    </div>
  )
}
