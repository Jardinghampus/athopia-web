import { Skeleton } from "@/components/ui/skeleton";

export default function PodcastIndexLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8" aria-hidden>
      <div className="mb-6">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-full max-w-md mt-1" />
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
      <div className="mt-8">
        <Skeleton className="h-4 w-32 mb-3" />
        <div className="rounded-xl border border-border bg-card divide-y divide-border/60">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-4 py-3 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
