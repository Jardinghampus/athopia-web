# Native-Feel Plan — Athopia web

Mål: iOS-grade fysik & hierarki på en **web-native** yta (inte iOS-klon; app
byggs separat senare). Revolut-kvalitet, enkelt. Läs PRODUCT.md + DESIGN.md.

Modell: bygg-faserna (1+) körs på **Fable 5**. Planering/arkitektur kan köras på
Opus.

## Global arbetsmetod (varje sida, samma loop)
1. Inventera UI-primitiv.
2. Mappa → Tactile-komponent (tab-rad→SegmentedControl, detalj→Sheet,
   lista→ListGroup, knapp→Pressable, siffra→StatNumber).
3. Ersätt. Inga engångsstilar.
4. `/impeccable critique <sida>` → hitta gap.
5. `/impeccable polish <sida>` → finputs.
6. `/impeccable audit <sida>` → a11y/perf/responsive före ship.
7. Commit `feel(<sida>): …` → push athopia-web → deploy.

## Definition of Done (per sida)
- 60 fps, CLS 0. Spring-rörelse; tap-scale-feedback.
- Material/blur-ytor; `env(safe-area-inset-*)`.
- Web-native: mus + tangentbord + hover + breda viewports fungerar lika bra.
- Skeleton + empty state + optimistic UI.
- `prefers-reduced-motion` + VoiceOver/tab-ordning OK.
- Dark-first, en accent, en radie-skala.

## Guardrails (bryt aldrig)
Server components default · `proxy.ts` ej middleware.ts · lazy-init
Stripe/Clerk/Supabase · ISR-revalidate kvar · `.eq('type','team')` ·
behåll mock-fallbacken (`lib/team-hub/mock.ts`) tills DB är stabil.

---

## Phase 0 — Setup ✅ (klart)
- Impeccable installerat (.claude/.agents/.github)
- PRODUCT.md + DESIGN.md skrivna
- Denna plan

## Phase 1 — Fundament (Tactile UI-system)
- Installera: `vaul`, `@tanstack/react-query`, `number-flow`,
  `embla-carousel-react`, `tailwind-variants`.
- `lib/motion.ts` (spring-tokens), type/spacing-skala enligt DESIGN.md.
- `app/providers.tsx`: React Query Provider.
- Bygg i `components/ui/`: `Pressable`, `Card`, `SegmentedControl`,
  `Sheet` (vaul), `ListGroup`/`ListRow`, `LargeTitleHeader`, `TabBar`,
  `StatNumber`, `PullToRefresh`.
- Verifiera: bygg grön, ingen sida ändrad ännu.

## Phase 2 — /mitt-lag (flaggskepp)
- Wrappa hub-fetch i React Query (ersätt manuell fetch).
- Tabs → SegmentedControl. Kort → Card/Pressable. Siffror → StatNumber.
- PullToRefresh + LargeTitleHeader. Match/spelare-quickview → Sheet.
- critique → polish → audit → ship.

## Phase 3 — /statistik/* (tabell, scout, spelare-jämför, jamfor)
- Tabeller → ListGroup/native rader. Filter → Sheet. Segmenterade tabbar.

## Phase 4 — /spelare/[slug] + /match/[id]
- Spelarsida: stat-grid + StatNumber, match-historik som ListGroup.
- Matchsida: events/lineups; öppna från andra ytor som Sheet.

## Phase 5 — /forum/*
- Threads-listor → ListGroup; compose → Sheet; Pressable på rader.

## Phase 6 — /onboarding + /konto + auth
- Onboarding-wizard som segment/steg med spring. Konto → grupplistor.

## Phase 7 — /nyheter + /feed + /podcast
- Flöden → kort/listor; filter-Sheet; embla för horisontella sektioner.

## Phase 8 — Landning (brand) + global QA
- Polera landning (behåll Bebas-brand). `/impeccable audit` på alla nyckelsidor.
- Perf-pass (bundle, lazy, Lighthouse), a11y-pass, slutlig deploy.
