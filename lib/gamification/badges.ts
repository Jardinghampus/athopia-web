import { createServerClient } from '@/lib/supabase'
import type { UserBadge } from './types'

export async function assignBadge(
  clerkUserId: string,
  slug: string,
  name: string,
  description: string
) {
  const supabase = createServerClient()
  const { error } = await supabase.from('user_badges').upsert({
    clerk_user_id: clerkUserId,
    badge_slug: slug,
    badge_name: name,
    badge_description: description,
  }, { onConflict: 'clerk_user_id,badge_slug', ignoreDuplicates: true })

  if (error) {
    console.error('Failed to assign badge:', error)
    throw error
  }
}

export async function getUserBadges(clerkUserId: string): Promise<UserBadge[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('user_badges')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .order('earned_at', { ascending: false })
  return (data as UserBadge[]) ?? []
}
