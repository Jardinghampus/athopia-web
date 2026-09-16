import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function TeamFeedLoading() {
  return <PageSkeleton shape="list" rows={7} className="max-w-2xl" />;
}
