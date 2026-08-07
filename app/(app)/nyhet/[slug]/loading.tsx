import { Skeleton } from "@/components/ui/skeleton";

export default function NyhetLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12" aria-hidden>
      <Skeleton className="h-4 w-40 mb-5" />
      <Skeleton className="h-3 w-28 mb-2" />
      <Skeleton className="h-9 w-full mb-2" />
      <Skeleton className="h-9 w-2/3 mb-4" />
      <div className="flex gap-3 mb-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4 mb-8" />
      <Skeleton className="h-11 w-48 rounded-full" />
    </div>
  );
}
