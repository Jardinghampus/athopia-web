# Athopia Sync — self-heal & learning protocol

Load this file only when healing, documenting, or writing improvements.

## Self-heal loop (mandatory for each gap)

```
DETECT → MATCH LEARNING → FIX → VERIFY → DOCUMENT → IMPROVE
```

1. **DETECT** — gap ID from STATE or fresh inventory (layer + symptom)
2. **MATCH LEARNING** — scan `LEARNINGS.md` for L-* with same symptom; reuse Fix first
3. **FIX** — smallest cascade (os→web→admin→ios); no speculative refactors
4. **VERIFY** — only gates for dirty layers (see TOKEN BUDGET in SKILL.md)
5. **DOCUMENT** — append FINDINGS block; if new pattern → new L-NNN in LEARNINGS
6. **IMPROVE** — rewrite `IMPROVEMENTS.md` top-10 with confidence; propose 1–3 next Sync actions

If Fix fails twice: stop, write ERROR in FINDINGS with repro, escalate to user (do not thrash).

## Document templates

### FINDINGS entry (append at top)

```markdown
## YYYY-MM-DD — <trigger>

### Finds
- …

### Errors
- … (or "none")

### Structure changes
- …

### Lessons promoted
- L-NNN …
```

### LEARNINGS entry (append at bottom)

```markdown
### L-NNN — short title
- **Symptom:**
- **Cause:**
- **Fix:**
- **Prevent:**
- **Tokens:** cheapest next-time check
```

### IMPROVEMENTS rewrite rules

- Max 10 open rows
- Every row needs Impact / Effort (S|M|L) / Confidence / Evidence
- Move shipped items to “Done recently”
- Always include ≥1 token/speed improvement if any gate was slow or redundant

## Structure change rules

When any SoT path, nav IA, access key, or API contract class changes:

1. Update `.athopia-sync/STRUCTURE.md` same run
2. Note in FINDINGS under Structure changes
3. Invalidate related cache layers (re-run fingerprint)

## Healing priority

1. Red gates (`test:parity`, decode, typecheck)
2. Paywall / access mismatch
3. Missing iOS surface for shipped web feature
4. Stale docs that cause wrong agent behavior
5. Visual token drift
6. Admin ops niceties
