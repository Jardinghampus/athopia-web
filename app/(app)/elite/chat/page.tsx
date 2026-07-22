'use client'

import { useChat } from '@ai-sdk/react'
import { isToolUIPart, getToolName, isTextUIPart } from 'ai'
import { useEffect, useRef, useState } from 'react'
import { Send, Loader2, Bot } from 'lucide-react'

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
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
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'user' ? (
              <div className="max-w-[85%] rounded-2xl bg-zinc-800 px-4 py-2.5 text-sm leading-relaxed text-white">
                {(m.parts ?? []).map((part, i) => isTextUIPart(part) ? <span key={i}>{part.text}</span> : null)}
              </div>
            ) : (
              // Grok-stil: assistentsvar är löpande text utan bubbla/ram — bara indraget under en liten logga.
              <div className="max-w-[85%] space-y-1.5">
                <Bot size={16} style={{ color: BRAND }} />
                <div className="text-sm leading-relaxed text-zinc-100">
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
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex items-center gap-2">
            <Bot size={16} style={{ color: BRAND }} />
            <Loader2 size={14} className="animate-spin text-zinc-400" />
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 text-center py-2">
            {error.message?.includes('429') ? 'Du har nått dagens gräns. Försök igen imorgon.' :
             error.message?.includes('403') ? 'PRO-prenumeration krävs.' : 'Något gick fel. Försök igen.'}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); submit(input) }}
        className="flex items-end gap-2 rounded-3xl border border-zinc-800 bg-zinc-900 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <span className="mb-1.5 shrink-0 rounded-full bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-400">
          Athopia AI
        </span>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = `${e.target.scrollHeight}px`
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit(input)
            }
          }}
          rows={1}
          placeholder="Fråga om statistik, tabell, matcher, nyheter…"
          disabled={isLoading || remaining === 0}
          className="max-h-32 flex-1 resize-none overflow-y-auto bg-transparent px-1 py-1.5 text-sm leading-relaxed
            placeholder:text-zinc-600 focus:outline-none disabled:opacity-50" />
        <button type="submit" disabled={isLoading || !input.trim() || remaining === 0}
          className="mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40 transition-opacity"
          style={{ background: BRAND }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
