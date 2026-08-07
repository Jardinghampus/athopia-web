import { Skeleton } from "@/components/ui/skeleton";

export default function LagAnalysLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-12" aria-hidden>
      <Skeleton className="h-4 w-64" />

      <div className="mt-3 mb-6 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-40" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
