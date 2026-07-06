# Feature: Nyhetsflöde & Mitt feed

## Användarvärde
Personligt nyhetsflöde för Allsvenskan — free: 20/dag, PRO: smart ranking + filter.

## Dataflöde
```
RSS → content_queue → Echo → articles → news_feed_clustered (VIEW)
  → athopia-web GET /api/feed → FeedClient
```

## Byggt i

| Lager | Filer |
|-------|-------|
| os | `echo.ts` (articles upsert), `clustering.ts` |
| DB | `articles`, VIEW `news_feed_clustered` |
| web | `app/api/feed/route.ts`, `FeedClient.tsx`, `lib/feed/map-feed-row.ts` |
| web | `components/feed/FeedSourceBadge.tsx` |

## Tabeller
- `articles` — publicerade signaler
- `news_feed_clustered` — en rad per story-kluster
- `user_feed_config`, `user_feed_usage` — filter + dagsgräns

## AI?
Echo skriver `feed_score`, `importance_score`. Web **läser bara**.

## Fixa här om…
| Symptom | Gå till |
|---------|---------|
| Tom feed | Echo + `articles.status=published` |
| Dubbletter | `news_feed_clustered` migration |
| Free gate fel | `lib/feed/feed-usage.ts` |
| Badge "X källor" | `source_count` i articles, Echo clustering |

## PRO-gate
`smartRanking`, `unlimitedFeed` i `lib/access-rules.ts`
