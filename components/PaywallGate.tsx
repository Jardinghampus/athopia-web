/**
 * PaywallGate — enkel replace-gate (visa children ELLER UpgradePrompt).
 * För FOMO med blur: använd `BlurPaywall` (skickar aldrig full PRO-text till free-DOM).
 */
import type { Plan, AccessFeature } from "@/lib/access-rules";
import { canAccess } from "@/lib/access-rules";
import { UpgradePrompt } from "./UpgradePrompt";

interface PaywallGateProps {
  feature: AccessFeature;
  plan: Plan;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Lag-kontext för UpgradePrompt-copy ("Missa inget om {lag}"). */
  teamName?: string;
}

export function PaywallGate({ feature, plan, children, fallback, teamName }: PaywallGateProps) {
  if (canAccess(feature, plan)) return <>{children}</>;
  return <>{fallback ?? <UpgradePrompt feature={feature} teamName={teamName} />}</>;
}
