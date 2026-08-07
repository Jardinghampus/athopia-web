import { Skeleton } from "@/components/ui/skeleton";

export default function LagNyheterLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" aria-hidden>
      <Skeleton className="h-9 w-72 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
