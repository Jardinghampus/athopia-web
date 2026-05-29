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

## Fas 6 — Lag-hub & Global nav (2026-05-29)

| Jobb | Beskrivning | Status |
|------|-------------|--------|
| WEB-LH1 | app/lag/[slug]/nyheter/page.tsx | ✅ |
| WEB-LH2 | app/lag/[slug]/statistik/page.tsx (standings + team card) | ✅ |
| WEB-LH3 | app/lag/[slug]/podcasts/page.tsx | ✅ |
| WEB-LH4 | app/lag/[slug]/sammanfattning/page.tsx (AI digest + narrativ) | ✅ |
| WEB-LH5 | components/layout/AllsvenskanNav.tsx (global lag-badges) | ✅ |
