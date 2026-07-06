# Feature: Push-notiser

## Användarvärde
Breaking, match kickoff, FT — web + iOS (VAPID).

## Dataflöde
```
articles / matchday-loop → push_candidates / tasks
  → push-service agent → push_subscriptions (VAPID)
Story dedup: story_cluster_id i push.ts
```

## Byggt i

| Lager | Filer |
|-------|-------|
| os | `packages/notifications/src/push.ts` |
| os | `matchday-loop.ts`, `match-complete.ts` |
| web | `usePwa.ts`, VAPID env |

## Tabeller
- `push_subscriptions`, `push_candidates`, `team_push_popups` VIEW

## AI fix
- Push **copy** genereras sällan via LLM — mest templating
- Dedup: `getStoryKey()` i push.ts

## PRO-gate
`pushAlerts` — PRO+

## Blocker
VAPID-nycklar i Vercel (extern setup)
