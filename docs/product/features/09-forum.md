# Feature: Forum

## Användarvärde
Lag- och matchforum, trådar, likes. PRO för att skriva.

## Dataflöde
```
web forum API → Supabase forum_posts / threads
os runForumSummarizer → AI-sammanfattning (cron)
matchday-loop → seed tråd vid kickoff/FT
```

## Byggt i

| Lager | Filer |
|-------|-------|
| web | `app/(app)/forum/*`, `MatchForum.tsx` |
| web | `app/api/forum/*` |
| os | `runForumSummarizer`, matchday forum seed |

## Tabeller
- `forum_threads`, `forum_posts`, `forum_likes`

## AI fix
- Forum summarize: `app/api/forum/summarize/route.ts` (web, budget via agent_logs)
- Seed copy: `matchday-loop.ts`

## PRO-gate
Skriva: PRO (Clerk + rate limit)
