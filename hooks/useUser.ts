"use client";

import { useUser as useClerkUser } from "@clerk/nextjs";

export function useUser() {
  const { user, isLoaded, isSignedIn } = useClerkUser();
  const tier = (user?.publicMetadata as { subscriptionTier?: string } | undefined)?.subscriptionTier;
  const isPro = tier === "pro";
  return { user, isLoaded, isSignedIn, isPro };
}

