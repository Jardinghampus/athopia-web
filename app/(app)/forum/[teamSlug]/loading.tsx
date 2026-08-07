import { Skeleton } from "@/components/ui/skeleton";

export default function ForumTeamLoading() {
  return (
    <div className="w-full min-h-screen" aria-hidden>
      <Skeleton className="h-11 w-full rounded-none" />
      <div className="mx-auto w-full max-w-7xl px-4 xl:px-6">
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0 border-x border-border/40">
            <div className="px-4 py-3 flex items-center gap-3 border-b border-border/40">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="px-4 pt-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          </div>
          <aside className="hidden lg:block w-[280px] shrink-0 py-4 space-y-3">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </aside>
        </div>
      </div>
    </div>
  );
}
