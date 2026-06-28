'use client'

import { type Session } from '@/lib/hooks/useChat'
import { useState } from 'react'

type Props = {
  sessions: Session[]
  currentSessionId: string | null | undefined
  onNewChat: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onRenameSession: (id: string, title: string) => void
  isOpen: boolean
  onToggle: () => void
}

function getProviderIcon(provider: string): string {
  switch (provider) {
    case 'openai': return '⚡'
    case 'anthropic': return '🎯'
    case 'google': return '🌟'
    case 'mistral': return '🌪️'
    case 'groq': return '🦙'
    case 'nvidia': return '💎'
    default: return '💬'
  }
}

export default function ChatSidebar({
  sessions, currentSessionId, onNewChat, onSelectSession,
  onDeleteSession, onRenameSession, isOpen, onToggle,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [search, setSearch] = useState('')

  const startRename = (s: Session) => { setEditingId(s.id); setEditTitle(s.title) }
  const confirmRename = () => {
    if (editingId && editTitle.trim()) onRenameSession(editingId, editTitle.trim())
    setEditingId(null)
  }
  const confirmDelete = (s: Session) => {
    if (confirm(`Eliminar "${s.title}"?`)) onDeleteSession(s.id)
  }

  const filtered = search.trim()
    ? sessions.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
    : sessions

  const grouped = filtered.reduce<Record<string, Session[]>>((acc, s) => {
    const label = new Date(s.updated_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
    if (!acc[label]) acc[label] = []
    acc[label].push(s)
    return acc
  }, {})

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" onClick={onToggle} />}
      <div className={`${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:sticky top-0 left-0 z-40 w-72 h-screen border-r flex flex-col transition-transform duration-300 ease-out`}
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold gradient-text">Global AI</h2>
            <button onClick={onToggle} className="md:hidden p-2 rounded-lg hover:bg-card-hover transition"
              style={{ color: 'var(--text-muted)' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <button onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'var(--primary)', color: 'white', boxShadow: '0 4px 14px var(--primary-light)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Chat
          </button>
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none transition"
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-4 scrollbar-thin">
          {Object.entries(grouped).map(([label, items]) => (
            <div key={label}>
              <p className="px-2 text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <div className="space-y-0.5">
                {items.map((s) => (
                  <div key={s.id}
                    className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm ${
                      s.id === currentSessionId ? 'font-medium shadow-sm' : ''
                    }`}
                    style={{
                      background: s.id === currentSessionId ? 'var(--primary-light)' : 'transparent',
                      color: s.id === currentSessionId ? 'var(--primary)' : 'var(--text-secondary)',
                    }}
                    onClick={() => onSelectSession(s.id)}>
                    <span className="text-base flex-shrink-0">{getProviderIcon(s.provider)}</span>
                    {editingId === s.id ? (
                      <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={confirmRename}
                        onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setEditingId(null) }}
                        className="flex-1 text-xs px-2 py-1 rounded border focus:outline-none"
                        style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                        onClick={(e) => e.stopPropagation()} />
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm">{s.title}</p>
                      </div>
                    )}
                    <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => startRename(s)} className="p-1.5 rounded-lg hover:bg-card-hover transition" title="Renombrar">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => confirmDelete(s)} className="p-1.5 rounded-lg hover:bg-danger/20 transition" title="Eliminar">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--danger)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">💬</p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {search ? 'Sin resultados' : 'Sin conversaciones'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {search ? 'Intenta otra búsqueda' : 'Crea un nuevo chat para empezar'}
              </p>
            </div>
          )}
        </div>

        <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
          <a href="/settings/keys"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition hover:bg-card-hover"
            style={{ color: 'var(--text-muted)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            API Keys
          </a>
          <p className="text-xs text-center opacity-40" style={{ color: 'var(--text-muted)' }}>
            Global AI v1.0
          </p>
        </div>
      </div>
    </>
  )
}
