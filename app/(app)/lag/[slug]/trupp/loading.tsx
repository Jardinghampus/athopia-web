import { Skeleton } from "@/components/ui/skeleton";

export default function LagTruppLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-6 space-y-2" aria-hidden>
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-xl" />
      ))}
    </div>
  );
}
