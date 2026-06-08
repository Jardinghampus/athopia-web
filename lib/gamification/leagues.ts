import { createServerClient } from '@/lib/supabase'

export async function getLeagueRankings(leagueId: string) {
  const supabase = createServerClient()

  const { data: members } = await supabase
    .from('user_league_memberships')
    .select('clerk_user_id')
    .eq('league_id', leagueId)

  if (!members?.length) return []

  const userIds = members.map(m => m.clerk_user_id)

  const { data: rankings } = await supabase
    .from('user_football_iq')
    .select('clerk_user_id, weekly_iq, iq_score, league_rank')
    .in('clerk_user_id', userIds)
    .order('weekly_iq', { ascending: false })

  return rankings ?? []
}

export async function recalculateLeagueRanks() {
  const supabase = createServerClient()

  const { data: leagues } = await supabase
    .from('fan_leagues')
    .select('id')

  if (!leagues) return

  for (const league of leagues) {
    const { data: members } = await supabase
      .from('user_league_memberships')
      .select('clerk_user_id')
      .eq('league_id', league.id)

    if (!members?.length) continue

    const userIds = members.map(m => m.clerk_user_id)

    const { data: ranked } = await supabase
      .from('user_football_iq')
      .select('clerk_user_id, weekly_iq')
      .in('clerk_user_id', userIds)
      .order('weekly_iq', { ascending: false })

    if (!ranked) continue

    for (let i = 0; i < ranked.length; i++) {
      await supabase
        .from('user_football_iq')
        .update({ league_rank: i + 1 })
        .eq('clerk_user_id', ranked[i].clerk_user_id)
    }
  }
}
