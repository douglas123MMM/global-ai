'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type ReferralCode = { code: string; uses: number }

export default function ReferralLink() {
  const [code, setCode] = useState<ReferralCode | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  const getToken = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || ''
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken()
        const res = await fetch('/api/referral?action=code', { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          setCode(data.code)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [getToken])

  const link = typeof window !== 'undefined'
    ? `${window.location.origin}/register?ref=${code?.code || ''}`
    : ''

  const copy = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Unete a Global AI y gana dinero real con IA: ${link}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const shareTwitter = () => {
    const text = encodeURIComponent(`Gana dinero real con Global AI. Unete con mi enlace: ${link}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
  }

  if (loading) return <div className="animate-pulse glass p-6 rounded-2xl"><div className="h-8 bg-secondary rounded w-48" /></div>

  return (
    <div className="glass p-6 rounded-2xl">
      <h3 className="text-sm text-text-muted mb-3">Tu Enlace de Referido</h3>
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <code className="text-2xl md:text-3xl font-mono font-bold text-primary tracking-wider select-all">
          {code?.code || '------'}
        </code>
        <button
          onClick={copy}
          className="bg-primary hover:bg-primary-hover text-white text-sm px-4 py-2 rounded-lg transition"
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      <div className="text-xs text-text-muted mb-3 break-all">{link}</div>
      <div className="flex gap-2">
        <button onClick={shareWhatsApp} className="glass text-xs px-3 py-1.5 rounded-lg hover:bg-card-hover transition">
          WhatsApp
        </button>
        <button onClick={shareTwitter} className="glass text-xs px-3 py-1.5 rounded-lg hover:bg-card-hover transition">
          Twitter
        </button>
      </div>
      <p className="text-xs text-text-muted mt-3">
        Usos: <span className="text-white">{code?.uses || 0}</span>
      </p>
    </div>
  )
}
