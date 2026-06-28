'use client'

import { useState, useEffect, useCallback } from 'react'

export type Subscription = {
  tier: string
  status: string
  price: number
  stripe_subscription_id?: string
  current_period_end?: string
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadSubscription = useCallback(async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const { data: authData } = await createClient().auth.getSession()
      const token = authData.session?.access_token || ''

      if (!token) {
        setIsLoading(false)
        return
      }

      const res = await fetch('/api/subscription', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setSubscription(data || { tier: 'free', status: 'inactive', price: 0 })
      } else {
        setSubscription({ tier: 'free', status: 'inactive', price: 0 })
      }
    } catch {
      setSubscription({ tier: 'free', status: 'inactive', price: 0 })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadSubscription() }, [loadSubscription])

  const isPro = subscription?.tier === 'pro' && subscription?.status === 'active'
  const isFree = !subscription || subscription.tier === 'free' || subscription.tier === 'basic'

  const getDailyLimit = (): number => {
    if (isPro) return Infinity
    return 10
  }

  const getMonthlyMessages = async (): Promise<number> => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const { data: authData } = await createClient().auth.getSession()
      const token = authData.session?.access_token || ''
      const res = await fetch('/api/chat', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        return data.usage?.used_today || 0
      }
    } catch { /* */ }
    return 0
  }

  return {
    subscription,
    isLoading,
    isPro,
    isFree,
    dailyLimit: getDailyLimit(),
    getMonthlyMessages,
    refresh: loadSubscription,
  }
}
