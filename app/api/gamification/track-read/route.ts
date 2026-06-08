import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { trackArticleRead } from '@/lib/gamification/iq'
import type { ArticleType } from '@/lib/gamification/types'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { articleType, scrollDepth, roundId } = await req.json() as {
    articleType: ArticleType
    scrollDepth: number
    roundId?: string
  }

  if (!articleType || typeof scrollDepth !== 'number' || scrollDepth < 0 || scrollDepth > 100) {
    return NextResponse.json({ error: 'Invalid articleType or scrollDepth' }, { status: 400 })
  }

  await trackArticleRead(userId, articleType, scrollDepth, roundId)
  return NextResponse.json({ success: true })
}
