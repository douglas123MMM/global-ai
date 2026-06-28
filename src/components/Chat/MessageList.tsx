'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Message as ChatMessage } from '@/lib/hooks/useChat'
import { useEffect, useRef, useState } from 'react'

type Props = {
  messages: ChatMessage[]
  loading: boolean
  emptyState?: React.ReactNode
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium transition opacity-0 group-hover:opacity-100 hover:opacity-100"
      style={{ background: 'var(--bg-card-hover)', color: 'var(--text-secondary)' }}
    >
      {copied ? 'Copiado!' : 'Copiar'}
    </button>
  )
}

export default function MessageList({ messages, loading, emptyState }: Props) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  if (messages.length === 0 && emptyState) {
    return <div className="flex-1 flex items-center justify-center p-4">{emptyState}</div>
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div
              className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ring-2 ring-offset-1 mt-1"
              style={{
                background: m.role === 'user' ? 'var(--primary)' : 'var(--accent)',
                color: 'white',
                boxShadow: `0 0 0 2px ${m.role === 'user' ? 'var(--primary-light)' : 'var(--accent-light)'}`,
              }}
            >
              {m.role === 'user' ? 'U' : 'AI'}
            </div>
            <div
              className={`group relative max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                m.role === 'user' ? 'rounded-tr-md' : 'rounded-tl-md'
              }`}
              style={
                m.role === 'user'
                  ? { background: 'var(--primary)', color: 'white' }
                  : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
              }
            >
              {m.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none [&_pre]:!my-2 [&_pre]:!rounded-xl [&_pre]:!p-0 [&_pre]:!overflow-hidden
                  [&_code]:!text-sm [&_code]:!bg-[var(--bg-secondary)] [&_code]:!px-1.5 [&_code]:!py-0.5 [&_code]:!rounded-md
                  [&_p]:!my-1.5 [&_ul]:!my-1.5 [&_ol]:!my-1.5 [&_li]:!my-0.5
                  [&_table]:!w-full [&_th]:!border [&_th]:!border-[var(--border)] [&_th]:!p-2 [&_td]:!border [&_td]:!border-[var(--border)] [&_td]:!p-2
                  [&_h1]:!text-xl [&_h2]:!text-lg [&_h3]:!text-base [&_h1]:!font-bold [&_h2]:!font-bold [&_h3]:!font-semibold"
                  style={{ color: 'var(--text-primary)' }}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '')
                        const codeStr = String(children).replace(/\n$/, '')
                        if (match) {
                          return (
                            <div className="relative group">
                              <div className="flex items-center justify-between px-4 py-2 rounded-t-xl text-xs font-medium"
                                style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                                <span>{match[1]}</span>
                                <CopyButton code={codeStr} />
                              </div>
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                customStyle={{ margin: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, fontSize: '0.85rem' }}
                                {...props}
                              >
                                {codeStr}
                              </SyntaxHighlighter>
                            </div>
                          )
                        }
                        return (
                          <code className={className} style={{ background: 'var(--bg-secondary)', color: 'var(--accent)', padding: '2px 6px', borderRadius: '4px' }} {...props}>
                            {children}
                          </code>
                        )
                      },
                      a({ children, href, ...props }: any) {
                        return (
                          <a href={href} target="_blank" rel="noopener noreferrer"
                            style={{ color: 'var(--primary)', textDecoration: 'underline' }} {...props}>
                            {children}
                          </a>
                        )
                      },
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
              )}
              {m.timestamp && (
                <div className={`text-xs mt-2 opacity-50 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ring-2 ring-offset-1 mt-1"
              style={{ background: 'var(--accent)', color: 'white' }}>AI</div>
            <div className="rounded-2xl rounded-tl-md px-5 py-3 border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="flex gap-1.5">
                {[0, 200, 400].map((d) => (
                  <div key={d} className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: 'var(--primary)', animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  )
}
