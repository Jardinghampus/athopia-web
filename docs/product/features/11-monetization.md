# Feature: Prenumeration & access

## Användarvärde
Free / PRO / Elite — Stripe → Clerk metadata → web gates.

## Dataflöde
```
Stripe checkout → webhook → Clerk publicMetadata.plan
  → getUserPlan() server-side → canAccess(feature, plan)
```

## Byggt i

| Lager | Filer |
|-------|-------|
| web | `lib/access-rules.ts`, `lib/user-plan.ts` |
| web | `components/UpgradePrompt.tsx`, `PaywallGate` |
| web | `app/api/webhooks/stripe/route.ts` |
| web | `app/(app)/prenumerera/page.tsx` |

## Tabeller
- Clerk metadata (ej Supabase)
- `user_feed_config` — onboarding

## AI fix
Ingen — plan sätts av Stripe webhook. Om fel plan: Clerk dashboard + webhook logs.

## Feature matrix
Se `lib/access-rules.ts` — `aiSummaries`, `aiChat`, `podcastClips`, `briefAudio`, `crossSourceCluster`
