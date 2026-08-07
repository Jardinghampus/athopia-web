import { Skeleton } from "@/components/ui/skeleton";

export default function ThreadLoading() {
  return (
    <div className="w-full min-h-screen" aria-hidden>
      <div className="mx-auto w-full max-w-[600px] border-x border-border/20">
        <div className="px-4 py-3 space-y-2 border-b border-border/30">
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <div className="px-4 pt-5 pb-10 space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl ml-6" />
          ))}
        </div>
      </div>
    </div>
  );
}
