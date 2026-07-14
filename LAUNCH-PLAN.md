# Athopia — Launch Plan (kör härifrån)

> **En fil att öppna i ny chatt.** Full spec: [`EXECUTIVE-LAUNCH-PLAN-2026-07-13.md`](./EXECUTIVE-LAUNCH-PLAN-2026-07-13.md)  
> Audit: [`docs/audits/ATHOPIA-WEB-FULL-AUDIT-2026-07-13.md`](./docs/audits/ATHOPIA-WEB-FULL-AUDIT-2026-07-13.md)  
> Modell: **Composer 2.5** (implementation) · Sol endast vid arkitekturblocker.

## North star

**Allsvenskans dagliga intelligenslager för mitt lag** — snabbt, trovärdigt, värt att betala för.

Kärnloop: **Mitt lag → Flöde → Forum → (PRO) destillat.**

---

## Redan klart (web, `main`)

- [x] 4-fliksnav: Mitt lag · Flöde · Forum · Mer
- [x] Athletic-flöde + sortering (För dig / Senaste / Viktigt)
- [x] Priser 89/169/69, 7-dagars trial, blur-paywalls utan DOM-läckage
- [x] `lib/site-url.ts`, öppen produkt (ingen beta-modal)
- [x] API entitlement på scout, match-chat, elite usage
- [x] `pnpm typecheck` + `build` gröna

---

## Launch 1.0 — gör i denna ordning

### Wave 0 — STOP om inte grönt

| ID | Vad | Repo | Klart när |
|----|-----|------|-----------|
| **LAUNCH-01** | **Provenance** — `content_origin`, `article_sources`, ingen tredjepartsbody i publik HTML; `/nyhet/[slug]` source-first | os + web | ✅ tech 2026-07-14 (legal review kvar) |
| **LAUNCH-02** | **Production E2E** — Clerk prod, Stripe IDs, checkout/webhook/portal, personas free/PRO/Elite | web + founder | ⏸ founder (checkout = `price_data` från pricing.ts) |
| **LAUNCH-03** | **Data freshness** — 16/16 lag coverage dashboard, Daily producerar eller mätbart fel, sync/fixtures OK | os + admin | ✅ view live; Daily/Slack kvar |
| **LAUNCH-04** | **AI budget** — en hard cap, atomisk reservation, `getUserPlan()` överallt, server-side matchkontext | os + web | ✅ $20 hard cap web+OS 2026-07-14 |

### Wave 1 — Produkt

| ID | Vad | Repo | Status |
|----|-----|------|--------|
| **LAUNCH-05** | Mitt lag widgets + guest preview + favoritlag SSOT | web | ✅ 2026-07-14 |
| **LAUNCH-06** | Onboarding 3 steg (lag → värde → notiser) + forum/feed hooks | web | ✅ 2026-07-14 |
| **LAUNCH-07** | Release QA: persona-matris, mobil 390px, cookie, links, e2e | web | ✅ nav/smoke e2e uppdaterad; full persona-QA kvar |

**GO Launch 1.0** när LAUNCH-01–07 är gröna + runtime smoke live.

---

## Efter launch (inte blockera v1)

| Wave | Innehåll | Repo |
|------|----------|------|
| BETA-01 | Publisher: admin, mobil editor, 30d draft retention, hamburger-länk | admin + web link |
| BETA-02 | Editorial commissions, facts pack, quality gates | os |
| BETA-03 | Podcast highlights (inte transcript-publicering) | os + web |
| BETA-04 | **Pitchview** (PRO, snabb) + **Grassroot** (Elite, djup) — produktlägen, inte egna modeller | web |

---

## A–H — kort status

| Fas | Status | Fokus kvar |
|-----|--------|------------|
| A Nav | ~85% | Sheets kvar |
| B Flöde | ~75% | kommentar→forum, TTFB |
| C Mitt lag | ~55% | **launch-kritisk** |
| D Forum | ~60% | optimistic, summary API-gate |
| E Statistik | ~65% | zoner, null-xG |
| F Match | ~70% | QuickSheet, live orphan |
| G Onboarding | ~50% | **launch-kritisk** |
| H QA | ~25% | **release gate** |

---

## Agentregler (kort)

1. Läs `CLAUDE.md` + denna fil + en task (LAUNCH-XX) i taget.  
2. En task = en commit. Uppdatera `[ ]` → `[x]` med hash + tester.  
3. Rör inte filer utanför tasken. Committa/pusha bara på begäran.  
4. Ingen admin/publisher i `athopia-web`. Ingen mockdata. Ingen tredjepartstext publikt.

---

## Startprompt (klistra in ny chatt)

```
Du är implementation-agent för Athopia. Läs:
- athopia-web/LAUNCH-PLAN.md
- athopia-web/EXECUTIVE-LAUNCH-PLAN-2026-07-13.md (vid behov)
- athopia-web/CLAUDE.md

Kör LAUNCH-01 (provenance) först om inte redan grönt. En task i taget.
Efter varje task: typecheck, relevant test, uppdatera checklistor, rapportera filer + blockerare.
Committa endast om jag säger commit.
```

---

## STOP — lansera inte om

- Tredjeparts body/teaser i publik payload  
- Paid content nåbar som free (UI eller API)  
- Clerk dev-badge i prod  
- Pris/trial ≠ checkout  
- Påhittad statistik / placeholder-xG  
- Global LLM-budget överskriden  
- Kärnroute trasig på 390px mobil  
