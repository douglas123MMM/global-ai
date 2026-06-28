'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/supabase/provider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', models: 'GPT-4o, GPT-4o Mini, GPT-4 Turbo', icon: '🧠', placeholder: 'sk-...' },
  { id: 'anthropic', name: 'Anthropic', models: 'Claude 3.5 Sonnet, Claude 3 Haiku', icon: '🎯', placeholder: 'sk-ant-...' },
  { id: 'google', name: 'Google AI', models: 'Gemini 2.0 Flash', icon: '🌟', placeholder: 'AIza...' },
  { id: 'mistral', name: 'Mistral', models: 'Mistral Large', icon: '🌪️', placeholder: '...' },
  { id: 'groq', name: 'Groq', models: 'Llama 3.3 70B, Mixtral 8x7B', icon: '🦙', placeholder: 'gsk_...' },
  { id: 'nvidia', name: 'NVIDIA', models: 'Llama 3.1 405B', icon: '💎', placeholder: 'nvapi-...' },
]

type ApiKeyRow = { id: string; provider: string; is_valid: boolean; created_at: string; last_validated_at: string | null }

export default function ApiKeysPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [keys, setKeys] = useState<ApiKeyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [keyValues, setKeyValues] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const getToken = useCallback(async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const { data } = await createClient().auth.getSession()
    return data.session?.access_token || ''
  }, [])

  const loadKeys = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch('/api/settings/keys', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setKeys(data)
      }
    } catch { /* */ } finally { setLoading(false) }
  }, [getToken])

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login?redirect=/settings/keys'); return }
    if (user) loadKeys()
  }, [user, authLoading, loadKeys, router])

  const saveKey = async (provider: string) => {
    const apiKey = keyValues[provider]?.trim()
    if (!apiKey) { setMessage({ type: 'error', text: 'Ingresa una API key' }); return }

    setSaving(provider)
    setMessage(null)
    try {
      const token = await getToken()
      const res = await fetch('/api/settings/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ provider, api_key: apiKey }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: `API Key de ${provider} guardada` })
        setKeyValues({ ...keyValues, [provider]: '' })
        loadKeys()
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexion' })
    } finally {
      setSaving(null)
    }
  }

  const deleteKey = async (id: string, provider: string) => {
    try {
      const token = await getToken()
      await fetch(`/api/settings/keys?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      loadKeys()
      setMessage({ type: 'success', text: `API Key de ${provider} eliminada` })
    } catch {
      setMessage({ type: 'error', text: 'Error al eliminar' })
    }
  }

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><p style={{color:'var(--text-muted)'}}>Cargando...</p></div>
  }

  const getKeyForProvider = (provider: string) => keys.find((k) => k.provider === provider)

  return (
    <div className="min-h-screen" style={{background:'var(--bg-primary)',color:'var(--text-primary)'}}>
      <nav className="flex items-center justify-between px-4 py-3 border-b sticky top-0 z-40" style={{background:'var(--nav-bg)',borderColor:'var(--border)',backdropFilter:'blur(16px)'}}>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-bold gradient-text">Global AI</Link>
          <span className="text-xs px-2 py-0.5 rounded" style={{background:'var(--primary-light)',color:'var(--primary)'}}>Settings</span>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/chat" className="text-sm hover:text-primary" style={{color:'var(--text-muted)'}}>Chat</Link>
          <Link href="/dashboard" className="text-sm hover:text-primary" style={{color:'var(--text-muted)'}}>Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">API Keys</h1>
          <p className="text-sm" style={{color:'var(--text-muted)'}}>
            Configura tus propias API keys para usar los modelos de IA. Tus claves se almacenan de forma segura.
          </p>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
            message.type === 'success' ? 'bg-success/10 border border-success/30 text-success' : 'bg-danger/10 border border-danger/30 text-danger'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          {PROVIDERS.map((p) => {
            const existing = getKeyForProvider(p.id)
            return (
              <div key={p.id} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-xs" style={{color:'var(--text-muted)'}}>{p.models}</p>
                  </div>
                  {existing && (
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded ${existing.is_valid ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                      {existing.is_valid ? 'Configurada' : 'Sin validar'}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={keyValues[p.id] || ''}
                    onChange={(e) => setKeyValues({ ...keyValues, [p.id]: e.target.value })}
                    placeholder={existing ? '(oculta) Agregar nueva' : p.placeholder}
                    className="flex-1 text-sm rounded-lg px-3 py-2 border focus:outline-none"
                    style={{background:'var(--bg-secondary)',color:'var(--text-primary)',borderColor:'var(--border)'}}
                  />
                  <button onClick={() => saveKey(p.id)} disabled={saving === p.id}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                    style={{background:'var(--primary)',color:'white'}}>
                    {saving === p.id ? '...' : 'Guardar'}
                  </button>
                  {existing && (
                    <button onClick={() => deleteKey(existing.id, p.id)}
                      className="px-3 py-2 rounded-lg text-sm transition hover:bg-danger/10"
                      style={{color:'var(--danger)'}}>
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 card p-5" style={{background:'var(--accent-light)',borderColor:'var(--accent)'}}>
          <p className="text-sm font-medium mb-1" style={{color:'var(--accent)'}}>Como obtener tus API Keys</p>
          <ul className="text-xs space-y-1" style={{color:'var(--text-secondary)'}}>
            <li>OpenAI: <a href="https://platform.openai.com/api-keys" target="_blank" className="underline" style={{color:'var(--primary)'}}>platform.openai.com/api-keys</a></li>
            <li>Anthropic: <a href="https://console.anthropic.com/keys" target="_blank" className="underline" style={{color:'var(--primary)'}}>console.anthropic.com/keys</a></li>
            <li>Google: <a href="https://aistudio.google.com/apikey" target="_blank" className="underline" style={{color:'var(--primary)'}}>aistudio.google.com/apikey</a></li>
            <li>Mistral: <a href="https://console.mistral.ai/api-keys" target="_blank" className="underline" style={{color:'var(--primary)'}}>console.mistral.ai/api-keys</a></li>
            <li>Groq: <a href="https://console.groq.com/keys" target="_blank" className="underline" style={{color:'var(--primary)'}}>console.groq.com/keys</a></li>
            <li>NVIDIA: <a href="https://build.nvidia.com/explore/discover" target="_blank" className="underline" style={{color:'var(--primary)'}}>build.nvidia.com</a></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
