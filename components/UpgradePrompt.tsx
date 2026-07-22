import { requiredPlanFor, type AccessFeature } from "@/lib/access-rules";
import { ProductEventTracker } from "@/components/analytics/ProductEventTracker";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { FOUNDER_OFFER, TRIAL_DAYS, proPriceLabel, listMonthlyKr } from "@/lib/pricing";

const FEATURE_LABELS: Record<AccessFeature, string> = {
  basicFilter:        "grundfilter",
  advancedFilter:     "avancerade filter",
  aiSummaries:        "AI-sammanfattningar",
  smartRanking:       "smart ranking",
  crossSourceCluster: "cross-source clustering",
  eliteBrief:         "daglig AI-brief för ditt lag",
  pushAlerts:         "push-notiser",
  unlimitedFeed:      "obegränsat flöde",
  aiChat:             "matchchatten",
  globalAiChat:       "Athopia AI",
  podcastClips:       "podcastkuratering",
  briefAudio:         "lyssna på brief",
  forumSummary:       "forum-läget senaste timmarna",
  transferSignals:    "ryktesradar (Rykte/Bekräftad)",
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
  const requiredPlan = requiredPlanFor(feature);
  const price = proPriceLabel();
  const founder = FOUNDER_OFFER.active;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-6 text-center">
      <ProductEventTracker
        event="paywall_view"
        props={{ feature, surface: "upgrade_prompt" }}
        once={`paywall_view::${feature}`}
        onceScope="session"
      />
      {teamName && (
        <p className="text-sm font-semibold text-white mb-1">Missa inget om {teamName}</p>
      )}
      <p className="text-sm text-zinc-400">
        <span className="font-medium text-white">{label}</span> — så du är först utan att scrolla.
        Kräver {requiredPlan === "elite" ? "Elite" : "PRO eller Elite"}.
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        {founder
          ? `Founder ${price} för alltid (ordinarie ${listMonthlyKr("pro")} kr) · ${TRIAL_DAYS} dagar gratis`
          : `${price} · ${TRIAL_DAYS} dagar gratis`}
      </p>
      <TrackedLink
        href="/prenumerera"
        event="paywall_cta_click"
        props={{ feature, surface: "upgrade_prompt", required_plan: requiredPlan }}
        className="mt-3 inline-block rounded-lg bg-pitch px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        {founder ? `Bli founder — ${price}` : `Prova ${TRIAL_DAYS} dagar`}
      </TrackedLink>
    </div>
  );
}
