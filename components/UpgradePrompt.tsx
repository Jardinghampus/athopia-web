import Link from "next/link";
import type { AccessFeature } from "@/lib/access-rules";
import { ProductEventTracker } from "@/components/analytics/ProductEventTracker";

const FEATURE_LABELS: Record<AccessFeature, string> = {
  basicFilter:        "grundfilter",
  advancedFilter:     "avancerade filter",
  aiSummaries:        "AI-sammanfattningar",
  smartRanking:       "smart ranking",
  crossSourceCluster: "cross-source clustering",
  eliteBrief:         "daglig AI-brief för ditt lag",
  pushAlerts:         "push-notiser",
  unlimitedFeed:      "obegränsat flöde",
  aiChat:             "AI-chat",
  podcastClips:       "podcastkuratering",
  briefAudio:         "lyssna på brief",
};

export function UpgradePrompt({
  feature,
  teamName,
}: {
  feature: AccessFeature;
  /** Lag-kontext gör CTA:n personlig: "Missa inget om AIK" istället för generisk copy. */
  teamName?: string;
}) {
  const label = FEATURE_LABELS[feature] ?? feature;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-6 text-center">
      <ProductEventTracker
        event="paywall_view"
        props={{ feature }}
        once={`paywall_view::${feature}`}
        onceScope="session"
      />
      {teamName && (
        <p className="text-sm font-semibold text-white mb-1">Missa inget om {teamName}</p>
      )}
      <p className="text-sm text-zinc-400">
        <span className="font-medium text-white">{label}</span> kräver PRO eller ELITE.
      </p>
      <Link
        href="/prenumerera"
        className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
      >
        Uppgradera
      </Link>
    </div>
  );
}
