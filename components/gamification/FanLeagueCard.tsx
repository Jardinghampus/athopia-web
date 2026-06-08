'use client'

import { useEffect, useState } from 'react'
import type { UserLeagueMembership } from '@/lib/gamification/types'

interface LeagueEntry {
  clerk_user_id: string
  weekly_iq: number
  league_rank: number | null
}

interface Props {
  membership: UserLeagueMembership
  currentUserId: string
}

export function FanLeagueCard({ membership, currentUserId }: Props) {
  const [rankings, setRankings] = useState<LeagueEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/gamification/league-rank')
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch rankings')
        return r.json()
      })
      .then(d => {
        setRankings(d.rankings ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const { team_name, team_color } = membership.fan_leagues

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: team_color }}
        />
        <span className="text-xs text-white/40 uppercase tracking-widest">
          {team_name}-ligan
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-6 rounded bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {rankings.slice(0, 5).map((entry, i) => {
            const isMe = entry.clerk_user_id === currentUserId
            return (
              <div
                key={entry.clerk_user_id}
                className={`flex items-center justify-between rounded-lg px-2 py-1 ${
                  isMe ? 'bg-[#1D9E75]/10 border border-[#1D9E75]/20' : ''
                }`}
              >
                <span className={`text-xs ${isMe ? 'text-[#1D9E75] font-semibold' : 'text-white/40'}`}>
                  #{entry.league_rank ?? i + 1} {isMe ? 'Du' : '···'}
                </span>
                <span className={`text-sm font-bold tabular-nums ${isMe ? 'text-[#1D9E75]' : 'text-white/60'}`}>
                  {entry.weekly_iq}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
