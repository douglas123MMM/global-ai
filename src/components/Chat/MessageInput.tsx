'use client'

import { useRef, useEffect } from 'react'

type Props = {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled: boolean
  placeholder?: string
}

export default function MessageInput({ value, onChange, onSend, disabled, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = Math.min(ref.current.scrollHeight, 200) + 'px'
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && value.trim()) onSend()
    }
  }

  return (
    <div className="p-3 md:p-4 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2 items-end p-1.5 rounded-2xl border transition-all focus-within:ring-2"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border)',
          }}>
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva linea)'}
            rows={1}
            disabled={disabled}
            className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm focus:outline-none disabled:opacity-50 placeholder-opacity-50"
            style={{
              color: 'var(--text-primary)',
              maxHeight: '200px',
            }}
          />
          <button
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="p-2.5 rounded-xl transition-all disabled:opacity-30 flex-shrink-0 hover:scale-105 active:scale-95"
            style={{ background: value.trim() && !disabled ? 'var(--primary)' : 'transparent', color: value.trim() && !disabled ? 'white' : 'var(--text-muted)' }}
            title="Enviar mensaje"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-center mt-2 opacity-40" style={{ color: 'var(--text-muted)' }}>
          Global AI puede cometer errores. Verifica la informacion importante.
        </p>
      </div>
    </div>
  )
}
