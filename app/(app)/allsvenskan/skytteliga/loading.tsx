import { Skeleton } from "@/components/ui/skeleton";

export default function AllsvenskanSkytteligaLoading() {
  return (
    <div className="w-full px-4 sm:px-8 py-10 max-w-3xl mx-auto" aria-hidden>
      <Skeleton className="h-4 w-40 mb-6" />
      <Skeleton className="h-12 w-[26rem] mb-2" />
      <Skeleton className="h-4 w-72 mb-8" />
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="flex gap-4 px-4 py-3 border-b border-border bg-muted/30">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 flex-1" />
          ))}
        </div>
        {Array.from({ length: 20 }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 py-3 border-b border-border/40 last:border-0 items-center">
            <Skeleton className="h-4 flex-1" />
            <div className="flex-[2] flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
