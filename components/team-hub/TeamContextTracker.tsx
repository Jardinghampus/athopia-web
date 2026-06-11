"use client";

import { useEffect } from "react";
import { setStoredTeam } from "@/lib/team-hub/teamContext";

/**
 * Registrerar besökt lag som "currentTeam" i localStorage.
 * Renderas i lag-layouten → persistens av team-context över navigering.
 */
export function TeamContextTracker({ slug, name, logo_url }: { slug: string; name: string; logo_url?: string | null }) {
  useEffect(() => {
    if (slug && name) setStoredTeam({ slug, name, logo_url });
  }, [slug, name, logo_url]);
  return null;
}
