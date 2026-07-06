# Feature: Sportmonks & statistik

## Användarvärde
Tabell, matcher, spelarstats, xG — trusted data från sync, aldrig fabricerad.

## Dataflöde
```
Sportmonks API → athopia-os sync jobs → fixtures, team_match_stats,
  player_match_stats, team_season_stats → web läser Supabase
```

## Byggt i

| Lager | Filer |
|-------|-------|
| os | `packages/sportmonks/`, `nightlySync`, `liveSync`, `syncRound` |
| os | normalize worker, stats cron 05:00 |
| web | `app/(app)/allsvenskan/*`, `statistik/*`, `MatchXgChart` |
| web | `lib/supabase.ts` — `.eq('sport','football')` ALLTID |

## Tabeller
- `fixtures`, `live_scores`, `fixture_events`, `fixture_lineups`
- `team_season_stats`, `player_match_stats`, `team_match_stats`
- `entities.sportmonks_id` — mapping

## AI fix
- **Ingen LLM** för rå stats
- Milo: anomali/rapporter i `agent_logs`
- xG: visa bara om payload har värden (AGENTS.md stats policy)

## Fixa här om…
| Symptom | Gå till |
|---------|---------|
| Match saknas | `fixtures` sync, Hetzner `/api/sync/*` |
| Fel xG | os round.ts, premium includes |
| Web visar 0 | `isSupabaseConfigured`, entity mapping |
