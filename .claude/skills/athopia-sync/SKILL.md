---
name: athopia-sync
description: >-
  Athopia Sync — self-healing, self-learning cross-repo sync for Athopia football
  (athopia-os, athopia-web, athopia-admin, athopia-ios). Fingerprint-cached warm
  starts; audits UI/UX + API + paywalls + schema; heals drift; journals findings;
  proposes improvements after every build. Use when the user says "Athopia Sync",
  "synka", parity, after a feature in one repo, or before ship/PR across platforms.
---

# Athopia Sync (v2 — self-heal)

Cross-repo parity **engine** for Athopia fotboll. Not a checklist — a loop that
**detects → heals → verifies → learns → improves**, with a persistent brain.

**In scope:** `athopia-os` · `athopia-web` · `athopia-admin` · `athopia-ios`  
**Out:** `athopia-golf`, gamification, speculative redesigns

**Build root:** `C:\Users\jardi\Athopia Build` (Mac: `~/Athopia Build`)  
**Brain:** `Athopia Build/.athopia-sync/` ← **always read/write this**

| Brain file | Purpose |
|------------|---------|
| `cache.json` | Fingerprints + gate results (warm start) |
| `LEARNINGS.md` | Recipes (self-training) |
| `FINDINGS.md` | Append-only journal |
| `IMPROVEMENTS.md` | Post-build ranked ideas |
| `STRUCTURE.md` | Compact SoT map |
| `scripts/fingerprint.ps1` | Cheap dirty-layer scan |

Human summary: `Athopia Build/ATHOPIA-SYNC-STATE.md`

---

## TOKEN BUDGET (force efficiency)

**Goal:** each Sync uses fewer tokens than the last for the same work.

1. **Fingerprint first** (mandatory):
   ```powershell
   pwsh -File ".athopia-sync/scripts/fingerprint.ps1"
   # after code changes / before report:
   pwsh -File ".athopia-sync/scripts/fingerprint.ps1" -RunGates
   ```
2. **Warm start** if `cache.json` exists and `layersDirty` ≠ `cold-start`:
   - Read: `STATE` + `LEARNINGS` (skim) + `IMPROVEMENTS` (top) + dirty layers only
   - **Do NOT** re-read all CLAUDE.md / brand books unless `brand`, `cold-start`, or constitution paths dirty
3. **Cold start** only when no cache, `cold-start` dirty, or user says “full audit / cold”:
   - Skim constitutions once (web + ios + os hard rules); brand only if UI work
4. Prefer **rg/grep + fingerprint** over explore agents; max **2** explore agents unless cold
5. Sub-agents get **paths + learning IDs**, not full skill text
6. Never dump FINDINGS history into the user report — link + latest block only

---

## Modes

| Trigger | Mode |
|---------|------|
| `Athopia Sync` / synka / parity | Heal open STATE gaps → dirty-layer audit → improve |
| Feature just shipped in one repo | Feature-wave cascade only |
| Before PR/ship | Gates + delta inventory |
| `Athopia Sync cold` / full audit | Ignore warm shortcuts; full layers |
| After failed fix | Self-heal using LEARNINGS; stop after 2 failures |

---

## Hard ownership

```
os → writes data/migrations/push senders
web → public product + API contracts iOS consumes
admin → ops UI for OS
ios → native client (never Sportmonks direct)
```

SoT: `nav.ts` · `access-rules.ts` · `api-schemas.ts` · `deep-links.ts` · `docs/brand/*`  
Details: [ownership.md](ownership.md) · live map: `.athopia-sync/STRUCTURE.md`

---

## Protocol (always)

```
Athopia Sync Progress:
- [ ] 0. Fingerprint + load brain (STATE, LEARNINGS, cache)
- [ ] 1. Heal known gaps (self-heal loop)
- [ ] 2. Inventory dirty layers only (or full if cold)
- [ ] 3. Plan P0–P2
- [ ] 4. Fix + verify (minimal gates)
- [ ] 5. Document FINDINGS + LEARNINGS + STRUCTURE
- [ ] 6. Rewrite IMPROVEMENTS + refresh cache -RunGates
- [ ] 7. Update ATHOPIA-SYNC-STATE.md
- [ ] 8. Report (verdict + improvements)
```

### 0. Fingerprint + brain

```powershell
cd "C:\Users\jardi\Athopia Build"
pwsh -File ".athopia-sync/scripts/fingerprint.ps1"
```

Read `cache.json` → `layersDirty`. Read `ATHOPIA-SYNC-STATE.md` Open gaps.  
Skim LEARNINGS matching those gap symptoms (L-IDs).

