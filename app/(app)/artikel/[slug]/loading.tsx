import { Skeleton } from "@/components/ui/skeleton";

export default function ArtikelLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10" aria-hidden>
      <Skeleton className="h-4 w-48 mb-5" />
      <Skeleton className="aspect-[16/9] w-full rounded-2xl mb-8" />
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-12 w-full mb-2" />
      <Skeleton className="h-12 w-2/3 mb-3" />
      <div className="flex items-center justify-between gap-3 mb-8">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl mb-8" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
