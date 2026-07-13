"use client";

import { useUser as useClerkUser } from "@clerk/nextjs";
import type { Plan } from "@/lib/access-rules";

/** Client helper — plan from publicMetadata.plan (same as getUserPlan server-side). */
export function useUser() {
  const { user, isLoaded, isSignedIn } = useClerkUser();
  const plan = ((user?.publicMetadata as { plan?: Plan } | undefined)?.plan ?? "free") as Plan;
  const isPro = plan === "pro" || plan === "elite";
  const isElite = plan === "elite";
  return { user, isLoaded, isSignedIn, plan, isPro, isElite };
}
