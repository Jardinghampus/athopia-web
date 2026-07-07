# Launch ops — 2026-07-07

> Plan-enligt status efter matchdag E2E + entity-fix session.

## Verifierat (prod)

| Punkt | Status |
|-------|--------|
| VAPID (web Vercel prod) | ✅ `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_*` satt |
| Clerk webhook secret | ✅ `CLERK_WEBHOOK_SECRET` satt |
| Matchdag-loop | ✅ Kör, E2E simulerad (kickoff/live/FT/ratings) |
| Fixture entity FK | ✅ 240/240 `home_entity_id` + `away_entity_id` |
| RSS active sources | ✅ 36+ aktiva football-källor i `rss_sources` |
| `source_count > 1` | 🟡 32/659 artiklar — kluster kräver samma story från flera källor |

## Founder / DNS (ej kod)

| Punkt | Åtgärd |
|-------|--------|
| **athopia.se → Vercel** | `vercel domains ls` visar 0 under team — domänen kan ligga på annat Vercel-konto eller extern DNS. Dashboard → Project → Domains → lägg till `athopia.se` + `www`. |
| Clerk webhook endpoint | Dashboard → Webhooks → peka på `https://athopia.se/api/webhooks/clerk` |
| PITR backup | Supabase Dashboard → Settings → Backups |

## Skript (Hetzner)

```bash
cd /opt/athopia-os && set -a && . ./.env && set +a
npx tsx scripts/backfill-podcast-entities-from-teams.ts --limit=53
npx tsx scripts/backfill-fixture-entities.ts
npx tsx scripts/test-matchday-loop.ts
npx tsx scripts/simulate-matchday-e2e.ts --fixture=19635815  # endast test
```

## Podcast entity-policy

- **BBpodd** → alltid IFK Göteborg (käll-hint)
- **Studio Allsvenskan / Lundh** → entity från titel/topics (alias i `classify-helpers.ts`)
- VM/Sverige-avsnitt utan klubbnamn → tom `entity_ids` är OK (inte Allsvenskan-hub)
