import { Skeleton } from "@/components/ui/skeleton";

export default function LagMatcherLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-6" aria-hidden>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
