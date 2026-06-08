import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getLeagueRankings } from '@/lib/gamification/leagues'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data: membership } = await supabase
    .from('user_league_memberships')
    .select('league_id')
    .eq('clerk_user_id', userId)
    .single()

  if (!membership) return NextResponse.json({ rankings: [] })

  const rankings = await getLeagueRankings(membership.league_id)
  return NextResponse.json({ rankings })
}
