'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
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
    <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin space-y-5">
      {messages.map((m, i) => (
        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          {m.role === 'assistant' && (
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mr-3 mt-1"
              style={{ background: 'var(--primary)', color: 'white' }}>AI</div>
          )}
          <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
            m.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
          }`}
            style={m.role === 'user'
              ? { background: 'var(--primary)', color: 'white' }
              : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            {m.role === 'assistant' ? (
              <div className="prose prose-sm max-w-none text-[var(--text-primary)]
                [&_pre]:!bg-[var(--bg-secondary)] [&_pre]:!rounded-lg [&_pre]:!p-0 [&_pre]:!overflow-hidden
                [&_code]:!text-sm [&_code]:!bg-[var(--bg-secondary)] [&_code]:!px-1.5 [&_code]:!py-0.5 [&_code]:!rounded
                [&_p]:!my-1 [&_ul]:!my-1 [&_ol]:!my-1
                [&_table]:!w-full [&_th]:!border [&_th]:!border-[var(--border)] [&_th]:!p-2 [&_td]:!border [&_td]:!border-[var(--border)] [&_td]:!p-2
                [&_h1]:!text-xl [&_h2]:!text-lg [&_h3]:!text-base [&_h1]:!font-bold [&_h2]:!font-bold [&_h3]:!font-semibold">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '')
                      const codeStr = String(children).replace(/\n$/, '')
                      if (match) {
                        return (
                          <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
                            {codeStr}
                          </SyntaxHighlighter>
                        )
                      }
                      return (
                        <code className={className} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', padding: '2px 6px', borderRadius: '4px' }} {...props}>
                          {children}
                        </code>
                      )
                    },
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm">{m.content}</p>
            )}
            {m.timestamp && (
              <div className="text-xs mt-1 opacity-60">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex justify-start">
          <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mr-3 mt-1"
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
