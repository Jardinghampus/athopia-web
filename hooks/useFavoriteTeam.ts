"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

const LS_KEY = "athopia_favorite_team";
const LS_ONBOARDING_KEY = "athopia_onboarding_done";

export interface FavoriteTeamState {
  slug: string | null;
  isLoaded: boolean;
  /** teamId (entities.id, uuid) synkar user_feed_config.followed_team_ids server-side. */
  setFavoriteTeam: (slug: string, teamId?: string) => Promise<void>;
  clearFavoriteTeam: () => Promise<void>;
  needsOnboarding: boolean;
  markOnboardingDone: () => void;
}

/**
 * Enda skrivvägen till server-personalisering. Utan detta anrop desyncar
 * /api/feed (som filtrerar på followed_team_ids) från vad Clerk-metadata/
 * localStorage visar i UI — historiskt bugg: TeamSelectionModal bytte bara
 * Clerk-slug, aldrig DB-arrayen.
 */
async function syncFollowedTeam(teamId: string): Promise<void> {
  try {
    await fetch("/api/feed/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followed_team_ids: [teamId] }),
    });
  } catch {
    // Icke-kritiskt för UI — feed hämtar in vid nästa lyckade sync
  }
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

  const setFavoriteTeam = useCallback(async (newSlug: string, teamId?: string) => {
    setSlug(newSlug);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_KEY, newSlug);
      window.localStorage.setItem(LS_ONBOARDING_KEY, "1");
    }
    setNeedsOnboarding(false);
    // Ingen Clerk-session i lokalt läge → /api/feed/config kräver auth, hoppa över.
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
    async (newSlug: string, teamId?: string) => {
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
              onboardingDone: true,
            },
          });
        } catch {
          // Clerk-fel är icke-kritiskt — localStorage räcker
        }
        if (teamId) await syncFollowedTeam(teamId);
        // Spegla till profiles.favourite_team_id — enda källan den publika
        // profilsidan (och /api/profile/[id]) kan läsa utan Clerk-backend-anrop.
        try {
          await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ favourite_team_id: newSlug }),
          });
        } catch {
          // Icke-kritiskt — Clerk-metadata är fortfarande sanning för egna vyer
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
    // Persistera server-side så onboarding-gaten (mitt-lag/onboarding) ser
    // "klar utan lag" på alla enheter — localStorage är enhetsbunden.
    if (user) {
      void user
        .update({
          unsafeMetadata: {
            ...((user.unsafeMetadata as Record<string, unknown>) ?? {}),
            onboardingDone: true,
          },
        })
        .catch(() => {});
    }
  }, [user]);

  return { slug, isLoaded, setFavoriteTeam, clearFavoriteTeam, needsOnboarding, markOnboardingDone };
}

export const useFavoriteTeam = clerkEnabled ? useClerkFavoriteTeam : useLocalFavoriteTeam;
