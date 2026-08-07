# DESIGN.md — Athopia visuella system

> Läses av alla `/impeccable`-kommandon. Visuell sanning: färg, typografi,
> komponenter, rörelse. Regenererad 2026-08-07 direkt ur koden (`app/layout.tsx`,
> `app/globals.css`, `lib/nav.ts`, `lib/motion.ts`, `components/`) — inte ur
> föregående version av denna fil, som beskrev Lora/Instrument Serif. Koden kör
> Geist/Geist Mono. Varje påstående nedan är verifierat mot en filreferens.

## Princip

iOS-grade fysik & hierarki, web-native beteende. **Dual-mode** (light default,
dark toggle via `.dark`-klass, styrd av next-themes/`ThemeProvider`). En accent
— Racing Green. En radie-skala. Djup via *material* (translucent blur), inte
tunga skuggor. Restraint > dekor.

## Färg

Källa: `app/globals.css` `:root` (light, rad 120–176) och `.dark` (rad 179–233).
Yta och bläck är MEDVETET skilda tokens — se avsnittet "Yta vs bläck" nedan.

### Light mode (default)

| Token | Värde | Bruk |
|---|---|---|
| `--background` | `#FAFAF8` | Sidans bakgrund (papper) |
| `--foreground` | `#111111` | Primär text |
| `--card` | `#ffffff` | Kortytor |
| `--muted` | `#F3F2F0` | Dämpad yta |
| `--muted-foreground` | `#6E6D6A` | Sekundär text, metadata (4.6–5.2:1) |
| `--border` / `--input` | `#E2E0DC` | Hairlines, fält |
| `--destructive` | `#D61F1F` | Fel, förlust |
| `--success` | `#0B5C43` | ENDAST positiv status (form, avklarat) |

### Dark mode (true black)

| Token | Värde | Bruk |
|---|---|---|
| `--background` | `#000000` | Sidans bakgrund |
| `--foreground` | `#F4F4F2` | Primär text |
| `--card` | `#1B1B1C` | Kortytor |
| `--muted` | `#151516` | Dämpad yta |
| `--muted-foreground` | `#8A8A87` | Sekundär text (5.0–6.1:1) |
| `--border` / `--input` | `#2C2C2E` | Hairlines, fält |
| `--destructive` | `#FF453A` | Fel, förlust |
| `--success` | `#25C48F` | ENDAST positiv status; text ovanpå = `--success-foreground` (`#0A1A14`, 10.6:1) |

### Accent — Racing Green (`docs/brand/BRAND.md`, brand 1.1)

| Token | Ljust värde | Mörkt värde | Bruk |
|---|---|---|---|
| `--color-pitch` | `#2D5349` | `#2D5349` | YTA: `bg-pitch`/`border-pitch` (med vit text) |
| `--color-pitch-dark` | `#1E3A32` | `#1E3A32` | Mörkare pitch-yta (t.ex. `pitch-gradient`) |
| `--color-pitch-light` | `#5FA98C` | `#5FA98C` | Ljusare pitch-yta/hover |
| `--pitch-ink` → `--color-pitch-ink` | `#2D5349` (7.4:1 på `#FAFAF8`) | `#5FA98C` (7.9:1 på `#000`) | BLÄCK: text-på-bakgrund, växlar per tema |
| `--color-pitch-muted` | `rgba(45,83,73,.12)` | samma | Bakgrundston |

**Yta vs bläck (bindande, `globals.css` rad 33–37, CLAUDE.md §5):** `--color-pitch`
är en fast hex som INTE växlar med temat — som text på mörk bakgrund ger den
2.0–2.45:1, långt under AA. Text på sidbakgrund använder alltid `text-pitch-ink`
(eller `text-pitch-dark`/`text-pitch-light` — se nedan, dessa är LIKA fasta och
förbjudna som text). Ytklasser (`bg-pitch`, `border-pitch`, `bg-pitch-dark`) är
fortsatt korrekta. Källkodsvakten `tests/e2e/contrast.spec.ts` failar bygget vid
`text-pitch`, `text-pitch-light` eller `text-pitch-dark` som textklass.

Samma mönster för klubbfärger: `getTeamAccent()` = yta, `getTeamInk()` +
`.team-ink`-klassen (globals.css rad 456–461) = bläck som växlar med temat.

