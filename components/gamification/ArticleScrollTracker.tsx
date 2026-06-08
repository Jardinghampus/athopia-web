'use client'

import { useScrollDepth } from '@/hooks/useScrollDepth'
import type { ArticleType } from '@/lib/gamification/types'

interface Props {
  articleType: ArticleType
  roundId?: string
}

export function ArticleScrollTracker({ articleType, roundId }: Props) {
  useScrollDepth(articleType, roundId, true)
  return null
}
