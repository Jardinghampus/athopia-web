import { Skeleton } from "@/components/ui/skeleton";

type Shape = "list" | "article" | "detail" | "form" | "grid";

/**
 * Delad skelettyta för route-segment (mobil UX-regel 15: aldrig en tom skärm).
 *
 * Formen ska likna det som kommer, inte vara en generisk spinner — ett skelett
 * som har fel silhuett ger en layouthoppning när innehållet landar, vilket är
 * värre än ingen skelett alls. Välj den variant som matchar sidan.
 */
export function PageSkeleton({
  shape = "list",
  rows = 6,
  className = "max-w-3xl",
}: {
  shape?: Shape;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full px-4 sm:px-6 py-6 ${className}`} aria-hidden>
      <span className="sr-only" aria-live="polite">
        Laddar
      </span>

      {shape === "article" ? (
        <div className="space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-52 w-full rounded-2xl" />
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-4" style={{ width: i % 3 === 2 ? "70%" : "100%" }} />
          ))}
        </div>
      ) : shape === "detail" ? (
        <div className="space-y-5">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : shape === "form" ? (
        <div className="space-y-5">
          <Skeleton className="h-8 w-44" />
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          ))}
          <Skeleton className="h-11 w-36 rounded-lg" />
        </div>
      ) : shape === "grid" ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: rows }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
