import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase'

export const revalidate = 0

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ count: 0, limit: 30 }, { status: 401 })

  const db = createServerClient()
  const today = new Date().toISOString().slice(0, 10)
  const limit = Number(process.env.DAILY_LIMIT ?? '30')

  const { data } = await db
    .from('chat_usage')
    .select('msg_count')
    .eq('user_id', userId)
    .eq('day', today)
    .single()

  return Response.json({ count: data?.msg_count ?? 0, limit })
}
