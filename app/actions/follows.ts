'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase'

const SPORT = 'football'

type Result = { ok: boolean; following?: boolean; error?: string }

export async function toggleFollow(entityId: string): Promise<Result> {
  const { userId } = await auth()
  if (!userId) return { ok: false, error: 'unauthorized' }
  if (!isSupabaseConfigured()) return { ok: false, error: 'not_configured' }

  const supabase = createServerClient()

  const { data: existing } = await supabase
    .from('user_follows')
    .select('id')
    .eq('user_id', userId)
    .eq('entity_id', entityId)
    .eq('sport', SPORT)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('id', existing.id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/dashboard')
    return { ok: true, following: false }
  }

  const { error } = await supabase
    .from('user_follows')
    .insert({ user_id: userId, entity_id: entityId, sport: SPORT })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard')
  return { ok: true, following: true }
}

export async function isFollowing(entityId: string): Promise<boolean> {
  const { userId } = await auth()
  if (!userId || !isSupabaseConfigured()) return false
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('user_follows')
      .select('id')
      .eq('user_id', userId)
      .eq('entity_id', entityId)
      .eq('sport', SPORT)
      .maybeSingle()
    return !!data
  } catch {
    return false
  }
}
