import { createServerClient } from '@/lib/supabase'

export async function getActiveRoundRing(clerkUserId: string) {
  const supabase = createServerClient()

  const { data: activeRound } = await supabase
    .from('match_rounds')
    .select('*')
    .eq('is_active', true)
    .order('round_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!activeRound) return null

  const { data: ring } = await supabase
    .from('round_ring_progress')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .eq('round_id', activeRound.id)
    .single()

  return ring
    ? { ...ring, round_number: activeRound.round_number }
    : {
        round_id: activeRound.id,
        round_number: activeRound.round_number,
        read_match_report: false,
        read_statistics: false,
        read_preview: false,
        ring_completed: false,
        completed_at: null,
      }
}
