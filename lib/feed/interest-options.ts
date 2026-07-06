/** Delad lista — onboarding + inställningar. */
export const INTEREST_OPTIONS = [
  { id: "transfer", label: "Transfers" },
  { id: "analysis", label: "Taktik & analys" },
  { id: "match", label: "Matchrapport" },
  { id: "statistics", label: "Statistik & tabell" },
  { id: "injury", label: "Skador" },
  { id: "table", label: "Tabeller" },
] as const;

export type InterestId = (typeof INTEREST_OPTIONS)[number]["id"];
