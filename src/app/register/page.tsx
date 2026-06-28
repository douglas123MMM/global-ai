'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/supabase/provider'
import Link from 'next/link'

function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, refreshUser } = useAuth()

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) setReferralCode(ref.toUpperCase())
  }, [searchParams])

  useEffect(() => {
    if (user) router.push('/dashboard')
  }, [user, router])

  const getPasswordStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (!pwd) return { label: '', color: 'transparent', width: '0%' }
    if (pwd.length < 6) return { label: 'Debil', color: 'var(--danger)', width: '25%' }
    if (pwd.length < 8) return { label: 'Media', color: 'var(--warning)', width: '50%' }
    if (pwd.length < 10 || !/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { label: 'Buena', color: 'var(--accent)', width: '75%' }
    return { label: 'Fuerte', color: 'var(--success)', width: '100%' }
  }

  const passwordStrength = getPasswordStrength(password)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          referral_code: referralCode || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al registrarse')
        return
      }

      setSuccess('Cuenta creada! Iniciando sesion automaticamente...')

      const { createClient: createSupabaseClient } = await import('@/lib/supabase/client')
      const supabase = createSupabaseClient()
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (loginError) {
        setSuccess('Cuenta creada! Redirigiendo al login...')
        setTimeout(() => router.push('/login'), 1500)
        return
      }
      await refreshUser()
      router.push('/dashboard')
    } catch {
      setError('Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass p-8 rounded-2xl w-full max-w-md">
      <Link href="/" className="text-2xl font-bold gradient-text block text-center mb-6">
        Global AI
      </Link>
      <h1 className="text-xl font-semibold text-center mb-6">Crear Cuenta</h1>

      {error && (
        <div className="bg-danger/20 border border-danger/50 text-danger rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-success/20 border border-success/50 text-success rounded-lg px-4 py-3 mb-4 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nombre Completo</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            required
            autoComplete="name"
          />
        </div>
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
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Contrasena</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            required
            minLength={6}
            autoComplete="new-password"
          />
          {password && (
            <div className="mt-2">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-card-hover)' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: passwordStrength.width, background: passwordStrength.color }} />
              </div>
              <p className="text-xs mt-1" style={{ color: passwordStrength.color }}>{passwordStrength.label}</p>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Codigo de Referido {referralCode && '(detectado)'}
          </label>
          <input
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary uppercase transition"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            placeholder="Opcional: ABC123XY"
            maxLength={8}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: 'var(--primary)', color: 'white' }}
        >
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </button>
      </form>
      <p className="text-center text-sm mt-5" style={{ color: 'var(--text-muted)' }}>
        Ya tienes cuenta?{' '}
        <Link href="/login" className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
          Inicia Sesion
        </Link>
      </p>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <Suspense fallback={<div style={{ color: 'var(--text-muted)' }}>Cargando...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  )
}
