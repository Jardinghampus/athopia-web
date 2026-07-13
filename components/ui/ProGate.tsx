/**
 * @deprecated Legacy gate — used subscriptionTier and leaked children via CSS blur.
 * Prefer PaywallGate / BlurPaywall + getUserPlan() / canAccess().
 * Rewritten to match the authoritative plan model so accidental imports stay safe.
 */
import type { ReactNode } from "react";
import { getUserPlan } from "@/lib/user-plan";
import { BlurPaywall } from "@/components/BlurPaywall";

export default async function ProGate({
  children,
  feature = "den här funktionen",
}: {
  children: ReactNode;
  feature?: string;
}) {
  const plan = await getUserPlan();
  const tease = typeof feature === "string" ? `Lås upp ${feature} med PRO.` : undefined;

  return (
    <BlurPaywall
      feature="aiSummaries"
      plan={plan}
      tease={tease}
      preview={<div className="h-24 rounded-xl bg-muted/40" />}
    >
      {children}
    </BlurPaywall>
  );
}
