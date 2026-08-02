/**
 * Ansvarig utgivare för AI-transparenssidan.
 *
 * Bakgrund: sidan renderade literalen `[namn ska fastställas]` i produktion.
 * Att publikt skylta med en ifylld TODO är sämre än båda alternativen — det
 * annonserar bristande efterlevnad för varje besökare, och EU AI Act-deadlinen
 * var 2026-08-02.
 *
 * Varför inget namn är hårdkodat här: att utse en fysisk person till ansvarig
 * utgivare är en juridisk utpekning som skapar personligt ansvar. Det är
 * grundarens signatur att ge, inte en kodändring att gissa sig till.
 *
 * Lösningen: namnet läses ur env. Är den satt visas personen. Är den inte satt
 * visas verksamheten som redaktoriellt ansvarig — vilket är sant utan att göra
 * ett påstående om en namngiven person eller ett juridiskt bolagsnamn som inte
 * går att verifiera härifrån.
 *
 * Sätt `NEXT_PUBLIC_ANSVARIG_UTGIVARE="Förnamn Efternamn"` i Vercel för att
 * namnge personen. Ingen deploy av kod krävs — bara env.
 */

/** Verksamheten som bär det redaktionella ansvaret när ingen person är utsedd. */
export const EDITORIAL_FALLBACK = 'Athopia';

export type EditorialResponsibility = {
  /** Texten som ska renderas efter "Ansvarig utgivare:". */
  label: string;
  /** True när en namngiven fysisk person är utsedd via env. */
  isNamedPerson: boolean;
};

export function resolveEditorialResponsibility(
  env: string | undefined = process.env.NEXT_PUBLIC_ANSVARIG_UTGIVARE,
): EditorialResponsibility {
  const name = env?.trim();

  // Tomt, blankt eller en kvarglömd platshållare räknas som "inte utsedd".
  // Hakparenteser fångar `[namn ska fastställas]`, `[TBD]`, `[fyll i]` osv.
  if (!name || /^\[.*\]$/.test(name) || /^(tbd|todo)$/i.test(name)) {
    return { label: EDITORIAL_FALLBACK, isNamedPerson: false };
  }

  return { label: name, isNamedPerson: true };
}
