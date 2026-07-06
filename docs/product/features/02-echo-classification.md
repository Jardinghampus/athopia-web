# Feature: Echo — klassificering & signal

## Användarvärde
Rankar och taggar RSS-signaler: breaking/major, entity_ids, feed_score.

## Dataflöde
```
content_queue (pending) → Echo (Haiku/Ollama) → classified
  → articles upsert → embedArticle → assignStoryCluster
```

## Byggt i

| Lager | Filer |
|-------|-------|
| os | `packages/ai-core/src/agents/echo.ts` |
| os | `echo-backfill.ts`, `scripts/backfill-echo-signals.ts` |
| os | `apps/agents/src/index.ts` — rolling classifier, `/api/echo/backfill` |
| admin | Echo backfill på `/admin/sync` |

## Tabeller
- `content_queue` — staging
- `articles` — publicerade
- `embeddings` — för clustering
- `agent_logs` — Echo output

## AI fix
1. `echo.ts` — prompt, signal_score, importance_tier
2. `text-sanitize.ts` — JSON/surrogate-fel
3. `withBudget()` wrapper — måste finnas på LLM-anrop
4. Backfill: `POST /api/echo/backfill` på agent-servern

## Verifiera
```sql
SELECT status, count(*) FROM content_queue GROUP BY status;
SELECT avg(feed_score) FROM articles WHERE published_at > now()-interval '7 days';
```
