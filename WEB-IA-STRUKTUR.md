# Athopia Web — navigationsstruktur (2026-07-13)

Enda källan för top-level-IA. Ändra `lib/nav.ts`, inte enskilda nav-komponenter.

## 4 flikar (botten / sidebar)

| Flik | Route | Innehåll |
|---|---|---|
| Mitt lag | `/mitt-lag` | Favoritlagets hem: brief, matchdag, snabbvägar → `/lag/[slug]` |
| Flöde | `/nyheter` | Athletic-feed: hero + dividerlista, sort För dig / Senaste / Viktigt |
| Forum | `/forum` | Team-forum |
| Mer | `/mer` | Allsvenskan, Matcher, Statistik, AI, Poddar, Konto… |

`lib/nav.ts` → `NAV_ITEMS` (4) + `SECONDARY_NAV_ITEMS` (hamburger).

- Mobil botten: `GlassNav` → `TabBar` (ikon + etikett)
- Hamburger: `MobileNav` (sekundärt + byt lag + sök + tema)
- Desktop: `AppSidebar` läser samma `NAV_ITEMS`

## Primärt lag

`entities.slug` i Clerk `unsafeMetadata.favoriteTeam` — skriv via `useFavoriteTeam`, läs via `getPrimaryTeam()`.

## SEO-djupsidor (inte bottenflikar)

`/allsvenskan/*`, `/match`, `/statistik`, `/artikel/[slug]` m.m. nås via Mer eller inline-länkar.
