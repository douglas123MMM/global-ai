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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '\\' && e.ctrlKey) {
        e.preventDefault()
        setSidebarOpen((p) => !p)
      }
      if (e.key === 'k' && e.ctrlKey) {
        e.preventDefault()
        document.querySelector<HTMLTextAreaElement>('textarea')?.focus()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  if (authLoading || chat.isLoadingSessions) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            {[0, 150, 300].map((d) => (
              <div key={d} className="w-3 h-3 rounded-full animate-bounce"
                style={{ background: 'var(--primary)', animationDelay: `${d}ms` }} />
            ))}
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Cargando Global AI...</p>
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
    <div className="text-center max-w-xl px-4 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: 'var(--primary-light)' }}>
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--primary)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
      </div>
      <h1 className="text-3xl md:text-4xl font-bold mb-3 gradient-text">Global AI Chat</h1>
      <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        8 modelos de IA. 6 proveedores. <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Trae tu propia API Key.</span>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
        {[
          { text: 'Explicame como funciona la computacion cuantica', icon: '🔬' },
          { text: 'Escribe una funcion en Python para ordenar datos', icon: '💻' },
          { text: 'Cuales son las mejores practicas de seguridad web?', icon: '🔒' },
          { text: 'Traduce este texto al ingles y frances', icon: '🌐' },
        ].map((t, i) => (
          <button
            key={i}
            onClick={() => chat.sendMessage(t.text)}
            className="p-4 rounded-2xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98] text-left border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <span className="block mb-2 text-xl">{t.icon}</span>
            <span className="leading-relaxed">{t.text}</span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
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

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="flex items-center justify-between px-3 md:px-5 py-3 border-b flex-shrink-0"
          style={{ background: 'var(--nav-bg)', borderColor: 'var(--border)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((p) => !p)}
              className="p-2 rounded-xl transition hover:bg-card-hover"
              style={{ color: 'var(--text-muted)' }}
              title="Ctrl+\ para toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {chat.currentSession && (
              <div className="hidden sm:block">
                <h2 className="text-sm font-semibold truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>
                  {chat.currentSession.title}
                </h2>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-medium"
              style={{
                background: chat.isLimitReached ? 'var(--danger-light)' : 'var(--success-light)',
                color: chat.isLimitReached ? 'var(--danger)' : 'var(--success)',
              }}>
              {chat.usage.plan === 'pro' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
                  Pro · Ilimitado
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: chat.isLimitReached ? 'var(--danger)' : 'var(--success)' }} />
                  {chat.messagesToday}/{chat.usage.limit} hoy
                </>
              )}
            </div>
            <ModelSelector value={chat.selectedModel} onChange={chat.setSelectedModel} />
            <ThemeToggle />
            <Link href="/settings/keys" className="hidden sm:flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full font-medium transition hover:bg-card-hover"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Keys
            </Link>
          </div>
        </header>

        {chat.error && (
          <div className="px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 flex-shrink-0"
            style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
            <span>⚠️</span> {chat.error}
            <Link href="/settings/keys" className="underline font-bold ml-2">Configurar API Keys</Link>
          </div>
        )}

        {chat.isLimitReached && (
          <div className="px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 flex-shrink-0"
            style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
            <span>⚠️</span> Limite diario alcanzado ({chat.messagesToday} consultas).
            <Link href="/pricing" className="underline font-bold ml-2">Actualizar a Pro</Link>
          </div>
        )}

        <MessageList messages={chat.messages} loading={chat.isLoading} emptyState={<EmptyState />} />
        <MessageInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={chat.isLoading || chat.isLimitReached}
          placeholder={
            chat.isLimitReached
              ? 'Limite diario alcanzado. Actualiza a Pro.'
              : `Escribe un mensaje... (${chat.selectedModel})`
          }
        />
      </div>
    </div>
  )
}
