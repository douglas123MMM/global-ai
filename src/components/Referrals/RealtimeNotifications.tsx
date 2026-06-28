'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Notification = {
  id: string
  message: string
  type: 'success' | 'info' | 'bonus'
  timestamp: number
}

export default function RealtimeNotifications({ userId }: { userId?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [subscribed, setSubscribed] = useState(false)

  const addNotification = useCallback((msg: string, type: Notification['type'] = 'info') => {
    const id = Date.now().toString()
    setNotifications((prev) => [{ id, message: msg, type, timestamp: Date.now() }, ...prev].slice(0, 5))
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 6000)
  }, [])

  useEffect(() => {
    if (!userId || subscribed) return

    try {
      const supabase = createClient()

      const channel = supabase
        .channel(`referrals-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'referrals',
            filter: `referrer_id=eq.${userId}`,
          },
          () => {
            addNotification('Alguien se registro con tu enlace!', 'success')
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'commissions',
            filter: `referrer_id=eq.${userId}`,
          },
          (payload) => {
            const amount = (payload.new as any)?.amount || 0
            addNotification(`Nueva comision de $${Number(amount).toFixed(2)}!`, 'bonus')
          }
        )
        .subscribe()

      setSubscribed(true)

      return () => {
        supabase.removeChannel(channel)
      }
    } catch {
      // Realtime not available in this context
    }
  }, [userId, subscribed, addNotification])

  if (!notifications.length) return null

  const typeStyles: Record<string, { bg: string; border: string; icon: string }> = {
    success: {
      bg: 'var(--success-light)',
      border: '1px solid var(--success)',
      icon: '🔔',
    },
    bonus: {
      bg: 'var(--accent-light)',
      border: '1px solid var(--accent)',
      icon: '💰',
    },
    info: {
      bg: 'var(--primary-light)',
      border: '1px solid var(--primary)',
      icon: 'ℹ️',
    },
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4">
      {notifications.map((n) => {
        const style = typeStyles[n.type] || typeStyles.info
        return (
          <div
            key={n.id}
            className="animate-slide-in p-3 rounded-xl text-sm font-medium flex items-center gap-2"
            style={{
              background: style.bg,
              border: style.border,
              backdropFilter: 'blur(12px)',
              color: 'var(--text-primary)',
            }}
          >
            <span>{style.icon}</span>
            <span className="flex-1">{n.message}</span>
          </div>
        )
      })}
    </div>
  )
}
