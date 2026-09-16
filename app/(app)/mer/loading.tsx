import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function MerLoading() {
  return <PageSkeleton shape="list" rows={9} className="max-w-2xl" />;
}
