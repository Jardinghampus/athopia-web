import { Skeleton } from "@/components/ui/skeleton";

export default function AnalysListLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10" aria-hidden>
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-10 w-64 mb-2" />
      <Skeleton className="h-4 w-96 mb-8" />
      <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-5 py-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
