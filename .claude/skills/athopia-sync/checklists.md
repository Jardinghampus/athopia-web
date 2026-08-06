# Athopia Sync — checklists

## Feature-wave (copy per feature)

```markdown
### Feature: <NAME>
Source: <os|web|admin|ios> · Supporter question: <one line>

- [ ] Schema / migration (os) — N/A or done + applied date
- [ ] Admin ops — N/A or done
- [ ] Web page / component
- [ ] Web API (if iOS needs it)
- [ ] api-schemas + jsonContract + SWIFT_MODEL_CONTRACTS
- [ ] access-rules / PaywallGate
- [ ] nav / deep-link
- [ ] contracts:generate + test:parity
- [ ] iOS model + APIClient + view (loading/empty/error)
- [ ] iOS paywall matches ACCESS
- [ ] iOS deep link / overflow if Mer destination
- [ ] Push target if notified
- [ ] Brand tokens only
- [ ] FINDINGS + IMPROVEMENTS updated
- [ ] Explicit skips listed
```

## Warm-start gate matrix

| Dirty layer | Minimum verify |
|-------------|----------------|
| api / contracts / access / nav | contracts:check + test:parity |
| web TS beyond contracts | + typecheck |
| iosNav / ios files | verify-pc-handoff.ps1 |
| brand | tokens visual skim + design-tokens contract |
| docs / brain only | fingerprint (no typecheck) |
| repo:os | migration applied? admin? web consumer? |

## End-of-build mandatory

```markdown
- [ ] FINDINGS.md appended
- [ ] LEARNINGS.md if new pattern
- [ ] STRUCTURE.md if SoT/IA changed
- [ ] IMPROVEMENTS.md rewritten (top ideas + ≥1 efficiency)
- [ ] fingerprint.ps1 -RunGates
- [ ] ATHOPIA-SYNC-STATE.md overwritten
- [ ] User report includes top 3 improvements
```

## STATE template

Write `Athopia Build/ATHOPIA-SYNC-STATE.md`:

```markdown
# ATHOPIA-SYNC-STATE
> Updated: … · Trigger: … · Mode: warm|cold · Dirty: …

## Verdict
## Done this run
## Open gaps (table)
## Explicit skips
## Verify (checkboxes)
## Brain pointers
- Findings: .athopia-sync/FINDINGS.md (latest)
- Improvements: .athopia-sync/IMPROVEMENTS.md
## Next
```
