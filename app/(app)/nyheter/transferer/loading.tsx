import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function TransfererLoading() {
  return <PageSkeleton shape="list" rows={8} className="max-w-2xl" />;
}
