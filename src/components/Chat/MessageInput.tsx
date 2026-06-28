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
      <div className="max-w-4xl mx-auto flex gap-2 items-end">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Escribe un mensaje... (Enter para enviar)'}
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none rounded-xl px-4 py-3 text-sm focus:outline-none transition disabled:opacity-50"
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            maxHeight: '200px',
          }}
        />
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="px-6 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-40 flex-shrink-0"
          style={{ background: 'var(--primary)', color: 'white' }}
        >
          {disabled ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}
