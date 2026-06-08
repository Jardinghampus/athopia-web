import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { submitPrediction } from '@/lib/gamification/cards'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { matchId, homeTeam, awayTeam, matchDate, prediction } = body

  if (!matchId || !homeTeam || !awayTeam || !matchDate || prediction === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const result = await submitPrediction(
    userId,
    matchId,
    homeTeam,
    awayTeam,
    matchDate,
    prediction
  )
  return NextResponse.json(result)
}