### 1. Self-heal known gaps

For each open P0/P1 in STATE that is PC-actionable:

Follow [self-heal.md](self-heal.md): DETECT → MATCH LEARNING → FIX → VERIFY → DOCUMENT.

Skip Mac/founder-blocked items (note in report, don’t spin).

### 2. Inventory

| Layer | Dirty key | Compare |
|-------|-----------|---------|
| nav | `nav`, `iosNav` | `lib/nav.ts` ↔ iOS tabs + overflow |
| access | `access` | ACCESS map ↔ PaywallGate ↔ iOS `canAccess` |
| api | `api`, `contracts` | routes ↔ schemas ↔ jsonContract ↔ Swift models |
| deepLinks | `deepLinks` | `deep-links.ts` ↔ ContentView |
| brand | `brand` | tokens.json ↔ web CSS ↔ DesignTokens |
| schema | `repo:os` | migrations applied? admin ops? web/iOS consumers? |
| push/commerce | `repo:os`, `repo:web` | APNs + D3 soft-gate intact |

**Feature-wave cascade:**

```
os → migration + admin? → web API → contracts → iOS
web → access/nav/api → contracts → iOS (admin only if ops)
ios-only → usually wrong; add web API first
```

### 3. Plan (user-visible, short)

```markdown
## Athopia Sync Plan — YYYY-MM-DD
Mode: warm|cold · Dirty: …
### P0 …  ### P1 …  ### P2 …
### Heal from LEARNINGS: L-…
### Explicit skips: gamification, …
```

### 4. Fix + verify

| Dirty | Run |
|-------|-----|
| api / access / nav / contracts | `pnpm contracts:generate && contracts:check && test:parity` |
| any web TS | `pnpm typecheck` |
| ios | `pwsh -File athopia-ios/scripts/verify-pc-handoff.ps1` |
| docs-only | fingerprint only — skip typecheck |

Never hand-edit `contracts/generated/*` or `GeneratedProductContracts.swift`.

### 5–6. Document + improve (mandatory — never skip)

1. Append block to `.athopia-sync/FINDINGS.md` (finds / errors / structure)
2. New pattern? Append `L-NNN` to `LEARNINGS.md`
3. Structure path/IA change? Update `STRUCTURE.md`
4. **Rewrite** `.athopia-sync/IMPROVEMENTS.md` (≥3 ideas, ranked; include ≥1 efficiency idea)
5. `fingerprint.ps1 -RunGates` → refresh `cache.json`

Templates: [self-heal.md](self-heal.md) · [checklists.md](checklists.md)

### 7. STATE

Overwrite `ATHOPIA-SYNC-STATE.md` (verdict, done, open gaps, skips, next).

### 8. Report to user (keep short)

1. Verdict + warm/cold + dirty layers  
2. Healed vs still open (Mac/founder called out)  
3. **Improvement potential** — top 3 from IMPROVEMENTS.md with why  
4. Next phrase: `Athopia Sync` · `Athopia Sync cold` · or one gap ID  

---

## Continuous mode (while building any football feature)

Before “done”:

1. Name cascade (which repos move)  
2. Feature-wave checklist ([checklists.md](checklists.md))  
3. Fingerprint dirty layers → heal if needed  
4. One IMPROVEMENTS note if you discovered debt  

---

## Sub-agents

| When | Who | Prompt must include |
|------|-----|---------------------|
| Unknown path | explore (≤2) | repo path + layer + relevant L-ID |
| Implement | parent / generalPurpose | cascade + verify commands |
| iOS compile (Mac) | gstack-ios-fix | build log only |
| Paywall/auth | security-review | files touched |
| Pre-merge large | bugbot | branch diff |

Parent synthesizes — never paste raw sub-agent dumps to the user.

---

## DO NOT

- Gamification · Sportmonks from clients · client-side paywall · mock data  
- Force-push · hand-edit generated contracts · golf  
- Full constitution re-read on warm start  
- Claim “synced” if gates red or STATE P0 PC-fixable remains  
- Skip FINDINGS / IMPROVEMENTS after a build that changed code  

---

## Reference (progressive disclosure)

- [self-heal.md](self-heal.md) — heal loop + journal templates  
- [ownership.md](ownership.md) — cascade + file map  
- [checklists.md](checklists.md) — feature-wave + STATE template  
- [examples.md](examples.md) — prompts  
- Brain: `Athopia Build/.athopia-sync/*`  
- Handoffs: `IOS-MAC-HANDOFF.md`, `athopia-web/contracts/README.md`
