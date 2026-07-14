# MANUAL.md — Athopia Web driftshandbok

## Kommandon

| Kommando | Vad det gör |
|----------|-------------|
| `pnpm dev` | Startar dev-server på localhost:3000 |
| `pnpm build` | Bygger produktionsapp |
| `pnpm start` | Kör produktionsbygge lokalt |
| `git add . && git commit && git push` | Commitar och pushar |

## Miljövariabler (.env.local)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/konto/logga-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/konto/skapa
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

```
# Sportmonks-synkronisering hanteras av athopia-os (separat repo).
# athopia-web läser enbart från Supabase.

## Projektstruktur

```
app/
  page.tsx              — startsida (ISR 60s)
  layout.tsx            — root layout + Clerk + fonts
  artikel/[slug]/       — artikeldetaljsida + JSON-LD
  lag/[slug]/           — lagprofil + Supabase-statistik (synkad via athopia-os)
  podcast/              — lista + [id]/episod
  prenumerera/          — Stripe Checkout (39 SEK/mån)
  konto/                — PRO-gate, Stripe Portal
  api/
    create-checkout/    — POST → Stripe Checkout Session
    webhooks/stripe/    — checkout.completed → Clerk metadata
    related/            — pgvector nearest neighbors
  sitemap.ts
  robots.ts
lib/
  supabase.ts           — createServerClient() + createBrowserClient()
  db/fixtures.ts        — Supabase-queries för matchdata (ISR-cachad)
components/ui/
  NavAuth.tsx           — Client Component, Clerk auth i navbar
  ArticleCard.tsx
  NarrativeCard.tsx
  EntityChip.tsx
  ScoreWidget.tsx
  PodcastCard.tsx
proxy.ts                — Clerk auth + PRO-gate (Next.js 16)
```

## Gotchas

### Next.js 16
- `middleware.ts` heter `proxy.ts` — felaktigt namn ger varning
- Läs `node_modules/next/dist/docs/` innan du skriver ny kod

### Clerk v7
- `SignedIn`/`SignedOut` finns INTE — använd `useAuth()` hook
- Använd `NavAuth.tsx` (Client Component) för auth-UI i navbar

### Stripe v22
- API-version: `"2026-04-22.dahlia"`
- Initieras ALDRIG på module-level — lazy init i funktionskropp

### Supabase
- Singleton på module-level ger build-fel
- Använd alltid `createServerClient()` / `createBrowserClient()` lazily
- pgvector RPC heter `match_articles` (måste skapas i Supabase)

### Tailwind v4
- Ingen `tailwind.config.ts` — konfigureras via `@theme` i `globals.css`
- CSS-token: `--color-pitch: #2D5349` (Racing Green; mörk valör `#5FA98C`)

## PRO-gate

Clerk metadata avgör PRO-status:
```ts
// Kontrollera PRO i Server Component
const { userId } = await auth()
const user = await clerkClient.users.getUser(userId)
const isPro = user.publicMetadata?.plan === 'pro'
```

Stripe webhook sätter metadata:
```ts
await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: { plan: 'pro' }
})
```

## Supabase-tabeller (förväntade)

- `articles` — id, slug, title, content, published_at, embedding (vector)
- `teams` — id, slug, name, sportsmonks_id
- `podcasts` — id, title, description, audio_url, published_at

## Deploy (Vercel)

1. `vercel env pull` — hämta env-variabler
2. `pnpm build` — verifiera lokalt
3. `git push` → auto-deploy på Vercel
4. Stripe webhook-URL: `https://athopia.se/api/webhooks/stripe`
