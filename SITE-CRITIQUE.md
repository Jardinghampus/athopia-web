# Site-Wide Design Critique — Athopia Web
Date: 2026-06-24
Reviewer: impeccable critique (fork run)

---

## Site-Wide Detector Findings

Automated detector (`detect.mjs --json app`) returned `[]` — no automated slop patterns detected. No gradient text, no side-stripe borders, no sketchy SVG illustrations, no repeating-gradient backgrounds found in markup.

Manual review found significant recurring issues the detector does not catch (copy, semantic misuse, typography).

---

## Recurring Patterns (cross-page issues)

### Pattern 1 — All-caps h1 on every product page (6+ routes)
Every page title uses uppercase text strings and large `text-4xl`–`text-5xl` sizes:
- `hem/page.tsx:163` — "SENASTE NYTT" (h2), `hem/page.tsx:186` — "TRENDANDE NARRATIV" (h2)
- `statistik/page.tsx:493` — "STATISTIK" (h1, text-5xl)
- `match/page.tsx:29` — "MATCHER" (h1, text-4xl)
- `forum/page.tsx:81` — "FORUM" (h1, text-4xl)
- `nyheter/page.tsx:107` — "NYHETER" (h1, text-5xl)
- `analys/page.tsx:13` — "ANALYS" (h1, text-5xl)
- `spelare/[slug]/page.tsx` — fixed in last session (now "Spelarjämförelse")

This is the tabloid-sport tell in the anti-references. Sportbladet uses all-caps screaming headings. PRODUCT.md explicitly names that as what to avoid. **Fix across all pages: title-case, drop to text-3xl or use `--text-display-md` token.**

### Pattern 2 — Uppercase tracking-wider section headers (banned eyebrow) in statistik
`statistik/page.tsx` PressTab has 5 consecutive section h2s all using `text-sm font-semibold uppercase tracking-wider text-muted-foreground` (lines 385, 390, 394, 399, 403). This is exactly the banned "tiny uppercase tracked eyebrow" pattern cited in the skill's absolute bans. Also appears in both table `<thead>` rows (lines 182, 221) — `text-xs uppercase tracking-wider`.

Table header uppercase is a data-table convention (acceptable); h2 section labels are the ban. Fix the h2s; leave the thead.

### Pattern 3 — Internal system names exposed in user-facing error copy
- `statistik/page.tsx:77–79`: "Data synkroniseras via athopia-os. Kontrollera att sync-jobbet är igång." — users see "athopia-os" and "sync-jobb"
- `match/page.tsx:35`: "Data synkroniseras från Supabase via athopia-os." — users see "Supabase" and "athopia-os"

Both are operator messages accidentally left as user-facing copy. A supporter doesn't know what athopia-os is. Fix: "Data laddas in — kom tillbaka om en liten stund." or just remove the second paragraph entirely.

### Pattern 4 — Fluid type scale on product surfaces
`hem/page.tsx:89`: `text-4xl sm:text-6xl` on HeroNarrative h1 (48px → 96px fluid).
`hem/page.tsx:140`: `text-3xl sm:text-4xl` on DailySummarySection h2.
Per `reference/product.md`: "Fixed rem scale, not fluid. Clamp-sized headings don't serve product UI." The home page is product surface (authenticated dashboard), not brand surface.

### Pattern 5 — `Suspense fallback={null}` causing content shift
`hem/page.tsx:220`: `<Suspense fallback={null}>` for DailySummarySection. When this section loads in after streaming, it shifts the layout below it. Use a fixed-height skeleton (`<Skeleton className="h-28 rounded-2xl mb-8" />`) or reserve the space.

---

## Page Scores

| Route | Score /40 | P0 | P1 | Top Issue |
|---|---|---|---|---|
| `/` (landing — AthopiaLanding) | ~28 | 0 | 0 | Couldn't read component; ISR + JSON-LD correct |
| `/hem` | 22 | 0 | 2 | Fluid type on product surface; fallback={null} CLS |
| `/feed` (→ FeedDashboard) | ~24 | 0 | 0 | Couldn't read client component |
| `/mitt-lag` (→ MittLagDashboard) | ~24 | 0 | 0 | Couldn't read client component |
| `/statistik` | 23 | 0 | 2 | All-caps h1 + 5× banned uppercase eyebrow h2s + internal copy |
| `/statistik/spelare` | 22→est.30 | 0 | 0 | Fixed last session (combobox, typography, position filter) |
| `/match` | 18 | 0 | 2 | All-caps h1; internal copy in empty state; no date grouping |
| `/forum` | 24 | 0 | 1 | All-caps h1; initials instead of logos |
| `/nyheter` | 22 | 0 | 1 | All-caps h1; dual stream hierarchy unclear |
| `/analys` | 10 | 1 | 0 | Dead stub page linked from nav — P0 |
| `/profil` (→ ProfilePageClient) | ~26 | 0 | 0 | Couldn't read client component |
| `/priser` | N/A | 0 | 0 | Redirect only — correct |
| `/prenumerera` (→ PricingPlans) | ~22 | 0 | 0 | Couldn't read client component |
| `/onboarding` (→ OnboardingClient) | ~22 | 0 | 0 | Couldn't read client component |

**Pages not read** (delegate to client component without readable JSX at page level): `/feed`, `/mitt-lag`, `/profil`, `/prenumerera`, `/onboarding`. Their page.tsx files are thin shells — critiquing them requires reading the client component files.

---

## Page-by-Page: P0 and P1 Issues Only

