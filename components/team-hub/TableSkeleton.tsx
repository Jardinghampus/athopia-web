import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generisk tabell-skelett med våg-shimmer för scout/spelar-vyer.
 */
export function TableSkeleton({ rows = 12, cols = 6, filters = true }: { rows?: number; cols?: number; filters?: boolean }) {
  return (
    <div className="space-y-5" aria-hidden>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {filters && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex gap-4 px-4 py-3 border-b border-border bg-muted/40">
          {Array.from({ length: cols }).map((_, i) => <Skeleton key={i} className="h-3.5 flex-1" />)}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 py-3 border-b border-border/40 last:border-0">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={`h-4 ${c === 1 ? "flex-[2]" : "flex-1"}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
