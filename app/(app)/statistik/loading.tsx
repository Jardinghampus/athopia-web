import { TableSkeleton } from "@/components/team-hub/TableSkeleton";

export default function StatistikLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6" aria-hidden>
      <TableSkeleton rows={16} cols={8} />
    </div>
  );
}
