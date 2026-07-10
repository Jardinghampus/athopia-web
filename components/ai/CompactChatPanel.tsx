'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, isToolUIPart, getToolName, isTextUIPart } from 'ai'
import { useEffect, useRef, useState } from 'react'
import { Bot, ChevronDown, ChevronUp, Loader2, Send } from 'lucide-react'
import Link from 'next/link'
import type { Plan } from '@/lib/access-rules'
import { canAccess } from '@/lib/access-rules'

const BRAND = '#D61F1F'

interface CompactChatPanelProps {
  apiUrl: string
  title: string
  subtitle?: string
  suggestions: string[]
  plan: Plan
  paywallFeature?: 'aiChat' | 'aiSummaries'
  /** Extra fält som skickas med varje POST (t.ex. matchkontext) */
  chatBody?: Record<string, unknown>
}

export function CompactChatPanel({
  apiUrl,
  title,
  subtitle,
  suggestions,
  plan,
  paywallFeature = 'aiChat',
  chatBody,
}: CompactChatPanelProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const hasAccess = canAccess(paywallFeature, plan)

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: apiUrl,
      body: chatBody,
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const submit = (text: string) => {
    if (!text.trim() || isLoading || !hasAccess) return
    sendMessage({ role: 'user', parts: [{ type: 'text', text }] })
    setInput('')
  }

  if (!hasAccess) {
    return (
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="h-4 w-4 text-pitch" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {subtitle ?? 'Ställ frågor om matchen med AI — kräver PRO.'}{' '}
          <Link href="/prenumerera" className="text-pitch hover:underline">
            Uppgradera
          </Link>
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-pitch/20 bg-gradient-to-br from-pitch/5 to-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-pitch/5 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: BRAND }}>
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {subtitle && !open && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border/60 px-4 pb-4">
          <div className="max-h-64 overflow-y-auto space-y-3 py-3">
            {messages.length === 0 && (
              <div className="space-y-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => submit(s)}
                    className="block w-full rounded-lg border border-border px-3 py-2 text-left text-xs text-muted-foreground hover:border-pitch/40 hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-zinc-800 text-white'
                      : 'bg-zinc-900/80 border border-border text-foreground'
                  }`}
                >
                  {(m.parts ?? []).map((part, i) => {
                    if (isTextUIPart(part)) return <span key={i}>{part.text}</span>
                    if (isToolUIPart(part)) {
                      const name = getToolName(part)
                      const label =
                        name === 'searchNews' ? 'nyheter' :
                        name === 'getStandings' ? 'tabell' :
                        name === 'getTeamStats' ? 'lagstatistik' : 'data'
                      return (
                        <span key={i} className="inline-flex items-center gap-1 text-xs text-muted-foreground italic">
                          <Loader2 size={10} className="animate-spin" />
                          söker {label}…
                        </span>
                      )
                    }
                    return null
                  })}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-border bg-zinc-900/80 px-3 py-2">
                  <Loader2 size={14} className="animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-400 text-center">
                {error.message?.includes('429')
                  ? 'Dagsgräns nådd — försök imorgon.'
                  : error.message?.includes('403')
                    ? 'PRO krävs.'
                    : 'Något gick fel.'}
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit(input)
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ställ en fråga…"
              disabled={isLoading}
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-pitch/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-xl px-3 py-2 text-white disabled:opacity-40"
              style={{ background: BRAND }}
              aria-label="Skicka"
            >
              <Send size={16} />
            </button>
          </form>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              className="mt-2 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Rensa konversation
            </button>
          )}
        </div>
      )}
    </section>
  )
}
