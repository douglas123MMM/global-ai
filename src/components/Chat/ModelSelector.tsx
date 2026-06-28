'use client'

import { useState, useRef, useEffect } from 'react'

type Model = { id: string; name: string; provider: string; icon: string; desc: string }

const MODELS: Model[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', icon: '🧠', desc: 'Modelo mas potente de OpenAI' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', icon: '⚡', desc: 'Rapido y economico para tareas simples' },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', icon: '🎯', desc: 'Excelente para codigo y razonamiento' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', icon: '🌟', desc: 'Gran ventana de contexto, 2M tokens' },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral', icon: '🌪️', desc: 'Rendimiento europeo de primer nivel' },
  { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'Groq', icon: '🦙', desc: 'Open source, ultra rapido via Groq' },
  { id: 'mixtral-8x7b', name: 'Mixtral 8x7B', provider: 'Groq', icon: '🔀', desc: 'Mixture of Experts, balance calidad/velocidad' },
  { id: 'llama-3.1-405b', name: 'Llama 3.1 405B', provider: 'NVIDIA', icon: '💎', desc: 'Modelo masivo open source via NVIDIA' },
]

function getProviderColor(provider: string): string {
  switch (provider) {
    case 'OpenAI': return '#10a37f'
    case 'Anthropic': return '#d97757'
    case 'Google': return '#4285f4'
    case 'Mistral': return '#f59e0b'
    case 'Groq': return '#ef4444'
    case 'NVIDIA': return '#76b900'
    default: return 'var(--text-muted)'
  }
}

type Props = { value: string; onChange: (v: string) => void; disabled?: boolean }

export default function ModelSelector({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = MODELS.find((m) => m.id === value) || MODELS[0]

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const providerColor = getProviderColor(selected.provider)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
      >
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: providerColor }} />
        <span className="font-semibold hidden sm:inline">{selected.name}</span>
        <span className="text-xs hidden sm:inline opacity-50">por {selected.provider}</span>
        <svg className="w-3.5 h-3.5 opacity-40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="fixed sm:absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 rounded-2xl shadow-2xl z-50 overflow-hidden border animate-fade-in"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="p-2">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Seleccionar Modelo
            </p>
            {MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => { onChange(m.id); setOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition hover:bg-card-hover"
                style={{
                  color: 'var(--text-primary)',
                  background: m.id === value ? 'var(--primary-light)' : 'transparent',
                }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: 'var(--bg-secondary)' }}>
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{m.name}</p>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={{ background: getProviderColor(m.provider) + '20', color: getProviderColor(m.provider) }}>
                      {m.provider}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.desc}</p>
                </div>
                {m.id === value && (
                  <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export { MODELS }
