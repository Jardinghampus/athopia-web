# Feature: Match & matchdag

## Användarvärde
Live/FT-sida, händelser, lineups, xG, spelarbetyg, forum, match-chat.

## Dataflöde
```
Sportmonks → fixtures/live_scores
matchday-loop (5 min) → push + forum seed + ratings nudge
generatePostMatchAnalysis → content_queue (metadata fixture_id)
  → web /match/[sportmonks_id]
```

## Byggt i

| Lager | Filer |
|-------|-------|
| os | `apps/agents/src/triggers/matchday-loop.ts` |
| os | `match-complete.ts`, `generatePostMatchAnalysis` |
| web | `app/(app)/match/[id]/page.tsx` |
| web | `MatchAskPanel.tsx`, `PlayerRatingPanel`, `MatchForum` |

## Tabeller
- `fixtures`, `live_scores`, `fixture_events`, `player_match_stats`
- `player_ratings` — användarbetyg
- `forum_threads` — matchforum

## AI fix
| Feature | Var |
|---------|-----|
| Post-match text | os `generatePostMatchAnalysis` |
| Match-chat | web `app/api/match/chat` + `lib/ai/tools.ts` |
| Push copy | os notifications |

## PRO-gate
Match-chat: `aiChat`
