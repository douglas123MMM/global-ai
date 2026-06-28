'use client'

import { useState, useRef, useEffect } from 'react'

type Model = { id: string; name: string; provider: string; icon: string }

const MODELS: Model[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', icon: '🧠' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', icon: '⚡' },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', icon: '🎯' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', icon: '🌟' },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral', icon: '🌪️' },
  { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'Groq', icon: '🦙' },
  { id: 'mixtral-8x7b', name: 'Mixtral 8x7B', provider: 'Groq', icon: '🔀' },
  { id: 'llama-3.1-405b', name: 'Llama 3.1 405B', provider: 'NVIDIA', icon: '💎' },
]

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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl border transition hover:bg-card-hover disabled:opacity-50"
        style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
      >
        <span>{selected.icon}</span>
        <span className="font-medium hidden sm:inline">{selected.name}</span>
        <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-64 rounded-xl shadow-xl z-50 overflow-hidden border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          {MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => { onChange(m.id); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition hover:bg-card-hover"
              style={{
                color: 'var(--text-primary)',
                background: m.id === value ? 'var(--primary-light)' : 'transparent',
              }}
            >
              <span className="text-lg">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{m.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.provider}</p>
              </div>
              {m.id === value && (
                <span style={{ color: 'var(--primary)' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { MODELS }
