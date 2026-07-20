import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { recalculateLeagueRanks } from '@/lib/gamification/leagues'
import { secretsEqual } from '@/lib/secrets'

export async function POST() {
  const headersList = await headers()
  const cronSecret = headersList.get('x-cron-secret')

  if (!secretsEqual(cronSecret, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()

  const { data: allIQ } = await supabase
    .from('user_football_iq')
    .select('clerk_user_id, weekly_iq, league_rank')

  const now = new Date()
  const weekNumber = getISOWeek(now)
  const year = now.getFullYear()

  if (allIQ?.length) {
    await supabase.from('iq_history').upsert(
      allIQ.map(u => ({
        clerk_user_id: u.clerk_user_id,
        week_number: weekNumber,
        year,
        iq_score: u.weekly_iq,
        rank_in_league: u.league_rank,
      })),
      { onConflict: 'clerk_user_id,week_number,year' }
    )
  }

  await supabase
    .from('user_football_iq')
    .update({ weekly_iq: 50 })
    .gt('iq_score', -1) // uppdatera alla rader

  await recalculateLeagueRanks()

  return NextResponse.json({ success: true, reset: allIQ?.length ?? 0 })
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
