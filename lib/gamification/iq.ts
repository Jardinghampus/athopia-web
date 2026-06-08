import { createServerClient } from '@/lib/supabase'
import { IQ_POINTS, ArticleType } from './types'

export async function trackArticleRead(
  clerkUserId: string,
  articleType: ArticleType,
  scrollDepth: number,
  roundId?: string
) {
  const supabase = createServerClient()

  const isFullRead = scrollDepth >= 80
  const isPartialRead = scrollDepth >= 30
  const points = isFullRead
    ? IQ_POINTS.ARTICLE_READ_FULL
    : isPartialRead
    ? IQ_POINTS.ARTICLE_READ_PARTIAL
    : 0

  if (points === 0) return

  const { data: existing } = await supabase
    .from('user_football_iq')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (existing) {
    await supabase
      .from('user_football_iq')
      .update({
        articles_read: existing.articles_read + 1,
        articles_read_fully: isFullRead
          ? existing.articles_read_fully + 1
          : existing.articles_read_fully,
        iq_score: Math.min(100, existing.iq_score + points),
        weekly_iq: Math.min(100, existing.weekly_iq + points),
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', clerkUserId)
  } else {
    await supabase.from('user_football_iq').insert({
      clerk_user_id: clerkUserId,
      iq_score: Math.min(100, 50 + points),
      weekly_iq: Math.min(100, 50 + points),
      articles_read: 1,
      articles_read_fully: isFullRead ? 1 : 0,
    })
  }

  if (roundId) {
    await updateRingProgress(clerkUserId, roundId, articleType)
  }
}

export async function awardPredictionIQ(
  clerkUserId: string,
  outcomeCorrect: boolean,
  scoreExact: boolean
) {
  const supabase = createServerClient()
  let points = IQ_POINTS.PREDICTION_MADE

  if (outcomeCorrect) points += IQ_POINTS.PREDICTION_OUTCOME_CORRECT
  if (scoreExact) points += IQ_POINTS.PREDICTION_SCORE_EXACT

  const { data: existing } = await supabase
    .from('user_football_iq')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (!existing) return points

  await supabase
    .from('user_football_iq')
    .update({
      iq_score: Math.min(100, existing.iq_score + points),
      weekly_iq: Math.min(100, existing.weekly_iq + points),
      predictions_made: existing.predictions_made + 1,
      predictions_correct: outcomeCorrect
        ? existing.predictions_correct + 1
        : existing.predictions_correct,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', clerkUserId)

  return points
}

async function updateRingProgress(
  clerkUserId: string,
  roundId: string,
  articleType: ArticleType
) {
  const supabase = createServerClient()

  const fieldMap: Record<ArticleType, keyof { read_match_report: boolean; read_statistics: boolean; read_preview: boolean }> = {
    match_report: 'read_match_report',
    statistics: 'read_statistics',
    preview: 'read_preview',
    summary: 'read_match_report',
  }

  const field = fieldMap[articleType]

  const { data: existing } = await supabase
    .from('round_ring_progress')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .eq('round_id', roundId)
    .single()

  if (existing) {
    const updated = { ...existing, [field]: true }
    const willComplete =
      updated.read_match_report &&
      updated.read_statistics &&
      updated.read_preview

    if (willComplete && !existing.ring_completed) {
      // Atomic: only one concurrent request can mark ring as complete
      const { count } = await supabase
        .from('round_ring_progress')
        .update({ [field]: true, ring_completed: true, completed_at: new Date().toISOString() })
        .eq('clerk_user_id', clerkUserId)
        .eq('round_id', roundId)
        .eq('ring_completed', false)
        .select()

      if (count) {
        const { data: iqRow } = await supabase
          .from('user_football_iq')
          .select('iq_score, weekly_iq, matches_covered')
          .eq('clerk_user_id', clerkUserId)
          .single()

        if (iqRow) {
          await supabase
            .from('user_football_iq')
            .update({
              iq_score: Math.min(100, iqRow.iq_score + IQ_POINTS.ROUND_RING_COMPLETE),
              weekly_iq: Math.min(100, iqRow.weekly_iq + IQ_POINTS.ROUND_RING_COMPLETE),
              matches_covered: iqRow.matches_covered + 1,
            })
            .eq('clerk_user_id', clerkUserId)
        }

        const { updateStreakOnRingComplete } = await import('./streaks')
        const { data: round } = await supabase
          .from('match_rounds')
          .select('round_number')
          .eq('id', roundId)
          .single()
        if (round) {
          await updateStreakOnRingComplete(clerkUserId, round.round_number)
        }
      }
    } else {
      await supabase
        .from('round_ring_progress')
        .update({ [field]: true })
        .eq('clerk_user_id', clerkUserId)
        .eq('round_id', roundId)
    }
  } else {
    await supabase.from('round_ring_progress').insert({
      clerk_user_id: clerkUserId,
      round_id: roundId,
      [field]: true,
    })
  }
}
