/**
 * Formbokstäver — en källa för hela produkten.
 *
 * Datat kommer engelskt från Sportmonks (W/D/L). Tre ytor visade det råa
 * värdet i en svensk produkt: `/statistik`-tabellen, laghubbens header och
 * lagvalet — medan `/allsvenskan/tabell` och Mitt lag redan översatte med en
 * egen inline-ternär. Fyra kopior av samma mappning, två av dem oöversatta.
 *
 * V = vinst, O = oavgjort, F = förlust.
 */
export type FormResult = "W" | "D" | "L";

const LETTER: Record<FormResult, string> = { W: "V", D: "O", L: "F" };
const LABEL: Record<FormResult, string> = {
  W: "Vinst",
  D: "Oavgjort",
  L: "Förlust",
};

/** Svensk bokstav för ett resultat. Okänt värde returneras oförändrat. */
export function formLetter(result: string): string {
  return LETTER[result as FormResult] ?? result;
}

/** Utskrivet resultat för skärmläsare och `title` — färgen får inte bära ensam. */
export function formLabel(result: string): string {
  return LABEL[result as FormResult] ?? result;
}
