import { Skeleton } from "@/components/ui/skeleton";

export default function AllsvenskanTabellLoading() {
  return (
    <div className="w-full px-4 sm:px-8 py-10 max-w-3xl mx-auto" aria-hidden>
      <Skeleton className="h-4 w-40 mb-6" />
      <Skeleton className="h-12 w-96 mb-2" />
      <Skeleton className="h-4 w-56 mb-6" />
      <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-xl shrink-0" />
        ))}
      </div>
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="flex gap-4 px-4 py-3 border-b border-border bg-muted/30">
          {Array.from({ length: 11 }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 flex-1" />
          ))}
        </div>
        {Array.from({ length: 16 }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 py-3 border-b border-border/40 last:border-0">
            {Array.from({ length: 11 }).map((_, c) => (
              <Skeleton key={c} className={`h-4 ${c === 1 ? "flex-[2]" : "flex-1"}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
