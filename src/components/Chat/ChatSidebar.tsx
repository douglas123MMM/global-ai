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

export default function ChatSidebar({
  sessions, currentSessionId, onNewChat, onSelectSession,
  onDeleteSession, onRenameSession, isOpen, onToggle,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const startRename = (s: Session) => { setEditingId(s.id); setEditTitle(s.title) }
  const confirmRename = () => {
    if (editingId && editTitle.trim()) onRenameSession(editingId, editTitle.trim())
    setEditingId(null)
  }
  const confirmDelete = (s: Session) => {
    if (confirm(`Eliminar "${s.title}"?`)) onDeleteSession(s.id)
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onToggle} />}
      <div className={`${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:sticky top-0 left-0 z-40 w-64 h-screen border-r flex flex-col transition-transform duration-300`}
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <div className="p-3 flex items-center justify-between">
          <button onClick={onNewChat}
            className="flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
            style={{ background: 'var(--primary)', color: 'white' }}>+ Nueva</button>
          <button onClick={onToggle} className="md:hidden ml-2 p-1.5 rounded-lg hover:bg-card-hover"
            style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 scrollbar-thin">
          {sessions.map((s) => (
            <div key={s.id}
              className={`group flex items-center gap-1 px-3 py-2.5 rounded-lg cursor-pointer transition text-sm ${
                s.id === currentSessionId ? 'font-medium' : ''
              }`}
              style={{ background: s.id === currentSessionId ? 'var(--primary-light)' : 'transparent', color: s.id === currentSessionId ? 'var(--primary)' : 'var(--text-secondary)' }}
              onClick={() => onSelectSession(s.id)}>
              {editingId === s.id ? (
                <input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={confirmRename}
                  onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setEditingId(null) }}
                  className="flex-1 text-xs px-2 py-1 rounded border focus:outline-none"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                  onClick={(e) => e.stopPropagation()} />
              ) : (
                <div className="flex-1 min-w-0">
                  <p className="truncate">{s.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {new Date(s.updated_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              )}
              <div className="hidden group-hover:flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => startRename(s)} className="p-1 rounded hover:bg-card-hover" title="Renombrar" style={{ color: 'var(--text-muted)' }}>✏️</button>
                <button onClick={() => confirmDelete(s)} className="p-1 rounded hover:bg-danger/20" title="Eliminar" style={{ color: 'var(--danger)' }}>🗑</button>
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>Sin conversaciones</p>
          )}
        </div>
        <div className="p-3 border-t text-xs" style={{ borderColor: 'var(--border)' }}>
          <a href="/settings/keys" className="hover:text-primary transition" style={{ color: 'var(--text-muted)' }}>API Keys</a>
        </div>
      </div>
    </>
  )
}
