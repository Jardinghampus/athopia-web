# Athopia — produkt- & arkitekturdokumentation

Ritningar för hela stacken: **athopia-os** (skriver) → **Supabase** (kontrakt) → **athopia-web** / **athopia-ios** (läser).

## Start här

| Dokument | Innehåll |
|----------|----------|
| [ARCHITECTURE_BLUEPRINT.md](./ARCHITECTURE_BLUEPRINT.md) | Helheten: lager, agenter, tabeller, AI-spår |
| [AI_FIX_GUIDE.md](./AI_FIX_GUIDE.md) | Var en AI-agent ska börja när något är trasigt |

## Interaktiv karta (webb)

Öppna **[athopia.se/system](https://athopia.se/system)** — signaler animeras mellan RSS, Echo, Supabase och UI.

## Feature-katalog (en fil per funktion)

| # | Feature | Doc |
|---|---------|-----|
| 1 | Nyhetsflöde & feed | [features/01-news-feed.md](./features/01-news-feed.md) |
| 2 | Echo-klassificering | [features/02-echo-classification.md](./features/02-echo-classification.md) |
| 3 | Story-kluster & källräkning | [features/03-story-clusters.md](./features/03-story-clusters.md) |
| 4 | Sportmonks & statistik | [features/04-sportmonks-stats.md](./features/04-sportmonks-stats.md) |
| 5 | Dagens brief (team pulse) | [features/05-team-daily-pulse.md](./features/05-team-daily-pulse.md) |
| 6 | Match & matchdag | [features/06-match-context.md](./features/06-match-context.md) |
| 7 | Podcast | [features/07-podcast.md](./features/07-podcast.md) |
| 8 | AI-chat | [features/08-ai-chat.md](./features/08-ai-chat.md) |
| 9 | Forum | [features/09-forum.md](./features/09-forum.md) |
| 10 | Push-notiser | [features/10-push-notifications.md](./features/10-push-notifications.md) |
| 11 | Prenumeration & access | [features/11-monetization.md](./features/11-monetization.md) |
| 12 | Admin & ops | [features/12-admin-ops.md](./features/12-admin-ops.md) |

## Repo-regler (kort)

```
athopia-os     → ingest, agenter, normalisering, Supabase-skriv
athopia-web    → produkt-UI, läser Supabase, user-facing AI (begränsat)
athopia-admin  → kontrollrum, editorial, sync-knappar
athopia-ios    → speglar web-kontrakt
```

Läs alltid `AGENTS.md` i workspace-roten före cross-repo-ändringar.
