# Feature: Admin & ops

## Användarvärde
Kontrollrum på os.athopia.se — sync, Echo backfill, editorial.

## Dataflöde
```
athopia-admin → API på Hetzner/Vercel → Supabase / agents
```

## Byggt i

| Lager | Filer |
|-------|-------|
| admin | `/admin/sync` — Echo rolling + backfill |
| os | HTTP `:3001` — `/api/echo/backfill`, `/api/sync/*`, `/health` |
| admin | docs i `athopia-admin/docs/` |

## AI fix från admin
| Knapp | Endpoint |
|-------|----------|
| Echo backfill | `POST /api/echo/backfill` |
| Echo rolling | `POST /api/echo/rolling` |
| Sportmonks | `/api/sync/nightly` |

## Verifiera agenter
```bash
curl http://135.181.107.47:3001/health
ssh root@135.181.107.47 → docker logs athopia-agents
```

## Docs
- `AI_AGENT_REPORTING.md`
- `CROSS_REPO_REPORTING.md`
