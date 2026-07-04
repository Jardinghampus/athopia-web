import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { submitPrediction } from '@/lib/gamification/cards'
import { enforceRateLimit } from '@/lib/ratelimit'
import { parseBody, z } from '@/lib/validation'

const PredictSchema = z.object({
  matchId: z.string().min(1).max(40),
  homeTeam: z.string().min(1).max(80),
  awayTeam: z.string().min(1).max(80),
  matchDate: z.string().min(1).max(40),
  prediction: z.object({
    outcome: z.enum(['home', 'draw', 'away']),
    homeGoals: z.number().int().min(0).max(20),
    awayGoals: z.number().int().min(0).max(20),
  }),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const blocked = await enforceRateLimit('write', req, userId)
  if (blocked) return blocked

  const parsed = await parseBody(req, PredictSchema)
  if (!parsed.ok) return parsed.response
  const { matchId, homeTeam, awayTeam, matchDate, prediction } = parsed.data

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
