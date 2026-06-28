'use client'

import { useState, useCallback, useEffect } from 'react'

export type Message = { role: 'user' | 'assistant' | 'system'; content: string; timestamp: string }

export type Session = {
  id: string
  title: string
  model: string
  provider: string
  tokens_used: number
  updated_at: string
  messages?: Message[]
}

export type UsageInfo = {
  used_today: number
  limit: number | 'unlimited'
  plan: string
  canChat: boolean
}

async function getToken() {
  const { createClient } = await import('@/lib/supabase/client')
  const { data } = await createClient().auth.getSession()
  return data.session?.access_token || ''
}

export function useChat() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedModel, setSelectedModel] = useState('gpt-4o')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [usage, setUsage] = useState<UsageInfo>({ used_today: 0, limit: 10, plan: 'free', canChat: true })
  const [error, setError] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch('/api/chat', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
        if (data.usage) setUsage({
          used_today: data.usage.used_today,
          limit: data.usage.limit === 999 ? 'unlimited' : data.usage.limit,
          plan: data.usage.plan,
          canChat: data.usage.canChat,
        })
      }
    } catch { /* */ } finally {
      setIsLoadingSessions(false)
    }
  }, [])

  const createSession = useCallback(async (title: string, model: string) => {
    setCurrentSession(null)
    setMessages([])
    setSelectedModel(model)
    setError(null)
  }, [])

  const switchSession = useCallback(async (id: string) => {
    try {
      const token = await getToken()
      const res = await fetch(`/api/chat?id=${id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        const session = data.session
        setCurrentSession(session)
        setMessages(session.messages || [])
        if (session.model) setSelectedModel(session.model)
        setError(null)
      }
    } catch { /* */ }
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return
    if (!usage.canChat) {
      setError('Limite diario alcanzado. Actualiza a Pro para continuar.')
      return
    }

    const now = new Date().toISOString()
    const userMsg: Message = { role: 'user', content: content.trim(), timestamp: now }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setError(null)
    setIsLoading(true)

    try {
      const token = await getToken()
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          model: selectedModel,
          messages: newMessages.map(({ role, content }) => ({ role, content })),
          sessionId: currentSession?.id || null,
        }),
      })
      const data = await res.json()

      if (data.error) {
        setMessages([...newMessages, {
          role: 'assistant',
          content: data.limitReached
            ? '⚠️ Limite diario alcanzado. Actualiza a Pro para consultas ilimitadas.'
            : data.needsApiKey
              ? `⚠️ Configura tu API Key de ${data.provider} en Settings para usar este modelo.`
              : `❌ ${data.error}`,
          timestamp: now,
        }])
        if (data.limitReached) setUsage((p) => ({ ...p, canChat: false }))
        if (data.needsApiKey) setError(`Falta API Key de ${data.provider}.`)
      } else {
        const assistantMsg: Message = { role: 'assistant', content: data.content, timestamp: now }
        setMessages([...newMessages, assistantMsg])

        if (data.sessionId) {
          setCurrentSession((prev) => prev ? { ...prev, id: data.sessionId } : {
            id: data.sessionId,
            title: content.substring(0, 60),
            model: selectedModel,
            provider: '',
            tokens_used: data.tokens || 0,
            updated_at: now,
          })
        }
        if (data.usage) setUsage({
          used_today: data.usage.used_today,
          limit: data.usage.limit === 999 ? 'unlimited' : data.usage.limit,
          plan: data.usage.plan,
          canChat: data.usage.canChat,
        })
        loadSessions()
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: '❌ Error de conexion. Intenta de nuevo.', timestamp: now }])
    } finally {
      setIsLoading(false)
    }
  }, [messages, selectedModel, currentSession, isLoading, usage.canChat, loadSessions])

  const deleteSession = useCallback(async (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (currentSession?.id === id) {
      setCurrentSession(null)
      setMessages([])
    }
    try {
      const token = await getToken()
      await fetch(`/api/chat?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    } catch { /* */ }
  }, [currentSession])

  const renameSession = useCallback(async (id: string, title: string) => {
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, title } : s))
    if (currentSession?.id === id) setCurrentSession((p) => p ? { ...p, title } : null)
    try {
      const token = await getToken()
      await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId: id, title }),
      })
    } catch { /* */ }
  }, [currentSession])

  useEffect(() => { loadSessions() }, [loadSessions])

  const messagesToday = messages.filter((m) =>
    m.role === 'user' &&
    new Date(m.timestamp).toDateString() === new Date().toDateString()
  ).length

  const isLimitReached = usage.limit !== 'unlimited' && messagesToday >= Number(usage.limit)

  return {
    sessions,
    currentSession,
    messages,
    selectedModel,
    isLoading,
    isLoadingSessions,
    usage,
    error,
    messagesToday,
    isLimitReached,
    setSelectedModel,
    loadSessions,
    createSession,
    switchSession,
    sendMessage,
    deleteSession,
    renameSession,
  }
}
