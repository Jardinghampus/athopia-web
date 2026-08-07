import { Skeleton } from "@/components/ui/skeleton";

export default function OmgangLoading() {
  return (
    <div className="w-full px-4 sm:px-8 py-10 max-w-3xl mx-auto" aria-hidden>
      <Skeleton className="h-4 w-40 mb-6" />
      <Skeleton className="h-12 w-56 mb-2" />
      <Skeleton className="h-4 w-48 mb-8" />
      <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/50">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-none" />
        ))}
      </div>
      <div className="mt-6 flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
