'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Sparkles, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { WavyBackground } from '@/components/ui/wavy-background'
import Link from 'next/link'

// ── Constants ────────────────────────────────────────────────────────────────

const UPGRADE_RESPONSE = `**AI-assistenten är tillgänglig för Elite-medlemmar.**

Som Elite-medlem får du:
- Obegränsade frågor om Allsvenskan-statistik
- Realtidsdata: tabell, matcher & spelarstatistik
- Nyhetsanalys från 1 000+ artiklar
- Svar inom sekunder, dygnet runt

**Uppgradera till Elite** och få tillgång direkt.`

const SUGGESTIONS = [
  { label: 'Tabellläge',  q: 'Hur ser tabellen ut just nu?' },
  { label: 'Skytteligan', q: 'Vem leder skytteligan?' },
  { label: 'Malmö FF',    q: 'Senaste nyheter om Malmö FF' },
  { label: 'Bäst form',   q: 'Vilka lag har bäst form just nu?' },
]

// Allsvenskan-specific, not generic AI filler
const THINKING_MESSAGES = [
  'Analyserar Allsvenskan-data…',
  'Kollar senaste matchresultaten…',
  'Söker bland 1 000+ artiklar…',
  'Hämtar spelarstatistik…',
  'Beräknar xG-form…',
]

type Msg = { role: 'user' | 'assistant'; text: string }

// ── Main ─────────────────────────────────────────────────────────────────────

