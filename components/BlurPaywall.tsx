import type { AccessFeature, Plan } from "@/lib/access-rules";
import { canAccess } from "@/lib/access-rules";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { cn } from "@/lib/utils";

type BlurPaywallProps = {
  feature: AccessFeature;
  plan: Plan;
  teamName?: string;
  /** Full content — rendered ONLY when unlocked (aldrig i DOM för free). */
  children: React.ReactNode;
  /**
   * Teaser som får visas (blur + CTA) för locked users.
   * Skicka ALDRIG hemlig fulltext här — bara titel/första mening.
   */
  preview: React.ReactNode;
  className?: string;
  /** Max höjd på blur-preview */
  maxHeight?: string;
  /** Extra copy ovanför CTA */
  tease?: string;
};

/**
 * Säker paywall: unlocked → children.
 * Locked → endast `preview` i DOM (blur) + upgrade CTA.
 * Full PRO-innehåll läcker aldrig till free-klienten.
 */
export function BlurPaywall({
  feature,
  plan,
  teamName,
  children,
  preview,
  className,
  maxHeight = "9rem",
  tease,
}: BlurPaywallProps) {
  if (canAccess(feature, plan)) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
    >
      <div
        className="pointer-events-none select-none overflow-hidden px-4 pt-4 opacity-60 blur-[3px]"
        style={{ maxHeight }}
        aria-hidden
      >
        {preview}
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/20 via-background/70 to-background"
        aria-hidden
      />

      <div className="relative z-10 space-y-3 p-4 pt-2">
        {tease && (
          <p className="text-center text-xs text-muted-foreground">{tease}</p>
        )}
        <UpgradePrompt feature={feature} teamName={teamName} />
      </div>
    </div>
  );
}
