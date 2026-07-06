import type { FeedItem } from "@/lib/types";

const TIER_LABEL: Record<string, string> = {
  breaking: "Breaking",
  major: "Stort",
};

export function FeedSourceBadge({
  sourceCount,
  importanceTier,
  showCluster,
}: {
  sourceCount?: number | null;
  importanceTier?: FeedItem["importanceTier"];
  showCluster?: boolean;
}) {
  const count = sourceCount ?? 0;
  const tier = importanceTier && TIER_LABEL[importanceTier] ? importanceTier : null;

  if (count <= 1 && !tier) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tier && (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            tier === "breaking"
              ? "bg-red-500/15 text-red-400"
              : "bg-orange-500/15 text-orange-400"
          }`}
        >
          {TIER_LABEL[tier]}
        </span>
      )}
      {count > 1 && (
        <span
          className="rounded-full bg-pitch/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pitch"
          title="Flera oberoende källor rapporterar samma story"
        >
          {count} källor
        </span>
      )}
      {showCluster && count > 2 && (
        <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
          Kluster
        </span>
      )}
    </div>
  );
}
