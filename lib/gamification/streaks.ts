import { createServerClient } from '@/lib/supabase'

export async function updateStreakOnRingComplete(
  clerkUserId: string,
  roundNumber: number
) {
  const supabase = createServerClient()

  const { data: streak } = await supabase
    .from('user_season_streak')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (!streak) {
    await supabase.from('user_season_streak').insert({
      clerk_user_id: clerkUserId,
      current_streak: 1,
      longest_streak: 1,
      last_completed_round: roundNumber,
    })
    return
  }

  const expectedPrevRound = roundNumber - 1
  const prevRoundOK =
    streak.last_completed_round === expectedPrevRound ||
    streak.freeze_used_rounds?.includes(expectedPrevRound)

  const newStreak = prevRoundOK ? streak.current_streak + 1 : 1

  await supabase
    .from('user_season_streak')
    .update({
      current_streak: newStreak,
      longest_streak: Math.max(streak.longest_streak, newStreak),
      last_completed_round: roundNumber,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', clerkUserId)
}

export async function useFreeze(clerkUserId: string, roundNumber: number) {
  const supabase = createServerClient()

  const { data: streak } = await supabase
    .from('user_season_streak')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (!streak) {
    return { success: false, reason: 'Ingen streak-data hittades' }
  }

  if (streak.freeze_tokens < 1) {
    return { success: false, reason: 'Inga freeze-tokens kvar' }
  }

  const { count } = await supabase
    .from('user_season_streak')
    .update({
      freeze_tokens: streak.freeze_tokens - 1,
      freeze_used_rounds: [...(streak.freeze_used_rounds ?? []), roundNumber],
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', clerkUserId)
    .gt('freeze_tokens', 0)
    .select()

  if (!count) {
    return { success: false, reason: 'Inga freeze-tokens kvar' }
  }

  return { success: true }
}

export async function checkAndBreakExpiredStreaks(currentRoundNumber: number) {
  const supabase = createServerClient()

  const { data: atRiskStreaks } = await supabase
    .from('user_season_streak')
    .select('*')
    .gt('current_streak', 0)
    .lt('last_completed_round', currentRoundNumber - 1)

  if (!atRiskStreaks) return

  for (const s of atRiskStreaks) {
    const missedRound = currentRoundNumber - 1
    const usedFreeze = s.freeze_used_rounds?.includes(missedRound)

    if (!usedFreeze) {
      await supabase
        .from('user_season_streak')
        .update({ current_streak: 0 })
        .eq('clerk_user_id', s.clerk_user_id)
    }
  }
}
