import { Skeleton } from "@/components/ui/skeleton";

export default function AllsvenskanTalangerLoading() {
  return (
    <div className="w-full px-4 sm:px-8 py-10 max-w-3xl mx-auto" aria-hidden>
      <Skeleton className="h-4 w-40 mb-6" />
      <Skeleton className="h-12 w-72 mb-2" />
      <Skeleton className="h-4 w-full max-w-xl mb-1" />
      <Skeleton className="h-4 w-2/3 max-w-xl mb-8" />
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="flex gap-4 px-4 py-3 border-b border-border bg-muted/30">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 flex-1" />
          ))}
        </div>
        {Array.from({ length: 15 }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 py-3 border-b border-border/40 last:border-0">
            {Array.from({ length: 6 }).map((_, c) => (
              <Skeleton key={c} className={`h-4 ${c === 1 ? "flex-[2]" : "flex-1"}`} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  );
}
