# SPEC — /nyheter omstrukturering + /allsvenskan påfyllning (2026-08-07)

> Beslut tagna av Fable. Sonnet exekverar exakt detta — inga egna designval.
> Läs CLAUDE.md + DESIGN.md först. Yta vs bläck-reglerna gäller. Minsta diff
> som uppfyller spec:en. `pnpm typecheck && pnpm build` före klart.

## A. /nyheter — fullscreen, tre fält, fungerande tabbar

### A1. Buggfix (viktigast): tabbarna är vyer, inte bara sort
`FeedSortBar` behåller idag `scope=allsvenskan` när man klickar "För dig" →
personalisering slår aldrig in. Beslut: segmented-kontrollen växlar **vy**:

| Tab | URL |
|-----|-----|
| För dig | `/nyheter` (inga scope/sort-params) |
| Senaste | `/nyheter?scope=allsvenskan&sort=latest` |
| Viktigt | `/nyheter?scope=allsvenskan&sort=important` |

Implementera i `FeedSortBar`: tab-klick bygger URL:en ovan från grunden men
BEHÅLLER `lag`/`kalla`/`event`/`visa` (och nollar `page`). Aktiv tab avgörs av
scope+sort-kombon, inte bara sort. `parseSort`-default i page.tsx oförändrad.

### A2. Layout: tre fält på desktop (detta är för web)
Ersätt `max-w-2xl`-wrappern i `app/(app)/nyheter/page.tsx` med:

```
<div class="mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-6 pb-24 md:pb-10
            lg:grid lg:grid-cols-[260px_minmax(0,1fr)_320px] lg:gap-8">
```

- **Vänster fält (lg+, `<aside>` sticky top):** ny `FeedFilterPanel` (A3).
  Dold under lg.
- **Mittfält:** rubrik, chips, FeedSortBar, hero, flödeslista, paginering.
  Läsmåttet skyddas: lista/hero ligger i `max-w-2xl`-container inom mittfältet.
- **Höger fält (lg+, `<aside>`):** `FeedModulesRail` flyttar hit på desktop
  (på mobil ligger den kvar där den är idag, under sortbaren). Rendera samma
  modules-data — ingen dubbelfetch; en prop `placement: "rail" | "inline"`
  eller CSS-styrd visning (`hidden lg:block` / `lg:hidden`) räcker.
- Ticker ligger kvar överst i full bredd. `NyheterRealtimeBanner` +
  `FeedMatchHero` visas ENDAST i För dig-vyn (scope=personal) — i Senaste/
  Viktigt är sidan ett rent nyhetsflöde. Det är dagens stapling som dödar
  hierarkin.

### A3. Ny komponent: FeedFilterPanel (klubbar + källor)
`components/feed/FeedFilterPanel.tsx` ("use client").

- **Klubbar:** de 16 Allsvenskan-lagen från `entities` (server-sida hämtar
  via befintlig helper — leta `getTeams`/entities-fetch i `lib/`; slugs från
  `entities.slug`, ALDRIG ad-hoc slugify). Skickas som prop från page.tsx.
- **Källor:** distinct källnamn ur articles-datat (page.tsx har redan datat;
  om en billig helper finns i lib/supabase — använd den, annars härled från
  aktuell sidas artiklar + de vanligaste hårdkodas INTE).
  Om distinct-källor inte går att få billigt server-side: bygg endast
  klubbfiltret nu och lämna källor till chips (dokumentera i rapporten).
- UI: två grupper med rubrik (`Klubbar`, `Källor`), checkbox-rader i
  ListGroup-stil (befintliga `ListGroup`/`ListRow` om de passar, annars enkla
  rader). Val skrivs till URL:en (`lag=a,b` / `kalla=x,y`) via router.push,
  `page` nollas. Aktiva val bockade. "Rensa filter"-länk längst ned.
- **Mobil:** knapp "Filter" (med räknare för aktiva filter) bredvid
  FeedSortBar som öppnar samma panel i `TactileSheet`. Touch-targets ≥44px.
- Tillgänglighet: riktiga `<input type="checkbox">` + label, synligt fokus.

### A4. Rubrikstädning
- `h1` visar vyn: "För dig" / "Allsvenskan — senaste" / "Allsvenskan — viktigt"
  i stället för FLÖDE/ALLSVENSKAN i versaler (versalrubriken behålls som stil
  om den redan är etablerad — men texten ska matcha vald vy).
- "N signaler" behålls, flyttas till samma rad som h1 på desktop (baseline-align).

## B. /allsvenskan — mer matig, samma struktur

Strukturen är älskad — rör inte grid:en (huvud + 380px-sidokolumn). Fyll på:

### B1. Nyheter: 12 + "Visa fler"
- Höj `NEWS_PREVIEW_LIMIT` 6 → 12.
- Under kortgriden: sektion "Fler nyheter" med nästa 8 artiklar som kompakta
  rader (`AthleticFeedRow`, `getFilteredArticles({ page: 2, limit: 8 })`
  eller offset — återanvänd befintlig fetcher, en query om möjligt:
  hämta 20 och dela 12/8).
- Längst ned: primär länk-knapp "Alla nyheter →" till
  `/nyheter?scope=allsvenskan&sort=latest` (befintlig TrackedLink-event kvar).
  Ingen client-side infinite scroll — sidan är ISR (revalidate 60), håll den
  statisk.

### B2. Mer statistik i sidokolumnen
Under MATCHER, två nya block (återanvänd fetchers från undersidorna —
`skytteliga`- och `xp-tabell`-sidorna visar var datat hämtas):

1. **SKYTTELIGA** — topp 5: rad = position, spelarnamn (länk till
   `/spelare/[slug]` om slug finns), lag, mål (`tabular-nums`).
   Länk "Hela skytteligan →" till `/allsvenskan/skytteliga`.
2. **FORM** — i tabell-preview:n: lägg en formkolumn (senaste 5: W/O/F som
   små prickar — grön/grå/röd via tokens, `--color-success` / muted /
   `--destructive`, ALDRIG råa hex) om formdata finns i
   `fetchStandingsFull()`-resultatet. **Om formdata inte finns i datat: hoppa
   över, visa inget placeholder** (xG-regeln gäller all statistik).

Samma kortspråk som befintliga block: `rounded-2xl border border-border
bg-card`, rubrik i samma stil som TABELL/MATCHER.

## Gemensamt
- Inga nya beroenden. Server components default; "use client" bara filterpanel/sortbar.
- Empty/loading: nya block döljs helt vid tom data (inga "Ingen data"-kort
  utöver de mönster som redan finns på sidan).
- Verifiera båda temana (light/dark) och 390px-viewport.
- Rapportera: filer ändrade, vad som verifierats, vad som hoppats + varför.
