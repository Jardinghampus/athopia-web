# Feature: Story-kluster & källräkning

## Användarvärde
"5 källor" — samma story från flera medier, en rad i feed (Particle-style).

## Dataflöde
```
Echo embed → assignStoryCluster (cosine > 0.85)
  → story_clusters + refreshClusterSourceCount
  → news_feed_clustered VIEW
```

## Byggt i

| Lager | Filer |
|-------|-------|
| os | `packages/ai-core/src/lib/clustering.ts` |
| os | `scripts/backfill-story-clusters.ts` |
| DB | `story_clusters`, `articles.story_cluster_id`, `articles.source_count` |
| DB | migration `20260706100000_news_feed_clustered.sql` |
| web | `FeedSourceBadge.tsx`, feed API |

## AI fix
- Clustering: `clustering.ts` (embed via OpenAI i `llm.ts`)
- Om 0 kluster: kolla `embeddings` för artiklar
- `refreshClusterSourceCount` — räknar unika `source_name`

## Elite
`crossSourceCluster` badge — `access-rules.ts`
