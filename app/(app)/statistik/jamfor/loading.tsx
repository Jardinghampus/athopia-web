import { Skeleton } from "@/components/ui/skeleton";

export default function JamforLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8" aria-hidden>
      <div className="space-y-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
  );
}
