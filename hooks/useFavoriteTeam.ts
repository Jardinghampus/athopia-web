"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

const LS_KEY = "athopia_favorite_team";
const LS_ONBOARDING_KEY = "athopia_onboarding_done";

export interface FavoriteTeamState {
  slug: string | null;
  isLoaded: boolean;
  setFavoriteTeam: (slug: string) => Promise<void>;
  clearFavoriteTeam: () => Promise<void>;
  needsOnboarding: boolean;
  markOnboardingDone: () => void;
}

const clerkEnabled =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.match(/^pk_(test|live)_[A-Za-z0-9+/=]+$/);

function useLocalFavoriteTeam(): FavoriteTeamState {
  const [slug, setSlug] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(LS_KEY);
      const done = window.localStorage.getItem(LS_ONBOARDING_KEY);
      if (stored) setSlug(stored);
      setNeedsOnboarding(!done && !stored);
    }
    setIsLoaded(true);
  }, []);

  const setFavoriteTeam = useCallback(async (newSlug: string) => {
    setSlug(newSlug);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_KEY, newSlug);
      window.localStorage.setItem(LS_ONBOARDING_KEY, "1");
    }
    setNeedsOnboarding(false);
  }, []);

  const clearFavoriteTeam = useCallback(async () => {
    setSlug(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LS_KEY);
    }
  }, []);

  const markOnboardingDone = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_ONBOARDING_KEY, "1");
    }
    setNeedsOnboarding(false);
  }, []);

  return { slug, isLoaded, setFavoriteTeam, clearFavoriteTeam, needsOnboarding, markOnboardingDone };
}

function useClerkFavoriteTeam(): FavoriteTeamState {
  const { user, isLoaded: clerkLoaded } = useUser();
  const [slug, setSlug] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Initialisera från Clerk metadata (inloggad) eller localStorage (gäst)
  useEffect(() => {
    if (!clerkLoaded) return;

    if (user) {
      const meta = user.unsafeMetadata as Record<string, unknown> | undefined;
      const clerkSlug = meta?.["favoriteTeam"] as string | undefined;
      if (clerkSlug) {
        setSlug(clerkSlug);
        setIsLoaded(true);
        return;
      }
    }

    // Fallback: localStorage
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(LS_KEY);
      if (stored) setSlug(stored);

      // Kolla om onboarding behövs
      const done = window.localStorage.getItem(LS_ONBOARDING_KEY);
      if (!done && !stored) {
        setNeedsOnboarding(true);
      }
    }
    setIsLoaded(true);
  }, [clerkLoaded, user]);

  const setFavoriteTeam = useCallback(
    async (newSlug: string) => {
      setSlug(newSlug);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(LS_KEY, newSlug);
        window.localStorage.setItem(LS_ONBOARDING_KEY, "1");
      }
      setNeedsOnboarding(false);

      // Spara i Clerk metadata om inloggad
      if (user) {
        try {
          await user.update({
            unsafeMetadata: {
              ...((user.unsafeMetadata as Record<string, unknown>) ?? {}),
              favoriteTeam: newSlug,
            },
          });
        } catch {
          // Clerk-fel är icke-kritiskt — localStorage räcker
        }
      }
    },
    [user],
  );

  const clearFavoriteTeam = useCallback(async () => {
    setSlug(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LS_KEY);
    }
    if (user) {
      try {
        const meta = { ...((user.unsafeMetadata as Record<string, unknown>) ?? {}) };
        delete meta["favoriteTeam"];
        await user.update({ unsafeMetadata: meta });
      } catch {
        // ignore
      }
    }
  }, [user]);

  const markOnboardingDone = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_ONBOARDING_KEY, "1");
    }
    setNeedsOnboarding(false);
  }, []);

  return { slug, isLoaded, setFavoriteTeam, clearFavoriteTeam, needsOnboarding, markOnboardingDone };
}

export const useFavoriteTeam = clerkEnabled ? useClerkFavoriteTeam : useLocalFavoriteTeam;
