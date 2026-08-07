import { Skeleton } from "@/components/ui/skeleton";

export default function MotenLoading() {
  return (
    <div className="w-full px-4 sm:px-8 py-10 max-w-3xl mx-auto" aria-hidden>
      <Skeleton className="h-4 w-40 mb-6" />
      <Skeleton className="h-12 w-full mb-2" />
      <Skeleton className="h-4 w-56 mb-8" />
      <div className="grid grid-cols-3 gap-3 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-4 w-64 mb-8" />
      <Skeleton className="h-4 w-32 mb-3" />
      <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/50">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-none" />
        ))}
      </div>
    </div>
  );
}
