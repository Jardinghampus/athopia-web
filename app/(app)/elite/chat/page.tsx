'use client'

import { useChat } from '@ai-sdk/react'
import { isToolUIPart, getToolName, isTextUIPart } from 'ai'
import { useEffect, useRef, useState } from 'react'
import { Send, Loader2, Bot, User } from 'lucide-react'

const BRAND = '#2D5349'

const SUGGESTIONS = [
  'Hur ligger Hammarby till i tabellen?',
  'Senaste nyheter om Malmö FF',
  'Vem leder skytteligan?',
]

export default function EliteChatPage() {
  const [usage, setUsage] = useState<{ count: number; limit: number } | null>(null)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // ponytail: ai@7 UseChatOptions union type doesn't expose transport directly — cast needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { messages, sendMessage, status, error } = useChat({
    transport: { url: '/api/elite/chat' } as any,
    onFinish: () => {
      fetch('/api/elite/usage').then(r => r.json()).then(setUsage).catch(() => null)
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    fetch('/api/elite/usage').then(r => r.json()).then(setUsage).catch(() => null)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submit = (text: string) => {
    if (!text.trim() || isLoading) return
    sendMessage({ role: 'user', parts: [{ type: 'text', text }] })
    setInput('')
  }

  const remaining = usage ? usage.limit - usage.count : null

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">AI-assistent</h1>
          <p className="text-sm text-zinc-400">Allsvenskan — statistik, nyheter &amp; matcher</p>
        </div>
        {remaining !== null && (
          <span className="text-xs text-zinc-500">{remaining} frågor kvar idag</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-500">
            <Bot size={40} style={{ color: BRAND }} />
            <p className="text-sm text-center max-w-xs">Fråga om statistik, tabell, matcher eller nyheter.</p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => submit(s)}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ background: BRAND }}>
                <Bot size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
              ${m.role === 'user' ? 'bg-zinc-800 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-100'}`}>
              {(m.parts ?? []).map((part, i) => {
                if (isTextUIPart(part)) return <span key={i}>{part.text}</span>
                if (isToolUIPart(part)) {
                  const name = getToolName(part)
                  const label = name === 'searchNews' ? 'nyheter' : name === 'getStandings' ? 'tabell' :
                                name === 'getTeamStats' ? 'lagstatistik' : name === 'getPlayerStats' ? 'spelarstatistik' : 'matcher'
                  return (
                    <span key={i} className="inline-flex items-center gap-1 text-xs text-zinc-500 italic">
                      <Loader2 size={10} className="animate-spin" />söker {label}…
                    </span>
                  )
                }
                return null
              })}
            </div>
            {m.role === 'user' && (
              <div className="h-7 w-7 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-1">
                <User size={14} className="text-zinc-300" />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3">
            <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ background: BRAND }}>
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
              <Loader2 size={14} className="animate-spin text-zinc-400" />
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 text-center py-2">
            {error.message?.includes('429') ? 'Du har nått dagens gräns. Försök igen imorgon.' :
             error.message?.includes('403') ? 'Elite-prenumeration krävs.' : 'Något gick fel. Försök igen.'}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); submit(input) }}
        className="flex gap-2 pt-2 border-t border-zinc-800">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Fråga om statistik, tabell, matcher, nyheter…"
          disabled={isLoading || remaining === 0}
          className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-sm
            placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 disabled:opacity-50" />
        <button type="submit" disabled={isLoading || !input.trim() || remaining === 0}
          className="rounded-xl px-4 py-2.5 text-white disabled:opacity-40 transition-opacity"
          style={{ background: BRAND }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
