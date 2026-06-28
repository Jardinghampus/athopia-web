# Handoff — AI Chat UI + Build fixes
> Uppdaterad: 2026-06-28 | Senaste commit: 13a4af5 | Branch: main

---

## Session 2 — vad som gjordes (2026-06-28)

### Build-fix: server-only i client bundle
- `lib/access.ts` importerade `currentUser` från `@clerk/nextjs/server` — bröt Turbopack
- Fix: `getUserPlan()` flyttad till `lib/user-plan.ts` (server-only)
- `lib/access.ts` är nu ren (Plan-typ + ACCESS-objekt, ingen Clerk-import)
- Påverkade filer: `app/api/elite/chat/route.ts`, `app/(app)/mitt-lag/page.tsx`, `components/news/NewsStream.tsx`

### /ai — komplett omdesign
Sidan byggdes om från grunden med:

**Layout & responsivitet**
- Desktop: centrerat fönster `max-w-3xl`, bordered card, `sm:p-6` padding
- Mobil: full-bleed, `pb-[calc(env(safe-area-inset-bottom)+5rem)]` för GlassNav-clearance
- `visualViewport.resize` håller höjden korrekt när tangentbordet öppnas på mobil
- `document.body.overflow = 'hidden'` — sidan kan inte scrollas, modulen äger sin höjd

**Visuell design**
- **WavyBackground** (Aceternity) — animerad canvas med pitch-gröna + blå vågor
- Bakgrundsfärg: `oklch(0.07 0.03 240)` (mörkblå)
- Vågfärger: `#1D9E75`, `#25C48F`, `#3B82F6`, `#1e40af`, `#47c99a`, `#60a5fa`
- **Liquid glass-kort** — exakt samma recept som GlassNav:
  - `backdrop-filter: blur(24px) saturate(180%)`
  - `color-mix(in srgb, var(--background) 58%, transparent)`
  - `2px solid rgba(29, 158, 117, 0.7)` border + grön outer glow

**UX & motion**
- Streaming text: assistentsvar "skrivs" tecken för tecken (4 chars/frame, ~60fps)
- Upgrade-CTA animeras in först när streaming är klar
- Suggestion chips staggerar in (60ms delay var)
- Fönster materializes med scale+fade på load
- Allsvenskan-specifika thinking-messages ("Beräknar xG-form…" etc.)
- Empty state: Sparkles-ikon andas med scale-puls
- Auto-grow textarea (Shift+Enter = ny rad, Enter = skicka)
- Auto-focus på desktop (`pointer: fine`)
- `prefers-reduced-motion` → waves av, animationer minimala

**Footer**
- Footer dold på `/ai` (pathname-check i `Footer.tsx`)

**Deps**
- `simplex-noise` tillagd i package.json (krävs av wavy-background)

---

## För att få /ai live med riktig AI (BLOCK-lista)

### BLOCK A — Env-variabler i Vercel (gör detta först)
Vercel → athopia-web → Settings → Environment Variables:
```
ANTHROPIC_API_KEY=...        # console.anthropic.com
OPENAI_API_KEY=...           # platform.openai.com (embeddings)
CHAT_MODEL=claude-haiku-4-5
DAILY_LIMIT=30
MONTHLY_LIMIT=300
MONTHLY_BUDGET_USD=50
ADMIN_SECRET=<starkt slumplösenord>
```

### BLOCK B — Hårt kostnadstak (direkt efter nycklar)
Anthropic Console → Billing → Limits → $20/mån hard cap.

### BLOCK C — Backfill embeddings (kör en gång)
```bash
# .env.local måste ha OPENAI_API_KEY
pnpm embed:articles
```
~5 min, embeddar ~1 060 artiklar. Idempotent.

### BLOCK D — Write-time hook i athopia-os
När ny artikel sparas, posta till `/api/admin/embed-article` så RAG hålls uppdaterat.
Se föregående HANDOFF för exakt kodsnippet.

### BLOCK E — Koppla mockup → riktig chatt
`app/(app)/ai/page.tsx` är idag en mockup som simulerar svar.
När nycklar + backfill är klart: ersätt mock-`ask()`-funktionen med ett fetch mot `/api/elite/chat` (eller gate bakom plan-check).

---

## Viktiga filer

| Fil | Syfte |
|-----|-------|
| `app/(app)/ai/page.tsx` | AI-chattsida (mockup, live nu) |
| `components/ui/wavy-background.tsx` | Aceternity canvas-komponent |
| `lib/user-plan.ts` | Server-only getUserPlan() |
| `lib/access.ts` | Plan-typ + canAccess() — ingen server-import |
| `components/layout/Footer.tsx` | Dold på /ai via pathname-check |
| `app/(app)/elite/chat/page.tsx` | Riktig Elite-chatt (väntar nycklar) |
| `app/api/elite/chat/route.ts` | Backend — auth, limits, streamText |
| `lib/ai/tools.ts` | 5 verktyg mot Supabase |
| `lib/ai/embedding.ts` | RAG-sökning |

---

## Commit-historik denna session
```
13a4af5  feat(ai): glowing green border, blue+green wave mix
7cdfcd5  fix(ai): thicker pitch border 2px
81fd0b3  fix(ai): visible pitch border, faster waves, opacity 0.8
67c323a  feat(ai): wavy canvas bg + liquid glass card
fb3446b  fix: add simplex-noise dep for wavy-background
88a1f3d  fix(ai): remove footer, visualViewport height tracks mobile keyboard
f7bc8d9  fix(ai): lock body scroll, page owns its height
cab0dd7  feat(ai): overdrive streaming, stagger chips, thinking msg, auto-grow textarea, polish
ae5c6b5  fix(ai): clear GlassNav on mobile with pb-safe + items-start
7c8f6b1  feat(ai): centered window layout, design tokens, smooth thinking dots
97c2955  fix: move getUserPlan to user-plan.ts to avoid server-only in client bundle
```
