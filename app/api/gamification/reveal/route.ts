import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { revealMatchCard } from '@/lib/gamification/cards'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { matchId, actual } = await req.json()

  if (!matchId || actual === undefined) {
    return NextResponse.json({ error: 'Missing matchId or actual' }, { status: 400 })
  }

  const result = await revealMatchCard(userId, matchId, actual)
  return NextResponse.json(result)
}
