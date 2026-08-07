import { Skeleton } from "@/components/ui/skeleton";

export default function AllsvenskanLoading() {
  return (
    <div className="w-full px-6 sm:px-8 py-10" aria-hidden>
      <Skeleton className="h-10 w-full mb-6 -mx-6 sm:-mx-8 -mt-10 rounded-none" />
      <div className="mb-8">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-4 w-96 mt-2" />
        <div className="flex gap-2 flex-wrap mt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-28 rounded-full" />
          ))}
        </div>
      </div>

      <Skeleton className="h-32 w-full rounded-2xl mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <section>
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </section>

        <aside className="flex flex-col gap-8">
          <div>
            <Skeleton className="h-8 w-24 mb-4" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div>
            <Skeleton className="h-8 w-32 mb-4" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-8 w-40 mb-4" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </aside>
      </div>
    </div>
  );
}
