import { TableSkeleton } from "@/components/team-hub/TableSkeleton";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <TableSkeleton rows={14} cols={6} />
    </div>
  );
}
