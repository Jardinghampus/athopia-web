import { Skeleton } from "@/components/ui/skeleton";

export default function PodcastEpisodeLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10" aria-hidden>
      <Skeleton className="h-4 w-40 mb-5" />
      <Skeleton className="h-4 w-32 mb-3" />
      <Skeleton className="h-10 w-full mb-2" />
      <Skeleton className="h-10 w-2/3 mb-4" />
      <Skeleton className="h-4 w-56 mb-8" />
      <Skeleton className="h-[352px] w-full rounded-xl mb-8" />
      <Skeleton className="h-4 w-full max-w-md" />
    </div>
  );
}
