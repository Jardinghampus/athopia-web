# Feature: Dagens brief (Team Daily Pulse)

## Användarvärde
"Athopia idag" på lag-hub — AI-sammanfattning inför/efter match.

## Dataflöde
```
team-daily-pulse agent (Sonnet) → team_daily_pulses
  → VIEW published_team_daily_pulses → web lag-hub / mitt-lag
```

## Byggt i

| Lager | Filer |
|-------|-------|
| os | `packages/ai-core/src/agents/team-daily-pulse.ts` |
| os | `generateTeamDailyPulses` i agents index |
| web | `TeamHubBriefRitual.tsx`, `BriefListenButton.tsx` (TTS, PRO) |
| web | `lib/team-hub/queries.ts` → `getTeamPulse` |

## Tabeller
- `team_daily_pulses` — status approved/published
- `published_team_daily_pulses` — VIEW för web

## AI fix
1. `team-daily-pulse.ts` — prompt, context (fixtures + articles)
2. `withBudget()` — mandatory
3. Status måste vara `published` för att synas

## PRO-gate
Full body: `aiSummaries`. TTS: `briefAudio`.

## Verifiera
```sql
SELECT team_entity_id, pulse_date, status FROM team_daily_pulses ORDER BY pulse_date DESC LIMIT 10;
```
