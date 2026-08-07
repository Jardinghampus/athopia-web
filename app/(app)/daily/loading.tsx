import { Skeleton } from "@/components/ui/skeleton";

export default function DailyLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12 pb-24" aria-hidden>
      <div className="mb-8 flex flex-col items-center">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-10 w-72 mt-4" />
        <Skeleton className="h-4 w-full max-w-lg mt-3" />
        <Skeleton className="h-4 w-2/3 max-w-lg mt-1" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
        <Skeleton className="h-11 w-full sm:w-40 rounded-2xl" />
        <Skeleton className="h-11 w-full sm:w-48 rounded-2xl" />
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
