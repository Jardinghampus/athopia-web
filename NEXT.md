# NEXT.md — Athopia Web jobblista

Jobb körs i ordning. Markera ✅ när klart.

---

## Fas 1: Grund & infrastruktur

- [x] **J-01** — Env-variabler: fixade SUPABASE_SERVICE_ROLE_KEY, SPORTSMONKS_API_TOKEN, NEXT_PUBLIC_BASE_URL + Clerk redirects
- [x] **J-02** — Layout: global navbar med NavAuth + footer med länkstruktur
- [x] **J-03** — Fonts: Bebas Neue + DM Sans via next/font/google
- [x] **J-04** — Theme: dark-first, CSS-tokens (#1D9E75 som --color-pitch), custom utilities

## Fas 2: Innehållssidor

- [x] **J-05** — Startsida (app/page.tsx): hero + senaste artiklar (ISR 60s) + featured podcast
- [x] **J-06** — Artikelsida (app/artikel/[slug]/): full artikel + JSON-LD + relaterade
- [x] **J-07** — Lagsida (app/lag/[slug]/): lagprofil + Sportsmonks-statistik (ISR 60s)
- [x] **J-08** — Podcast-lista (app/podcast/): grid med PodcastCard
- [x] **J-09** — Podcast-episod (app/podcast/[id]/): audio-player + beskrivning
- [x] **J-09b** — Nyheter (app/nyheter/): paginerad artikel-lista
- [x] **J-09c** — Allsvenskan (app/allsvenskan/): tabell + matcher
- [x] **J-09d** — Narrativ (app/narrativ/[id]/): detaljsida (placeholder för timeline/källor)
- [x] **J-09e** — Spelare (app/spelare/[slug]/): profil + coverage (placeholder för stats)

## Fas 3: Auth & prenumeration

- [x] **J-10** — Clerk integration: proxy.ts PRO-gate aktiverad (clerkMiddleware + /konto PRO-gate)
- [x] **J-11** — Prenumerera-sida (app/prenumerera/): Stripe Checkout 39 SEK/mån
- [x] **J-12** — Stripe webhook (api/webhooks/stripe/): checkout.completed → Clerk metadata
- [x] **J-13** — Kontosida (app/konto/): PRO-status + Stripe Customer Portal

## Fas 4: Sökning & discoverability

- [x] **J-14** — Supabase pgvector: match_articles RPC + api/related/
- [x] **J-15** — Sitemap (app/sitemap.ts): dynamisk från Supabase
- [x] **J-16** — Robots (app/robots.ts): korrekt konfiguration
- [x] **J-16b** — CommandPalette (Cmd+K) + /api/search (server-side Supabase search)

## Fas 5: Polish & deploy

- [x] **J-17** — generateMetadata() på alla sidor (verifiera lag, podcast, konto)
- [x] **J-18** — next/image på alla bilder (verifiera lag, podcast)
- [x] **J-19** — Lighthouse-audit: Core Web Vitals ≥ 90
- [x] **J-20** — Vercel deploy + env-variabler i produktion
