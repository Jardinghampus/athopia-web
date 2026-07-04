/**
 * Klubbfärger per entities.slug (audit T6) — porterade från studio/src/teamIdentity.ts.
 * Används som `--team-accent`/`--team-accent-fg` på lag-hub och matchytor.
 * Lag utan post faller tillbaka på pitch-grönt.
 */
export type TeamColors = { primary: string; secondary: string; text: string };

const TEAM_COLORS: Record<string, TeamColors> = {
  aik: { primary: "#111111", secondary: "#D6B25E", text: "#FFFFFF" },
  djurgarden: { primary: "#1E4C9A", secondary: "#F3C542", text: "#FFFFFF" },
  hammarby: { primary: "#0B7A3B", secondary: "#FFFFFF", text: "#FFFFFF" },
  "malmo-ff": { primary: "#6DB7E8", secondary: "#FFFFFF", text: "#07111F" },
  "ifk-goteborg": { primary: "#1D5FA7", secondary: "#FFFFFF", text: "#FFFFFF" },
  "if-elfsborg": { primary: "#F4D21F", secondary: "#111111", text: "#111111" },
  "bk-hacken": { primary: "#F5D000", secondary: "#111111", text: "#111111" },
  sirius: { primary: "#003D8F", secondary: "#111111", text: "#FFFFFF" },
  halmstad: { primary: "#0056A4", secondary: "#FFFFFF", text: "#FFFFFF" },
  brommapojkarna: { primary: "#D71920", secondary: "#111111", text: "#FFFFFF" },
  mjallby: { primary: "#F4D21F", secondary: "#111111", text: "#111111" },
  degerfors: { primary: "#D71920", secondary: "#FFFFFF", text: "#FFFFFF" },
  gais: { primary: "#0B7A3B", secondary: "#111111", text: "#FFFFFF" },
  "kalmar-ff": { primary: "#D71920", secondary: "#FFFFFF", text: "#FFFFFF" },
};

const FALLBACK: TeamColors = { primary: "#1D9E75", secondary: "#FFFFFF", text: "#FFFFFF" };

export function getTeamColors(slug: string | null | undefined): TeamColors {
  return (slug && TEAM_COLORS[slug]) || FALLBACK;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return (((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255;
}

/** Accentfärg läsbar mot mörk bakgrund — den ljusare av primary/secondary (AIK:s #111 är osynlig på zinc-950). */
export function getTeamAccent(slug: string | null | undefined): string {
  const c = getTeamColors(slug);
  const pick = luminance(c.primary) >= 0.25 ? c.primary : c.secondary;
  return luminance(pick) >= 0.25 ? pick : FALLBACK.primary;
}