export default function AiChatPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [thinkingMsg]           = useState(
    () => THINKING_MESSAGES[Math.floor(Math.random() * THINKING_MESSAGES.length)]
  )

  const bottomRef   = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prefersReduced = useReducedMotion()

  // ── Auto-grow textarea ──────────────────────────────────────────────────
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [])

  useEffect(() => { adjustHeight() }, [input, adjustHeight])

  // ── Auto-focus on desktop ───────────────────────────────────────────────
  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) {
      textareaRef.current?.focus()
    }
  }, [])

  // ── Lock page scroll + track visualViewport (mobile keyboard) ───────────
  const [viewportH, setViewportH] = useState<number | null>(null)
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const vv = window.visualViewport
    if (vv) {
      const update = () => setViewportH(vv.height)
      vv.addEventListener('resize', update)
      update()
      return () => { vv.removeEventListener('resize', update); document.body.style.overflow = prev }
    }
    return () => { document.body.style.overflow = prev }
  }, [])

  // ── Scroll to bottom ────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: prefersReduced ? 'instant' : 'smooth' })
  }, [messages, loading, prefersReduced])

  // ── Send ────────────────────────────────────────────────────────────────
  const ask = useCallback(async (question: string) => {
    if (!question.trim() || loading) return
    const q = question.trim()
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.text }))
      const res = await fetch('/api/elite/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...history, { role: 'user', content: q }] }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const errText = (data.error as string | undefined)?.includes('Elite')
          ? UPGRADE_RESPONSE
          : 'Ett fel uppstod. Försök igen om en stund.'
        setMessages(prev => [...prev, { role: 'assistant', text: errText }])
        return
      }

      // Stream text tokens into the last assistant message
      setMessages(prev => [...prev, { role: 'assistant', text: '' }])
      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = dec.decode(value, { stream: true })
        setMessages(prev => {
          const msgs = [...prev]
          msgs[msgs.length - 1] = { role: 'assistant', text: msgs[msgs.length - 1].text + chunk }
          return msgs
        })
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Något gick fel. Försök igen.' }])
    } finally {
      setLoading(false)
    }
  }, [loading, messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ask(input)
    }
  }

  return (
    <div
      className="relative overflow-hidden flex items-start justify-center p-0 pb-[calc(env(safe-area-inset-bottom)+5rem)] sm:items-center sm:pb-0 sm:p-6"
      style={{ height: viewportH ? `${viewportH}px` : 'calc(100svh - 3.5rem)' }}
    >
      {/* Wavy canvas background — only on sm+ (desktop) */}
      {!prefersReduced && (
        <WavyBackground
          containerClassName="absolute inset-0 z-0 hidden sm:flex"
          colors={['#2D5349', '#5FA98C', '#111111', '#8A8885', '#1E3A32', '#B5B5B3']}
          backgroundFill="oklch(0.07 0.03 240)"
          blur={6}
          speed="fast"
          waveOpacity={0.8}
          waveWidth={60}
        />
      )}

      {/* Window */}
      <motion.div
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex h-full w-full max-w-3xl flex-col overflow-hidden sm:h-[min(700px,calc(100svh-7rem))] sm:rounded-2xl"
        style={{
          background: 'color-mix(in srgb, var(--background) 58%, transparent)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '2px solid rgba(45, 83, 73, 0.7)',
          boxShadow: '0 0 18px 2px rgba(45, 83, 73, 0.25), 0 0 0 1px rgba(45,83,73,0.15) inset, 0 24px 60px -12px rgba(0,0,0,0.6)',
        }}
      >
        {/* Window chrome */}
        <header className="flex shrink-0 items-center gap-3 px-5 py-3.5" style={{ borderBottom: '1px solid color-mix(in srgb, var(--foreground) 8%, transparent)' }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pitch">
            <Sparkles size={14} className="text-white" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-none">Athopia AI</p>
            <p className="text-xs text-muted-foreground mt-0.5">Allsvenskan · statistik &amp; nyheter</p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
            <Sparkles size={9} aria-hidden />
            Elite
          </span>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto" role="log" aria-label="Konversation" aria-live="polite">
          <AnimatePresence initial={false}>
            {messages.length === 0 && !loading ? (
              <EmptyState key="empty" onAsk={ask} />
            ) : (
              <div className="space-y-5 px-5 py-5">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.role === 'assistant' && (
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pitch" aria-hidden>
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
                        ? <AssistantMessage text={m.text} isStreaming={i === messages.length - 1 && loading} />
                        : m.text}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-3"
                    aria-label="Athopia AI tänker"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pitch" aria-hidden>
                      <Sparkles size={13} className="text-white" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3.5">
                      <ThinkingIndicator message={thinkingMsg} />
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
            aria-label="Skriv en fråga"
            className="flex items-end gap-2 rounded-xl px-4 py-2.5 transition-colors focus-within:ring-1 focus-within:ring-pitch/40"
            style={{ background: 'color-mix(in srgb, var(--background) 60%, transparent)', border: '1px solid color-mix(in srgb, var(--foreground) 10%, transparent)' }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ställ en fråga om Allsvenskan…"
              disabled={loading}
              rows={1}
              aria-label="Fråga"
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 leading-relaxed max-h-[120px]"
              style={{ overflowY: 'auto' }}
            />
            <motion.button
              type="submit"
              disabled={loading || !input.trim()}
              whileTap={{ scale: 0.88 }}
              transition={{ duration: 0.1 }}
              aria-label="Skicka fråga"
              className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pitch text-white transition-opacity hover:opacity-90 disabled:opacity-30 touch-manipulation"
            >
              <Send size={14} aria-hidden />
            </motion.button>
          </form>
          <p className="mt-2.5 text-center text-xs text-muted-foreground">
            Kräver{' '}
            <Link href="/prenumerera" className="text-pitch hover:underline">
              Elite-prenumeration
            </Link>
            {' '}· Enter för att skicka
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onAsk }: { onAsk: (q: string) => void }) {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="flex h-full flex-col items-center justify-center gap-6 px-6 py-12"
    >
      {/* Breathing icon */}
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pitch/10"
        aria-hidden
      >
        <Sparkles size={28} className="text-pitch" />
      </motion.div>

      <div className="text-center">
        <h2 className="text-base font-semibold text-foreground">Vad vill du veta?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Fråga om Allsvenskan — statistik, matcher, nyheter</p>
      </div>

      {/* Staggered chips */}
      <div className="grid w-full max-w-sm grid-cols-2 gap-2" role="list" aria-label="Förslag">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.q}
            type="button"
            role="listitem"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 + 0.1, duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onAsk(s.q)}
            className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors hover:border-pitch/40 hover:bg-pitch/5 touch-manipulation"
            aria-label={s.q}
          >
            <span className="text-xs font-medium text-foreground">{s.label}</span>
            <ChevronRight size={12} className="shrink-0 text-muted-foreground" aria-hidden />
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// ── Thinking Indicator ────────────────────────────────────────────────────────

function ThinkingIndicator({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{message}</span>
    </div>
  )
}

// ── Assistant Message ─────────────────────────────────────────────────────────

function AssistantMessage({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  const lines = text.split('\n')

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
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

      {/* Show upgrade CTA only for paywall messages */}
      {!isStreaming && text.includes('Elite-prenumeration krävs') && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <Link
            href="/prenumerera"
            className="mt-3 flex items-center justify-center gap-2 w-full rounded-xl bg-pitch py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 touch-manipulation"
          >
            <Sparkles size={14} aria-hidden />
            Uppgradera till Elite
          </Link>
        </motion.div>
      )}
    </div>
  )
}
