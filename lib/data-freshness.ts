/**
 * data-freshness.ts — säg hur gammal datan är, i stället för att låtsas.
 *
 * Bakgrund, mätt 2026-09-22: tabellen på athopia-web.vercel.app visade Sirius
 * med 14 spelade matcher och 38 poäng. Serien hade då spelat 22 omgångar.
 * `team_season_stats` beräknas varje natt och `computed_at` var samma dygn — men
 * den räknar ur `fixtures`, vars senaste spelade match är 2 augusti. Färsk
 * beräkning av 51 dygn gammal verklighet.
 *
 * Orsaken går inte att koda bort: Allsvenskan ingår inte i Sportmonks-planen
 * (se athopia-os/CLAUDE.md §5). Men att presentera gammal data som aktuell är
 * ett eget fel ovanpå det, och det är det här som rättar.
 *
 * Doktrinen säger "dölj hellre fältet än visa placeholder-nollor". En tabell är
 * inte en nolla: den är korrekt för sin tidpunkt. Därför märks den med datumet
 * i stället för att döljas — läsaren ska kunna lita på det som står.
 */

/** Tabellen ska följa omgångarna; två dygn utan ny match är normalt i uppehåll. */
export const STANDINGS_STALE_AFTER_DAYS = 3;

export interface Freshness {
  /** Sista verklighet datan täcker (senaste spelade match), ISO. */
  coveredThrough: string | null;
  /** Dygn sedan dess, avrundat nedåt. null när datum saknas. */
  ageDays: number | null;
  /** Äldre än tröskeln — då måste ytan säga det. */
  stale: boolean;
}

export function freshnessOf(
  coveredThrough: string | null | undefined,
  staleAfterDays = STANDINGS_STALE_AFTER_DAYS,
  now: Date = new Date(),
): Freshness {
  if (!coveredThrough) {
    // Vet vi inte vad datan täcker ska den behandlas som opålitlig, inte färsk.
    return { coveredThrough: null, ageDays: null, stale: true };
  }
  const then = new Date(coveredThrough);
  if (Number.isNaN(then.getTime())) {
    return { coveredThrough: null, ageDays: null, stale: true };
  }
  const ageDays = Math.floor((now.getTime() - then.getTime()) / 86_400_000);
  return { coveredThrough, ageDays, stale: ageDays >= staleAfterDays };
}

/** Svensk tid, alltid explicit — servern kör UTC och läsaren kan sitta var som helst. */
export function formatCoveredThrough(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", {
    timeZone: "Europe/Stockholm",
    day: "numeric",
    month: "long",
  });
}

/** Texten läsaren möter. Ärlig, kort, utan ursäkter. */
export function stalenessNotice(f: Freshness): string | null {
  if (!f.stale) return null;
  if (!f.coveredThrough) {
    return "Vi kan inte bekräfta hur aktuell den här tabellen är just nu.";
  }
  return `Tabellen är uppdaterad till och med ${formatCoveredThrough(f.coveredThrough)} och speglar inte senare omgångar.`;
}
