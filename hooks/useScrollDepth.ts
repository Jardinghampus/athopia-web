'use client'

import { useEffect, useRef } from 'react'

export function useScrollDepth(
  articleType: string,
  roundId?: string,
  enabled = true
) {
  const reported = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (!enabled) return

    reported.current = new Set()

    const checkpoints = [30, 80]

    const onScroll = () => {
      const scrollHeight = document.body.scrollHeight - window.innerHeight
      if (scrollHeight <= 0) return
      const scrolled = (window.scrollY / scrollHeight) * 100

      for (const checkpoint of checkpoints) {
        if (scrolled >= checkpoint && !reported.current.has(checkpoint)) {
          reported.current.add(checkpoint)
          fetch('/api/gamification/track-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ articleType, scrollDepth: checkpoint, roundId }),
          })
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [articleType, roundId, enabled])
}
