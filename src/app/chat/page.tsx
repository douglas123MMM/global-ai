'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/supabase/provider'
import { useRouter } from 'next/navigation'
import { useChat } from '@/lib/hooks/useChat'
import Link from 'next/link'
import ThemeToggle from '@/components/Referrals/ThemeToggle'
import ChatSidebar from '@/components/Chat/ChatSidebar'
import MessageList from '@/components/Chat/MessageList'
import MessageInput from '@/components/Chat/MessageInput'
import ModelSelector from '@/components/Chat/ModelSelector'

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const chat = useChat()
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login?redirect=/chat') }
  }, [user, authLoading, router])

  if (authLoading || chat.isLoadingSessions) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex gap-2">
          {[0, 150, 300].map((d) => (
            <div key={d} className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: 'var(--primary)', animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    )
  }

  const handleSend = () => {
    if (!input.trim() || chat.isLoading) return
    chat.sendMessage(input)
    setInput('')
  }

  const EmptyState = () => (
    <div className="text-center max-w-lg px-4 animate-fade-in">
      <h1 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Global AI Chat</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
        8 modelos de IA. 6 proveedores. Trae tu propia API Key.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { text: 'Explicame como funciona la computacion cuantica', icon: '🔬' },
          { text: 'Escribe una funcion en Python para ordenar datos', icon: '💻' },
          { text: 'Cuales son las mejores practicas de seguridad web?', icon: '🔒' },
          { text: 'Traduce este texto al ingles y frances', icon: '🌐' },
        ].map((t, i) => (
          <button
            key={i}
            onClick={() => chat.sendMessage(t.text)}
            className="p-4 rounded-xl text-sm text-left transition border hover:border-primary/50 hover:-translate-y-0.5"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <span className="block mb-1 text-lg">{t.icon}</span>
            {t.text}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {sidebarOpen && (
        <div className="fixed md:sticky top-0 left-0 h-screen z-30 md:z-0 shadow-2xl md:shadow-none">
          <ChatSidebar
            sessions={chat.sessions}
            currentSessionId={chat.currentSession?.id}
            onNewChat={() => chat.createSession('Nueva conversacion', chat.selectedModel)}
            onSelectSession={chat.switchSession}
            onDeleteSession={chat.deleteSession}
            onRenameSession={chat.renameSession}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {!sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-20 p-2 rounded-xl shadow-lg md:hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="flex items-center justify-between px-3 md:px-4 py-2 border-b sticky top-0 z-20"
          style={{ background: 'var(--nav-bg)', borderColor: 'var(--border)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setSidebarOpen((p) => !p)}
              className="p-1.5 rounded-lg hover:bg-card-hover transition flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/" className="text-base md:text-lg font-bold gradient-text truncate">Global AI</Link>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              {chat.usage.limit === 'unlimited'
                ? <span style={{ color: 'var(--success)' }}>✨ Pro</span>
                : <span>{chat.messagesToday}/{chat.usage.limit} hoy</span>}
            </div>
            <ModelSelector value={chat.selectedModel} onChange={chat.setSelectedModel} />
            <ThemeToggle />
            <Link href="/settings/keys" className="text-xs hover:text-primary transition hidden sm:inline" style={{ color: 'var(--text-muted)' }}>Keys</Link>
          </div>
        </header>

        {chat.error && (
          <div className="px-4 py-2 text-xs font-medium flex items-center gap-2" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
            <span>⚠️</span> {chat.error}
            <Link href="/settings/keys" className="underline ml-auto">Configurar</Link>
          </div>
        )}

        {chat.isLimitReached && (
          <div className="px-4 py-2 text-xs font-medium flex items-center gap-2" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
            <span>⚠️</span> Limite diario alcanzado ({chat.messagesToday} consultas). <Link href="/pricing" className="underline ml-auto font-bold">Actualizar a Pro</Link>
          </div>
        )}

        <MessageList messages={chat.messages} loading={chat.isLoading} emptyState={<EmptyState />} />
        <MessageInput value={input} onChange={setInput} onSend={handleSend}
          disabled={chat.isLoading || chat.isLimitReached}
          placeholder={chat.isLimitReached ? 'Limite diario alcanzado. Actualiza a Pro.' : 'Escribe tu mensaje...'} />
      </div>
    </div>
  )
}
