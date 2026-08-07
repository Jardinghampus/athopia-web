import { Skeleton } from "@/components/ui/skeleton";

export default function MatchDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" aria-hidden>
      <Skeleton className="h-4 w-56" />

      <div className="bg-card border border-border rounded-2xl p-6">
        <Skeleton className="h-3 w-40 mx-auto mb-3" />
        <div className="flex items-center justify-center gap-6">
          <Skeleton className="h-6 flex-1 max-w-48" />
          <Skeleton className="h-14 w-28 rounded-lg" />
          <Skeleton className="h-6 flex-1 max-w-48" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <Skeleton className="h-3 w-32" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <Skeleton className="h-3 w-24 mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <Skeleton className="h-3 w-24 mb-2" />
          {Array.from({ length: 11 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
