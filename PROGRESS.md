# PROGRESS.md — Athopia Web

Senast uppdaterad: 2026-05-29

## Statusöversikt

### Fas 1–5: KLARA ✅
Alla routes byggda och kompilerade rent (`pnpm build` → 0 fel).

---

## Jobb-sammanfattning

| Jobb | Beskrivning | Status |
|------|-------------|--------|
| J-01 | Env-variabler fixade | ✅ |
| J-02 | Layout: global navbar + footer | ✅ |
| J-03 | Fonts: Bebas Neue + DM Sans | ✅ |
| J-04 | Theme: dark-first, CSS-tokens (#1D9E75) | ✅ |
| J-05 | Startsida: hero + senaste artiklar (ISR 60s) | ✅ |
| J-06 | Artikelsida: full artikel + JSON-LD + relaterade | ✅ |
| J-07 | Lagsida: lagprofil + statistik (ISR 60s) | ✅ |
| J-08 | Podcast-lista: grid med PodcastCard | ✅ |
| J-09 | Podcast-episod: audio-player + beskrivning | ✅ |
| J-09b | Nyheter: paginerad artikel-lista | ✅ |
| J-09c | Allsvenskan: tabell + matcher | ✅ |
| J-09d | Narrativ: detaljsida | ✅ |
| J-09e | Spelare: profil + coverage | ✅ |
| J-10 | Clerk integration: proxy.ts PRO-gate | ✅ |
| J-11 | Prenumerera-sida: Stripe Checkout 39 SEK/mån | ✅ |
| J-12 | Stripe webhook: checkout.completed → Clerk metadata | ✅ |
| J-13 | Kontosida: PRO-status + Stripe Customer Portal | ✅ |
| J-14 | Supabase pgvector: match_articles RPC + api/related/ | ✅ |
| J-15 | Sitemap: dynamisk från Supabase | ✅ |
| J-16 | Robots: korrekt konfiguration | ✅ |
| J-16b | CommandPalette (Cmd+K) + /api/search | ✅ |
| J-17 | generateMetadata() på alla sidor | ✅ |
| J-18 | next/image på alla bilder | ✅ |
| J-19 | Lighthouse-audit: Core Web Vitals ≥ 90 | ✅ |
| J-20 | Vercel deploy + env-variabler i produktion | ✅ |

---

## Kritiska env-vars som saknas (blockerar live-data)

| Variabel | Krävs av | Status |
|----------|----------|--------|
| `SPORTSMONKS_API_TOKEN` | Statistik, matcher, standings | Behöver sättas i Vercel |
| `STRIPE_WEBHOOK_SECRET` | Webhook-verifiering i produktion | Behöver sättas i Vercel |
| `NEXT_PUBLIC_SUPABASE_URL` | All data | Behöver sättas i Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All data | Behöver sättas i Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side queries | Behöver sättas i Vercel |

---

## Arkitekturbeslut

- **proxy.ts** (inte middleware.ts) — Next.js 16-konvention. `clerkMiddleware` + PRO-gate på `/konto/*`.
- **Supabase**: `createServerClient()` lazy init, `isSupabaseConfigured()` guard — appen startar utan nycklar.
- **Stripe/Clerk**: lazy init i funktionskroppar — aldrig module-level.
- **ISR revalidate:60** på startsida + matchdata, 3600 på statisk data.
- **Graceful fallback**: Sportsmonks-fel loggas men bryter inte bygget.

---

## Fas 9 — Personalisering & Forum ✅ KLAR (2026-05-31)

| Jobb | Beskrivning | Status |
|------|-------------|--------|
| WEB-F1 | MITT FEED — FeedClient med FeedItem (4 varianter), Realtime + infinite scroll | ✅ 2026-05-31 |
| WEB-F2 | Forum top-level — /app/forum + /app/forum/[teamSlug] med AI-box + Hetast-sort | ✅ 2026-05-31 |
| WEB-F3 | RSS Allsvenskan-filter — /api/admin/classify-article + /app/admin/content | ✅ 2026-05-31 |
| WEB-F4 | Dagliga sammanfattningar — /app/sammanfattning + AI-sektion i lag-hub | ✅ 2026-05-31 |
| WEB-F5 | Full-width layout — Header full-width, Feed + Forum i nav | ✅ 2026-05-31 |
| WEB-F6 | MobileNav — sticky bottom nav (Feed/Nyheter/Statistik/Forum/Profil) | ✅ 2026-05-31 |
| WEB-F7 | Onboarding — Dedikerad sida med lag-grid, redirect via proxy.ts | ✅ 2026-05-31 |

Manuella SQL-migrations som behöver köras i Supabase SQL Editor:
```sql
ALTER TABLE articles ADD COLUMN IF NOT EXISTS team_tags text[] DEFAULT '{}';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS manually_reviewed bool DEFAULT false;
ALTER TABLE forum_threads ADD COLUMN IF NOT EXISTS hot_score float DEFAULT 0;
```

## Fas 8 — The Athletic v2 ✅ KLAR (2026-05-31)

| Jobb | Beskrivning | Status |
|------|-------------|--------|
| WEB-30 | Enhanced nyheter feed — NyheterRealtimeBanner (Supabase Realtime) | ✅ 2026-05-31 |
| WEB-31 | Podcast filterview — team/show/visa-filter + entity chips | ✅ 2026-05-31 |
| WEB-32 | Lag-sammanfattning AI-hero — hämtar från articles WHERE source_name='Athopia AI' | ✅ 2026-05-31 |
| WEB-33 | PWA setup — manifest.json + sw.js + PwaInstallBanner (redan klar från WEB-26) | ✅ 2026-05-31 |

Nya filer:
- `components/NyheterRealtimeBanner.tsx` — realtime-banner med Supabase channel
Uppdaterade filer:
- `app/nyheter/page.tsx` — NyheterRealtimeBanner importerad
- `app/podcast/page.tsx` — komplett rebuild med filter + entity chips
- `app/lag/[slug]/sammanfattning/page.tsx` — hämtar AI-artiklar + prominentvisning
- `app/page.tsx` — getAllsvenskanDailySummary() + AI-hero sektion

## Fas 7 — The Athletic-vision ⬜ PÅGÅENDE (2026-05-31)

| Jobb | Beskrivning | Status |
|------|-------------|--------|
| WEB-25 | Lag-val onboarding (Clerk metadata, localStorage-fallback) | ⬜ |
| WEB-26 | PWA-setup (manifest, service worker, push permission flow) | ⬜ |
| WEB-27 | Statistik-jämförelse (sida-vid-sida lag/spelare + AI-analys) | ⬜ |
| WEB-28 | Match-center (/match/[id], live xG, forum live) | ⬜ |
| WEB-29 | Personaliserad feed (useFavoriteTeam, Supabase team_id filter) | ⬜ |

**Vision:** Allsvenskan one-stop platform → Web → PWA → React Native
**Beroenden:** WEB-25 måste vara klar innan WEB-29 (feed kräver lag-val)
**Beroenden:** OS-16 (push pipeline) måste vara klar innan WEB-26 (push permission)
**Prioritet:** WEB-25 → WEB-29 → WEB-27 → WEB-28 → WEB-26

## Fas 6 — Lag-hub & Global nav (2026-05-29)

| Jobb | Beskrivning | Status |
|------|-------------|--------|
| WEB-LH1 | app/lag/[slug]/nyheter/page.tsx | ✅ |
| WEB-LH2 | app/lag/[slug]/statistik/page.tsx (standings + team card) | ✅ |
| WEB-LH3 | app/lag/[slug]/podcasts/page.tsx | ✅ |
| WEB-LH4 | app/lag/[slug]/sammanfattning/page.tsx (AI digest + narrativ) | ✅ |
| WEB-LH5 | components/layout/AllsvenskanNav.tsx (global lag-badges) | ✅ |

---

## Native-feel-initiativet — status 2026-06-12

> Plan: NATIVE-FEEL-PLAN.md · Design: DESIGN.md · Kontext: PRODUCT.md
> Critique-snapshots: .impeccable/critique/ (mitt-lag: 26 → 31)

### Faser

| Fas | Yta | Status | Commit |
|-----|-----|--------|--------|
| 0 | Setup (Impeccable, PRODUCT/DESIGN/PLAN) | ✅ | 1bb0dd6 |
| 1 | Tactile UI-system (components/ui/) | ✅ | d8f41e1, 2bf9bab |
| 2 | /mitt-lag (React Query, Sheet, PTR, LargeTitle) | ✅ | eb1d962, 46701da |
| 3 | /statistik/* (pill-tabbar, filter-Sheet, ListGroup) | ✅ | d8df24f, 9d22571 |
| 4 | /spelare/[slug] + /match/[id] | ✅ | fe0f201 |
| 5 | /forum/* (ListGroup-index, compose-Sheet, FAB) | ✅ | ba7d573 |
| 6 | /onboarding (StepDots+spring) + /konto (grupplistor) | ✅ | 4a622f0 |
| 7 | /feed (PTR, ban-fix) + /nyheter (tokens) + Carousel-primitiv | ✅ | 0c83f0c |
| 8 | Global QA kodnivå (MotionConfig, recharts-dynamic, audit) | ✅ | (denna commit) — browser-QA kvar, se Phase 8-sektionen |

Fas 7-not: embla-primitiven finns som components/ui/Carousel.tsx men är medvetet
INTE applicerad — ingen yta tjänar på karusell idag (grid/lista är rätt affordance;
karusell döljer innehåll). Använd den när en sektion faktiskt behöver horisontell
snap (t.ex. landningens telefon-mockups eller en framtida "shows"-rail i /podcast).
Feed-korten hade en färgad vänsterkant (side-stripe = absolute ban i Impeccable) —
borttagen; typfärgen bärs av ikon-bubblan + etiketten.

### Tactile UI-komponenter (components/ui/)

Pressable · SegmentedControl · Sheet (TactileSheet.tsx) · Card (TactileCard.tsx)
· ListGroup/ListRow (density-prop) · LargeTitleHeader (titleContent/stickyOffset)
· TabBar · StatNumber (@number-flow/react) · PullToRefresh (overscroll-contain)
· Carousel (embla, oanvänd än — se Fas 7-not).
Motion-tokens: lib/motion.ts (speglar --ease-* i globals.css).
React Query-provider: app/providers.tsx, inkopplad i app/layout.tsx.
OBS: Sheet/Card ligger i TactileSheet/TactileCard pga Windows case-krock med shadcn.

### Datapunkter att skjuta in (UI klart, väntar på data)

| Yta | Datakälla | Fylls av | Tomt-läge idag |
|-----|-----------|----------|----------------|
| /mitt-lag hela hubben | GET /api/team/[slug]/hub ← lib/team-hub/queries.ts | Sportmonks-sync (fixtures, team_season_stats, player_season_stats) + RSS→content_queue | Mock-fallback lib/team-hub/mock.ts |
| /mitt-lag radar | team_season_stats (alla lag, season_id=26806) | syncResults → Milo | "visas när säsongsstatistik finns" |
| /mitt-lag nyheter | articles via hub-payload | RSS-pipeline + Echo | "Inga artiklar ännu" |
| /statistik tabell/skytte/assist/form | lib/sportsmonks.ts (fetchStandingsFull, fetchTopScorers, fetchTopAssists) | SPORTSMONKS_API_TOKEN i env | EmptyState med env-hint |
| /statistik xG-flik | Sportmonks premium | abonnemangsuppgradering | platshållare |
| /statistik/scout + /spelare (jämför) | scout-pool ← player_season_stats | Sportmonks player-sync | tom pool |
| /statistik/jamfor | match_stats + entities + content_queue(comparison-digest) | OS-17 match-collector + AI-digest | "Kör OS-17" |
| /spelare/[slug] | players, player_season_stats, player_match_stats, fixtures | Sportmonks player/fixture-sync | mock-spelare + "Ingen statistik" |
| /match/[id] | fixtures, team_match_stats, fixture_events, fixture_lineups, match_summaries | Hetzner-agent efter matchslut | "Ingen data för match" |
| /forum | forum_threads, entities + /api/forum/posts | användargenererat (Clerk-auth) | "Inga lag/inlägg" |
| LIVE-lägen (puls, live_scores) | live_scores + fixtures.status='LIVE' | syncLive (30–60s, endast vid LIVE) | visas ej |

### Kända blockers (oförändrade av initiativet)

1. Lokal `pnpm build` failar på prerender: hooks/useFavoriteTeam.ts kräver
   ClerkProvider men .env.local saknas lokalt. Vercel (env finns) bygger OK.
   Fix: villkora useUser-anropet eller lägg Clerk-nycklar i .env.local.
2. Två lokala kloner: C:\Users\jardi\athopia-web och
   C:\Users\jardi\Athopia Build\athopia-web — synka båda via git pull.

### Verifieringsprotokoll per fas

rtk tsc (0 fel) → pnpm build (Compiled successfully; prerender-felet ovan är känt)
→ commit feel(<yta>): … → push → Vercel-deploy. Critique: /impeccable critique <yta>.

---

## Phase 8 — Global QA-audit (2026-06-12, kodnivå)

> Browser-baserad QA (Lighthouse, VoiceOver, riktiga viewports) kunde inte köras
> i denna miljö — kör den checklistan separat, se "Kvar för browser-QA" nedan.

### Audit Health Score (kodnivå)

| # | Dimension | Poäng | Nyckelfynd |
|---|-----------|-------|-----------|
| 1 | Accessibility | 3 | aria/focus-visible/44px genomfört i Tactile-ytor; äldre ytor (gamification, LiveMatchClient) ej genomgångna |
| 2 | Performance | 3 | recharts nu dynamic i mitt-lag + spelare-jämför; alla bilder via next/image; XgChart kvar statisk (server-sida) |
| 3 | Responsive | 3 | 44px-mål + breakpoints i alla konverterade ytor; tabeller scrollar medvetet horisontellt |
| 4 | Theming | 2 | SYSTEMISKT: 93 hårdkodade hex i 25 filer (mest gamification/, jamfor/, LiveMatchClient) — många är legitima lagfärger/data-viz men #1D9E75 bör vara var(--color-pitch) överallt |
| 5 | Anti-Patterns | 4 | Detektor 0 fynd över landing+app+ui+forum; feed-side-stripe åtgärdad i Fas 7 |
| **Totalt** | | **15/20** | **Good** |

### Åtgärdat i denna fas
- MotionConfig reducedMotion="user" i app/providers.tsx — ALLA motion-komponenter
  respekterar nu prefers-reduced-motion globalt (P1, WCAG 2.3.3).
- recharts lazy-laddas via next/dynamic i MittLagDashboard + PlayerCompareClient
  (skeleton-wave som loading-state).

### Kvarstående (P2, ej blockerande)
- Hex → tokens-städning i gamification/, jamfor/page.tsx, LiveMatchClient.tsx,
  sammanfattning/ (93 förekomster; behåll äkta lagfärger, ersätt brand-hex).
- XgChart (recharts) statisk i jamfor — dynamic kräver client-wrapper.
- Refetch-fel i mitt-lag är tysta (sonner-toast vore rätt kanal).
- Kortkommandon (1–5 för flikar) för power users.

### Kvar för browser-QA (kräver miljö med browser/deploy)
1. Lighthouse på /, /mitt-lag, /statistik, /nyheter (mål: perf ≥90, a11y ≥95, CLS 0).
2. VoiceOver/NVDA-pass på onboarding-wizarden och quickview-sheeten.
3. 320px-viewport-svep (lagväljaren, segmented controls, tabeller).
4. Verifiera 60fps på sheet-drag + segmented-spring på mellanklassmobil.
5. /impeccable critique på /statistik och landningen (mitt-lag-trend: 26 → 31).
