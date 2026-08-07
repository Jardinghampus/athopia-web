/**
 * Kanoniska klubbförkortningar, nycklade på `entities.slug`.
 *
 * Lagvalet genererade tidigare initialer ur ordens första bokstäver, vilket gav
 * "DI" för BÅDE Degerfors IF och Djurgårdens IF, "A" för AIK och "IG" för IFK
 * Göteborg. Ingen svensk supporter känner igen sitt lag på det. Det här är vad
 * klubbarna faktiskt kallas.
 */
const ABBR: Record<string, string> = {
  aik: "AIK",
  "bk-hacken": "BKH",
  degerfors: "DIF",
  djurgarden: "DIF",
  gais: "GAIS",
  halmstad: "HBK",
  hammarby: "BAJEN",
  brommapojkarna: "BP",
  "if-elfsborg": "IFE",
  "ifk-goteborg": "IFK",
  "ifk-norrkoping": "IFKN",
  sirius: "SIRIUS",
  "kalmar-ff": "KFF",
  "malmo-ff": "MFF",
  mjallby: "MAIF",
  varnamo: "IFKV",
};

/**
 * Degerfors IF och Djurgårdens IF förkortas båda "DIF" i vardagligt tal. I en
 * lista där båda finns måste de gå att skilja åt, så Degerfors får sin
 * ortsförkortning i stället.
 */
const ABBR_DISAMBIGUATED: Record<string, string> = {
  ...ABBR,
  degerfors: "DEG",
};

export function teamAbbr(slug: string | null | undefined, name?: string | null): string {
  if (slug && ABBR_DISAMBIGUATED[slug]) return ABBR_DISAMBIGUATED[slug];
  // Okänd klubb (t.ex. nykomling innan kartan uppdaterats): fall tillbaka på
  // namnets bärande ord, inte på varje ords initial.
  const words = (name ?? slug ?? "").split(" ").filter(Boolean);
  if (words.length === 0) return "?";
  const core =
    words.length > 1 && ["IFK", "IF", "BK", "FF", "IK"].includes(words[0]!.toUpperCase())
      ? words[1]!
      : words[0]!;
  return core.slice(0, 4).toUpperCase();
}
