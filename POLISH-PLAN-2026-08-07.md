# POLISH-PLAN 2026-08-07 — athopia-web

> Full audit (impeccable) + exekveringsplan för billiga Sonnet-agenter.
> Mandat: **enbart polish**. Designen är älskad som den är — inga omgörningar,
> inga nya mönster, inga layoutbyten. Små detaljer: färger, typsnitt, rubriker,
> storlekar, states, konsekvens. Lämna inget åt slumpen.
>
> Bas: UX-AUDIT-2026-08-03.md (forum-500, skip-link, kontrast, fokusfällor —
> ALLT DÄR ÄR REDAN FIXAT, gör inte om det). Detta dokument tar vid efter den.

---

## Audit-sammanfattning (verifierad mot koden 2026-08-07)

| # | Dimension | Poäng | Nyckelfynd |
|---|-----------|-------|-----------|
| 1 | Accessibility | 3/4 | Grundjobbet gjort 08-03; kvar: 161 st text under 12px att triagera, `text-pitch-dark` som textfärg (kringgår kontrastvakten) |
| 2 | Performance | 3/4 | Bara 8 `loading.tsx` på 58 routes; inga route-nära error boundaries |
| 3 | Responsive | 3/4 | Struktur OK (GlassNav/sidebar/drawer); per-route mobilsvep ej gjort sedan IA-bytet till 5 flikar |
| 4 | Theming | 2/4 | ~30 hårdkodade hex i komponenter; klubbfärger duplicerade i OnboardingLeaguePicker i stället för `getTeamAccent()` |
| 5 | Anti-patterns | 4/4 | Rent — ingen gradient-text, inga eyebrows, designen är egen |
| **Totalt** | | **15/20** | God — åtgärda svaga dimensioner (theming + states) |

**Systemfynd (viktigast):**

1. **DESIGN.md ljuger.** Den beskriver Lora + Instrument Serif; koden kör Geist +
   Geist Mono (app/layout.tsx, globals.css `--font-display: var(--font-geist)`).
   Alla agenter som läser DESIGN.md får fel sanning → första jobbet är att
   regenerera den.
2. **Döda nav-komponenter.** `components/ui/TabBar.tsx` och
   `components/ui/tubelight-navbar.tsx` importeras inte av någon produktyta
   (GlassNav äger botten, AppSidebar desktop, MobileNav drawer). Död kod som
   lurar agenter att "fixa" fel nav.
3. **Token-läckage.** Hårdkodade hex där tokens finns:
   `elite/chat/page.tsx:8` + `components/ai/CompactChatPanel.tsx:11` (`BRAND='#2D5349'`),
   `feed/FeedClient.tsx:27-29` (kategori-färger), `match/[id]/LiveMatchClient.tsx:53`
   (`#3B82F6`), `statistik/spelare/PlayerCompareClient.tsx:20`,
   `CookieBanner.tsx:107` (`hover:bg-[#18876A]`), `gamification/IQRatingWidget.tsx`,
   `gamification/OnboardingLeaguePicker.tsx:8-20` (13 klubbfärger hårdkodade,
   flera klubbar felaktigt samma blå — ska komma från `getTeamAccent()`).
4. **Metadata-luckor.** Saknar `generateMetadata`/`metadata`:
   `/ai`, `/dashboard`, `/elite/chat`, `/nyheter/transferer`, `/statistik/[teamSlug]`.
5. **States-täckning.** 8 `loading.tsx` på 58 sidor; endast rot-`error.tsx` och
   rot-`not-found.tsx`. Datavyer utan loading får layoutskift.
6. **Nav-detalj.** `SECONDARY_NAV_ITEMS` innehåller `/mer` — dvs. Mer-sidan
   listar sig själv i sin egen overflow. Tas bort ur listan på Mer-sidan.
