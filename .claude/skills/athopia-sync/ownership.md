# Athopia Sync — ownership & file map

## Repo roles

| Repo | Role | Publishes to |
|------|------|----------------|
| **athopia-os** | AI factory, Sportmonks sync, RSS→queue, agents, APNs, migrations | Supabase |
| **athopia-web** | Public product + HTTP API for iOS | Vercel |
| **athopia-admin** | Ops / Command OS | Vercel |
| **athopia-ios** | Native SwiftUI client | TestFlight / App Store |

## Cascade

| Change | Must update |
|--------|-------------|
| Schema | os migration → (admin?) → web API → iOS model |
| Public feature | web page + API + access/nav → contracts → iOS |
| Paywall | `access-rules.ts` → web gate → iOS `canAccess` → access.json |
| Nav | `nav.ts` → web UI → iOS tabs/overflow/deep link |
| Brand | `docs/brand/tokens.json` → web → iOS DesignTokens → contract |
| Push | os sender → deep link target exists on web+iOS |
| OS pipeline | admin surface if humans must control it |

## Canonical files

| Concern | Path |
|---------|------|
| **Brain (memory)** | `Athopia Build/.athopia-sync/` |
| Human STATE | `Athopia Build/ATHOPIA-SYNC-STATE.md` |
| Brand | `docs/brand/BRAND.md`, `tokens.json` |
| Nav / access / deep links | `athopia-web/lib/{nav,access-rules,deep-links}.ts` |
| API schemas | `athopia-web/lib/api-schemas.ts` |
| Contracts | `athopia-web/contracts/generated/*` |
| iOS generated | `athopia-ios/.../GeneratedProductContracts.swift` |
| iOS routing / API / tokens | `ContentView.swift`, `APIClient.swift`, `DesignTokens.swift` |
| PC iOS verify | `athopia-ios/scripts/verify-pc-handoff.ps1` |
| Fingerprint | `.athopia-sync/scripts/fingerprint.ps1` |

## Parity meaning

1. **Behavior** — destinations, data, paywalls, empty/error  
2. **Visual** — tokens/hierarchy; native idiom OK  
3. **Interaction** — same intent, platform controls  

## Prices (do not invent)

Free 0 · PRO 89 kr/mån · Elite 169 kr/mån · 25% yearly

## Intentional asymmetries (skips, not gaps)

- Admin/OS have no public twin  
- Web Stripe vs iOS D3 soft-gate until Apple answers  
- Widget may use SF; web Geist  
- Gamification excluded  
