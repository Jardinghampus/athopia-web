/**
 * Visningsvakt mot gamla LIVE-flaggor.
 *
 * `fixtures.status` skrivs av sync i athopia-os. När en sync tystnar fryser
 * raden i sitt sista tillstånd — 2026-08-02 stod två matcher kvar som LIVE i
 * 127 timmar och sajten visade en pulserande LIVE-badge i fem dygn. Ingen
 * rimlig match pågår längre än ett par timmar efter avspark, så vi litar på
 * klockan i stället för på statusfältet.
 *
 * Alla display-vägar ska fråga härifrån i stället för att jämföra strängen.
 */

/** 90 min + paus + tillägg + generöst påslag för sena avsparkar. */
const MAX_LIVE_HOURS = 4;

export function isLiveStatus(status: string | null | undefined): boolean {
  return status === "LIVE" || status === "inprogress";
}

/** Sant bara om avsparken är känd OCH ligger inom det trovärdiga fönstret. */
export function isCredibleLiveWindow(
  kickoff: string | null | undefined,
  now: number = Date.now()
): boolean {
  if (!kickoff) return false;
  const ms = new Date(kickoff).getTime();
  if (Number.isNaN(ms)) return false;
  // Avspark i framtiden = matchen kan inte pågå än.
  if (ms > now) return false;
  return now - ms <= MAX_LIVE_HOURS * 60 * 60 * 1000;
}

/**
 * Enda sanningen för "visa den här matchen som pågående".
 * ponytail: tidsfönster, inte en färskhetsstämpel på raden. Om os börjar skriva
 * `fixtures.updated_at` vid varje live-tick är den signalen exaktare — byt då hit.
 */
export function isLiveNow(
  status: string | null | undefined,
  kickoff: string | null | undefined,
  now: number = Date.now()
): boolean {
  return isLiveStatus(status) && isCredibleLiveWindow(kickoff, now);
}

/**
 * Statussträng att visa när LIVE inte längre är trovärdig. Vi hittar inte på ett
 * resultat: finns båda målen är matchen spelad, annars faller vi tillbaka på
 * "ej startad" hellre än att påstå att den pågår.
 */
export function displayStatus(
  status: string | null | undefined,
  kickoff: string | null | undefined,
  hasScores: boolean,
  now: number = Date.now()
): string {
  if (!isLiveStatus(status)) return status ?? "NS";
  if (isCredibleLiveWindow(kickoff, now)) return "LIVE";
  return hasScores ? "FT" : "NS";
}
