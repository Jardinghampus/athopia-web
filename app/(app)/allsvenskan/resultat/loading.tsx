import { Skeleton } from "@/components/ui/skeleton";

export default function AllsvenskanResultatLoading() {
  return (
    <div className="w-full px-4 sm:px-8 py-10 max-w-3xl mx-auto" aria-hidden>
      <Skeleton className="h-4 w-40 mb-6" />
      <Skeleton className="h-12 w-96 mb-2" />
      <Skeleton className="h-4 w-72 mb-8" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
      <div className="mt-6 flex gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
