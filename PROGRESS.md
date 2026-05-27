# PROGRESS.md — Athopia Web

Senast uppdaterad: 2026-05-27

## Statusöversikt

### Fas 1–4: KLARA ✅
Alla routes är byggda och kompilerar rent (`pnpm build` → 0 fel).

### Fas 5: Polish & deploy (pågående)
- J-17, J-18: behöver verifieras
- J-19: Lighthouse ej kört
- J-20: Ej deployat till Vercel

---

## Kritiska fixes i J-01 (2026-05-27)

Env-diskrepanser som orsakade att all data-hämtning var trasig:

| Variabel i .env.local | Rätt namn (enl. kod) | Status |
|---|---|---|
| `SUPABASE_SERVICE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` | **Fixad** |
| `SPORTSMONKS_API_KEY` | `SPORTSMONKS_API_TOKEN` | **Fixad** (värde saknas fortfarande) |
| *(saknades)* | `NEXT_PUBLIC_BASE_URL` | **Tillagd** = `http://localhost:3000` |

### Fortfarande saknas (blockerar funktioner)
- `STRIPE_WEBHOOK_SECRET` — krävs av J-12 för webhook-verifiering i produktion
- `SPORTSMONKS_API_TOKEN` — krävs för live-matchdata; allt annat fungerar utan

---

## Beslut & arkitektur

- **proxy.ts** (inte middleware.ts) — Next.js 16-konvention. Aktiverad med `clerkMiddleware` + PRO-gate på `/konto/*`.
- **Supabase**: `createServerClient()` lazy init, `isSupabaseConfigured()` guard på alla data-anrop — appen startar utan nycklar.
- **Stripe/Clerk**: lazy init i funktionskroppar — aldrig module-level.
- **ISR revalidate:60** på startsida + matchdata, 3600 på statisk data.

---

## Nästa steg

1. Kör `nästa` → J-17 (verifiera generateMetadata på alla sidor)
2. J-18 (verifiera next/image)
3. J-19 (Lighthouse-audit)
4. J-20 (Vercel deploy med env-vars)
