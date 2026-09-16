import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function ColumnEditorLoading() {
  return <PageSkeleton shape="form" rows={3} className="max-w-3xl" />;
}
