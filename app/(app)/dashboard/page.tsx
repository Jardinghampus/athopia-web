import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getFollowedTeams } from '@/lib/dashboard/queries'
import { TeamTabs } from '@/components/dashboard/team-tabs'
import { DashboardGrid } from '@/components/dashboard/dashboard-grid'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { EmptyState } from '@/components/dashboard/empty-state'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const teams = await getFollowedTeams(userId)
  if (teams.length === 0) return <EmptyState />

  const { team } = await searchParams
  const active = teams.find((t) => t.slug === team)?.slug ?? teams[0]!.slug

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">MIN DASHBOARD</h1>
        <p className="text-sm text-muted-foreground">Allt om dina följda lag på ett ställe</p>
      </div>

      <TeamTabs teams={teams} active={active} />

      <Suspense key={active} fallback={<DashboardSkeleton />}>
        <DashboardGrid teamSlug={active} />
      </Suspense>
    </div>
  )
}
