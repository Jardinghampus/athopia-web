---
target: mitt-lag
total_score: 26
p0_count: 0
p1_count: 3
timestamp: 2026-06-12T10-29-28Z
slug: app-app-mitt-lag-mittlagdashboard-tsx
---
## Design Health Score — /mitt-lag (MittLagDashboard)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeleton + "Uppdaterad Xs sedan" bra; tyst vid refetch-fel |
| 2 | Match System / Real World | 4 | Svensk fotbollsterminologi rakt igenom (V/O/F, xG, H/B) |
| 3 | User Control and Freedom | 3 | Sheet har drag/overlay/Esc-dismiss; inget att ångra |
| 4 | Consistency and Standards | 2 | blue-400 på KOMMER/LIVE bryter en-accent-regeln; nyhetsrader (border-chips) vs matchrader (ListRow) = två radvokabulärer |
| 5 | Error Prevention | 3 | Read-only-yta, lite att förebygga |
| 6 | Recognition Rather Than Recall | 3 | Lagväljaren ser ut som rubrik — dold affordance utan chevron |
| 7 | Flexibility and Efficiency | 2 | Tab-state ej i URL (kan ej bokmärka Statistik); inga kortkommandon |
| 8 | Aesthetic and Minimalist Design | 3 | Tät och ren; collapse-chevrons på varje kort är brus |
| 9 | Error Recovery | 1 | "Kunde inte ladda lagdata." — ingen retry-knapp, ingen orsak |
| 10 | Help and Documentation | 2 | Radar har förklaring; annars inget (acceptabelt för ytan) |
| **Total** | | **26/40** | **Acceptable** |

## Anti-Patterns Verdict
LLM: Ingen AI-slop. Tactile-vokabulären (SegmentedControl, ListRow, Sheet, StatNumber) är konsekvent och produktmässig; inga gradient-text/eyebrows/ghost-cards. Deterministisk scan: 0 fynd över mitt-lag + alla 10 Tactile-komponenter.

## Priority Issues
- **[P1] Lagväljaren är en osynlig affordance.** Native select stylad som rubrik — ingen chevron, ingen aria-label; ser ut som statisk text. Fix: synlig ChevronDown + aria-label="Välj lag"; överväg Sheet-baserad väljare. (polish)
- **[P1] PullToRefresh krockar med webbläsarens egen pull-to-refresh.** overscroll-behavior är inte satt — på mobil Chrome/Safari triggas sidomladdning samtidigt som komponentens gest. Fix: overscroll-behavior-y: contain på containern. (harden/polish)
- **[P1] Touchmål under 44px.** SegmentedControl py-1.5 ≈ 32px höjd; DESIGN.md kräver ≥44px. Fix: höj till py-2.5/min-h-11 på mobil. (polish)
- **[P2] Fel-state utan återhämtning.** "Kunde inte ladda lagdata." saknar retry-knapp. Fix: knapp som kör refetch + behåll förra datat synligt om det finns. (harden)
- **[P2] Off-palette-accent.** blue-400 för KOMMER/LIVE — paletten har en accent (pitch). Fix: pitch för LIVE (puls), muted för KOMMER. (polish)

## Persona Red Flags
**Alex (power user):** Tab-val försvinner vid lagbyte och finns inte i URL:en — kan inte länka till Statistik-fliken; inga kortkommandon (1–5 för flikar vore naturligt).
**Casey (mobil, en hand):** Segmented control-målen ~32px och tätt packade (5 flikar); dubbel pull-to-refresh-gest; quickview-CTA i tumzonen är däremot rätt.
**Sam (skärmläsare):** select utan label; uppdatera-knappen blir ikon-enbart på mobil utan aria-label; FormDots OK (bokstäver, inte bara färg).

## Minor Observations
- FixtureFeed:s [&>*]-padding-hack är skör — ge ListRow en density-prop istället.
- 6 KeyStat-kort i en grupp (>4-chunk-regeln) — acceptabelt för målgruppen men 4+2 vore lugnare.
- Collapse-state på SectionCards persisteras inte.
- Radar utan data saknar empty state.

## Questions to Consider
- Ska fliken ligga i URL:en (?tab=statistik) så delning/bokmärken fungerar?
- Behövs collapse på korten alls, eller är det kvarglömd komplexitet?
- Vad förmedlar LIVE bäst — färg, puls eller båda?
