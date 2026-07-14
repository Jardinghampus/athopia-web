# Athopia — kanonisk navigationsstruktur (2026-07-14)

Kodens enda källa för top-level-IA är `lib/nav.ts`. Det versionsmärkta
cross-platform-kontraktet genereras till `contracts/generated/navigation.json`.
Ändra aldrig enskilda navkomponenter eller iOS-tabbar direkt.

## 5 primära destinationer

| Flik | Route | Innehåll |
|---|---|---|
| Mitt lag | `/mitt-lag` | Favoritlagets hem: brief, matchdag, snabbvägar → `/lag/[slug]` |
| Flöde | `/nyheter` | Athletic-feed: hero + dividerlista, sort För dig / Senaste / Viktigt |
| Allsvenskan | `/allsvenskan` | Ligan: tabell, spelschema, resultat och topplistor |
| Matcher | `/match` | Live, kommande och avslutade matcher |
| AI | `/ai` | Global Athopia AI för Elite |

Forum, Statistik, Daily, Analys, Poddar och Konto är sekundära destinationer
under toolbar/overflow och desktop-sidebar.

- Webb: `GlassNav`, `MobileNav` och `AppSidebar` läser `lib/nav.ts`.
- iOS: genererad navigation mappas till native `TabView` + `NavigationStack`.
- Profil/Konto nås från toolbar/overflow och upptar inte en sjätte tab.

## Primärt lag

`entities.slug` i Clerk `unsafeMetadata.favoriteTeam` — skriv via `useFavoriteTeam`, läs via `getPrimaryTeam()`.

## Djupsidor

`/allsvenskan/*`, `/statistik`, `/artikel/[slug]`, `/spelare/[slug]`,
`/forum/*` m.m. nås via primär destination, overflow eller inline-länkar.
Samma route registry används för Universal Links på iOS.
