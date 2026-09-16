import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function SkrivLoading() {
  return <PageSkeleton shape="list" rows={5} className="max-w-3xl" />;
}
