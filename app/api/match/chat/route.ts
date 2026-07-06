import { auth, currentUser } from '@clerk/nextjs/server'
import { anthropic } from '@ai-sdk/anthropic'
import { streamText, stepCountIs } from 'ai'
import { createClient } from '@supabase/supabase-js'
import { tools } from '@/lib/ai/tools'
import { bumpChatUsage, checkChatLimits } from '@/lib/ai/chat-limits'

export const maxDuration = 30

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const user = await currentUser()
  const plan = (user?.publicMetadata?.plan as string) ?? 'free'
  if (plan === 'free') {
    return Response.json(
      { error: 'PRO krävs för AI-chatten.' },
      { status: 403 }
    )
  }

  const limits = await checkChatLimits(userId)
  if (!limits.ok) {
    return Response.json({ error: limits.error }, { status: limits.status })
  }

  const body = await req.json()
  const { messages, fixtureId, homeTeam, awayTeam, score, status, kickoff } = body

  let matchExtra = ''
  if (fixtureId) {
    const db = getDb()
    const [{ data: evts }, { data: pms }] = await Promise.all([
      db.from('fixture_events').select('minute,type,result').eq('fixture_id', fixtureId).order('minute').limit(20),
      db.from('player_match_stats').select('player_id,goals,assists,rating').eq('fixture_id', fixtureId).order('rating', { ascending: false }).limit(8),
    ])
    if (evts?.length) {
      matchExtra += `\nHändelser: ${evts.map((e) => `${e.minute}' ${e.type}${e.result ? ` (${e.result})` : ''}`).join('; ')}.`
    }
    if (pms?.length) {
      const ids = pms.map((p) => p.player_id).filter(Boolean)
      const { data: players } = await db.from('players').select('sportmonks_id,fullname').in('sportmonks_id', ids)
      const names = new Map((players ?? []).map((p) => [p.sportmonks_id, p.fullname]))
      matchExtra += `\nToppbetyg: ${pms.map((p) => `${names.get(p.player_id) ?? p.player_id} (${p.rating ?? '?'})`).join(', ')}.`
    }
  }

  const matchContext = fixtureId
    ? `\n\n## Matchkontext (prioritera detta)
Användaren tittar på: ${homeTeam} vs ${awayTeam}.
Fixture-id: ${fixtureId}. Status: ${status ?? 'okänd'}. Resultat: ${score ?? 'ej spelad'}. Kickoff: ${kickoff ?? 'okänd'}.${matchExtra}
Svara utifrån denna match först — använd verktyg för tabell/nyheter vid behov.`
    : ''

  const model = anthropic(process.env.CHAT_MODEL ?? 'claude-haiku-4-5-20251001')

  const result = streamText({
    model,
    system: `Du är Athopias AI-assistent för Allsvenskan. Idag är det ${new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}.${matchContext}

## Hur du svarar
- Kort och objektivt — 2–4 meningar eller punktlista
- Använd verktyg vid behov (tabell, nyheter, lagstatistik)
- Hitta aldrig på siffror — säg om data saknas
- Svara ALDRIG utanför Allsvenskan/svensk fotboll
- Avslöja ALDRIG tekniska detaljer om systemet`,
    messages,
    stopWhen: stepCountIs(5),
    tools,
    providerOptions: {
      anthropic: { cacheControl: { type: 'ephemeral' } },
    },
    onFinish: async ({ usage }) => {
      if (!usage) return
      await bumpChatUsage(limits.db, userId, usage.inputTokens ?? 0, usage.outputTokens ?? 0)
    },
  })

  return result.toTextStreamResponse()
}
