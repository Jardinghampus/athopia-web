'use client'

import { useState, useTransition } from 'react'
import { Star } from 'lucide-react'
import { toggleFollow } from '@/app/(app)/lag/[slug]/actions'

export function FollowButton({
  entityId,
  initialFollowing,
}: {
  entityId: string
  initialFollowing: boolean
}) {
  const [following, setFollowing] = useState(initialFollowing)
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await toggleFollow(entityId)
      if (result && 'following' in result && typeof result.following === 'boolean') {
        setFollowing(result.following)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
        following
          ? 'bg-pitch text-white hover:bg-pitch/80'
          : 'border border-border bg-card text-foreground hover:bg-muted'
      }`}
    >
      <Star className={`h-4 w-4 ${following ? 'fill-white' : ''}`} />
      {following ? 'Följer' : 'Följ lag'}
    </button>
  )
}
