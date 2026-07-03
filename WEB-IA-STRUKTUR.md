# Athopia Web — navigationsstruktur (2026-07-02)

Enda källan för top-level-IA. Ändra `lib/nav.ts`, inte enskilda nav-komponenter.

## 4 flikar

| Flik | Route | Innehåll | Preset |
|---|---|---|---|
| Hem | `/hem` | Allsvenskan-puls: nyheter, tabell-snapshot, matcher, narrativ | Allsvenskan (ingen team-filter) |
| Mitt lag | `/mitt-lag` | `entity_ids`-filtrerad feed, AI-summary, nästa match, poddar | Primärt lag (server-resolved) |
| Statistik | `/statistik` | Tabell, form, skytteliga, spelarstat, jämför/scout | Primärt lag (highlight) |
| Mer | `/mer` | Forum, AI-chatt, Poddar, Konto, Prenumeration, Om oss | — |

`lib/nav.ts` driver `AppSidebar` (desktop), `GlassNav` (mobil bottenrad) och
top-delen av `MobileNav`-drawern (Header-hamburgaren). Sekundära länkar
(Forum/AI/Podcasts/Konto) i `MobileNav` matchar `/mer`-sidan.

## Primärt lag — en källa, tre läsare

`entities.slug` sparat i Clerk `unsafeMetadata.favoriteTeam` är sanningen.

- **Skrivs** enbart via `hooks/useFavoriteTeam.ts` → `setFavoriteTeam(slug, teamId?)`.
  Om `teamId` ges synkas `user_feed_config.followed_team_ids` server-side
  (`syncFollowedTeam`). **Alla anropsställen måste skicka `teamId`** — annars
  desyncar `/api/feed`-personaliseringen igen (historisk bugg, fixad 2026-07-02
  i `TeamSelectionModal` + `OnboardingClient`).
- **Läses server-side** via `lib/team/getPrimaryTeam.ts` → `getPrimaryTeam()`.
  Används av `/mitt-lag` (SSR-preset). Lägg till i `/hem`/`/statistik` om de
  behöver server-side preset senare.
- **Läses client-side** via `hooks/useFavoriteTeam.ts` → samma Clerk-fält.
  Används av `FavoriteTeamHighlight` på `/statistik`.

`lib/team-hub/teamContext.ts` (`localStorage["athopia:currentTeam"]`) är ett
**separat** koncept — "senast besökta lag" för drill-down, inte primärt lag.
Rör inte ihop dem.

## Hem vs. djupsidor — medvetet inte en sammanslagning

`/nyheter` och `/allsvenskan` (+ `/allsvenskan/tabell|spelschema|skytteliga|resultat`)
och `/match` är fullvärdiga, SEO-optimerade sidor (canonical URL, filter,
paginering, egna landningssidor för organisk trafik). `/hem` slår **inte**
ihop dem till inline-tabbar — det vore samma misstag som de tre gamla
nav-komponenterna, fast i innehållslagret. Istället är `/hem` en overview som
förhandsvisar (1 narrativ, 6 nyheter, 6 tabellrader, 5 matcher) och länkar
vidare med "Visa alla →". Samma mönster som Spotify/Apple Home-tabs: hem
aggregerar, de djupa sidorna äger sitt ämne och sin SEO-yta.

## Löst — entity-tagg-inkonsekvens (2026-07-02)

`/api/feed/hero` filtrerade på `team_tags` (troligen inaktuell/oskriven
kolumn) medan `/api/feed` filtrerar på `entity_ids` (rätt, OS-doktrin).
Fixat: routen slår nu upp lagets `entities.id` från slug och filtrerar på
`entity_ids`, samma kontrakt som `/api/feed`. Anropskontraktet (`?team=<slug>`)
är oförändrat — fixen är intern i routen.

## Fas-status

- **Fas 1 (klar 2026-07-02):** `lib/nav.ts`, `getPrimaryTeam()`, nav-komponenter
  synkade, `/mer`-sida skapad, primärt-lag-desync fixad (write-path + mitt-lag
  SSR-preset).
- **Fas 2 (klar 2026-07-02):** `/feed` och `/dashboard` redirectade redan till
  `/mitt-lag` (gjort i tidigare session) — verifierat, ingen ny risk. `/hem`
  omskriven från redirect-stub till riktig overview-dashboard (narrativ +
  nyheter + tabell + matcher, allt förhandsvisat med länkar vidare).
  `/analys` pekade felaktigt på `/mitt-lag` → korrigerad till `/hem` (dess
  narrativ-innehåll bor där nu). `entity_ids`/`team_tags`-fixen (ovan).
- **Fas 3 (kvar):** verifiera live i browser när Supabase-avbrottet är över;
  QA AI-summary end-to-end på Mitt lag; överväg redirect av `/feed/[teamSlug]`
  vs. behåll som eget delbart lag-feed-koncept (medveten, ej gjord ännu).
