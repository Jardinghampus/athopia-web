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

Covered so far: `/api/feed`, `/api/scores`, `/api/articles/{slug}`,
`/api/team/{slug}/hub`. Extend
`API_CONTRACTS` + `SWIFT_MODEL_CONTRACTS` per endpoint; the remaining iOS
endpoints (match detail, standings, stats, daily, analyses, podcasts, search,
profile, forum) are
still unguarded.

Run:

```bash
pnpm contracts:generate
pnpm contracts:check
pnpm test:parity
```

Do not edit generated files manually. Any contract-breaking change increments
`schemaVersion` and must update both clients in the same delivery wave.
