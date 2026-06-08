'use client'

import type { UserBadge } from '@/lib/gamification/types'

const BADGE_ICONS: Record<string, string> = {
  synskarp: '🔮',
  torskblind: '🙈',
  ring_master: '💍',
  streak_5: '🔥',
  streak_10: '⚡',
}

interface Props {
  badges: UserBadge[]
}

export function BadgeShelf({ badges }: Props) {
  if (badges.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs text-white/40 uppercase tracking-widest">Badges</p>
      <div className="flex flex-wrap gap-2">
        {badges.map(badge => (
          <div
            key={badge.badge_slug}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1"
            title={badge.badge_description}
          >
            <span className="text-sm">{BADGE_ICONS[badge.badge_slug] ?? '🏅'}</span>
            <span className="text-xs font-semibold text-white/70">{badge.badge_name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
