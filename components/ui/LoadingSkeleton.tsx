import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ArticleSkeleton({ variant = "md" }: { variant?: "sm" | "md" | "lg" | "featured" }) {
  const aspect = variant === "md" ? "aspect-[4/3]" : "aspect-video";
  if (variant === "sm") return <Skeleton className="h-24 rounded-2xl" />;
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <Skeleton className={cn("w-full", aspect)} />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function NarrativeSkeleton() {
  return <Skeleton className="h-28 rounded-2xl" />;
}

export function PodcastSkeleton() {
  return <Skeleton className="h-24 rounded-2xl" />;
}

export function ScoreSkeleton() {
  return <Skeleton className="h-20 rounded-xl" />;
}

