'use client'

import { motion } from 'motion/react'
import type { SeasonStreak } from '@/lib/gamification/types'

interface Props {
  streak: SeasonStreak
  totalRounds?: number
  onUseFreeze?: (roundNumber: number) => void
  currentRound?: number
}

export function SeasonStreakBar({
  streak,
  totalRounds = 30,
  onUseFreeze,
  currentRound,
}: Props) {
  const canFreeze = streak.freeze_tokens > 0 && currentRound !== undefined

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40 uppercase tracking-widest">Säsongssvit</span>
        <span className="text-xs text-white/30">Bäst: {streak.longest_streak} omgångar</span>
      </div>

      <div className="flex items-end gap-3">
        <motion.span
          className="text-4xl font-black text-white tabular-nums"
          key={streak.current_streak}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          {streak.current_streak}
        </motion.span>
        <div className="pb-1">
          <p className="text-sm text-white/50">omgångar i rad 🔥</p>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: Math.min(totalRounds, 30) }, (_, i) => {
          const roundNum = i + 1
          const isFrozen = streak.freeze_used_rounds?.includes(roundNum)
          const isCompleted =
            !isFrozen &&
            streak.last_completed_round != null &&
            roundNum <= streak.last_completed_round
          const isCurrent = roundNum === currentRound

          return (
            <motion.div
              key={roundNum}
              className={`w-5 h-5 rounded-sm text-[9px] flex items-center justify-center font-bold ${
                isCompleted
                  ? 'bg-[#1D9E75] text-black'
                  : isFrozen
                  ? 'bg-blue-500/60 text-white'
                  : isCurrent
                  ? 'border border-[#1D9E75] text-[#1D9E75]'
                  : 'bg-white/5 text-white/20'
              }`}
              whileHover={{ scale: 1.2 }}
            >
              {isFrozen ? '❄' : roundNum}
            </motion.div>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">❄️</span>
          <span className="text-xs text-white/50">
            {streak.freeze_tokens} freeze {streak.freeze_tokens === 1 ? 'token' : 'tokens'} kvar
          </span>
        </div>
        {canFreeze && (
          <button
            onClick={() => onUseFreeze?.(currentRound!)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors border border-blue-400/30 rounded px-2 py-0.5"
          >
            Använd freeze
          </button>
        )}
      </div>
    </div>
  )
}
