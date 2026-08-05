# Fortsättningsprompt — athopia-web efter UX/a11y-auditen (2026-08-05)

Klistra in avsnittet under linjen som första meddelande i nästa session.

---

## Prompt

Vi fortsätter på athopia-web efter UX/UI/a11y-auditen som avslutades 2026-08-05.
Allt från den är mergat till `main` och deployat till prod (PR #9–#13). Läs
`UX-AUDIT-2026-08-03.md` innan du börjar — särskilt §2, §3b.3, §3c.4 och §3d.5,
som listar hypoteser som visade sig vara **mätfel**. Jaga dem inte igen.

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

**1. Visuell granskning av mörkt läge (kräver en människa, gör det först)**
Accentfärgen som textfärg gick från `#2D5349` till `#5FA98C` i mörkt tema, och
`--muted-foreground` justerades i båda teman. Allt är mätt till 0 kontrastbrott
över 18 routes × 2 teman, men **ingen människa har sett resultatet**. Gå igenom
athopia.se i mörkt läge och säg till om något ser fel ut — det är billigare att
justera nu än efter att användare hunnit vänja sig.

**2. Stäng de tre öppna punkterna i rapportens §4**

- **Alfakomposition i kontrastmätaren.** `tests/e2e/contrast.spec.ts` hoppar
  över element vars bakgrund den inte kan tolka (Tailwind v4 skriver många
  färger som `oklch()`). Det döljer verkliga brott — det var så en osynlig
  rubrik på `/analys` slank igenom. Ett canvas-försök gav 35 falska brott och
  återställdes; korrekt lösning kräver att man parsar alfa och komponerar
  genom hela förälderkedjan. Fixa mätaren först, kör om, åtgärda det som faller
  ut.
- **Kontrast på djupsidor.** `/artikel/[slug]`, `/lag/[slug]`, `/spelare/[slug]`
  och `/match/[id]` är inte svepta eftersom de kräver riktiga id:n. Hämta ett
  giltigt id per typ och lägg till dem i `contrast.spec.ts`.
- **Sökknappen före hydrering.** Ett klick innan appen hydrerats gör
  ingenting. Kräver att öppet-läget flyttas till URL:en (t.ex. `?sok=1`), vilket
  också ger delbara söklänkar. Produktbeslut: vill vi ha history-poster för
  öppnad sök?

**3. Om något av ovanstående inte är intressant**
Föreslå själv utifrån `BUILD.md` och `VISION.md` vad som ger mest värde
härnäst, och motivera kort varför.

### Arbetssätt

Följ `CLAUDE.md`. Mät i webbläsaren i stället för att gissa, och skriv ut när en
hypotes **inte** höll — de posterna är lika värdefulla som fynden. Nya
UX-regler ska landa som regressionstest, inte bara som text i ett dokument.

---

## Läget just nu (fakta, inte påståenden)

| | |
|---|---|
| `main` | `1b5460b`, prod-deploy grön |
| Öppna PR:ar från auditen | inga — #9, #10, #11, #12, #13 mergade |
| Full svit mot prodbygge | 173 passerade, 3 skippade, 0 fel, 6,7 min, utan omförsök |
| Kontrast | 0 brott över 18 routes × 2 teman |

**Regressionsvakter i `tests/e2e/`:**

- `a11y-shell` — skip-link, `#main` per route, dock-etiketter, `aria-current`,
  320px-overflow, 44px-träffytor, 404-wayfinding
- `contrast` — WCAG 1.4.3 över 18 routes × 2 teman + källkodsvakt mot att
  `text-pitch` återinförs som textfärg
- `modal-focus` — dialogsemantik, fokusfälla, Escape, fokusåterlämning,
  scroll-lås, samt att toasts uttryckligen INTE fångar fokus

**Tre skippade tester är avsiktliga**, inte trasiga: skip-linkens
tangentbordsordning under WebKit (Safari tabbar inte till länkar utan macOS
"Tab highlights each item"), och två som kräver data som inte alltid finns.

**Designsystem — viktigast att inte bryta:**

| Token | Roll |
|---|---|
| `--color-pitch` | **yta** (`bg-pitch`, `border-pitch`), alltid med vit text |
| `--color-pitch-ink` | **text** på sidbakgrund, växlar valör med temat |
| `--success-foreground` | text på solid `bg-success`, vänds per tema |

Skriv aldrig `text-pitch` eller `text-pitch-light` som textfärg — vakten i
`contrast.spec.ts` failar bygget. Undantag är ytor som medvetet inte följer
temat, t.ex. telefonmockupen på landningssidan (en bild av appen på fast ljus
bakgrund); de ska använda en statisk valör som `text-pitch-dark`.
