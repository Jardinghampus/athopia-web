import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase'
import { getUserPlan } from '@/lib/user-plan'
import { canAccess, requiredPlanFor } from '@/lib/access-rules'

export const revalidate = 0

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ count: 0, limit: 30 }, { status: 401 })

  // Same gate as /api/elite/chat — founder D2: globalAiChat = PRO.
  const plan = await getUserPlan()
  if (!canAccess('globalAiChat', plan)) {
    const requiredPlan = requiredPlanFor('globalAiChat')
    return Response.json(
      {
        error: `${requiredPlan === 'elite' ? 'Elite' : 'PRO'}-prenumeration krävs för AI-chatten.`,
        code: 'plan_required',
        feature: 'globalAiChat',
        requiredPlan,
        upgradePath: '/prenumerera',
      },
      { status: 403 },
    )
  }

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
