# Handoff — Elite Chat + Stats API
> Session: 2026-06-28 | Commit: 2e06cc7 | Branch: main

---

## Vad som byggdes

### 1. AI-chatt mockup — live nu
**URL:** `/ai`
- Tillgänglig för ALLA users (ingen auth-gate)
- Användaren skriver fråga → 10s loading-animation → upgrade-svar med CTA
- Länk i GlassNav (bottom bar) och MobileNav
- Redirect-knapp → `/prenumerera`

### 2. Stats API-routes — fixade
- `GET /api/stats/finishing-index` — Finishing Index (xG-överprestation)
- `GET /api/stats/player-twins` — Statistiska tvillingar, stöder `?playerId=`
- Kompletterar de 3 som redan fanns (clutch, projection, schedule-form)

### 3. Elite Chat — kodad, VÄNTAR PÅ NYCKLAR
**URL:** `/elite/chat`
- Auth-gatad: kräver `plan === 'elite'` i Clerk publicMetadata
- `streamText` med Haiku 4.5, 5 verktyg, per-user dagsgräns
- Allt är byggt — behöver bara env-variabler

### 4. RAG-infrastruktur — kodad, VÄNTAR PÅ NYCKLAR
- `lib/ai/embedding.ts` — chunk + embedMany + searchArticles
- `lib/ai/resolve.ts` — fuzzy team/player resolve (ILIKE + alias-karta)
- `lib/ai/tools.ts` — 5 verktyg: searchNews, getStandings, getTeamStats, getPlayerStats, getMatch
- `scripts/embed-articles.ts` — backfill 1 060 artiklar (kör en gång med OPENAI_API_KEY)
- DB: match_articles(), chat_usage, bump_chat_usage, pg_trgm — KLARA i Supabase

---

## Vad som återstår (i prioritetsordning)

### BLOCK A — Env-variabler (gör detta först)
Lägg till i Vercel → athopia-web → Settings → Environment Variables:

```
ANTHROPIC_API_KEY=...        # från console.anthropic.com
OPENAI_API_KEY=...           # från platform.openai.com (embeddings)
CHAT_MODEL=claude-haiku-4-5
DAILY_LIMIT=30
MONTHLY_LIMIT=300
MONTHLY_BUDGET_USD=50
ADMIN_SECRET=<slumpa ett starkt lösenord>
```

### BLOCK B — Hårt tak (gör direkt efter nycklar)
Anthropic Console → Billing → Limits → sätt $20/mån hard cap.
Detta är den riktiga backstoppen — koden är mjuk spärr.

### BLOCK C — Backfill (kör en gång)
```bash
cd C:\Users\jardi\athopia-web
# Sätt env lokalt i .env.local först, sedan:
pnpm embed:articles
```
Tar ~5 min, embeddar 1 060 artiklar. Idempotent — kan köras om.

### BLOCK D — Write-time hook (liten ändring i athopia-os)
I `athopia-os/packages/ai-core/src/agents/content-engine.ts` (eller nightly):
```ts
// Efter att artikel sparats i Supabase:
await fetch(`${process.env.WEB_URL}/api/admin/embed-article`, {
  method: 'POST',
  headers: { 'x-admin-secret': process.env.ADMIN_SECRET, 'content-type': 'application/json' },
  body: JSON.stringify({ article_id: newArticle.id }),
})
```

### BLOCK E — Mockup → riktig chatt
När nycklar + backfill är klart: byt `/ai/page.tsx` att peka på `/elite/chat`
(eller flytta mockup-logiken dit bakom en plan-gate).

---

## Filer att känna till

| Fil | Syfte |
|-----|-------|
| `ELITE-CHAT.md` | Fullständig arkitekturdokumentation, kostnadskalkyl |
| `HANDOFF.md` | Denna fil |
| `app/(app)/ai/page.tsx` | Mockup-sida (live) |
| `app/(app)/elite/chat/page.tsx` | Riktig chat (väntar nycklar) |
| `app/api/elite/chat/route.ts` | Backend — auth, limits, streamText |
| `lib/ai/tools.ts` | 5 verktyg mot Supabase |
| `lib/ai/embedding.ts` | RAG-sökning |
| `scripts/embed-articles.ts` | Backfill-script |

---

## Kostnadsuppskattning (Haiku 4.5)

| Aktiva elitusers | Kostnad/mån |
|-----------------|-------------|
| 20 | ~$36 |
| 50 | ~$90 |
| 100 | ~$180 |

Uppskalning till Sonnet: byt `CHAT_MODEL=claude-sonnet-4-6` i Vercel. Inget annat.

---

## Commit
`2e06cc7` — feat: elite chat mockup + stats API routes + AI SDK setup
