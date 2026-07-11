@AGENTS.md

# ATHOPIA WEB — operativ konstitution

> Uppdaterad 2026-07-10. Detta är den enda regel-filen för athopia-web.
> Läs den innan du ändrar produktbeteende. AGENTS.md kompletterar med data-regler.

## 1. Vad detta repo är

Publik produkt på **athopia.se** — premium svensk fotbollsplattform (nyhetsfeed,
lag-hubbar, statistik, matchsidor, forum, podcast, AI-funktioner, prenumerationer).
All data kommer från Supabase, producerad av `athopia-os`. Web läser, visar och
monetiserar — den ingesterar aldrig.

Kvalitetsbar: snabb, mobil-först, redaktionellt trovärdig, premium men inte
corporate. Ingen "generic dashboard"-UI: varje yta ska svara på en riktig
supporterfråga (nästa match, form, tabelläge, transfersignal).

## 2. Stack (verifierad mot package.json)

- Next.js 16.2.6 App Router · React 19 · TypeScript strict
- Tailwind v4 (`@theme` i `app/globals.css` — INGEN tailwind.config.ts) · shadcn/ui · Base UI · motion
- Clerk v7 (auth + plan i `publicMetadata.plan`) · Stripe v22 · Supabase JS v2
- Vercel AI SDK v7 (`ai`, `@ai-sdk/anthropic`) för AI-features
- Sentry · Upstash ratelimit/redis · web-push (VAPID) · Playwright e2e
- pnpm. OBS: Next 16 skiljer sig från träningsdata — läs `node_modules/next/dist/docs/` vid tvekan.

## 3. Arkitekturkarta

```
proxy.ts                  — route-skydd (Next 16-konvention, INTE middleware.ts)
app/page.tsx              — landing (copy från landing_copy-tabellen med statisk fallback)
app/(app)/                — produktytor: feed, nyheter, lag, spelare, match, statistik,
                            mitt-lag, daily, analys, forum, podcast, elite, prenumerera,
                            konto/profil, mer (nav-flik 4)
app/(onboarding)/         — onboarding-wizard efter signup
app/api/                  — route handlers: feed, team, match, stats, standings, scores,
                            forum, daily, elite, push, webhooks (clerk/stripe), create-checkout
app/actions/              — server actions
lib/supabase.ts           — createServerClient (service role, server-only) +
                            createBrowserClient (anon key); typer i types/supabase
lib/access-rules.ts       — Plan + ACCESS-map (single source för feature-gating)
lib/user-plan.ts          — getUserPlan() — ALLTID server-side
lib/nav.ts                — EN nav-config för alla 4 flikar (Hem/Mitt lag/Statistik/Mer)
components/               — feature-mappar (feed, match, team-hub, news, landing, ui …)
                            PaywallGate.tsx + UpgradePrompt.tsx för gating-UI
```

Ny kod läggs i befintlig feature-mapp. Skapa inte parallella mönster —
återanvänd `lib/`-helpers och komponentmapparna som finns.

## 4. Hårda regler (bryt aldrig)

- **INGEN admin i athopia-web.** Admin = athopia-admin (os.athopia.se). Backend
  (RSS, agenter, Sportmonks-sync) = athopia-os. Web = publik visning enbart.
- **proxy.ts, inte middleware.ts.**
- **Lazy init** för Stripe, Clerk och Supabase i function bodies — ALDRIG module-level.
- **Service-role-klienten aldrig i client components.** Client components använder
  `createBrowserClient` (anon + RLS).
- **`getUserPlan()` körs alltid på servern.** Paywall-beslut aldrig client-side;
  `PaywallGate` används i server components.
- **Sport-separation:** `.eq('sport', SPORT)`-filtret på alla Supabase-queries.
- **Anropa aldrig Sportmonks direkt.** Konsumera normaliserad data via Supabase.
- **xG/pressure visas bara när riktiga syncade värden finns.** Aldrig placeholder
  `0.00 xG`, aldrig påhittad xA — dölj fältet i stället.
- **Publicera aldrig tredjeparts brödtext/teaser ordagrant.** Endast titel +
  källnamn + länk + egenskriven text (upphovsrätt).
- **ISR:** `revalidate: 30` nyhetsflöde, `60` matcher/standings/artiklar, `3600` statisk spelardata.
- Server components som default; `"use client"` bara när det behövs.
- `generateMetadata()` på alla sidor; alla bilder via `next/image`.
- Ingen auth-läsning i render-vägen som tvingar routes dynamic i onödan
  (LCP-regressioner har fixats för detta — se commits 46dc3a8, 97e8cb6).
- Priser: Free 0 / PRO 89 kr/mån / Elite 169 kr/mån, 25% rabatt årsvis.

