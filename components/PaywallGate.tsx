import type { Plan, AccessFeature } from "@/lib/access";
import { canAccess } from "@/lib/access";
import { UpgradePrompt } from "./UpgradePrompt";

interface PaywallGateProps {
  feature: AccessFeature;
  plan: Plan;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PaywallGate({ feature, plan, children, fallback }: PaywallGateProps) {
  if (canAccess(feature, plan)) return <>{children}</>;
  return <>{fallback ?? <UpgradePrompt feature={feature} />}</>;
}
