import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { useFreeze } from '@/lib/gamification/streaks'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { roundNumber } = await req.json()

  if (typeof roundNumber !== 'number' || roundNumber < 1) {
    return NextResponse.json({ error: 'Invalid roundNumber' }, { status: 400 })
  }

  const result = await useFreeze(userId, roundNumber)
  return NextResponse.json(result)
}
