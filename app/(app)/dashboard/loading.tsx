import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-10 w-full animate-pulse rounded bg-muted" />
      <DashboardSkeleton />
    </div>
  )
}
