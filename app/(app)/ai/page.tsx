'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'

const UPGRADE_RESPONSE = `**AI-assistenten är tillgänglig för Elite-medlemmar.**

Som Elite-medlem får du:
- Obegränsade frågor om Allsvenskan-statistik
- Realtidsdata: tabell, matcher & spelarstatistik
- Nyhetsanalys från 1 000+ artiklar
- Svar inom sekunder, dygnet runt

**Uppgradera till Elite** och få svar direkt.`

const SUGGESTIONS = [
  { label: 'Tabellläge', q: 'Hur ser tabellen ut just nu?' },
  { label: 'Skytteligan', q: 'Vem leder skytteligan?' },
  { label: 'Malmö FF', q: 'Senaste nyheter om Malmö FF' },
  { label: 'Bäst form', q: 'Vilka lag har bäst form just nu?' },
]

type Msg = { role: 'user' | 'assistant'; text: string }

export default function AiChatPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const ask = (question: string) => {
    if (!question.trim() || loading) return
    setMessages(prev => [...prev, { role: 'user', text: question }])
    setInput('')
    setLoading(true)
    inputRef.current?.focus()
    setTimeout(() => {
      setLoading(false)
      setMessages(prev => [...prev, { role: 'assistant', text: UPGRADE_RESPONSE }])
    }, 1400)
  }

  return (
    <div className="flex h-[calc(100svh-3.5rem)] items-start justify-center p-0 pb-[calc(env(safe-area-inset-bottom)+5rem)] sm:items-center sm:pb-0 sm:p-6">
      {/* Window */}
      <div className="relative flex h-full w-full max-w-3xl flex-col overflow-hidden sm:h-[min(700px,calc(100svh-7rem))] sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:shadow-sm">

        {/* Window chrome */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pitch">
            <Sparkles size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-none">Athopia AI</p>
            <p className="text-xs text-muted-foreground mt-0.5">Allsvenskan · statistik &amp; nyheter</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
            <Sparkles size={9} />
            Elite
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence initial={false}>
            {messages.length === 0 && !loading ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex h-full flex-col items-center justify-center gap-6 px-6 py-12"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pitch/10">
                  <Sparkles size={28} className="text-pitch" />
                </div>
                <div className="text-center">
                  <h2 className="text-base font-semibold text-foreground">Vad vill du veta?</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Fråga om Allsvenskan — statistik, matcher, nyheter</p>
                </div>
                <div className="grid w-full max-w-sm grid-cols-2 gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.q}
                      onClick={() => ask(s.q)}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors hover:border-pitch/40 hover:bg-pitch/5 active:scale-[0.98] touch-manipulation"
                    >
                      <span className="text-xs font-medium text-foreground">{s.label}</span>
                      <ChevronRight size={12} className="shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-5 px-5 py-5">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.role === 'assistant' && (
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pitch">
                        <Sparkles size={13} className="text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'rounded-tr-sm bg-pitch text-white'
                          : 'rounded-tl-sm bg-muted text-foreground'
                      }`}
                    >
                      {m.role === 'assistant'
                        ? <AssistantMessage text={m.text} />
                        : m.text}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex gap-3"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pitch">
                      <Sparkles size={13} className="text-white" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3.5">
                      <ThinkingDots />
                    </div>
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Input bar */}
        <div className="shrink-0 border-t border-border px-4 py-4">
          <form
            onSubmit={(e) => { e.preventDefault(); ask(input) }}
            className="flex items-center gap-2 rounded-xl border border-border bg-background pl-4 pr-1.5 py-1.5 transition-colors focus-within:border-pitch/50"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ställ en fråga om Allsvenskan…"
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pitch text-white transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              <Send size={14} />
            </button>
          </form>
          <p className="mt-2.5 text-center text-xs text-muted-foreground">
            Kräver{' '}
            <Link href="/prenumerera" className="text-pitch hover:underline">
              Elite-prenumeration
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function AssistantMessage({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (!line) return <div key={i} className="h-1" />
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-semibold text-foreground">{line.slice(2, -2)}</p>
        }
        if (line.startsWith('- ')) {
          return (
            <p key={i} className="pl-2 text-foreground/80">
              · {line.slice(2)}
            </p>
          )
        }
        if (line.includes('**')) {
          const parts = line.split(/\*\*(.*?)\*\*/)
          return (
            <p key={i} className="text-foreground/80">
              {parts.map((part, k) =>
                k % 2 === 1
                  ? <strong key={k} className="font-semibold text-foreground">{part}</strong>
                  : part
              )}
            </p>
          )
        }
        return <p key={i} className="text-foreground/80">{line}</p>
      })}
      <Link
        href="/prenumerera"
        className="mt-3 flex items-center justify-center gap-2 w-full rounded-xl bg-pitch py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        <Sparkles size={14} />
        Uppgradera till Elite
      </Link>
    </div>
  )
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5" aria-label="Laddar svar…">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  )
}
