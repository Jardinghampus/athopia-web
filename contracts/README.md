# Athopia cross-platform contracts

Version 1 establishes the shared product contract for web and iOS:

- `generated/navigation.json` — canonical primary and secondary destinations
- `generated/access.json` — minimum plan required by every gated feature
- `generated/design-tokens.json` — exact copy of workspace brand tokens
- `generated/storekit.json` — canonical App Store product IDs and plans
- `generated/openapi.json` — response contracts for the endpoints iOS decodes
- `athopia-ios/.../GeneratedProductContracts.swift` — generated native types

Sources of truth remain `lib/nav.ts`, `lib/access-rules.ts`,
`lib/product-contract.ts`, `lib/deep-links.ts`, `lib/api-schemas.ts`, and
`../docs/brand/tokens.json`.

`pnpm test:parity` blocks cross-platform drift on Windows, without Xcode:

- deep links: every shareable web URL is dispatched by iOS `ContentView`
- decode: no handwritten Swift model decodes a field the server never sends,
  and no nullable/optional field is decoded as non-optional (a silent decode
  failure of the whole response)

Routes answer through `jsonContract()`, so a response that breaks its own schema
throws in dev and is logged in production.

**Covered (jsonContract + decode gate):** feed (+ modules), feed/hero, feed/config,
scores, articles/{slug}, team/list, team/{slug}/hub, team/{slug}/transfers,
standings, match/{fixtureId}, match/{fixtureId}/timeline,
stats/{projection,schedule-form,clutch,h2h,compare,leaderboard},
player/{idOrSlug}, scout, daily, daily/audio, analyses, podcasts, search,
forum/posts, forum/summary, profile, widget, storekit/entitlements,
push/apns-subscribe.

**iOS product reads:** leaderboard, match timeline, and player profile go through
athopia.se APIs (no Supabase-direct StatsRepository queries for those surfaces).

Note: several legacy routes may still answer with raw DB rows (snake_case) and
iOS decodes them with `.convertFromSnakeCase`. Newer gated routes use camelCase
wire format via Zod schemas; the decode gate matches Swift property names.

Run:

```bash
pnpm contracts:generate
pnpm contracts:check
pnpm test:parity
```

Do not edit generated files manually. Any contract-breaking change increments
`schemaVersion` and must update both clients in the same delivery wave.
