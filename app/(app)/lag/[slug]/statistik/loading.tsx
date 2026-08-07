import { Skeleton } from "@/components/ui/skeleton";

export default function LagStatistikLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8" aria-hidden>
      <Skeleton className="h-9 w-80" />

      {/* Tabellrad: stat cards */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Säsongsprognos + schemakorrigerad form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>

      {/* Mål per period */}
      <Skeleton className="h-32 rounded-xl" />

      {/* Athopia-betyg */}
      <Skeleton className="h-64 rounded-xl" />

      {/* Interna ligorna */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>

      {/* Full spelarstatistik-tabell */}
      <Skeleton className="h-96 rounded-2xl" />

      {/* Senaste matcher */}
      <div className="space-y-3">
        <Skeleton className="h-7 w-48" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
