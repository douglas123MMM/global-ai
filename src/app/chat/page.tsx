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

  if (authLoading || chat.loadingSessions) {
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
    if (!input.trim() || chat.loading) return
    chat.sendMessage(input)
    setInput('')
  }

  const EmptyState = () => (
    <div className="text-center max-w-lg px-4">
      <h1 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Global AI Chat</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
        Conversa con 8 modelos de IA de 6 proveedores. Configura tus API Keys en Settings.
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
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block h-screen sticky top-0 z-20 transition-all`}>
        <ChatSidebar
          sessions={chat.sessions}
          activeId={chat.activeSession?.id || null}
          onSelect={chat.loadSession}
          onNew={chat.newChat}
          onRename={chat.renameSession}
          onDelete={chat.deleteSession}
        />
      </div>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="flex items-center justify-between px-3 md:px-4 py-2 border-b sticky top-0 z-30" style={{ background: 'var(--nav-bg)', borderColor: 'var(--border)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setSidebarOpen((p) => !p)} className="p-1.5 rounded-lg hover:bg-card-hover transition flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <Link href="/" className="text-base md:text-lg font-bold gradient-text truncate">Global AI</Link>
            {chat.usageLimit.plan !== 'pro' && (
              <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
                {chat.usageLimit.used_today}/{chat.usageLimit.limit}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ModelSelector value={chat.model} onChange={chat.setModel} />
            <ThemeToggle />
            <Link href="/settings/keys" className="text-xs hover:text-primary transition hidden sm:inline" style={{ color: 'var(--text-muted)' }}>Keys</Link>
            <Link href="/dashboard" className="text-xs hover:text-primary transition" style={{ color: 'var(--text-muted)' }}>Dashboard</Link>
          </div>
        </header>

        {chat.error && (
          <div className="px-4 py-2 text-xs font-medium flex items-center gap-2" style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderBottom: '1px solid var(--danger)' }}>
            <span>⚠️</span> {chat.error}
            <Link href="/settings/keys" className="underline ml-auto">Configurar</Link>
          </div>
        )}

        {!chat.usageLimit.canChat && (
          <div className="px-4 py-2 text-xs font-medium flex items-center gap-2" style={{ background: 'var(--warning-light)', color: 'var(--warning)', borderBottom: '1px solid var(--warning)' }}>
            <span>⚠️</span> Limite diario alcanzado.
            <Link href="/pricing" className="underline ml-auto font-bold">Actualizar a Pro</Link>
          </div>
        )}

        <MessageList messages={chat.messages} loading={chat.loading} emptyState={<EmptyState />} />

        <MessageInput value={input} onChange={setInput} onSend={handleSend} disabled={chat.loading || !chat.usageLimit.canChat} />
      </div>
    </div>
  )
}
