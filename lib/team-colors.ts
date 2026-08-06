/**
 * Klubbfärger per entities.slug (audit T6) — porterade från studio/src/teamIdentity.ts.
 * Används som `--team-accent`/`--team-accent-fg` på lag-hub och matchytor.
 * Lag utan post faller tillbaka på pitch-grönt.
 */
export type TeamColors = {
  primary: string;
  secondary: string;
  text: string;
  /** Valfria extra gradient-stopp, i ordning — override av det annars 2-stopps primary→secondary. */
  gradientStops?: string[];
};

const TEAM_COLORS: Record<string, TeamColors> = {
  aik: { primary: "#111111", secondary: "#F5C518", text: "#FFFFFF" }, // svart och gul
  djurgarden: { primary: "#0B2A6B", secondary: "#5FA8E0", text: "#FFFFFF" }, // mörkblå/ljusblå
  hammarby: { primary: "#0B7A3B", secondary: "#4ED17A", text: "#FFFFFF" }, // mörkgrön/ljusgrön
  "malmo-ff": { primary: "#6DB7E8", secondary: "#FFFFFF", text: "#07111F" }, // himmelsblå
  "ifk-goteborg": { primary: "#1D5FA7", secondary: "#FFFFFF", text: "#FFFFFF" }, // blå/vitt
  "if-elfsborg": { primary: "#F4D21F", secondary: "#111111", text: "#111111" },
  "bk-hacken": { primary: "#F5D000", secondary: "#111111", text: "#111111" }, // gul-svart
  sirius: { primary: "#111111", secondary: "#003D8F", text: "#FFFFFF" }, // svart-mörkblå
  halmstad: { primary: "#0056A4", secondary: "#FFFFFF", text: "#FFFFFF" },
  brommapojkarna: { primary: "#D71920", secondary: "#111111", text: "#FFFFFF" },
  mjallby: { primary: "#F4D21F", secondary: "#111111", text: "#111111" },
  degerfors: { primary: "#D71920", secondary: "#FFFFFF", text: "#FFFFFF" },
  gais: { primary: "#0B7A3B", secondary: "#111111", text: "#FFFFFF" },
  "kalmar-ff": { primary: "#D71920", secondary: "#FFFFFF", text: "#FFFFFF" },
  "vasteras-sk": { primary: "#0C7B45", secondary: "#FFFFFF", text: "#FFFFFF" },
  orgryte: { primary: "#C8102E", secondary: "#123B7A", text: "#FFFFFF" },
};

/** Kortnamn per slug — för "Nickname (DIF)"-visning i forum m.m. */
const TEAM_SHORT: Record<string, string> = {
  aik: "AIK",
  djurgarden: "DIF",
  hammarby: "HIF",
  "malmo-ff": "MFF",
  "ifk-goteborg": "IFK",
  "if-elfsborg": "IFE",
  "bk-hacken": "BKH",
  sirius: "SIR",
  halmstad: "HBK",
  brommapojkarna: "BP",
  mjallby: "MAIF",
  degerfors: "DEG", // "DIF" är taget av Djurgården
  gais: "GAIS",
  "kalmar-ff": "KFF",
  "vasteras-sk": "VSK",
  orgryte: "ÖIS",
};

export function getTeamShort(slug: string | null | undefined): string | null {
  return (slug && TEAM_SHORT[slug]) ?? null;
}

const FALLBACK: TeamColors = { primary: "#2D5349", secondary: "#FFFFFF", text: "#FFFFFF" };

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

// ─── Klubbfärg som TEXT ───────────────────────────────────────────────────────
// getTeamAccent duger som yta men inte som textfärg: tröskeln 0.25 är
// perceptuell, inte WCAG. Hammarbys #0B7A3B passerar den och landar på 3.19:1
// mot svart, och fallbacken #2D5349 på 2.45:1. Ingen enskild valör klarar 4.5:1
// mot BÅDA temabakgrunderna (kraven motsäger varandra), därför ett par.

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hex = (c: number[]) =>
  "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

/** WCAG relativ luminans — inte att förväxla med luminance() ovan. */
function relLuminance(c: number[]): number {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: number[], b: number[]): number {
  const [l1, l2] = [relLuminance(a), relLuminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Blandar `color` mot `toward` i 5%-steg tills 4.5:1 mot `bg` uppnås. */
function readableOn(color: string, bg: string, toward: number[]): string {
  const src = rgb(color);
  const dst = rgb(bg);
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const mixed = src.map((v, i) => v * (1 - t) + toward[i] * t);
    if (contrast(mixed, dst) >= 4.5) return hex(mixed);
  }
  return hex(toward);
}

/* Referenserna är den svåraste ytan i varje tema, inte den vanligaste: mörkt
   bläck har lägst kontrast mot den MÖRKASTE ljusa ytan (--muted #F3F2F0), ljust
   bläck mot den LJUSASTE mörka (--card #1B1B1C). Klarar de dem klarar de resten. */
const PAPER = "#F3F2F0";
const DARK_SURFACE = "#1B1B1C";

/**
 * Klubbfärg avsedd som textfärg, en valör per tema. Sätt som CSS-variabler och
 * använd `.team-ink` (definierad i globals.css) så växlar den med `.dark`.
 */
export function getTeamInk(slug: string | null | undefined): { light: string; dark: string } {
  const accent = getTeamAccent(slug);
  return {
    light: readableOn(accent, PAPER, [0, 0, 0]),
    dark: readableOn(accent, DARK_SURFACE, [255, 255, 255]),
  };
}
