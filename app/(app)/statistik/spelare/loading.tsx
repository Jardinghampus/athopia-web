import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6" aria-hidden>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Spelarväljare */}
      <div className="rounded-2xl border border-border bg-card p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Skeleton className="h-11 rounded-lg" />
        <Skeleton className="h-11 rounded-lg" />
      </div>

      {/* Radar + råvärden */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      </div>
    </div>
  );
}
