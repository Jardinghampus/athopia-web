import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function AnalysDetailLoading() {
  return <PageSkeleton shape="article" rows={8} className="max-w-2xl" />;
}
