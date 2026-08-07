import { Skeleton } from "@/components/ui/skeleton";

export default function ForumIndexLoading() {
  return (
    <div className="w-full min-h-screen" aria-hidden>
      <div className="mx-auto w-full max-w-[900px] px-4 sm:px-6 py-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 16 }).map((_, i) => (
            <Skeleton key={i} className="h-[76px] rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
