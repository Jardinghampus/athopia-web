'use client'

import { useState, useTransition } from 'react'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { toggleFollow } from '@/app/actions/follows'

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
    const next = !following
    setFollowing(next)
    startTransition(async () => {
      const res = await toggleFollow(entityId)
      if (!res.ok) {
        setFollowing(!next)
        toast.error('Kunde inte uppdatera. Försök igen.')
        return
      }
      setFollowing(!!res.following)
      toast.success(res.following ? 'Du följer nu laget' : 'Slutade följa laget')
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-pressed={following}
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
