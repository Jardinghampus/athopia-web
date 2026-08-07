import { Skeleton } from "@/components/ui/skeleton";

export default function LagPoddarLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" aria-hidden>
      <Skeleton className="h-9 w-72 mb-6" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
