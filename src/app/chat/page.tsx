'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/supabase/provider'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import ThemeToggle from '@/components/Referrals/ThemeToggle'

const MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', icon: '🧠' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', icon: '⚡' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', icon: '💎' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', icon: '🎯' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', icon: '🌸' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', icon: '🌟' },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral', icon: '🌪️' },
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'Groq', icon: '🦙' },
]

type Message = { role: string; content: string }
type Session = { id: string; title: string; model: string; provider: string; updated_at: string }

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [model, setModel] = useState('gpt-4o')
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const getToken = useCallback(async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const { data } = await createClient().auth.getSession()
    return data.session?.access_token || ''
  }, [])

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login?redirect=/chat'); return }
    if (user) loadSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadSessions = async () => {
    const token = await getToken()
    const res = await fetch('/api/chat', { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setSessions(await res.json())
  }

  const newChat = () => {
    setMessages([])
    setSessionId(null)
    setInput('')
  }

  const loadSession = async (id: string) => {
    const token = await getToken()
    const res = await fetch(`/api/chat?id=${id}`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) {
      setSessionId(id)
      // Messages stored via API response if session data includes messages
    }
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const token = await getToken()
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ model, messages: newMessages, sessionId }),
      })
      const data = await res.json()

      if (data.error) {
        if (data.needsApiKey) {
          setMessages([...newMessages, { role: 'assistant', content: `⚠️ Necesitas configurar una API Key para **${data.provider}**. Ve a [Configuracion de API Keys](/settings/keys) para agregarla.` }])
        } else {
          setMessages([...newMessages, { role: 'assistant', content: `❌ Error: ${data.error}` }])
        }
      } else {
        const updated = [...newMessages, { role: 'assistant', content: data.content }]
        setMessages(updated)
        if (data.sessionId) setSessionId(data.sessionId)
        loadSessions()
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: '❌ Error de conexion. Intenta de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><p style={{color:'var(--text-muted)'}}>Cargando...</p></div>

  return (
    <div className="min-h-screen flex" style={{background:'var(--bg-primary)'}}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden border-r flex-shrink-0`}
        style={{background:'var(--bg-secondary)',borderColor:'var(--border)'}}>
        <div className="p-3 flex flex-col h-full">
          <button onClick={newChat}
            className="w-full mb-3 px-3 py-2 rounded-lg text-sm font-medium transition"
            style={{background:'var(--primary)',color:'white'}}>
            + Nueva Conversacion
          </button>
          <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin">
            {sessions.map((s) => (
              <button key={s.id} onClick={() => loadSession(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition ${
                  s.id === sessionId ? 'bg-primary/20 text-white' : 'hover:bg-card-hover'
                }`}
                style={{color:'var(--text-secondary)'}}>
                {s.title}
              </button>
            ))}
          </div>
          <div className="pt-3 border-t" style={{borderColor:'var(--border)'}}>
            <Link href="/settings/keys" className="block px-3 py-2 rounded-lg text-xs hover:bg-card-hover transition"
              style={{color:'var(--text-muted)'}}>
              Configurar API Keys
            </Link>
          </div>
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="flex items-center justify-between px-4 py-2 border-b" style={{borderColor:'var(--border)'}}>
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded hover:bg-card-hover" style={{color:'var(--text-muted)'}}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <Link href="/" className="text-lg font-bold gradient-text">Global AI</Link>
          </div>
          <div className="flex items-center gap-3">
            <select value={model} onChange={(e) => setModel(e.target.value)}
              className="text-sm rounded-lg px-3 py-1.5 border focus:outline-none"
              style={{background:'var(--bg-card)',color:'var(--text-primary)',borderColor:'var(--border)'}}>
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.icon} {m.name}</option>
              ))}
            </select>
            <ThemeToggle />
            <Link href="/dashboard" className="text-sm hover:text-primary" style={{color:'var(--text-muted)'}}>Dashboard</Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <h2 className="text-3xl font-bold mb-3 gradient-text">Global AI Chat</h2>
                <p className="text-sm mb-6" style={{color:'var(--text-muted)'}}>
                  Selecciona un modelo y empieza a conversar. Trae tu propia API Key en Configuracion.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {['Explica conceptos complejos', 'Escribe codigo', 'Analiza datos', 'Traduce textos'].map((t) => (
                    <button key={t} onClick={() => { setInput(t); inputRef.current?.focus() }}
                      className="p-3 rounded-xl text-sm text-left transition border hover:bg-card-hover"
                      style={{background:'var(--bg-card)',borderColor:'var(--border)',color:'var(--text-secondary)'}}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`mb-4 ${m.role === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-left ${
                m.role === 'user'
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-card text-white rounded-bl-md'
              }`} style={m.role !== 'user' ? {background:'var(--bg-card)',border:'1px solid var(--border)'} : {}}>
                {m.role === 'assistant' ? (
                  <div className="prose prose-sm prose-invert max-w-none [&_pre]:bg-[var(--bg-secondary)] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_code]:text-sm [&_code]:bg-[var(--bg-secondary)] [&_code]:px-1 [&_code]:rounded [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_table]:w-full [&_th]:border [&_th]:border-[var(--border)] [&_th]:p-2 [&_td]:border [&_td]:border-[var(--border)] [&_td]:p-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="mb-4">
              <div className="inline-block rounded-2xl rounded-bl-md px-4 py-3" style={{background:'var(--bg-card)',border:'1px solid var(--border)'}}>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{background:'var(--primary)',animationDelay:'0ms'}}/>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{background:'var(--primary)',animationDelay:'150ms'}}/>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{background:'var(--primary)',animationDelay:'300ms'}}/>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t" style={{borderColor:'var(--border)'}}>
          <div className="max-w-4xl mx-auto flex gap-2">
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva linea)"
              rows={1}
              className="flex-1 resize-none rounded-xl px-4 py-3 text-sm focus:outline-none"
              style={{background:'var(--bg-card)',color:'var(--text-primary)',border:'1px solid var(--border)',maxHeight:'200px'}}
              onInput={(e) => {
                const t = e.currentTarget
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 200) + 'px'
              }}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}
              className="px-5 rounded-xl font-medium transition disabled:opacity-40"
              style={{background:'var(--primary)',color:'white'}}>
              {loading ? '...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
