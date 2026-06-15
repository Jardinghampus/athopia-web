'use client'

import { motion } from 'motion/react'
import type { FootballIQ } from '@/lib/gamification/types'

interface Props {
  iq: FootballIQ
  leagueTeamName?: string
}

export function IQRatingWidget({ iq, leagueTeamName }: Props) {
  const scoreColor =
    iq.weekly_iq >= 80 ? 'var(--color-pitch)'
    : iq.weekly_iq >= 60 ? '#F9A825'
    : '#888'

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40 uppercase tracking-widest">Fotbolls-IQ</span>
        {leagueTeamName && (
          <span className="text-xs text-white/30">{leagueTeamName}-ligan</span>
        )}
      </div>

      <div className="flex items-end gap-3">
        <motion.span
          className="text-5xl font-black tabular-nums"
          style={{ color: scoreColor }}
          key={iq.weekly_iq}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          {iq.weekly_iq}
        </motion.span>
        <div className="pb-1 space-y-0.5">
          {iq.weekly_rank != null && (
            <p className="text-xs text-white/50">#{iq.weekly_rank} denna vecka</p>
          )}
          {iq.league_rank != null && (
            <p className="text-xs text-white/50">#{iq.league_rank} i din liga</p>
          )}
        </div>
      </div>

      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: scoreColor }}
          initial={{ width: 0 }}
          animate={{ width: `${iq.weekly_iq}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center pt-1">
        {[
          { label: 'Lästa', value: iq.articles_read_fully },
          { label: 'Rätt tips', value: iq.predictions_correct },
          { label: 'Omgångar', value: iq.matches_covered },
        ].map(stat => (
          <div key={stat.label}>
            <p className="text-lg font-bold text-white">{stat.value}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
