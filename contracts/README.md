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

Covered: feed, feed/hero, scores, articles/{slug}, team/list, team/{slug}/hub,
standings, match/{fixtureId}, stats/{projection,schedule-form,clutch,h2h,compare},
scout, daily, daily/audio, analyses, podcasts, search, forum/posts, profile.

Still unguarded: StoreKit/APNs endpoints, feed-config, transfer radar, and the
iOS screens that query Supabase directly (player/team stats) — those decode DB
rows, not API responses, so they need a different contract.

Note: several routes answer with raw DB rows (snake_case) and iOS decodes them
with `.convertFromSnakeCase`. Those schemas describe the wire format in
snake_case; the gate applies the same conversion when matching Swift properties.

Run:

```bash
pnpm contracts:generate
pnpm contracts:check
pnpm test:parity
```

Do not edit generated files manually. Any contract-breaking change increments
`schemaVersion` and must update both clients in the same delivery wave.
