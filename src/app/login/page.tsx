'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/supabase/provider'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  const { refreshUser } = useAuth()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Email o contrasena incorrectos')
        return
      }
      await refreshUser()
      router.push(redirect)
    } catch {
      setError('Error al iniciar sesion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass p-8 rounded-2xl w-full max-w-md">
      <Link href="/" className="text-2xl font-bold gradient-text block text-center mb-6">
        Global AI
      </Link>
      <h1 className="text-xl font-semibold text-center mb-6">Iniciar Sesion</h1>

      {error && (
        <div className="bg-danger/20 border border-danger/50 text-danger rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm text-text-muted mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1">Contrasena</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
        >
          {loading ? 'Iniciando...' : 'Iniciar Sesion'}
        </button>
      </form>
      <p className="text-center text-text-muted text-sm mt-4">
        No tienes cuenta?{' '}
        <Link href="/register" className="text-primary hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Suspense fallback={<div className="text-text-muted">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
