# DESIGN.md — Athopia visuella system

> Läses av alla `/impeccable`-kommandon. Visuell sanning: färg, typografi,
> komponenter, rörelse. Härlett från `app/globals.css` + befintlig kod.
> Kör `/impeccable document` för att uppdatera när systemet växer.

## Princip

iOS-grade fysik & hierarki, web-native beteende. Dark-first. En accent. En
radie-skala. Djup via *material* (translucent blur), inte via tunga skuggor.
Restraint > dekor.

## Färg

| Token | Värde | Bruk |
|---|---|---|
| `--background` | `#0A0A0A` | App-bakgrund (dark-first) |
| Card / surface | `bg-card` / `white/[0.025]` | Kortytor |
| Accent (pitch) | `#1D9E75` | Primär accent — *lugn*, ej betting-neon |
| pitch-light | ljusare grön | Hover/aktiv |
| Hairline | `border-white/[0.06]` | Separatorer (1px) |
| Text | `white` / `white/55` / `white/35` | Primär / sekundär / tertiär |
| Fara | `red-500` | Förlust, fel |

Material: `backdrop-blur` på navigation/sheets/sticky headers (iOS "materials").
Använd `color-mix`/opacitet, inte solida paneler.

## Typografi

- **Bebas Neue** (`font-heading`) — endast brand/display (landning, stora rubriker).
  *Ej* app-chrome (för condensed/un-native för listor).
- **App-chrome:** system-stack → renderar San Francisco på iOS/Safari:
  `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui`.
- **DM Sans** — befintlig brödtext, kvar där den sitter.

Fluid type-skala (finns i `globals.css`): `--text-display-2xl … -md`,
`--text-body-fluid`. iOS-skala att matcha för product surface:
large-title ~34, title ~22–28, body 17, footnote 13.

## Radie & spacing

- Radie: kort 16–20px (`rounded-2xl`), kontroller 12px, pills full.
- Spacing: 4pt-grid. Generös vertikal rytm i listor.
- Safe-area: `env(safe-area-inset-*)` på alla fixerade kanter (redan i bruk).

## Rörelse

- Spring-token (en, återanvänds): `{ type:"spring", stiffness: 400, damping: 32 }`.
- Tap-feedback: scale `0.97` (pressable) → "haptik-känsla".
- Sheets/modaler: spring in, drag-to-dismiss.
- Respektera `prefers-reduced-motion` överallt (skeleton-vågen gör redan det).
- Befintligt: `motion/react`, `.skeleton-wave`, `.animate-fade-up`, `.live-dot`.

## Komponentsystem (Tactile UI — byggs i Phase 1)

Nya, i `components/ui/` (web-native, iOS-grade känsla):
`SegmentedControl`, `Sheet` (vaul), `ListGroup`/`ListRow`, `Card`, `Pressable`,
`LargeTitleHeader`, `TabBar`, `StatNumber` (number-flow), `PullToRefresh`.
Befintligt att återanvända: `Skeleton` (våg), `sonner`, `cmdk`, radix-primitiv.

## Stack

Next.js 16 App Router · TypeScript strict · Tailwind v4 (`@theme` i globals.css,
ingen config-fil) · React 19 · server components default · `motion/react` ·
radix/shadcn. Lägg till: `vaul`, `@tanstack/react-query`, `number-flow`,
`embla-carousel-react`, `tailwind-variants`.
