'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Headphones, Square } from 'lucide-react'
import Link from 'next/link'
import { canAccess, type Plan } from '@/lib/access-rules'

interface BriefListenButtonProps {
  text: string
  headline: string
  plan: Plan
}

export function BriefListenButton({ text, headline, plan }: BriefListenButtonProps) {
  const [playing, setPlaying] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const fullText = [headline, text].filter(Boolean).join('. ')

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setPlaying(false)
  }, [])

  useEffect(() => () => stop(), [stop])

  if (!canAccess('briefAudio', plan)) {
    return (
      <p className="mt-3 text-xs text-muted-foreground">
        <Headphones className="inline h-3.5 w-3.5 mr-1 -mt-0.5" aria-hidden />
        Lyssna på brief kräver PRO.{' '}
        <Link href="/prenumerera" className="text-pitch hover:underline">
          Uppgradera
        </Link>
      </p>
    )
  }

  const speak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    if (playing) {
      stop()
      return
    }

    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(fullText)
    u.lang = 'sv-SE'
    u.rate = 1
    const voices = window.speechSynthesis.getVoices()
    const sv = voices.find((v) => v.lang.startsWith('sv'))
    if (sv) u.voice = sv
    u.onend = () => setPlaying(false)
    u.onerror = () => setPlaying(false)
    utteranceRef.current = u
    window.speechSynthesis.speak(u)
    setPlaying(true)
  }

  return (
    <button
      type="button"
      onClick={speak}
      className="mt-3 inline-flex items-center gap-2 rounded-lg border border-pitch/30 bg-pitch/10 px-3 py-1.5 text-xs font-medium text-pitch hover:bg-pitch/15 transition-colors"
    >
      {playing ? (
        <>
          <Square className="h-3.5 w-3.5" />
          Stoppa
        </>
      ) : (
        <>
          <Headphones className="h-3.5 w-3.5" />
          Lyssna på brief
        </>
      )}
    </button>
  )
}
