import { createServerClient } from '@/lib/supabase'
import { awardPredictionIQ } from './iq'
import { assignBadge } from './badges'

export async function submitPrediction(
  clerkUserId: string,
  matchId: string,
  homeTeam: string,
  awayTeam: string,
  matchDate: string,
  prediction: {
    outcome: 'home' | 'draw' | 'away'
    homeGoals: number
    awayGoals: number
  }
) {
  const supabase = createServerClient()

  const { error } = await supabase.from('match_cards').upsert({
    clerk_user_id: clerkUserId,
    match_id: matchId,
    home_team: homeTeam,
    away_team: awayTeam,
    match_date: matchDate,
    prediction_outcome: prediction.outcome,
    prediction_home_goals: prediction.homeGoals,
    prediction_away_goals: prediction.awayGoals,
    predicted_at: new Date().toISOString(),
  }, { onConflict: 'clerk_user_id,match_id' })

  return { success: !error, error }
}

export async function revealMatchCard(
  clerkUserId: string,
  matchId: string,
  actual: {
    homeGoals: number
    awayGoals: number
  }
) {
  const supabase = createServerClient()

  const { data: card } = await supabase
    .from('match_cards')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .eq('match_id', matchId)
    .single()

  if (!card || card.is_revealed) return null

  const actualOutcome: 'home' | 'draw' | 'away' =
    actual.homeGoals > actual.awayGoals
      ? 'home'
      : actual.homeGoals < actual.awayGoals
      ? 'away'
      : 'draw'

  const outcomeCorrect = card.prediction_outcome === actualOutcome
  const scoreExact =
    card.prediction_home_goals === actual.homeGoals &&
    card.prediction_away_goals === actual.awayGoals

  const isRare = scoreExact
  const badgeEarned = isRare ? 'synskarp' : null

  // Atomic update — only succeeds if card hasn't been revealed by a concurrent request
  const { count } = await supabase
    .from('match_cards')
    .update({
      actual_home_goals: actual.homeGoals,
      actual_away_goals: actual.awayGoals,
      actual_outcome: actualOutcome,
      is_revealed: true,
      reveal_at: new Date().toISOString(),
      outcome_correct: outcomeCorrect,
      score_correct: scoreExact,
      is_rare_outcome: isRare,
      badge_earned: badgeEarned,
      iq_points_earned: 0,
    })
    .eq('clerk_user_id', clerkUserId)
    .eq('match_id', matchId)
    .eq('is_revealed', false)
    .select()

  if (!count) return null

  if (isRare) {
    await assignBadge(clerkUserId, 'synskarp', 'Synskarp', 'Förutsåg exakt rätt resultat')
  }

  const iqPointsEarned = await awardPredictionIQ(clerkUserId, outcomeCorrect, scoreExact) ?? 0

  await supabase
    .from('match_cards')
    .update({ iq_points_earned: iqPointsEarned })
    .eq('clerk_user_id', clerkUserId)
    .eq('match_id', matchId)

  return {
    outcomeCorrect,
    scoreExact,
    isRare,
    badgeEarned,
    iqPointsEarned,
    actualOutcome,
  }
}
