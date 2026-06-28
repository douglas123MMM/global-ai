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
  const { user } = useAuth()

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) setReferralCode(ref.toUpperCase())
  }, [searchParams])

  useEffect(() => {
    if (user) router.push('/dashboard')
  }, [user, router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const token = await getAuthToken()
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
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

      setSuccess('Cuenta creada! Redirigiendo al login...')
      setTimeout(() => router.push('/login'), 1500)
    } catch {
      setError('Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  async function getAuthToken() {
    const { createClient: createSupabaseClient } = await import('@/lib/supabase/client')
    const client = createSupabaseClient()
    const { data } = await client.auth.getSession()
    return data.session?.access_token || ''
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
          <label className="block text-sm text-text-muted mb-1">Nombre Completo</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
            required
          />
        </div>
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
            minLength={6}
          />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1">
            Codigo de Referido {referralCode && '(detectado)'}
          </label>
          <input
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary uppercase"
            placeholder="Opcional: ABC123XY"
            maxLength={8}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
        >
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </button>
      </form>
      <p className="text-center text-text-muted text-sm mt-4">
        Ya tienes cuenta?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Inicia Sesion
        </Link>
      </p>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Suspense fallback={<div className="text-text-muted">Cargando...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  )
}
