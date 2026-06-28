'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function PricingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (tier: 'basic' | 'pro') => {
    setLoading(tier)
    try {
      const { data: authData } = await supabase.auth.getSession()
      if (!authData.session) {
        router.push(`/login?redirect=/pricing`)
        return
      }

      const token = authData.session.access_token
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'create', tier }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen">
      <nav className="glass px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold gradient-text">Global AI</Link>
        <Link href="/dashboard" className="hover:text-primary">Dashboard</Link>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">Planes y Precios</h1>
        <p className="text-text-muted mb-12">Elige el plan que mejor se adapte a ti</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {[
            {
              name: 'Basic',
              price: 10,
              features: ['IA Assistant basico', '10 consultas/dia', 'Acceso a herramientas basicas', 'Soporte por email'],
            },
            {
              name: 'Pro',
              price: 20,
              popular: true,
              features: ['IA Assistant avanzado', 'Consultas ilimitadas', 'Todas las herramientas', 'Soporte prioritario 24/7', 'Acceso anticipado a nuevas funciones'],
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`glass p-8 rounded-2xl relative ${plan.popular ? 'border-primary/50 ring-1 ring-primary/30' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-4 py-1 rounded-full">
                  Mas Popular
                </span>
              )}
              <h2 className="text-xl font-bold mb-2">{plan.name}</h2>
              <div className="text-4xl font-bold mb-1">
                ${plan.price}<span className="text-lg text-text-muted">/mes</span>
              </div>
              <ul className="text-sm text-text-muted space-y-2 my-6 text-left">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-success">&#10003;</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.name.toLowerCase() as 'basic' | 'pro')}
                disabled={loading === plan.name.toLowerCase()}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  plan.popular
                    ? 'bg-primary hover:bg-primary-hover text-white'
                    : 'glass hover:bg-card-hover'
                } disabled:opacity-50`}
              >
                {loading === plan.name.toLowerCase() ? 'Cargando...' : `Elegir ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
