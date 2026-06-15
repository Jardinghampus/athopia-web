'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useGamification } from '@/hooks/useGamification'
import { IQRatingWidget } from './IQRatingWidget'
import { RoundRing } from './RoundRing'
import { SeasonStreakBar } from './SeasonStreakBar'
import { MatchCard } from './MatchCard'
import { BadgeShelf } from './BadgeShelf'
import { FanLeagueCard } from './FanLeagueCard'
import { OnboardingLeaguePicker } from './OnboardingLeaguePicker'

export function GamificationHub() {
  const { user } = useUser()
  const { iq, currentRoundRing, streak, recentCards, league, badges, isLoading } = useGamification()
  const [showPicker, setShowPicker] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-xl bg-white/5" />
        ))}
      </div>
    )
  }

  if (!league && !showPicker) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center space-y-4">
        <p className="text-white/60 text-sm">
          Välj ett lag för att gå med i en liga och börja tävla.
        </p>
        <button
          onClick={() => setShowPicker(true)}
          className="px-5 py-2 rounded-lg bg-pitch text-black font-bold text-sm"
        >
          Välj lag →
        </button>
        {showPicker && (
          <OnboardingLeaguePicker onComplete={() => setShowPicker(false)} />
        )}
      </div>
    )
  }

  return (
    <>
      {showPicker && (
        <OnboardingLeaguePicker onComplete={() => setShowPicker(false)} />
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
          {iq && (
            <IQRatingWidget
              iq={iq}
              leagueTeamName={league?.fan_leagues?.team_name}
            />
          )}
          {currentRoundRing && (
            <RoundRing
              readMatchReport={currentRoundRing.read_match_report}
              readStatistics={currentRoundRing.read_statistics}
              readPreview={currentRoundRing.read_preview}
              roundNumber={currentRoundRing.round_number}
              size={88}
            />
          )}
        </div>

        {streak && (
          <SeasonStreakBar
            streak={streak}
            currentRound={currentRoundRing?.round_number}
            onUseFreeze={async (round) => {
              await fetch('/api/gamification/use-freeze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roundNumber: round }),
              })
            }}
          />
        )}

        {league && user && (
          <FanLeagueCard membership={league} currentUserId={user.id} />
        )}

        {recentCards.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-white/40 uppercase tracking-widest">Dina matchkort</p>
            {recentCards.map(card => (
              <MatchCard key={card.id} card={card} />
            ))}
          </div>
        )}

        {badges.length > 0 && <BadgeShelf badges={badges} />}
      </div>
    </>
  )
}