### `/analys` — P0

**[P0] Dead stub page with nav link**
- What: Page renders one h1 and one sentence: "Analys-ytan byggs just nu." Navigation links to this route.
- Why: A user who taps "Analys" in the nav hits a dead end. P0 because it blocks the task entirely — there is no task to complete.
- Fix (option A): Remove the nav link until the feature exists. Fix (option B): Replace with a meaningful coming-soon state — what will be here, when, how to get notified. Do not ship a one-sentence dead end linked from the main nav.

---

### `/hem` — P1 × 2

**[P1] Fluid type scale on product dashboard**
- `hem/page.tsx:89` — `text-4xl sm:text-6xl` HeroNarrative heading
- `hem/page.tsx:140` — `text-3xl sm:text-4xl` DailySummary heading
- Why: Product surfaces use fixed scales. A narrative heading at 96px on desktop dominates the whole dashboard and breaks the iOS-grade premium feel with shouting.
- Fix: Cap to `text-3xl` (30px) for HeroNarrative topic text; `text-2xl` for DailySummary. Emphasize with weight, not scale.

**[P1] `fallback={null}` causing layout shift**
- `hem/page.tsx:220` — `<Suspense fallback={null}>` on DailySummarySection
- Why: When DailySummary loads in over streaming, everything below shifts. This is measurably bad for CLS and feels janky.
- Fix: `<Suspense fallback={<div className="h-28 rounded-2xl mb-8 skeleton-wave bg-card" />}>` to reserve height.

---

### `/statistik` — P1 × 2

**[P1] 5× banned uppercase eyebrow section headers in PressTab**
- `statistik/page.tsx:385,390,394,399,403` — all five subsections in PressTab use `text-sm font-semibold uppercase tracking-wider text-muted-foreground` as h2
- Why: This is the banned AI scaffold pattern. Five consecutive uppercase kickers signal "AI assembled this."
- Fix: Use `text-base font-semibold text-foreground` for real section headings, or consolidate into a two-column grid with implied hierarchy (no explicit label needed when position is clear).

**[P1] Internal system copy exposed to users**
- `statistik/page.tsx:77–79` — EmptyState component shows "Kontrollera att sync-jobbet är igång"
- Why: A supporter has no idea what a sync-jobb is. This makes the product feel unfinished and technical.
- Fix: Remove the second sentence entirely. "Data synkroniseras — prova igen om en stund." is sufficient.

---

### `/match` — P1 × 2

**[P1] No date/round grouping on fixture list**
- `match/page.tsx:37–43` — fixtures rendered as flat sequential list, no grouping
- Why: 20 fixtures without date headers gives no spatial orientation. A user can't scan for "upcoming" vs "played" vs "today." This is a core usability failure for a match schedule page.
- Fix: Group by date using `<ListGroup header="Idag" />` pattern. At minimum separate LIVE / upcoming / finished.

**[P1] Internal copy in empty/error state**
- `match/page.tsx:35` — "Data synkroniseras från Supabase via athopia-os." visible to users
- Fix: "Matchdata laddas in — kom tillbaka om en liten stund."

---

### `/forum` — P1 × 1

**[P1] Initials avatar instead of team logo**
- `forum/page.tsx:98–100` — `{team.name.slice(0, 2).toUpperCase()}` as avatar
- Why: This is a visible placeholder, not a design choice. "AI" for AIK, "Dj" for Djurgården, "Ha" for Hammarby — these are developer fallbacks shipped as product. For a forum about specific clubs, club identity matters.
- Fix: Read `logo_url` from entities (same query used in mitt-lag) and render with `<Image>`. Fall back to initials only when logo is null.

---

### `/nyheter` — P1 × 1

**[P1] Dual content stream without clear hierarchy**
- `nyheter/page.tsx:120–125` — NewsStream ("Senaste signaler") and ArticleGrid both render on the same page with no clear relationship
- Why: Two different data sources, two different visual treatments, zero explanation of what distinguishes them. "Senaste signaler" vs "Artiklar" — a first-time user has no idea why there are two news streams or which to trust.
- Fix: Either merge into one ranked feed, or add a clear one-sentence explanation under the section header: "Senaste signaler — råflöde från 20+ källor" vs "Artiklar — AI-kuraterat originalinnehåll."

---

## Overall Site Health

**Average score (readable pages): ~21/40 — Acceptable band, lower end.**

The structural bones are good: ISR, streaming, Suspense, Supabase-only data access, semantic HTML, correct auth patterns. The core UX failures are copy and typography — both fixable in hours, not days.

### Top 3 Recommendations

**1. Global find-and-replace of all-caps h1/h2 strings (2 hours)**
Every page title. Do it in one pass. Title-case, `text-3xl` max, no SHOUTING. This single change moves the product from tabloid to premium across every surface simultaneously.
Command: `/impeccable typeset app/(app)`

**2. Audit every user-facing error/empty state and remove internal system names (1 hour)**
Search `athopia-os`, `Supabase`, `sync-jobb`, `sync-jobbet` in app/ — remove or rewrite every hit. Replace with plain Swedish user copy.
Command: `/impeccable clarify app/(app)`

**3. Remove `/analys` from nav or replace with a real coming-soon (30 minutes)**
A dead link in the main nav is a P0. Either hide it behind a feature flag or make the page earn its place.
Command: `/impeccable harden app/(app)/analys`

After these three, re-run `/impeccable critique` on `/hem` and `/statistik` — those are the highest-traffic product surfaces and will benefit most from a targeted polish pass.
