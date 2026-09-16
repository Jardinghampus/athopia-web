import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function KronikaLoading() {
  return <PageSkeleton shape="article" rows={10} className="max-w-2xl" />;
}
