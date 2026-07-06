# AI Fix Guide — var ska en agent börja?

Snabb routing när något AI-relaterat är fel.

## Beslusträd

```
Symptom?
├─ Nyheter saknas / fel tier / ingen signal_score
│  └─ athopia-os → Echo → packages/ai-core/src/agents/echo.ts
├─ Samma story 3 gånger i feed
│  └─ clustering.ts + news_feed_clustered view
├─ "X källor" visar alltid 1
│  └─ Echo + assignStoryCluster + refreshClusterSourceCount
├─ Brief tom / gammal
│  └─ team-daily-pulse.ts + team_daily_pulses status
├─ Match-chat svarar fel / 403 / 429
│  └─ athopia-web → app/api/match/chat + lib/ai/tools.ts
├─ Elite-chat / budget
│  └─ app/api/elite/chat + chat_usage tabell
├─ Podcast entity_ids = 0
│  └─ podcast-processor.ts + scripts/backfill-podcast-listen-meta.ts
├─ Anthropic 400 / surrogate JSON
│  └─ packages/ai-core/src/lib/text-sanitize.ts
└─ LLM-kostnad exploderar
   ├─ os: withBudget + system_config
   └─ web: chat_usage månads-cap
```

## Per repo — första filer att öppna

### athopia-os

| Problem | Filer |
|---------|-------|
| RSS → signal | `packages/rss/src/worker.ts`, `pollFeedsDirectly` |
| Echo | `packages/ai-core/src/agents/echo.ts` |
| Kluster | `packages/ai-core/src/lib/clustering.ts` |
| Brief | `packages/ai-core/src/agents/team-daily-pulse.ts` |
| Match AI-analys | `generatePostMatchAnalysis` i ai-core |
| Podcast | `podcast-processor.ts`, `podcast-ingest.ts` |
| Sportmonks | `packages/sportmonks/` |
| Orchestration | `apps/agents/src/index.ts` |
| Budget | `packages/ai-core` → `withBudget` |

### athopia-web

| Problem | Filer |
|---------|-------|
| Feed API | `app/api/feed/route.ts` |
| Feed UI | `app/(app)/feed/FeedClient.tsx` |
| Brief UI | `components/team-hub/TeamHubBriefRitual.tsx` |
| Match chat | `app/api/match/chat`, `components/match/MatchAskPanel.tsx` |
| AI tools (data) | `lib/ai/tools.ts` |
| Access / PRO | `lib/access-rules.ts`, `lib/user-plan.ts` |
| Podcast policy | `PODCAST_RIGHTS.md`, `PodcastSignalsPanel.tsx` |

### athopia-admin

| Problem | Filer |
|---------|-------|
| Echo backfill knapp | `/admin/sync` → `/api/echo/backfill` |
| Editorial | social studio docs |

## Verifiering i Supabase (SQL)

```sql
-- Echo lever?
SELECT count(*) FROM content_queue WHERE status = 'classified' AND created_at > now() - interval '24 hours';

-- Kluster?
SELECT count(*) FILTER (WHERE source_count > 1) FROM articles WHERE status = 'published';

-- Brief idag?
SELECT count(*) FROM team_daily_pulses WHERE pulse_date = current_date;

-- Chat budget
SELECT sum(msg_count) FROM chat_usage WHERE day >= date_trunc('month', current_date);
```

## Regler (bryt aldrig)

1. **Web anropar inte Sportmonks**
2. **Transkript/chunks exponeras inte publikt**
3. **xG/pressure bara med provenance**
4. **All pipeline-LLM via withBudget i os**
