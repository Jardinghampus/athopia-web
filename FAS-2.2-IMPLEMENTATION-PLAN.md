# Fas 2.2 — Hub-konsolidering: exakt implementeringsplan

> Skriven 2026-07-03 för att en fräsch session (Sonnet eller Fable) ska kunna exekvera
> säkert utan att själv behöva utforska båda filerna från grunden. Detta ÄR INTE
> exekverat — det är en verifierad kartläggning + stegvis plan.

## Verklig arkitekturskillnad (viktigare än line-count antydde)

De två implementationerna är INTE bara duplicerad kod — de är **arkitektoniskt olika**:

| | `/mitt-lag` (`MittLagDashboard.tsx`, 683 rader) | `/lag/[slug]` (`page.tsx`, 440 rader) |
|---|---|---|
| Typ | Client component (`"use client"`) | Server component |
| Data | `react-query` mot `/api/team/[slug]/hub` (client-fetch) | Direkt Supabase-queries i komponenten (server-fetch) |
| Nav | Flikar via `?tab=`-state (Översikt/Statistik/Trupp/Matcher/Forum), `SegmentedControl` | Enda sidan, allt renderat linjärt (radar, insights, pulse, form, leaders) |
| Lagbyte | `TeamSwitcher` (nybyggd denna vecka) | Ingen — en slug = en sida |
| SEO | Ingen (client-rendered, ingen `generateMetadata`) | `generateMetadata()` finns, bra för delning/SEO |

**Konsekvens:** detta är INTE en enkel "flytta kod"-uppgift. De två sidorna har olika datalager (client react-query-hook vs server Supabase-calls) och olika innehållsmodeller (flikar vs en lång sida). En naiv sammanslagning riskerar antingen tappa SEO (om `/lag/[slug]` blir client-rendered) eller tappa TeamSwitcher/flik-interaktivitet (om `/mitt-lag` bara blir en redirect till den enkla server-sidan).

## Rekommenderad strategi: hybrid, inte fullständig merge

Gör `/lag/[slug]` till den kanoniska routen genom att **lägga till** MittLagDashboard's flikstruktur och TeamSwitcher OVANPÅ befintlig serverdata, inte genom att kasta bort någotdera:

1. **Behåll `/lag/[slug]/page.tsx` som server component** (SEO-vinsten är värdefull och lätt att tappa av misstag).
2. **Extrahera `TeamSwitcher`-anropet** (redan en egen komponent, `components/team-hub/TeamSwitcher.tsx`) och montera den i `/lag/[slug]`s header istället för i `/mitt-lag`. Den behöver `teams`-listan + `followedSlugs` — hämta dem server-side i `page.tsx` (samma queries som redan finns i `mitt-lag/page.tsx`s `getTeams()`/`getFollowedSlugs()`) och skicka som props till en ny liten client-wrapper `TeamHubHeader` (server-data in, client-interaktion för växlingen).
3. **Portera flikstrukturen** (`SegmentedControl` + `Översikt/Statistik/Trupp/Matcher/Forum`) som en NY client component `TeamHubTabs.tsx` som tar emot redan hämtad serverdata som props (inte react-query/client-fetch) — d.v.s. vänd datariktningen: `/lag/[slug]/page.tsx` hämtar allt server-side (som den redan gör), skickar ner till `TeamHubTabs` som bara hanterar `?tab=`-state och rendering, ingen egen fetching.
   - Detta eliminerar `/api/team/[slug]/hub`-roundtrip helt för denna sida (den kan leva kvar för annat om något annat använder den — sök `grep -rn "/api/team/.*hub"` innan borttagning).
4. **`/mitt-lag/page.tsx` blir en tunn redirect:** `redirect(\`/lag/${favoriteTeam?.slug ?? ''}\`)` — om ingen favorit: visa `EmptyPicker` (finns redan i `MittLagDashboard.tsx`, flytta den ut till en egen liten fil eller behåll som en enkel inline-komponent i `/mitt-lag/page.tsx`).
5. **Ta bort `MittLagDashboard.tsx`, `MittLagSkeleton.tsx`** när `/lag/[slug]` har all funktionalitet — inte innan, för att undvika ett läge utan fungerande hub.

## Exakt filordning (gör i denna ordning, testa mellan varje steg)

1. Bygg `TeamHubHeader.tsx` (client) — TeamSwitcher + large-title + nyckeltal, tar emot `teams`, `followedSlugs`, `currentSlug`, `stats` som props. Testa isolerat (Storybook-fritt: montera i `/lag/[slug]` bakom en `?newHeader=1`-flagga om extra försiktighet önskas, annars direkt).
2. Bygg `TeamHubTabs.tsx` (client) — flyttad `TAB_OPTIONS`/`SegmentedControl`-logik + de fem tab-render-funktionerna (`Oversikt`, `Statistik`, `Trupp`, `Matcher`, `Forum`) från `MittLagDashboard.tsx` rad ~308 och nedåt, omskrivna att ta emot data som props istället för `hub`-object från react-query.
3. Uppdatera `/lag/[slug]/page.tsx`: hämta samma data som `/api/team/[slug]/hub` gjorde (kolla den routen — `app/api/team/[slug]/hub/route.ts` — återanvänd dess query-logik direkt i page.tsx, inte via HTTP-roundtrip), montera `TeamHubHeader` + `TeamHubTabs`.
4. Verifiera live mot minst 3 olika lag (en med mycket data, en med lite, en med `logo_url: null`) + mot `favoriteTeam` satt och osatt.
5. Gör `/mitt-lag/page.tsx` till redirect.
6. Ta bort `MittLagDashboard.tsx` + `MittLagSkeleton.tsx` + verifiera inga andra imports pekar dit (`grep -rn "MittLagDashboard\|MittLagSkeleton"`).
7. `next build` + typecheck + live-klick-genomgång av alla fem flikar för minst ett lag.

## Risker att hålla koll på
- `TeamRadar` (recharts, lazy-loaded i `MittLagDashboard` via `next/dynamic`) — bevara lazy-loadingen i den nya strukturen, annars ökar bundlestorleken på en SEO-sida.
- `PullToRefresh`-komponenten i `MittLagDashboard` bygger på client-fetch (`refetch()`) — fungerar inte rakt av mot server-props utan en route-level `router.refresh()` istället.
- `getStoredTeam()/setStoredTeam()` (`lib/team-hub/teamContext.ts`) — separat koncept från `favoriteTeam`, används för "senast besökt". Bevara om möjligt, men lägre prioritet än TeamSwitcher-funktionaliteten.

**Uppskattad omfattning för exekvering:** en hel fokuserad session, inte ett delmoment i en redan lång session.
