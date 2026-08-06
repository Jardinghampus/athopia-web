# Fortsättningsprompt — athopia-web efter UX/a11y-auditen (uppdaterad 2026-08-06)

Klistra in avsnittet under linjen som första meddelande i nästa session.

---

## Prompt

Vi fortsätter på athopia-web. Läs `UX-AUDIT-2026-08-03.md` innan du börjar —
särskilt §2, §3b.3, §3c.4 och §3d.5, som listar hypoteser som visade sig vara
**mätfel**. Jaga dem inte igen. §3e beskriver senaste omgången: kontrastmätaren
fick alfakomposition och 229 dittills dolda brott stängdes.

**Kör e2e mot ett produktionsbygge, inte `next dev`:**

```
pnpm build && pnpm start     # ena terminalen
pnpm test:e2e                # andra
```

Mot dev-servern ger sviten sporadiska falska fel — vid minnesbrist svarade
fungerande API-routes 404 tills den startades om. Och innan du felsöker något
som ser trasigt ut lokalt: kontrollera att bara **en** process lyssnar på port
3000. Kvarglömda dev-servrar serverar gammal ISR-HTML och fick under auditen en
korrekt ligatabell att se ut som en allvarlig produktionsbugg.

### Uppgift — välj i denna ordning

**1. Visuell granskning (kräver en människa, gör det först)**
Två omgångar färgändringar är mätta till 0 kontrastbrott men aldrig sedda av en
människa:

- *Mörkt läge* — accenten som textfärg gick från `#2D5349` till `#5FA98C`,
  `--muted-foreground` justerades i båda teman.
- *Omgång 5 (2026-08-06)* — `--success` mörkades till `#0B5C43` (påverkar alla gröna
  statusytor), Tailwinds `emerald/amber/orange/blue/purple-400` är mörkare i
  ljust tema, landningssidans dämpade text har golv på `text-white/55` (bl.a.
  footern, som blir tydligt ljusare), och telefonmockupens `text-zinc-400` gick
  till `zinc-600`.

Gå igenom athopia.se i båda teman och säg till om något ser fel ut.

**2. `pnpm test:e2e` avslutas med kod 1**
Inte ett testfel — 228 passerar, 0 failar. En worker-process avslutas inte och
Playwright force-killar den efter 300 s. Det ger exit 1, drar ut körningen och
gör dessutom testet som råkar ligga i den workern flaky ("Target page … has been
closed" — senast `navigation.spec.ts › GlassNav visar fem flikar`, en orörd fil).
Sannolikt en sida som håller en timer eller uppkoppling vid liv. Värt att spåra
innan sviten sätts i CI.

**3. Om inget av ovanstående är intressant**
Föreslå själv utifrån `BUILD.md` och `VISION.md` vad som ger mest värde härnäst,
och motivera kort varför.

### Arbetssätt

Följ `CLAUDE.md`. Mät i webbläsaren i stället för att gissa, och skriv ut när en
hypotes **inte** höll — de posterna är lika värdefulla som fynden. Nya
UX-regler ska landa som regressionstest, inte bara som text i ett dokument.

---

## Läget just nu (fakta, inte påståenden)

| | |
|---|---|
| Full svit mot prodbygge | 228 passerade, 1 flaky, 5 skippade, 0 fel (exit 1 pga worker-hang, se punkt 2) |
| Kontrast | 0 brott över 22 routes × 2 teman, med alfakomposition |
| `pnpm lint` | 135 problem — oförändrad baslinje, inga nya |

**Regressionsvakter i `tests/e2e/`:**

- `a11y-shell` — skip-link, `#main` per route, dock-etiketter, `aria-current`,
  320px-overflow, 44px-träffytor, 404-wayfinding
- `contrast` — WCAG 1.4.3 över 22 routes × 2 teman (18 statiska + 4 djupsidor
  vars id:n plockas från listsidorna) + källkodsvakt mot `text-pitch`,
  `text-pitch-light` och `text-[var(--color-pitch)]` som textfärg
- `team-ink` — alla 16 klubbar + fallbacken, båda teman, mot de svåraste ytorna
- `modal-focus` — dialogsemantik, fokusfälla, Escape, fokusåterlämning,
  scroll-lås, samt att toasts uttryckligen INTE fångar fokus
- `search-url` — sökknappen är en länk, `?sok=1` öppnar dialogen, back stänger

**Fem skippade tester**: tre avsiktliga (skip-linkens tangentbordsordning under
WebKit, plus två som kräver data som inte alltid finns) och två djupsides-svep
som hoppar över sig själva när listsidan är tom.

**Designsystem — viktigast att inte bryta:**

| Token | Roll |
|---|---|
| `--color-pitch` | **yta** (`bg-pitch`, `border-pitch`), alltid med vit text |
| `--color-pitch-ink` | **text** på sidbakgrund, växlar valör med temat |
| `--success-foreground` | text på solid `bg-success`, vänds per tema |
| `--color-destructive-ink` | röd **text ovanpå sin egen tint** (`bg-destructive/20`) |
| `getTeamInk()` + `.team-ink` | klubbfärg som **text**; `getTeamAccent()` är ytan |

Skriv aldrig `text-pitch`, `text-pitch-light` eller `text-[var(--color-pitch)]`
som textfärg — vakten i `contrast.spec.ts` failar bygget. Undantag är ytor som
medvetet inte följer temat, t.ex. telefonmockupen på landningssidan; de ska
använda en statisk valör som `text-pitch-dark`.

Regeln bakom `-ink`-tokens: **en färg och en tint av samma färg räcker aldrig
till 4.5:1.** Ska statusfärgen ligga som text ovanpå `bg-<färg>/10–20`, använd
`-ink`-valören, inte grundfärgen.
