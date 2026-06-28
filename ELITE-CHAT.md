# Elite Chat — RAG + Stats

> Status: 🔨 Under bygge | Uppdaterad: 2026-06-28

## Vad det är

En AI-chatt för elitkunder (`plan === 'elite'`) som svarar på frågor om Allsvenskan
utifrån vår egen Supabase-data: artiklar (RAG via embeddings), tabellställning,
spelar- och lagstatistik, matcher.

Modell: `claude-haiku-4-5` (uppskalning = byt env `CHAT_MODEL` till `claude-sonnet-4-6`)
Embeddings: `text-embedding-3-small` (OpenAI, ~$0.02/1M tokens)

---

## Arkitektur

```
Användare (elite) → /elite/chat (UI)
  → POST /api/elite/chat
      1. Clerk auth + elite-gate (403 om ej elite)
      2. Per-user dagsgräns (chat_usage → 429 om överskridet)
      3. Global kostnadsspärr (429/503 om över budget)
      4. streamText (Haiku) med 5 verktyg
      5. onFinish → bump_chat_usage (tokens + räknare)
  → Stream tillbaka till UI

Verktyg (read-only, deterministiska):
  searchNews       → embedQuery → match_articles() → articles JOIN
  getStandings     → team_season_stats + entities
  getTeamStats     → resolveTeam() → team_season_stats
  getPlayerStats   → resolvePlayer() → player_season_stats
  getMatch         → fixtures + fixture_events

Entity-resolve (lib/ai/resolve.ts):
  resolveTeam/resolvePlayer → ILIKE + pg_trgm similarity
  LLM:en får ALDRIG skriva SQL eller gissa IDs
```

---

## Filer

| Fil | Syfte |
|-----|-------|
| `lib/ai/embedding.ts` | chunk(), embedChunks(), embedQuery(), searchArticles() |
| `lib/ai/resolve.ts` | resolveTeam(), resolvePlayer() — deterministisk entity-match |
| `lib/ai/tools.ts` | 5 AI SDK tools (searchNews, getStandings, getTeamStats, getPlayerStats, getMatch) |
| `app/api/elite/chat/route.ts` | POST — auth, limits, streamText, onFinish |
| `app/api/elite/usage/route.ts` | GET — dagens msg_count för UI-visning |
| `app/api/admin/embed-article/route.ts` | POST — embedda en artikel (write-time hook från athopia-os) |
| `scripts/embed-articles.ts` | Backfill: embeddar alla artiklar som saknas i embeddings |
| `app/elite/chat/page.tsx` | UI — useChat, verktygsindikator, usage-display |

---

## Databas

| Tabell/Funktion | Beskrivning |
|-----------------|-------------|
| `embeddings` (befintlig) | `content_type='article'`, `vector(1536)`, återanvänds |
| `match_articles(vec, threshold, count)` | SQL-funktion, HNSW cosine-sökning |
| `chat_usage` | `(user_id, day)` PK — msg_count + tokens_in/out |
| `bump_chat_usage(user_id, in, out)` | Atomisk upsert, returnerar ny msg_count |
| `pg_trgm` | Extension för fuzzy entity-resolve |

---

## Limits & kostnader

| Variabel | Default | Env |
|----------|---------|-----|
| Dagsgräns meddelanden | 30 | `DAILY_LIMIT` |
| Månadsgräns | 300 | `MONTHLY_LIMIT` |
| Månadsbudget (mjuk spärr) | $50 | `MONTHLY_BUDGET_USD` |
| Modell | claude-haiku-4-5 | `CHAT_MODEL` |

**Hårt tak:** sätts i Anthropic Console → Billing → Limits. Kan aldrig passeras.

Uppskattad kostnad Haiku 4.5 ($1/M in, $5/M ut, ~500 in + 300 ut per msg):
- 20 aktiva elitusers × 30 msg/dag × 30 dagar = 18 000 msg/mån
  → ~$9 in + ~$27 ut = **~$36/mån**
- 50 users: ~$90/mån
- 100 users: ~$180/mån

---

## Env-variabler (lägg i Vercel + .env.local)

```
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...          # enbart för embeddings
CHAT_MODEL=claude-haiku-4-5
DAILY_LIMIT=30
MONTHLY_LIMIT=300
MONTHLY_BUDGET_USD=50
ADMIN_SECRET=...            # skyddar /api/admin/embed-article
```

---

## Byggestatus

- [x] FAS 0 — Audit
- [x] FAS 1 — DB-migrationer (pg_trgm, match_articles, chat_usage, bump_chat_usage)
- [ ] FAS 2 — Embeddings (lib/ai/embedding.ts + backfill-script)
- [ ] FAS 3 — Verktyg + entity-resolve (lib/ai/resolve.ts + lib/ai/tools.ts)
- [ ] FAS 4 — Chat-route (app/api/elite/chat/route.ts)
- [ ] FAS 5 — UI (app/elite/chat/page.tsx)
- [ ] FAS 6 — Env i Vercel + Anthropic Console-tak
- [ ] Backfill körd (npm run embed:articles)
- [ ] Verifiering: Hammarby → standings, Malmö FF nyheter, okänd entitet, 429

---

## Uppskalningsväg

Byt `CHAT_MODEL=claude-sonnet-4-6` i Vercel env. Inga kodändringar.
