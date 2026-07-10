"use client";

import { useEffect } from "react";
import { useFavoriteTeam } from "@/hooks/useFavoriteTeam";

/**
 * Monteras i statistik-sidan och highlightar lagvald rad i tabellen.
 * Använder DOM query (matchning på lag-namn) eftersom tabellen är server-renderad.
 */
export function FavoriteTeamHighlight() {
  const { slug, isLoaded } = useFavoriteTeam();

  useEffect(() => {
    if (!isLoaded || !slug) return;

    // Normalisera slug → namn-fragment för jämförelse
    const slugWords = slug.replace(/-/g, " ").toLowerCase().split(" ");

    const rows = document.querySelectorAll<HTMLTableRowElement>("tbody tr[data-team-slug]");
    rows.forEach((row) => {
      const rowSlug = row.dataset["teamSlug"] ?? "";
      const match = rowSlug === slug || slugWords.some((w) => rowSlug.includes(w));

      if (match) {
        row.style.setProperty("background-color", "rgba(214,31,31,0.08)");
        row.style.setProperty("box-shadow", `inset 2px 0 0 var(--color-pitch)`);
        // Scrolla till raden om den inte är synlig
        row.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }, [slug, isLoaded]);

  return null;
}