### Regler ur korrigeringshistorik (detaljer i workspace-rotens LESSONS.md)

- **Ingen mock-/demodata på publika ytor, någonsin.** Demo IF, mock-lag och
  hårdkodade badges har rensats tre gånger — leta och ta bort, lägg aldrig till.
- **Slugs kommer från `entities.slug`** — aldrig ad-hoc `slugify()` av namn.
- **Verifiera att kolumnen/vyn du selectar faktiskt finns** (genererade typer eller
  SQL) — Supabase-js felar tyst och `catch { return [] }` döljer det; gav tomma
  lag-chips, tom H2H och trasig sitemap i produktion.
- **Varje Anthropic-anrop i web behöver egen hard-cap/budgetvakt** (forum-summarize-
  mönstret, commit 30d1255) — withBudget finns bara i os.
- **Före push: kolla otrackade filer som importeras** — en otrackad lib-fil bröt
  Vercel-bygget (3119050).
- **Objektnycklar av heltalstyp sorteras numeriskt i JS** — säsongsval via
  `Object.keys()` gav fel säsong i skytteligan (fb91b81); sortera explicit.

## 5. Design

- Brandbok: workspace-rotens `docs/brand/BRAND.md` (+ `tokens.json`) — single source of truth.
- Geist rubriker + brödtext · Geist Mono för data/siffror (tabular-nums) · optisk tracking
  via `--tracking-*`-tokens — justera aldrig letter-spacing fritt.
- Accent = Racing Green `#2D5349` (`--color-pitch`; ljus valör `#5FA98C` på mörkt). Röd ENDAST
  destructive/fel. Success-grön `#12805F` ljust / `#25C48F` mörkt = ENDAST status (`--color-success`).
  95 % av UI:t neutralt; accent bara för handling (CTA, aktiv tab, aktiv chart-serie).
- Light `#FAFAF8` (papper) · dark true black `#000000` med ytor `#151516`–`#222224`.
- Native-feel-initiativet gäller: iOS-grade känsla, se `NATIVE-FEEL-PLAN.md` och
  `WEB-IA-STRUKTUR.md` (4-fliks-IA). Följ befintliga komponentmönster i `components/ui`.
- Loading/empty/error-states är obligatoriska på nya datavyer.

## 6. AI-agent-arbetsflöde

1. **Inspektera först.** Läs filerna du ska ändra + deras callers. Gissa aldrig
   konventioner — kopiera dem från grannkoden.
2. **Planera kort** (3–6 rader) innan icke-triviala ändringar.
3. **Små ändringar.** En feature/fix per commit. Rör inte orelaterade filer.
4. **Verifiera:** `pnpm typecheck` alltid; `pnpm build` (eller `rtk next build`)
   före push; `pnpm test:e2e` när flöden ändras; visuell kontroll vid UI-ändringar
   (gstack `/qa` för synliga statistikytor).
5. **Rapportera:** filer ändrade, vad som verifierats, kända begränsningar.
   Hoppa aldrig tyst över ett krav — flagga det.

### Definition of done
- [ ] Kravet implementerat utan tysta scope-ändringar
- [ ] Inga orelaterade diffar
- [ ] `pnpm typecheck` grönt, build grön
- [ ] Loading/empty/error/mobil kontrollerat för UI-ändringar
- [ ] Paywall/plan-logik testad som free + pro
- [ ] Edge cases nämnda, begränsningar listade
- [ ] Ändrade filer summerade

## 7. Kommando-protokoll

"nästa" → kör nästa jobb i NEXT.md · "status" → visa progress ·
"kolla" → pnpm build + rapportera · "commit" → git add/commit/push

Efter varje avslutat NEXT.md-jobb: uppdatera PROGRESS.md, committa, kör `/compact`
(ALDRIG `/clear` — det raderar kontexten), rapportera och vänta på input.

## 8. Öppna frågor
- `middleware`/auth-täckning för `/admin/*`-routes under `app/api/admin` — verifiera
  skydd innan nya admin-nära endpoints läggs till (admin ska egentligen inte finnas här alls).

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

**Always prefix commands with `rtk`** — dedicated filter om det finns, annars passthrough. Gäller även i `&&`-kedjor.

Vanligast här: `rtk next build` · `rtk tsc` · `rtk lint` · `rtk vitest`/`rtk playwright test` ·
`rtk git status|log|diff|add|commit|push` · `rtk pnpm install|list` · `rtk gh pr view|checks` ·
`rtk ls` · `rtk grep` · `rtk curl`. Meta: `rtk gain` för besparingsstatistik.
<!-- /rtk-instructions -->
