'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { MatchCard as MatchCardType } from '@/lib/gamification/types'

interface Props {
  card: MatchCardType
  onReveal?: (result: { outcomeCorrect: boolean; isRare: boolean }) => void
}

export function MatchCard({ card, onReveal }: Props) {
  const [isRevealing, setIsRevealing] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  async function handleReveal() {
    if (card.is_revealed || isRevealing) return
    if (card.actual_home_goals == null || card.actual_away_goals == null) return
    setIsRevealing(true)

    const res = await fetch('/api/gamification/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId: card.match_id,
        actual: {
          homeGoals: card.actual_home_goals,
          awayGoals: card.actual_away_goals,
        },
      }),
    })
    if (!res.ok) {
      setIsRevealing(false)
      return
    }
    const data = await res.json()
    setIsRevealing(false)

    if (data.isRare) {
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    }

    onReveal?.({ outcomeCorrect: data.outcomeCorrect, isRare: data.isRare })
  }

  const isLocked = !card.is_revealed && new Date(card.match_date) > new Date()

  return (
    <div className="relative">
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 rounded-xl"
          >
            <div className="text-center">
              <p className="text-4xl mb-2">🔮</p>
              <p className="text-pitch font-bold text-lg">Synskarp!</p>
              <p className="text-white/60 text-sm">+{card.iq_points_earned} IQ-poäng</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className={`rounded-xl border p-4 space-y-3 transition-all ${
          isLocked
            ? 'border-white/5 bg-white/[0.03] opacity-60'
            : card.is_revealed
            ? card.outcome_correct
              ? 'border-pitch/30 bg-pitch/5'
              : 'border-red-500/20 bg-red-500/5'
            : 'border-white/10 bg-white/5 hover:border-white/20 cursor-pointer'
        }`}
        whileTap={!card.is_revealed && !isLocked ? { scale: 0.98 } : {}}
        onClick={!card.is_revealed && !isLocked ? handleReveal : undefined}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/30 uppercase tracking-widest">
            {isLocked
              ? '🔒 Ej spelad'
              : card.is_revealed
              ? 'Avslöjad'
              : isRevealing
              ? 'Avslöjar...'
              : '▶ Tryck för reveal'}
          </span>
          {card.is_revealed && card.iq_points_earned > 0 && (
            <span className="text-xs text-pitch font-semibold">
              +{card.iq_points_earned} IQ
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-white">{card.home_team}</span>
          <div className="text-center">
            {card.is_revealed ? (
              <span className="text-xl font-black text-white">
                {card.actual_home_goals} – {card.actual_away_goals}
              </span>
            ) : card.prediction_home_goals != null ? (
              <span className="text-sm text-white/40">
                {card.prediction_home_goals}–{card.prediction_away_goals}
              </span>
            ) : (
              <span className="text-white/20 text-sm">?–?</span>
            )}
          </div>
          <span className="font-semibold text-white">{card.away_team}</span>
        </div>

        {card.is_revealed && (
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold ${
                card.outcome_correct ? 'text-success' : 'text-red-400'
              }`}
            >
              {card.outcome_correct ? '✓ Rätt vinnare' : '✗ Fel vinnare'}
            </span>
            {card.score_correct && (
              <span className="text-xs text-pitch font-semibold">• Exakt rätt 🔮</span>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
