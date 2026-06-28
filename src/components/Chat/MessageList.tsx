'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message as ChatMessage } from '@/lib/hooks/useChat'
import { useEffect, useRef } from 'react'

type Props = {
  messages: ChatMessage[]
  loading: boolean
  emptyState?: React.ReactNode
}

export default function MessageList({ messages, loading, emptyState }: Props) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (messages.length === 0 && emptyState) {
    return <div className="flex-1 flex items-center justify-center">{emptyState}</div>
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
      {messages.map((m, i) => (
        <div key={i} className={`mb-5 ${m.role === 'user' ? 'flex justify-end' : ''}`}>
          <div className={`max-w-[85%] md:max-w-[70%] ${m.role === 'user' ? '' : 'flex gap-3'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                style={{ background: 'var(--primary)', color: 'white' }}>
                AI
              </div>
            )}
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                m.role === 'user'
                  ? 'rounded-br-md text-white'
                  : 'rounded-bl-md'
              }`}
              style={m.role === 'user'
                ? { background: 'var(--primary)' }
                : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
              }
            >
              {m.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none
                  [&_pre]:bg-[var(--bg-secondary)] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:my-2
                  [&_code]:text-sm [&_code]:bg-[var(--bg-secondary)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
                  [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1
                  [&_table]:w-full [&_th]:border [&_th]:border-[var(--border)] [&_th]:p-2 [&_td]:border [&_td]:border-[var(--border)] [&_td]:p-2
                  [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold
                " style={{ color: 'var(--text-primary)' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {loading && (
        <div className="mb-5 flex gap-3">
          <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
            style={{ background: 'var(--primary)', color: 'white' }}>AI</div>
          <div className="rounded-2xl rounded-bl-md px-5 py-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex gap-1.5">
              {[0, 150, 300].map((d) => (
                <div key={d} className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: 'var(--primary)', animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  )
}
