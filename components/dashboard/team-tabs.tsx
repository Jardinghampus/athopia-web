'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { DashTeam } from '@/lib/dashboard/types'

export function TeamTabs({ teams, active }: { teams: DashTeam[]; active: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function onChange(slug: string) {
    const p = new URLSearchParams(params.toString())
    p.set('team', slug)
    router.push(`${pathname}?${p.toString()}`, { scroll: false })
  }

  return (
    <Tabs value={active} onValueChange={onChange}>
      <TabsList className="h-auto flex-wrap justify-start gap-1 bg-muted/50 p-1">
        {teams.map((t) => (
          <TabsTrigger key={t.slug} value={t.slug} className="gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={t.logo_url ?? undefined} alt={t.name} />
              <AvatarFallback className="text-[10px]">
                {t.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {t.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
