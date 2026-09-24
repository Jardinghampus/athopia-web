# Nano Fotboll — kanonisk navigationsstruktur (2026-07-14)

Kodens enda källa för top-level-IA är `lib/nav.ts`. Det versionsmärkta
cross-platform-kontraktet genereras till `contracts/generated/navigation.json`.
Ändra aldrig enskilda navkomponenter eller iOS-tabbar direkt.

## 5 primära destinationer

| Flik | Route | Innehåll |
|---|---|---|
| Hem | `/mitt-lag` | Favoritlagets hem: brief, matchdag, snabbvägar → `/lag/[slug]` |
| Flöde | `/nyheter` | Athletic-feed: hero + dividerlista, sort För dig / Senaste / Viktigt |
| Matcher | `/match` | Live, kommande och avslutade matcher |
| Tabellen | `/allsvenskan` | Ligan: tabell, spelschema, resultat och topplistor |
| Profil | `/profil` | Kontot, intressen, notiser, plan |

Ordningen är låst: **Hem längst till vänster, Profil längst till höger, aldrig mer än fem
flikar** (`context/mobile_ux_rules.md` regel 3, vakt `lib/nav.test.ts`). Första fliken heter
"Hem" och inte "Mitt lag" eftersom det är supporterns startsida, inte en lagsektion —
laghubben ligger ett steg in på `/lag/[slug]`.

`/ai` är overflow under Mer — inte en primär flik. AI är infrastruktur.

Forum, Statistik, Daily, Analys, Poddar, Fråga och Konto är sekundära destinationer
under toolbar/overflow.

- Webb: `GlassNav`, `MobileNav` och `AppSidebar` läser `lib/nav.ts`.
- iOS: genererad navigation mappas till native `TabView` + `NavigationStack`.
- Profil är en egen flik längst till höger sedan 2026-09-13. `/konto` ligger kvar som
  djupsida under Profil — den tar ingen sjätte flik. `proxy.ts` skyddar `/profil(.*)`, så
  ett anonymt tryck landar i inloggning i stället för en 404.

## Primärt lag

`entities.slug` i Clerk `unsafeMetadata.favoriteTeam` — skriv via `useFavoriteTeam`, läs via `getPrimaryTeam()`.

## Djupsidor

`/allsvenskan/*`, `/statistik`, `/artikel/[slug]`, `/spelare/[slug]`,
`/forum/*` m.m. nås via primär destination, overflow eller inline-länkar.
Samma route registry används för Universal Links på iOS.
