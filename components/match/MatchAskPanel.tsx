'use client'

import { CompactChatPanel } from '@/components/ai/CompactChatPanel'
import type { Plan } from '@/lib/access-rules'

interface MatchAskPanelProps {
  fixtureId: number
  homeName: string
  awayName: string
  homeScore: number | null
  awayScore: number | null
  status: string
  kickoffAt: string | null
  plan: Plan
}

export function MatchAskPanel({
  fixtureId,
  homeName,
  awayName,
  homeScore,
  awayScore,
  status,
  kickoffAt,
  plan,
}: MatchAskPanelProps) {
  const score =
    homeScore != null && awayScore != null ? `${homeScore}–${awayScore}` : null

  return (
    <CompactChatPanel
      apiUrl="/api/match/chat"
      title="Fråga om matchen"
      subtitle={`${homeName} vs ${awayName} — AI med matchkontext`}
      plan={plan}
      paywallFeature="aiChat"
      chatBody={{
        fixtureId,
        homeTeam: homeName,
        awayTeam: awayName,
        score,
        status,
        kickoff: kickoffAt,
      }}
      suggestions={[
        `Vad var nyckeln i ${homeName} vs ${awayName}?`,
        'Vilka spelare stack ut?',
        'Hur påverkar resultatet tabellen?',
      ]}
    />
  )
}
