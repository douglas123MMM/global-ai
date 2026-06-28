'use client'

import { useState, useCallback, useEffect } from 'react'

export type Message = { role: 'user' | 'assistant' | 'system'; content: string }

export type Session = {
  id: string
  title: string
  model: string
  provider: string
  tokens_used: number
  updated_at: string
  messages?: Message[]
}

export type UsageLimit = {
  used_today: number
  limit: number
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
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [model, setModel] = useState('gpt-4o')
  const [loading, setLoading] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [usageLimit, setUsageLimit] = useState<UsageLimit>({ used_today: 0, limit: 10, plan: 'free', canChat: true })
  const [error, setError] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch('/api/chat', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
        setUsageLimit(data.usage || { used_today: 0, limit: 10, plan: 'free', canChat: true })
      }
    } catch { /* */ } finally {
      setLoadingSessions(false)
    }
  }, [])

  const loadSession = useCallback(async (id: string) => {
    try {
      const token = await getToken()
      const res = await fetch(`/api/chat?id=${id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        const session = data.session
        setActiveSession(session)
        setMessages(session.messages || [])
        if (session.model) setModel(session.model)
      }
    } catch { /* */ }
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return

    const userMsg: Message = { role: 'user', content: content.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setError(null)
    setLoading(true)

    try {
      const token = await getToken()
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          model,
          messages: newMessages,
          sessionId: activeSession?.id || null,
        }),
      })
      const data = await res.json()

      if (data.error) {
        setMessages([...newMessages, { role: 'assistant', content: data.error }])
        if (data.needsApiKey) {
          setError(`Falta configurar API Key para ${data.provider}.`)
        }
        if (data.limitReached) {
          setUsageLimit((p) => ({ ...p, canChat: false }))
        }
      } else {
        const assistantMsg: Message = { role: 'assistant', content: data.content }
        setMessages([...newMessages, assistantMsg])

        if (data.sessionId) {
          setActiveSession((prev) => prev ? { ...prev, id: data.sessionId } : {
            id: data.sessionId,
            title: content.substring(0, 60),
            model,
            provider: '',
            tokens_used: data.tokens || 0,
            updated_at: new Date().toISOString(),
          })
        }
        if (data.usage) setUsageLimit(data.usage)
        loadSessions()
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Error de conexion' }])
    } finally {
      setLoading(false)
    }
  }, [messages, model, activeSession, loading, loadSessions])

  const newChat = useCallback(() => {
    setActiveSession(null)
    setMessages([])
    setError(null)
  }, [])

  const renameSession = useCallback(async (id: string, title: string) => {
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, title } : s))
    if (activeSession?.id === id) setActiveSession((p) => p ? { ...p, title } : null)

    try {
      const token = await getToken()
      await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId: id, title }),
      })
    } catch { /* */ }
  }, [activeSession])

  const deleteSession = useCallback(async (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (activeSession?.id === id) {
      setActiveSession(null)
      setMessages([])
    }

    try {
      const token = await getToken()
      await fetch(`/api/chat?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    } catch { /* */ }
  }, [activeSession])

  useEffect(() => { loadSessions() }, [loadSessions])

  return {
    sessions, activeSession, messages, model, loading, loadingSessions,
    usageLimit, error,
    setModel, loadSession, sendMessage, newChat, renameSession, deleteSession,
  }
}
