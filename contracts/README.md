# Athopia cross-platform contracts

Version 1 establishes the shared product contract for web and iOS:

- `generated/navigation.json` — canonical primary and secondary destinations
- `generated/access.json` — minimum plan required by every gated feature
- `generated/design-tokens.json` — exact copy of workspace brand tokens
- `generated/storekit.json` — canonical App Store product IDs and plans
- `athopia-ios/.../GeneratedProductContracts.swift` — generated native types

Sources of truth remain `lib/nav.ts`, `lib/access-rules.ts`,
`lib/product-contract.ts`, and
`../docs/brand/tokens.json`.

Run:

```bash
pnpm contracts:generate
pnpm contracts:check
pnpm test:parity
```

Do not edit generated files manually. Any contract-breaking change increments
`schemaVersion` and must update both clients in the same delivery wave.
