import { Skeleton } from "@/components/ui/skeleton";

/**
 * Laddningsskelett för Mitt lag-dashboarden — speglar den riktiga layouten
 * (header, nyckeltal, tabs, kort) med en våg-shimmer medan datan hämtas.
 */
export function MittLagSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-48" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="w-5 h-5 rounded-full" />)}
            </div>
          </div>
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Nyckeltal */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-2.5 flex flex-col items-center gap-1.5">
            <Skeleton className="h-6 w-10" />
            <Skeleton className="h-2.5 w-12" />
          </div>
        ))}
      </div>

      {/* Tab-bar */}
      <div className="flex gap-2 border-b border-border pb-2.5">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-20 rounded-md" />)}
      </div>

      {/* Kort-grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <CardSkeleton className="lg:col-span-2" bodyHeight="h-[220px]" />
        <CardSkeleton rows={6} />
        <CardSkeleton className="lg:col-span-2" rows={4} />
        <CardSkeleton rows={5} />
      </div>
    </div>
  );
}

function CardSkeleton({ className = "", rows, bodyHeight }: { className?: string; rows?: number; bodyHeight?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-4 space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-5 w-40" />
      </div>
      {bodyHeight ? (
        <Skeleton className={`w-full ${bodyHeight} rounded-xl`} />
      ) : (
        <div className="space-y-2.5">
          {Array.from({ length: rows ?? 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