7. **Typografi-drift.** Godtycklig `tracking-[0.14em]`/`tracking-[0.18em]` i
   landing i stället för `--tracking-*`-tokens (CLAUDE.md §5: "justera aldrig
   letter-spacing fritt").
8. **`text-pitch-dark` som bläck** i `components/landing/phone/screens.tsx` —
   yta-token som text; vakten i `contrast.spec.ts` fångar bara `text-pitch`.

**Positivt (rör ej):** en nav-config (`lib/nav.ts`), yta/bläck-tokensystemet,
GlassNav med etiketter, skip-link, spring-motion-tokens, `getTeamInk()`-mönstret,
5-fliks-IA:n. Detta är stommen — polishen ska förstärka, inte ändra.

---

## Arbetspaket för Sonnet-agenter

Regler för VARJE paket (klistra in i agent-prompten):

```
Du polerar athopia-web. Läs CLAUDE.md + DESIGN.md först. ENDAST polish —
ändra aldrig layout, IA, komponentval eller copy-ton. Minsta möjliga diff.
Yta vs bläck: text på bakgrund = *-ink-tokens, aldrig text-pitch/text-pitch-dark.
Inga nya beroenden. Ingen mock-data. Verifiera: pnpm typecheck && pnpm build.
Rapportera: filer ändrade + vad som verifierats + vad som hoppats över och varför.
```

### WP0 — Sanera sanningen (kör FÖRST, blockerar övriga)
- Regenerera `DESIGN.md` från koden (Geist/Geist Mono, aktuella tokens ur
  `app/globals.css`, aktuell komponentlista — GlassNav/AppSidebar/MobileNav,
  inte TabBar).
- Ta bort `components/ui/TabBar.tsx` + `components/ui/tubelight-navbar.tsx`
  (verifiera noll imports först: `grep -rn "TabBar\|tubelight" app components`).
- Utöka vakten i `tests/e2e/contrast.spec.ts` (eller motsvarande källkodsvakt)
  till att även faila på `text-pitch-dark` och `text-pitch-light`.
- Uppskattning: 1 agent, liten.

### WP1 — Tokenisera färger
- Ersätt varje hårdkodad hex i systemfynd 3 med token/`getTeamAccent()`:
  - `BRAND`-konstanterna → `var(--color-pitch)`.
  - Feed-kategorifärger → nya semantiska tokens i `globals.css`
    (`--color-cat-forum` osv.) med dark-mode-valörer + kontrollerad kontrast.
  - `OnboardingLeaguePicker` → hämta färg via `getTeamAccent(slug)`; ta bort
    den duplicerade listan.
  - `CookieBanner` hover → `hover:bg-pitch-dark`.
  - `#3B82F6` (LiveMatchClient + PlayerCompareClient) → en gemensam
    `--color-away`/jämförelse-token, definierad en gång.
- Byt `text-pitch-dark` → korrekt ink-token i `landing/phone/screens.tsx`.
- Verifiera kontrast (4.5:1 text / 3:1 stora element) i BÅDA teman för varje
  ersatt färg — använd contrast-checker, gissa inte.
- Uppskattning: 1 agent, medel.

### WP2 — Typografi & rubriker
- Byt `tracking-[0.14em]`/`tracking-[0.18em]` → närmaste `--tracking-*`-token
  (lägg till token om den saknas, ändra inte det optiska utseendet).
- Svep alla 58 sidor: exakt en `h1` per sida, inga rubriknivåhopp
  (h1→h3), `text-wrap: balance` på h1–h3 där det saknas.
- Triagera de 161 förekomsterna av `text-[8-11px]`: undanta
  `components/landing/phone/*` (miniatyr-mockup, avsiktlig). Övriga: lyft till
  `text-xs` (12px) om det är läsbar text; behåll endast för ren dekor.
- Siffror/data: kontrollera `font-mono` + `tabular-nums` på alla tabeller,
  poäng och statistik (Geist Mono-regeln i CLAUDE.md §5).
- Uppskattning: 1–2 agenter, medel.

### WP3 — Metadata & SEO-detaljer
- `generateMetadata` på de 5 sidorna i systemfynd 4 (title + description på
  svenska, samma tonalitet som befintliga sidor; dynamisk för
  `/statistik/[teamSlug]`).
- Kontrollera `openGraph`-bild + canonical på lag-/spelare-/artikelsidor.
- Uppskattning: 1 agent, liten.

### WP4 — States: loading/error/empty
- `loading.tsx` (skeleton, inte spinner — använd befintliga `.skeleton-wave`/
  `Skeleton`) för datatunga route-grupper som saknar: `lag/[slug]/*`,
  `statistik/*`, `allsvenskan/*`, `match/*`, `nyheter`, `forum/*`, `analys`.
  Skelettet ska spegla den faktiska layouten (inga generiska boxar).
- `error.tsx` per route-grupp `(app)` minst — svensk copy, retry-knapp,
  samma visuella språk som `not-found.tsx`.
- Empty states: svep datavyer efter "inget här"-text; varje empty state ska
  säga vad ytan gör + nästa steg (aldrig bara "Ingen data").
- Uppskattning: 2 agenter (dela: lag+statistik / resten), medel-stor.

### WP5 — Per-route mobil- & desktop-svep (schemat)
Kör Playwright-svepet från 08-03-metoden igen (390×844 + 1440×900) över ALLA
58 routes och åtgärda per sida:
- horisontell overflow, träffytor <44px, klippta rubriker, GlassNav som
  skymmer innehåll (kolla `pb-20` räcker på långa sidor med sticky-element),
- dark mode-genomgång per sida (inga "glömda" ytor, hairlines, hover-states),
- fokusindikatorer på alla interaktiva element.
Ordning (värde först): `/mitt-lag` → `/nyheter` → `/allsvenskan/*` → `/match/*`
→ `/lag/[slug]/*` → `/statistik/*` → `/prenumerera` (paywall ska se värd ut,
PRODUCT.md-princip 4) → `/forum/*` → resten.
- Uppskattning: 2 agenter, stor. Kräver dev-server; se upp för zombie-servrar
  på port 3000 (kolla portägaren först) och kör helst mot prodbygge
  (`pnpm build && pnpm start`) — `next dev` har gett falska fel.

### WP6 — Nav-finlir
- Ta bort `/mer` ur listan som renderas på själva Mer-sidan (systemfynd 6).
- Verifiera aktiv-markering i GlassNav/AppSidebar för djupa rutter
  (`/lag/[slug]/analys` ska markera Mitt lag/rätt flik? — bestäm mot
  WEB-IA-STRUKTUR.md, dokumentera valet).
- Kontrollera att `/dashboard`, `/profil`, `/skriv`, `/kronika` nås från någon
  yta (inga föräldralösa sidor) — annars länka från Mer eller Konto.
- Uppskattning: 1 agent, liten.

## Schema

| Dag | Paket | Parallellt? |
|-----|-------|-------------|
| 1 fm | WP0 | Nej — blockerar allt |
| 1 em | WP1 + WP3 | Ja (olika filer) |
| 2 | WP2 + WP6 | Ja |
| 3 | WP4 (två agenter) | Ja |
| 4–5 | WP5 (två agenter) | Ja |
| 5 em | Slutverifiering | — |

**Slutverifiering (en agent):** `pnpm typecheck && pnpm build && pnpm test:e2e`,
kör om Playwright-svepet, diffa mot denna fil, uppdatera PROGRESS.md.
Commit per paket, push till `Jardinghampus/athopia-web`.

## Får INTE göras
- Byta fonter, färgskala, radie, IA, komponentbibliotek.
- Lägga till dependencies, nya "förbättrade" mönster, cards-i-cards.
- Röra paywall-logik (`getUserPlan` server-side), sport-filter, ISR-tider.
- Mock-data, placeholder-nollor (xG-regeln), tredjeparts brödtext.
- Fixa om saker som stängdes i UX-AUDIT-2026-08-03.md.