**Statusfärger overridade per tema** (samma "yta ≠ bläck som text på egen tint"-
problem som pitch): `--red-300/400`, `--destructive-ink`, `--emerald/amber/
orange/blue/purple-400` — se `globals.css` rad 48–65 (definitioner) och
rad 151–161/208–219 (per-tema-värden).

**Material:** `.glass`/`.glass-card` (globals.css rad 292–298) —
`backdrop-filter: blur(20px)`, `background: rgba(255,255,255,.04)`,
`border: rgba(255,255,255,.08)`. Används på GlassNav/sheets/sticky headers.

## Typografi

| Roll | Font | Token | Källa |
|---|---|---|---|
| Rubriker & brödtext | **Geist** (`next/font/google`) | `font-sans`, `font-body`, `font-heading`, `font-display` | `app/layout.tsx` rad 17–21, `globals.css` rad 79–82 |
| Monospace / data | **Geist Mono** | `font-mono` | `app/layout.tsx` rad 23–27, `globals.css` rad 83 |

Alla fyra semantiska fontroller (`--font-sans/body/heading/display`) pekar på
samma `--font-geist`-variabel — det finns bara en typsnittsfamilj i systemet,
ingen serif. `Inter`/`system-ui` är fallback-stacken, inte aktiv font.

### Optisk tracking (`globals.css` rad 86–91) — justera aldrig fritt

| Token | Värde | Bruk |
|---|---|---|
| `--tracking-caption` | `0.01em` | Liten text |
| `--tracking-eyebrow` | `0.06em` | Eyebrows/etiketter |
| `--tracking-ui` | `-0.006em` | UI-element |
| `--tracking-body` | `-0.011em` | Brödtext (satt på `body`) |
| `--tracking-heading` | `-0.017em` | h1–h3 (satt i `@layer base`) |
| `--tracking-display` | `-0.022em` | Display-storlekar |

### Fluid type-skala (`globals.css` rad 93–111)

| Token | Storlek | line-height |
|---|---|---|
| `--text-display-2xl` | `clamp(2.875rem, 1.9rem + 5vw, 6.5rem)` | 1.08 |
| `--text-display-xl` | `clamp(2.75rem, 2.05rem + 3.5vw, 4.25rem)` | 1.1 |
| `--text-display-lg` | `clamp(2.25rem, 1.8rem + 2.25vw, 3.25rem)` | 1.12 |
| `--text-display-md` | `clamp(1.75rem, 1.55rem + 1vw, 2.25rem)` | 1.2 |
| `--text-body-fluid` | `clamp(1rem, 0.94rem + 0.3vw, 1.125rem)` | 1.72 |

h1–h3 (`@layer base`, rad 268–273): `font-heading`, `font-weight: 600`,
`line-height: 1.15`, `letter-spacing: var(--tracking-heading)`.

## Radie & spacing

- `--radius: 0.75rem` (light+dark, `globals.css` rad 166/222).
  `--radius-sm` = `0.6×`, `--radius-md` = `0.8×`, `--radius-lg` = `1×`,
  `--radius-xl` = `1.4×` (rad 74–77).
- Spacing: Tailwind 4pt-grid, ingen egen skala definierad.
- Safe-area: `viewportFit: "cover"` i `app/layout.tsx` (rad 60–61) + skip-länk
  och GlassNav använder `env(safe-area-inset-*)`.

## Rörelse

### Easing tokens (`globals.css` rad 113–116)

```css
--ease-out-smooth:    cubic-bezier(0.23, 1, 0.32, 1)      /* Emil Kowalski */
--ease-in-out-smooth: cubic-bezier(0.77, 0, 0.175, 1)
--ease-drawer:        cubic-bezier(0.32, 0.72, 0, 1)
```

### Spring-tokens (`lib/motion.ts` rad 35–53)

Tre presets, inte en enda global token:

| Preset | stiffness | damping | Bruk |
|---|---|---|---|
| Snabb/tap | 500 | 30 | Standard tap-feedback |
| Standard | 400 | 32 | Vanligast — motsvarar "en spring-token" i tidigare dokumentation |
| Mjuk | 200 | 26 | Pull-to-refresh, större element |

### CSS-animationer (`globals.css` `@layer utilities`, rad 286–394)

- `.animate-fade-up` / `.page-enter` — 240–280ms fade+translateY, används vid
  listor och sidövergångar (`app/(app)/template.tsx`).
