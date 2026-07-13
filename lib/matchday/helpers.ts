import type { FixtureRow } from "@/lib/team-hub/queries";

const STOCKHOLM_DATE = new Intl.DateTimeFormat("sv-SE", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Europe/Stockholm",
});

export function isKickoffToday(kickoffAt: string | null | undefined): boolean {
  if (!kickoffAt) return false;
  return STOCKHOLM_DATE.format(new Date(kickoffAt)) === STOCKHOLM_DATE.format(new Date());
}

export function formatKickoff(kickoffAt: string | null): string {
  if (!kickoffAt) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
  }).format(new Date(kickoffAt));
}

export function pickTodaysMatch(recent: FixtureRow[], upcoming: FixtureRow[]): FixtureRow | null {
  const today = [...upcoming, ...recent].filter(
    (f) => isKickoffToday(f.kickoff_at) || f.status === "LIVE"
  );
  if (today.length === 0) return null;
  return today.find((f) => f.status === "LIVE") ?? today.find((f) => f.status === "NS") ?? today[0] ?? null;
}
