import { Skeleton } from "@/components/ui/skeleton";

export default function AnalysDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10" aria-hidden>
      <Skeleton className="h-3 w-40 mb-3" />
      <Skeleton className="h-10 w-full mb-2" />
      <Skeleton className="h-10 w-2/3 mb-3" />
      <Skeleton className="h-4 w-48 mb-8" />
      <Skeleton className="h-28 w-full rounded-xl mb-8" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
