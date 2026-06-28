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

  const startRename = (s: Session) => {
    setEditingId(s.id)
    setEditTitle(s.title)
  }

  const confirmRename = () => {
    if (editingId && editTitle.trim()) {
      onRenameSession(editingId, editTitle.trim())
    }
    setEditingId(null)
  }

  if (!isOpen) return null

  return (
    <div className="w-64 flex-shrink-0 border-r flex flex-col h-full" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
      <div className="p-3 flex items-center justify-between">
        <button
          onClick={onNewChat}
          className="flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
          style={{ background: 'var(--primary)', color: 'white' }}
        >
          + Nueva Conversacion
        </button>
        <button onClick={onToggle} className="ml-2 p-1.5 rounded-lg md:hidden hover:bg-card-hover" style={{ color: 'var(--text-muted)' }}>
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 scrollbar-thin">
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`group flex items-center gap-1 px-3 py-2 rounded-lg cursor-pointer transition text-sm ${
              s.id === currentSessionId ? 'font-medium' : ''
            }`}
            style={{
              background: s.id === currentSessionId ? 'var(--primary-light)' : 'transparent',
              color: s.id === currentSessionId ? 'var(--primary)' : 'var(--text-secondary)',
            }}
            onClick={() => onSelectSession(s.id)}
          >
            {editingId === s.id ? (
              <input
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={confirmRename}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setEditingId(null) }}
                className="flex-1 text-xs px-2 py-1 rounded border focus:outline-none"
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate flex-1">{s.title}</span>
            )}
            <div className="hidden group-hover:flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => startRename(s)} className="p-1 rounded hover:bg-card-hover text-xs" style={{ color: 'var(--text-muted)' }}>✏️</button>
              <button onClick={() => onDeleteSession(s.id)} className="p-1 rounded hover:bg-danger/20 text-xs" style={{ color: 'var(--danger)' }}>🗑</button>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>Sin conversaciones</p>
        )}
      </div>

      <div className="p-3 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        <a href="/settings/keys" className="hover:text-primary transition">API Keys</a>
      </div>
    </div>
  )
}
