/**
 * Ren id-normalisering, medvetet i egen modul.
 *
 * `discussion-counts.ts` importerar `lib/supabase`, som sedan
 * server-only-gränsen infördes kastar så fort den laddas utanför en Server
 * Component. Node-testet för den här funktionen drog därför in hela
 * service-role-fabriken och dog. Att köra testet med `--conditions=react-server`
 * löser server-only men bryter i stället React för alla tester som rör
 * lucide-ikoner — så gränsen dras här i stället: den rena funktionen har inga
 * beroenden och kan testas var som helst.
 */

/** Strip hero-route `article-` prefix so counts key on articles.id. */
export function articleIdForDiscussionCount(id: string): string {
  return id.startsWith("article-") ? id.slice("article-".length) : id;
}
