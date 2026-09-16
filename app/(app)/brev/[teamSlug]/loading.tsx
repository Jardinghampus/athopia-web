import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function BrevLoading() {
  return <PageSkeleton shape="article" rows={8} className="max-w-2xl" />;
}
