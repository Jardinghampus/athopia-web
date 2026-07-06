# Feature: Podcast

## Användarvärde
Kuraterade avsnitt per lag — Spotify embed / Acast-länk. **Ingen** republished audio/text.

## Dataflöde
```
RSS podcast-ingest → podcasts (metadata)
  → podcast-processor (Deepgram INTERNT, entity extraction)
  → podcast_chunks (RAG only)
  → web getPodcastSignalsForEntities → PodcastSignalsPanel
```

## Byggt i

| Lager | Filer |
|-------|-------|
| os | `packages/rss/src/podcast-ingest.ts`, `podcast-links.ts` |
| os | `packages/ai-core/src/agents/podcast-processor.ts` |
| web | `PODCAST_RIGHTS.md`, `PodcastSignalsPanel.tsx` |
| web | `lib/podcast/spotify.ts`, `lib/podcast/rights.ts` |

## Tabeller
- `podcasts`, `podcast_chunks`, `rss_sources.transcribe`

## Upphovsrätt
- ❌ `<audio src=enclosure>`, ❌ chunk-text publikt
- ✅ Spotify iframe, ✅ Acast outbound, ✅ titel + topics

## AI fix
1. Entity extraction: `podcast-processor.ts`
2. Backfill: `scripts/backfill-podcast-listen-meta.ts`
3. Web visar fel: `getPodcastSignalsForEntities` — metadata only

## PRO-gate
`podcastClips` (kuratering)
