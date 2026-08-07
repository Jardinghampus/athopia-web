import { Skeleton } from "@/components/ui/skeleton";

export default function MittLagLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-10 pt-4" aria-hidden>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg shrink-0" />
      </div>
      <Skeleton className="h-20 w-full rounded-2xl mb-5" />
      <Skeleton className="h-32 w-full rounded-2xl mb-5" />
      <Skeleton className="h-24 w-full rounded-2xl mb-5" />
      <Skeleton className="h-48 w-full rounded-2xl mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
