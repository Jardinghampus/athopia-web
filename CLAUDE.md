@AGENTS.md

# ATHOPIA WEB — operativ konstitution

## Mission
Publik webb för Athopia på athopia.se.
Data från athopia-os via Supabase.

## Stack
Next.js 16.2.6 App Router · TypeScript strict · Tailwind v4 · shadcn/ui
Clerk v7 auth · Stripe v22 betalningar · Supabase client · React 19

## Design
Bebas Neue rubriker · DM Sans brödtext
Primary: #1D9E75 · Dark-first

## Kommando-protokoll
"nästa" → kör nästa jobb i NEXT.md
"status" → visa progress
"kolla"  → pnpm build + rapportera
"commit" → git add . && git commit && git push

## Auto-session protokoll
Efter varje avslutat jobb i NEXT.md:
1. Spara all kontext till PROGRESS.md
2. Spara beslut till .claude/memory/decisions.md
3. Spara modul-status till .claude/memory/[modul].md
4. Kör git add . && git commit -m "[modul]: [vad byggdes]"
5. Kör /compact
6. Rapportera: "✅ [jobb-id] klart. Nästa: [nästa jobb]. Skriv nästa för att fortsätta."
7. Vänta på input

När användaren skriver "nästa" direkt efter rapport:
1. Läs NEXT.md + PROGRESS.md + .claude/memory/[relevant].md
2. Kör /planner för nästa jobb
3. Implementera
4. Upprepa auto-session protokoll

## Varför detta fungerar
/compact komprimerar konversationshistoriken men behåller kontexten.
PROGRESS.md + .claude/memory/ är det externa minnet.
Claude Code läser dessa filer i varje ny session automatiskt.
Ingenting går förlorat mellan sessioner.

## Viktigt
Kör ALDRIG /clear — det raderar all kontext.
Kör ALLTID /compact istället.
Skillnad:
  /compact → komprimerar, behåller kontext ✅
  /clear   → raderar allt ❌

## Regler
- Server components som default, client bara när nödvändigt
- generateMetadata() på alla sidor
- Alla bilder via next/image
- ISR revalidate:60 på Sportsmonks-data
- PRO-gate på premium content via Clerk metadata
- proxy.ts istället för middleware.ts (Next.js 16-konvention)
- Lazy-init för Stripe, Clerk och Supabase — ALDRIG module-level
- Tailwind v4: CSS-konfiguration via @theme i globals.css, ingen tailwind.config.ts
