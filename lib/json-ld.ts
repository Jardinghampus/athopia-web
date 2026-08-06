/**
 * lib/json-ld.ts — säker serialisering av JSON-LD
 * ─────────────────────────────────────────────────────────────────────────────
 * `JSON.stringify()` escapar INTE `<`, så ett fält som innehåller
 * `</script><script>…` bryter sig ut ur <script type="application/ld+json">
 * och blir körbar kod. Det gäller alla strukturerad-data-block i appen, och
 * datan är inte vår: artikeltitlar kommer från RSS-källor och AI-pipelinen,
 * lag- och spelarnamn från Sportmonks.
 *
 * Escapar också U+2028/U+2029 (LINE/PARAGRAPH SEPARATOR). De är giltiga i JSON
 * men olagliga i JavaScript-strängliteraler och kan bryta parsningen.
 *
 * Separatortecknen konstrueras med String.fromCharCode i stället för att skrivas
 * ut. Rakt i källkoden räknas de som radslut av TypeScript-parsern och gör
 * literalen ogiltig — verifierat: tsc föll på "Unterminated regular expression
 * literal" när de stod råa.
 *
 * Ersättningarna är JSON-escapesekvenser i den utmatade strängen: `<` är
 * fortfarande `<` för en JSON-LD-parser, men webbläsarens HTML-parser hittar
 * ingen `</script>` att avsluta taggen på.
 *
 * Använd ALLTID den här i stället för JSON.stringify i en <script>-tagg.
 * Regressionsvakt: tests/e2e/json-ld.spec.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

const ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  [LINE_SEPARATOR]: "\\u2028",
  [PARAGRAPH_SEPARATOR]: "\\u2029",
};

const UNSAFE = new RegExp("[<>&" + LINE_SEPARATOR + PARAGRAPH_SEPARATOR + "]", "g");

export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(UNSAFE, (c) => ESCAPES[c] ?? c);
}