- `.skeleton-wave` — vänster→höger shimmer, 1.6s.
- `.animate-marquee` — 36s linjär, landningssidans klubbrad.
- `.live-dot` — pulserande punkt för LIVE-status.
- Alla ovan har `@media (prefers-reduced-motion: reduce)`-avstängning.

## Navigation (verifierad — inte TabBar)

Källa: `lib/nav.ts` (enda nav-config-filen).

- **`BOTTOM_NAV_ITEMS`** (5 flikar): Mitt lag, Flöde, Allsvenskan, Matcher, AI.
  Renderas av `components/layout/GlassNav.tsx` (mobil botten, `.glass`-material)
  och `components/layout/MobileNav.tsx` (drawer/overflow).
- **`SIDEBAR_NAV_ITEMS`**: botten + Forum, Statistik, Daily, Analys. Renderas
  av `components/layout/AppSidebar.tsx` (desktop).
- **`SECONDARY_NAV_ITEMS`**: overflow-listan på `/mer` och i hamburgermenyn.
- `components/ui/TabBar.tsx` och `components/ui/tubelight-navbar.tsx` fanns
  tidigare i `components/ui/` men importerades av ingen produktyta — borttagna
  2026-08-07 (WP0). `components/landing/phone/screens.tsx` har en egen lokalt
  definierad `TabBar`-funktion för telefonmockupen; den är oberoende av de
  borttagna filerna.

## Komponentsystem (verifierad filinventering `components/ui/`, 2026-08-07)

Ingen egen namngiven "Tactile UI"-svit i separat dokumentation — nedan är den
faktiska filinventeringen, grupperad efter roll.

**Layout/nav** (i `components/layout/`, inte `components/ui/`): `GlassNav.tsx`,
`AppSidebar.tsx`, `MobileNav.tsx`, `Header.tsx`, `Footer.tsx`, `CommandPalette.tsx`,
`AllsvenskanMobileSelect.tsx`, `ThemeProvider.tsx`.

**`components/ui/` — egna (icke-shadcn):**

| Komponent | Fil |
|---|---|
| `TactileCard` | `TactileCard.tsx` |
| `ListGroup` / `ListRow` | `ListGroup.tsx`, `ListRow.tsx` |
| `LargeTitleHeader` | `LargeTitleHeader.tsx` |
| `SegmentedControl` | `SegmentedControl.tsx` |
| `Pressable` | `Pressable.tsx` |
| `TactileSheet` | `TactileSheet.tsx` |
| `StatNumber` | `StatNumber.tsx` (number-flow) |
| `PullToRefresh` | `PullToRefresh.tsx` |
| `Carousel` | `Carousel.tsx` (embla) |
| `ScoreWidget` | `ScoreWidget.tsx` |
| `ProGate` | `ProGate.tsx` |
| `ArticleCard`, `NarrativeCard`, `PodcastCard` | egna kortvarianter |
| `EntityChip`, `SourceBadge`, `TrendBadge`, `SentimentBar` | domänspecifika badges |
| `NewsFilterPanel`, `FixturesTicker`, `TeamSelectionModal` | feature-specifika |
| `ThemeToggle`, `NavAuth`, `AppBreadcrumbs`, `ShareButton`, `CollapsibleSection` | utility |
| `expandable-tabs`, `bento-grid`, `display-cards`, `wavy-background`, `highlighter`, `animated-hero`, `ai-input-with-loading` | landningssidan/marknadsföring |

**shadcn/radix-primitiver** (lowercase-filnamn i `components/ui/`): `avatar`,
`badge`, `breadcrumb`, `button`, `card`, `chart`, `dropdown-menu`, `scroll-area`,
`separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `table`, `tabs`, `textarea`,
`tooltip`.

## Stack

```
Next.js 16.2.6 App Router    TypeScript strict
Tailwind v4                  @theme i globals.css, ingen tailwind.config.ts
React 19                     server components default
motion/react                 animationer + spring (lib/motion.ts)
@number-flow/react           animerade siffror
embla-carousel-react         karuseller
@tanstack/react-query 5      client-side data fetching
radix/shadcn                 baskomponenter
vaul                         sheet/drawer (drag-to-dismiss)
Clerk v7                     auth
Stripe v22                   betalningar
Supabase                     databas
Sentry                       felövervakning
```
