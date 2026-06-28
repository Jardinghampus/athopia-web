'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, Lock } from 'lucide-react'
import Link from 'next/link'

const BRAND = '#1D9E75'

const UPGRADE_RESPONSE = `Tack för din fråga! 🔒

**AI-assistenten är tillgänglig för Elite-medlemmar.**

Som Elite-medlem får du:
- Obegränsade frågor om Allsvenskan-statistik
- Realtidsdata: tabell, matcher & spelarstatistik
- Nyhetsanalys från våra 1 000+ artiklar
- Svar inom sekunder, dygnet runt

**Uppgradera till Elite (169 kr/mån)** och få svar på den här frågan direkt.`

const SUGGESTIONS = [
  'Hur ligger Hammarby till i tabellen?',
  'Vem leder skytteligan just nu?',
  'Senaste nyheter om Malmö FF',
  'Vilka lag har bäst form just nu?',
]

type Msg = { role: 'user' | 'assistant'; text: string }

export default function AiChatPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const ask = (question: string) => {
    if (!question.trim() || loading) return
    setMessages(prev => [...prev, { role: 'user', text: question }])
    setInput('')
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setMessages(prev => [...prev, { role: 'assistant', text: UPGRADE_RESPONSE }])
    }, 10_000)
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-2xl flex-col px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: BRAND }}>
          <Bot size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold tracking-tight leading-none">AI-assistent</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Allsvenskan — statistik &amp; nyheter</p>
        </div>
        <span className="ml-auto flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2.5 py-1">
          <Sparkles size={10} />
          Elite
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: BRAND + '22' }}>
              <Bot size={28} style={{ color: BRAND }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-300">Fråga om Allsvenskan</p>
              <p className="text-xs text-zinc-500 mt-1">Statistik, tabell, matcher, nyheter</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => ask(s)}
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 transition-colors text-zinc-300">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: BRAND }}>
                <Bot size={13} className="text-white" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
              ${m.role === 'user'
                ? 'bg-zinc-800 text-white rounded-tr-sm'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-sm'}`}>
              {m.role === 'assistant' ? (
                <div className="space-y-2">
                  {m.text.split('\n').map((line, j) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <p key={j} className="font-semibold text-white">{line.slice(2, -2)}</p>
                    }
                    if (line.startsWith('- ')) {
                      return <p key={j} className="text-zinc-300 pl-2">· {line.slice(2)}</p>
                    }
                    if (line.includes('**')) {
                      const parts = line.split(/\*\*(.*?)\*\*/)
                      return (
                        <p key={j} className="text-zinc-300">
                          {parts.map((part, k) => k % 2 === 1 ? <strong key={k} className="text-white">{part}</strong> : part)}
                        </p>
                      )
                    }
                    return line ? <p key={j} className="text-zinc-300">{line}</p> : <div key={j} className="h-1" />
                  })}
                  <Link href="/prenumerera"
                    className="mt-3 flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: BRAND }}>
                    <Sparkles size={14} />
                    Uppgradera till Elite
                  </Link>
                </div>
              ) : m.text}
            </div>
            {m.role === 'user' && (
              <div className="h-7 w-7 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={13} className="text-zinc-300" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: BRAND }}>
              <Bot size={13} className="text-white" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); ask(input) }}
        className="flex gap-2 pt-2 border-t border-zinc-800">
        <div className="relative flex-1">
          <input value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Ställ en fråga om Allsvenskan…"
            disabled={loading}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pl-4 pr-10 py-2.5 text-sm
              placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 disabled:opacity-50" />
          <Lock size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600" />
        </div>
        <button type="submit" disabled={loading || !input.trim()}
          className="rounded-xl px-4 py-2.5 text-white disabled:opacity-40 transition-opacity"
          style={{ background: BRAND }}>
          <Send size={15} />
        </button>
      </form>
      <p className="text-center text-xs text-zinc-600 mt-2">
        Fullständig access kräver{' '}
        <Link href="/prenumerera" className="underline" style={{ color: BRAND }}>Elite-prenumeration</Link>
      </p>
    </div>
  )
}
