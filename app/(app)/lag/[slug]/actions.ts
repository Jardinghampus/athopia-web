'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase'

export async function toggleFollow(entityId: string, sport = 'football') {
  const { userId } = await auth()
  if (!userId) return { error: 'not_authenticated' }
  if (!isSupabaseConfigured()) return { error: 'db_not_configured' }

  const supabase = createServerClient()

  const { data: existing } = await supabase
    .from('user_follows')
    .select('id')
    .eq('user_id', userId)
    .eq('entity_id', entityId)
    .maybeSingle()

  if (existing) {
    await supabase.from('user_follows').delete().eq('id', existing.id)
    return { following: false }
  } else {
    await supabase.from('user_follows').insert({ user_id: userId, entity_id: entityId, sport })
    return { following: true }
  }
}
