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
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  const { refreshUser } = useAuth()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email o contrasena incorrectos')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Debes confirmar tu email antes de iniciar sesion')
        } else {
          setError(error.message)
        }
        return
      }
      await refreshUser()
      router.push(redirect)
    } catch {
      setError('Error de conexion. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Ingresa tu email para recuperar la contrasena')
      return
    }
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })
      if (error) {
        setError(error.message)
        return
      }
      setMessage('Te enviamos un enlace de recuperacion a tu email')
    } catch {
      setError('Error al enviar el email de recuperacion')
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
      {message && (
        <div className="bg-success/20 border border-success/50 text-success rounded-lg px-4 py-3 mb-4 text-sm">
          {message}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Contrasena</label>
            <button type="button" onClick={handleForgotPassword}
              className="text-xs font-medium hover:underline transition"
              style={{ color: 'var(--primary)' }}>
              Olvidaste tu contrasena?
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            required
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: 'var(--primary)', color: 'white' }}
        >
          {loading ? 'Iniciando sesion...' : 'Iniciar Sesion'}
        </button>
      </form>
      <p className="text-center text-sm mt-5" style={{ color: 'var(--text-muted)' }}>
        No tienes cuenta?{' '}
        <Link href="/register" className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
          Registrate
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <Suspense fallback={<div style={{ color: 'var(--text-muted)' }}>Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
