import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function EliteChatLoading() {
  return <PageSkeleton shape="list" rows={4} className="max-w-2xl" />;
}
