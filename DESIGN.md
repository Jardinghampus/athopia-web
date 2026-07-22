# DESIGN.md — Athopia visuella system

> Läses av alla `/impeccable`-kommandon. Visuell sanning: färg, typografi,
> komponenter, rörelse. Härlett från `app/globals.css` + befintlig kod.
> Uppdaterad 2026-06-24. Kör `/impeccable document` för att uppdatera när systemet växer.

## Princip

iOS-grade fysik & hierarki, web-native beteende. **Dual-mode** (light default,
dark toggle). En accent. En radie-skala. Djup via *material* (translucent blur),
inte via tunga skuggor. Restraint > dekor.

## Färg

### Light mode (default)

| Token | Värde | Bruk |
|---|---|---|
| `--background` | `#ffffff` | Sidans bakgrund |
| `--foreground` | `#000000` | Primär text |
| `--card` | `#fafafa` | Kortytor |
| `--muted-foreground` | `#71717a` | Sekundär text, metadata |
| `--border` | `rgba(0,0,0,0.08)` | Hairlines |

### Dark mode

| Token | Värde | Bruk |
|---|---|---|
| `--background` | `#000000` | Sidans bakgrund |
| `--foreground` | `#fafafa` | Primär text |
| `--card` | `#0a0a0a` | Kortytor |
| `--muted-foreground` | `#a1a1aa` | Sekundär text |
| `--border` | `rgba(255,255,255,0.08)` | Hairlines |

### Accent (konstant, båda modes)

| Token | Värde | Bruk |
|---|---|---|
| `--color-pitch` | `#2D5349` (mörk valör `#5FA98C`) | Primär accent, Racing Green — *lugn*, ej betting-neon. Källa: `docs/brand/tokens.json` |
| `--color-pitch-dark` | `#158A63` | Hover/pressed |
| `--color-pitch-light` | `#25C48F` | Aktiv/highlight |
| `--color-pitch-muted` | `rgba(29,158,117,0.15)` | Bakgrundston |
| `--destructive` | `#ef4444` (light) / `oklch(0.65 0.22 25)` (dark) | Fel, förlust |

**Material:** `backdrop-filter: blur(20px)` + `bg: rgba(255,255,255,0.04)` +
`border: rgba(255,255,255,0.08)` → `.glass` / `.glass-card` utility.
Använd på navigation/sheets/sticky headers. Inte dekorativt.

## Typografi

| Roll | Font | Token |
|---|---|---|
| Display / rubriker | **Instrument Serif** | `font-heading`, `font-display` |
| Brödtext / UI | **Lora** (serif) | `font-sans`, `font-body` |
| Monospace | `ui-monospace` | `font-mono` |

**Notera:** fontstacken är serif-baserad (Lora + Instrument Serif) — medvetet
editorial val. Inte system-UI-neutral. Passar brand-registret.

### Fluid type-skala (`globals.css`)

| Token | Storlek | Bruk |
|---|---|---|
| `--text-display-2xl` | `clamp(2.875rem, …, 6.5rem)` | Hero rubrik |
| `--text-display-xl` | `clamp(2.75rem, …, 4.25rem)` | Sektionsrubrik |
| `--text-display-lg` | `clamp(2.25rem, …, 3.25rem)` | Stor titel |
| `--text-display-md` | `clamp(1.75rem, …, 2.25rem)` | Korttitel |
| `--text-body-fluid` | `clamp(1rem, …, 1.125rem)` | Brödtext |

h1–h3: `font-heading`, `line-height: 1.15`, `letter-spacing: -0.015em`.

## Radie & spacing

- Radie: `--radius: 0.625rem` (10px bas).
  Kort: `rounded-2xl` (20px) · Kontroller: `rounded-xl` (14px) · Pills: `rounded-full`.
- Spacing: 4pt-grid. Generös vertikal rytm i listor.
- Safe-area: `env(safe-area-inset-*)` på alla fixerade kanter.

## Rörelse

### Easing tokens (`globals.css`)

```css
--ease-out-smooth:    cubic-bezier(0.23, 1, 0.32, 1)      /* Emil Kowalski */
--ease-in-out-smooth: cubic-bezier(0.77, 0, 0.175, 1)
--ease-drawer:        cubic-bezier(0.32, 0.72, 0, 1)
```

### Motion-mönster (`lib/motion.ts`)

- **Spring-token:** `{ type:"spring", stiffness: 400, damping: 32 }` — en token, återanvänds.
- **Tap-feedback:** `whileTap={{ scale: 0.97 }}` via `<Pressable>` → haptik-känsla.
- **Sheets/modaler:** spring in, drag-to-dismiss (vaul-pattern).
- **Siffror:** `@number-flow/react` — animerar sifferbyten flytande.
- **Reduced motion:** `prefers-reduced-motion` respekteras överallt. Skeleton-våg
  pausar automatiskt. Ingenting låser innehåll bakom animation.
- **CSS utilities:** `.skeleton-wave`, `.animate-fade-up`, `.live-dot`.

## Komponentsystem (Tactile UI — byggt)

Alla i `components/ui/`:

| Komponent | Fil | Notat |
|---|---|---|
| `Card` / `TactileCard` | `TactileCard.tsx` | Material-yta, `onPress` → tap-scale |
| `ListGroup` / `ListRow` | `ListGroup.tsx`, `ListRow.tsx` | iOS-grupplistor |
| `LargeTitleHeader` | `LargeTitleHeader.tsx` | Stor titel som kollapsar vid scroll |
| `SegmentedControl` | `SegmentedControl.tsx` | Native-känsla filter |
| `TabBar` | `TabBar.tsx` | Bottom navigation |
| `Pressable` | `Pressable.tsx` | Tap-feedback wrapper |
| `TactileSheet` | `TactileSheet.tsx` | Spring-sheet / bottom drawer |
| `StatNumber` | `StatNumber.tsx` | Animerad siffra (number-flow) |
| `PullToRefresh` | `PullToRefresh.tsx` | Dra-för-uppdatera |
| `Carousel` | `Carousel.tsx` | Embla-carousel wrapper |
| `ScoreWidget` | `ScoreWidget.tsx` | Live-poäng |
| `ProGate` | `ProGate.tsx` | Paywall-gate |

Befintliga radix/shadcn-primitiver att återanvända: `Badge`, `Sheet`, `Tabs`,
`Avatar`, `ScrollArea`, `Table`, `DropdownMenu`, `Tooltip`, `Skeleton`, `Sonner`.

## Stack

```
Next.js 16.2.6 App Router    TypeScript strict
Tailwind v4                  @theme i globals.css, ingen tailwind.config.ts
React 19                     server components default
motion/react 12              animationer + spring
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
