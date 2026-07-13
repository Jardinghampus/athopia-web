# ChatGPT hand-over 2026-07-13

## Uppdrag till Claude Code

Ta över granskningen och förbättringsarbetet i `athopia-web`. Börja med att förstå befintligt arbete och den fullständiga auditen. Åtgärda sedan problemen i prioriterad ordning, utan att skriva över de lokala ändringar som redan finns.

Målet är inte bara att få gröna tester. Målet är en trovärdig, begriplig och säker produkt där en ny användare snabbt förstår värdet, väljer sitt lag, kommer in i sin dagliga fotbollsupplevelse och kan uppgradera utan motsägelser eller tekniska risker.

Produktionsadress som granskades: <https://athopia-web.vercel.app>

Fullständig audit: [`docs/audits/ATHOPIA-WEB-FULL-AUDIT-2026-07-13.md`](docs/audits/ATHOPIA-WEB-FULL-AUDIT-2026-07-13.md)

Auditens nulägesbetyg: **56/100**.

## Börja här

Läs följande filer helt innan du ändrar kod:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `PRODUCT.md`
4. `DESIGN.md`
5. `docs/audits/ATHOPIA-WEB-FULL-AUDIT-2026-07-13.md`
6. Denna hand-over

Gör därefter detta innan första ändringen:

```powershell
git branch --show-current
git status --short
git diff --stat
git diff
git log -5 --oneline --decorate
```

## Kritisk säkerhetsregel: bevara pågående arbete

Arbetskopian är redan smutsig. Ändringarna tillhör användaren eller en annan pågående agent och ska betraktas som värdefullt WIP.

- Kör inte `git reset --hard`.
- Kör inte `git checkout -- <fil>`.
- Stasha inte allt slentrianmässigt.
- Skriv inte över en ändrad fil utan att först läsa diffen.
- Slå ihop nya åtgärder med befintlig intention.
- Gör små, avgränsade ändringar och verifiera efter varje grupp.
- Pusha, skapa PR, migrera live-data eller deploya inte utan uttryckligt uppdrag.
- Lägg aldrig nycklar eller andra hemligheter i klientkod, dokumentation eller git.

Nuläge vid överlämning:

- Branch: `main`
- HEAD: `9f474f7 fix: pin all match/forum timestamps to Europe/Stockholm`
- `origin/main` pekade på samma commit.
- Inga staged changes noterades.
- Diff vid överlämning: cirka 403 tillagda och 191 borttagna rader, utöver untracked filer.

Ändrade eller nya filer vid överlämning:

```text
M  app/(app)/artikel/[slug]/page.tsx
M  app/(app)/forum/[teamSlug]/page.tsx
M  app/(app)/konto/page.tsx
M  app/(app)/lag/[slug]/page.tsx
M  app/(app)/layout.tsx
M  app/(app)/match/[id]/page.tsx
M  app/(app)/prenumerera/PricingPlans.tsx
M  app/(app)/prenumerera/page.tsx
M  app/api/create-checkout/route.ts
M  components/FeedPaywallBanner.tsx
M  components/UpgradePrompt.tsx
M  components/landing/Faq.tsx
M  components/landing/FinalCta.tsx
M  components/landing/Pricing.tsx
M  components/layout/CommandPalette.tsx
M  components/news/NewsStream.tsx
M  components/team-hub/TransferRadar.tsx
M  lib/access-rules.ts
M  lib/pricing.ts
?? components/ForumSummaryPopupGate.tsx
?? docs/audits/
```

Kontrollera alltid ett nytt `git status` eftersom arbetet kan fortsätta ändras efter att dokumentet skrevs.

## Vad det pågående arbetet verkar göra

Den lokala diffen ser ut att vara en pågående monetiserings- och behörighetsombyggnad:

- centraliserar priser och lägger till sju dagars trial i `lib/pricing.ts`;
- ändrar landningssidans pris- och trial-copy;
- lägger PRO-gating på AI-sammanfattningar och Athopia AI-innehåll;
- lägger PRO-gating på forumets AI-sammanfattning;
- lägger PRO-gating på Transfer Radar;
- gate:ar den globala forum-popupen genom `ForumSummaryPopupGate`;
- utökar `lib/access-rules.ts` med `forumSummary` och `transferSignals`;
- justerar paywall- och uppgraderingsbudskap.

Detta är **inte verifierat eller färdigt bara för att diffen finns**. Särskilt viktigt:

- Kontrollera att betalande innehåll inte skickas till klienten och bara döljs med blur.
- Kontrollera att befintliga betalande användare behåller rätt åtkomst.
- Kontrollera `free`, `pro` och `elite` separat.
- Kontrollera att den nya paketeringen stämmer med `PRODUCT.md` och faktisk Stripe-konfiguration.
- Kontrollera att Athopia inte tar bort för mycket gratisvärde och därmed dödar vanebyggandet.

## Produktbedömning att utgå från

Athopias starkaste möjliga position är inte att vara ännu en livescore-app. Den trovärdiga kilen är:

> **Allsvenskans dagliga intelligenslager för mitt lag — sammanfattat, personligt och snabbare att förstå.**

Det kan konkurrera med större aktörer genom fokus, inte genom bredd:

- Forza/FotMob: starkare på livescore, matchdata och generell täckning.
- Google News: starkare på generell aggregation och distribution.
- Bolldata och statistikprodukter: starkare inom vissa datadjup.
- Athopia kan vinna på team-first onboarding, svensk kontext, källsammanvägning, AI-brief, supportersamtal och ett tydligt dagligt beteende.

Prioritera därför kärnloopen:

1. Välj lag.
2. Se vad som hänt sedan sist.
3. Förstå det viktigaste på några minuter.
4. Fördjupa sig i nyheter, match, forum eller podd.
5. Få anledning att komma tillbaka via relevanta notifieringar och nästa brief.

Bygg inte bredd bara för att efterlikna en stor app. Förstärk det Athopia kan vara bäst på.

## Åtgärdsordning

### Fas 0 — säkra baslinjen

- [ ] Läs hela lokala diffen och märk varje ändring som avsiktlig, ofärdig eller misstänkt.
- [ ] Kör typkontroll och bygg innan nya ändringar, så regressionsbasen är känd.
- [ ] Kontrollera vilka miljövariabler som förväntas utan att skriva ut deras värden.
- [ ] Kartlägg den enda auktoritativa modellen för plan/behörighet.
- [ ] Bekräfta om aktuellt produktläge ska vara öppen lansering eller sluten beta.

Om den sista punkten inte går att avgöra från repo, Vercel-konfiguration eller produktdokument: rekommendera **öppen produkt med riktig inloggning**, eftersom sajten redan marknadsför priser och prenumeration. Ändra inte produktläge i tysthet om valet påverkar riktiga användare.

### Fas 1 — P0: lanserings- och intäktsblockerare

#### 1. Clerk måste vara produktionsredo

Live-sajten visade `Development mode` i Clerk.

Åtgärd:

- kontrollera att Vercel använder Clerk production keys på production-deployment;
- kontrollera Clerk-domän, redirect-URL:er och tillåtna origins;
- lägg till tydlig konfigurationsvalidering om appen kan starta i fel läge;
- verifiera registrering, inloggning, utloggning och redirect till onboarding/app.

Acceptans:

- ingen development-badge i produktion;
- ingen redirect-loop;
- inloggad användare hamnar på avsedd sida;
- auth fungerar på mobil och desktop.

Detta kan kräva extern Vercel/Clerk-åtkomst. Dokumentera exakt miljöåtgärd om den inte kan utföras lokalt.

#### 2. Ett enda pris och ett enda trial-budskap

Auditen hittade flera samtidiga priser live:

- landning: PRO 89 / Elite 169;
- FAQ: 99 / 199;
- prenumerationssida: founder 69;
- lokal diff introducerar även sju dagars trial.

Åtgärd:

- använd `lib/pricing.ts` som enda källa för belopp, intervall, founder-status och trial;
- ta bort handskrivna belopp ur UI-copy, metadata och checkout;
- kontrollera att Stripe Price IDs motsvarar visade priser;
- bestäm exakt hur founder-priset presenteras jämfört med listpris;
- håll månads- och årspris matematiskt och språkligt konsekventa;
- visa villkor före checkout: trial, första debitering, förnyelse och uppsägning.

Acceptans:

- samma pris på landing, FAQ, `/prenumerera`, `/konto`, CTA:er och checkout;
- inga gamla 99/199-strängar kvar;
- inga falska rabatter eller otydliga trial-villkor;
- servern väljer pris från en allowlist, aldrig från godtycklig klientinput.

#### 3. Ta bort motsägelsen mellan beta och öppen försäljning

Live-sajten hade både en privat beta-modal med en klientläsbar accesskod och vanliga auth-/prisflöden som kunde kringgå den.

Rekommenderad riktning: öppen produkt med riktig auth och eventuell kontrollerad waitlist för funktioner som faktiskt är stängda.

Om produkten fortsatt ska vara sluten beta:

- validera access server-side;
- lagra inte accesskoden i klientbunten;
- skydda alla ingångar konsekvent;
- gör pris-/köpflödet förenligt med betastatus.

Om produkten ska vara öppen:

- ta bort beta-modal och accesskod;
- använd en ärlig label som “tidig version” endast där det behövs;
- låt CTA:er leda till samma registreringsflöde.

#### 4. Centralisera publik bas-URL och canonical

Auditen hittade cirka 70 förekomster i 29 filer av hårdkodade `https://athopia.se`, medan den verifierade live-adressen var `https://athopia-web.vercel.app`.

Det påverkar bland annat:

- canonical och metadata;
- sitemap och JSON-LD;
- delningslänkar;
- Stripe success/cancel URLs;
- webhook- eller redirectlogik.

Åtgärd:

- skapa eller använd en central `SITE_URL`/`APP_URL`-helper;
- validera URL:en server-side;
- använd Vercel-preview-URL endast för previews;
- sätt produktionens canonical till den domän som faktiskt är kopplad och fungerar;
- behåll en framtida `athopia.se`-växling som konfiguration, inte hårdkodning.

Acceptans:

- inga relevanta hårdkodade produktionsdomäner kvar;
- sitemap, robots, metadata, JSON-LD och checkout använder samma bas;
- inga preview-domäner indexeras som canonical.

#### 5. Gör behörighet och paywalls server-säkra

Nu finns både äldre `subscriptionTier`-spår och den aktiva modellen med `publicMetadata.plan`/`getUserPlan`/`canAccess`.

Granska särskilt:

- `components/ui/ProGate.tsx`
- `hooks/useUser.ts`
- `lib/user-plan.ts`
- `lib/access-rules.ts`
- `components/PaywallGate.tsx`
- alla API-routes som returnerar betalt innehåll.

Åtgärd:

- välj en auktoritativ planmodell;
- migrera eller ta bort legacy-hjälpare;
- kontrollera plan server-side vid varje skyddad datakälla;
- skicka inte full betald text till gratis klient och dölj med CSS;
- håll UI-gating och API-gating i synk;
- definiera beteende för saknad, felaktig eller gammal metadata;
- verifiera webhook-flödet som uppdaterar plan efter checkout/cancel/refund.

Acceptans:

- `free`, `pro` och `elite` får exakt rätt innehåll;
- inga betalväggar kan kringgås via nätverksanrop eller HTML;
- uppgradering och nedgradering slår igenom förutsägbart;
- ingen parallell entitlement-modell lever kvar utan tydligt skäl.

#### 6. Säkra checkout och publika skriv-endpoints

Åtgärda eller verifiera:

- checkout ska inte läcka råa Stripe-fel till klienten;
- plan och price ska allowlistas server-side;
- success/cancel URLs ska komma från betrodd bas-URL;
- AI-routes ska validera meddelandestruktur, längd och total payload;
- skydda promptgränser och behandla artikel-/forumtext som obetrodd data;
- analytics-, waitlist- och andra anonyma write-endpoints behöver rate limit och validering;
- logga säkert utan tokens, persondata eller hela promptar;
- returnera stabila, användarvänliga felkoder.

### Fas 2 — P1: mobil, tillgänglighet och visuellt förtroende

#### 1. Cookie-banner

På mobil överlappade cookiebannern centrala CTA:er och auth.

- [ ] Gör den kompakt eller bottom-sheet-baserad.
- [ ] Respektera safe-area.
- [ ] Blockera inte registrering, navigation eller köp.
- [ ] Behåll tillräckligt stora knappar.
- [ ] Verifiera vid 320, 375, 390 och 430 px.

#### 2. Horisontell overflow på `/prenumerera`

- [ ] Identifiera exakt element som bryter 390 px.
- [ ] Ta bort overflow utan att gömma viktig information.
- [ ] Kontrollera prisväxlare, kort, badges, tabeller och CTA-copy.

#### 3. Kontrast

Hero-grönt `#2D5349` mot svart låg runt 2.45:1 i granskningen.

- [ ] Använd en ljusare accent för text/länkar eller annan bakgrund.
- [ ] Kontrollera vanlig text mot WCAG AA 4.5:1.
- [ ] Kontrollera stor text och UI-komponenter mot relevant nivå.
- [ ] Kontrollera både light/dark om båda stöds.

#### 4. Text och touch targets

Många interaktiva ytor var under 44 px och sekundär text är ofta 10–12 px.

- [ ] Primär brödtext bör normalt vara minst 16 px på mobil.
- [ ] Metadata kan vara mindre men måste vara läsbar och ha kontrast.
- [ ] Ikonknappar och navmål ska normalt ha minst 44×44 px träffyta.
- [ ] Lägg inte avgörande information endast i färg eller hover.
- [ ] Kontrollera fokusmarkering, tangentbord och screen reader-labels.

#### 5. Navigationshierarki

Navigationen är rik men riskerar att kännas som många separata funktioner.

Gör “Mitt lag” och dagens brief till primära hemmet. Gruppera sekundära ytor som statistik, tabell, poddar och forum under begriplig kontext. Kommandopaletten får inte bli en ersättning för tydlig grundnavigation.

### Fas 3 — P1/P2: onboarding och kärnloop

Onboarding kunde inte fulltestas utan riktigt testkonto. Den måste testas med minst ett nytt gratis testkonto.

Önskat flöde:

1. Skapa konto.
2. Välj favoritlag.
3. Välj notifieringsnivå och eventuellt intressen.
4. Visa omedelbar personlig nytta, inte en tom dashboard.
5. Förklara nästa dagliga moment: brief, match eller viktig händelse.

Krav:

- [ ] Lagval kan ändras senare i konto.
- [ ] Skip är möjligt där det är rimligt, men konsekvensen förklaras.
- [ ] Onboarding återupptas korrekt om användaren lämnar mitt i.
- [ ] Ingen blank eller generisk första feed efter lagval.
- [ ] Notifieringstillstånd begärs efter att värdet förklarats, inte direkt.
- [ ] Gratisnivån ger tillräckligt värde för att bygga en vana.
- [ ] PRO säljer tidsbesparing, sammanhang och att vara tidigt informerad.
- [ ] Elite har en konkret målgrupp och konkret fördel; ta bort eller döp om nivån om värdet inte kan förklaras.

### Fas 4 — backend, data och driftsäkerhet

Granska hela auditens backend-kapitel. Fokusera särskilt på:

- bred användning av service-role;
- `select("*")` i heta eller publika flöden;
- mock/fallback-data som kan visas i produktion som om den vore riktig;
- RPC-funktioners `EXECUTE`-privilegier;
- RLS för alla användarägda tabeller;
- idempotens i webhookar och bakgrundsjobb;
- timeouts, retry och degraderat läge för AI/data-providers;
- cache-policy för nyheter, tabeller, matcher och personaliserat innehåll;
- skydd mot dubbla events, gamla events och fel ordning;
- observability utan känslig data.

Regler:

- använd minst privilegium;
- service-role ska aldrig hamna i klienten;
- använd explicita kolumner i stället för `select("*")` där det är relevant;
- mock-data ska vara tydligt märkt och helst avstängd i produktion;
- migreringar ska vara defensiva och verifieras mot faktisk live-schema innan de körs;
- applicera inte Supabase-migreringar live utan uttryckligt godkännande.

### Fas 5 — SEO, prestanda och kvalitetssystem

#### SEO

- [ ] En korrekt canonical-strategi.
- [ ] Unika titles/descriptions för viktiga indexerbara sidor.
- [ ] JSON-LD med korrekt publik URL.
- [ ] Sitemap ska bara innehålla avsedda, fungerande och indexerbara sidor.
- [ ] Auth-, konto- och personliga sidor ska inte indexeras.
- [ ] Artikel- och lag-sidor behöver internlänkning som hjälper både användare och sök.

#### Prestanda

Auditens ungefärliga browserprov:

- `/`: cirka 101 requests, 964 KB och cirka 1 s TTFB;
- `/nyheter`: cirka 3,0 s;
- `/statistik`: cirka 2,2 s;
- `/prenumerera`: cirka 1,7 s;
- `/mitt-lag`: cirka 1,9 s.

Mät på nytt och fokusera på:

- serverväntan och onödiga sekventiella datahämtningar;
- för stora klientbundles;
- bilder, fontladdning och tredjepartsskript;
- cache/revalidation per datatyp;
- skeletons som motsvarar slutlayouten;
- att landningen inte laddar appens hela tyngd.

#### Testinfrastruktur

`pnpm typecheck` och `pnpm build` gick igenom under auditen. Bygget behövde nätverksåtkomst för Google Fonts.

`pnpm test:links` misslyckades eftersom scriptet använder `ts-node`, som inte finns installerat. Projektet har redan `tsx`.

Rekommenderad fix:

- ändra `test:links` till att köra `tsx scripts/link-audit.ts`, eller installera och lås `ts-node` om det finns ett verkligt skäl;
- kör länkgranskningen och fixa verkliga fel;
- lägg den i CI så att brutna länkar inte återkommer.

## Testmatris som måste köras

| Persona | Desktop | Mobil | Viktigaste kontroller |
|---|---:|---:|---|
| Anonym | Ja | Ja | Landing, cookie, auth-CTA, priser, publika länkar |
| Ny gratis | Ja | Ja | Registrering, onboarding, lagval, första personliga vy |
| Befintlig gratis | Ja | Ja | Feed, forum, match, synliga men säkra paywalls |
| PRO | Ja | Ja | AI-sammanfattning, forum-digest, Transfer Radar, brief, checkoutstatus |
| Elite | Ja | Ja | Alla PRO-rättigheter plus faktisk Elite-skillnad |
| Nedgraderad | Ja | Minst smoke | Ingen fortsatt otillåten åtkomst, begripligt UI |

Viktiga rutter:

```text
/
/sign-in
/sign-up
/onboarding
/mitt-lag
/nyheter
/artikel/[slug]
/match/[id]
/lag/[slug]
/forum/[teamSlug]
/statistik
/tabell
/prenumerera
/konto
/ai
```

Kontrollera dessutom:

- back/forward och refresh mitt i onboarding;
- deep link före och efter auth;
- tom data, långsam data och providerfel;
- mycket långa rubriker och saknade bilder;
- 320–430 px mobilbredd och minst en vanlig desktopbredd;
- tangentbordsnavigation och synlig fokus;
- inga console errors eller oklara network failures;
- Stripe endast i testläge under verifiering.

## Verifieringskommandon

Kör från repo-roten:

```powershell
pnpm typecheck
pnpm lint
pnpm build
pnpm test:links
pnpm test:e2e
```

Om ett kommando redan har kända fel:

1. dokumentera exakt befintligt fel före ändringen;
2. skilj baslinjefel från ny regression;
3. lämna inte ett nytt fel odokumenterat;
4. använd inte `--no-verify` för att maskera problem.

Efter UI-fixar: verifiera visuellt i riktig browser, inte bara genom JSX-läsning.

Efter auth/plan/checkout-fixar: verifiera serverrespons och nätverk, inte bara att en knapp ser låst ut.

## Definition of done för första stabiliseringsrundan

- [ ] Clerk kör production mode i produktion.
- [ ] Ett pris/trial-budskap används överallt.
- [ ] Beta/open-product-motsägelsen är borta.
- [ ] Publik bas-URL är centraliserad och korrekt.
- [ ] Checkout använder allowlist och säkra fel.
- [ ] En enda entitlement-modell styr både UI och serverdata.
- [ ] Gratis användare kan inte hämta PRO/Elite-innehåll via API/HTML.
- [ ] Cookie-banner blockerar inte mobilflöden.
- [ ] `/prenumerera` har ingen horisontell overflow vid 390 px.
- [ ] Kritisk textkontrast och touch targets klarar rimlig tillgänglighetsnivå.
- [ ] Ny användare kan genomföra onboarding och får omedelbart personligt värde.
- [ ] `typecheck`, `build` och relevanta E2E-test går igenom.
- [ ] `test:links` fungerar och verkliga länkningsfel är åtgärdade.
- [ ] Inga hemligheter, mockdata eller råa providerfel exponeras.
- [ ] Ändringarna är dokumenterade med vad som fixades, vad som kräver extern konfiguration och vad som återstår.

## Så bör arbetet delas upp

Undvik en enda massiv ombyggnad. Föreslagen ordning för separata, granskningsbara ändringsgrupper:

1. Baslinje och testscript.
2. Pris/trial/checkout-copy.
3. Site URL, canonical och redirects.
4. Entitlementmodell och server-side paywalls.
5. Beta/auth production-konfiguration.
6. Mobil overflow, cookie och tillgänglighet.
7. Onboarding och första personliga upplevelse.
8. Backend-hardening.
9. Prestanda, SEO och bred regressionstest.

Varje grupp ska ha:

- konkret problem;
- begränsad diff;
- verifieringsbevis;
- notering om extern konfiguration;
- ingen orelaterad formattering eller städning.

## Saker som inte verifierades fullt i auditen

- autentiserad onboarding med ett riktigt nytt testkonto;
- Stripe-köp med testkort genom hela webhookkedjan;
- live Supabase RLS/policies direkt mot produktionsprojektet;
- planövergång free → pro → elite → nedgraderad;
- riktig pushnotis på fysisk enhet;
- faktisk DNS/custom domain-status för `athopia.se`;
- Lighthouse/Core Web Vitals under kontrollerade produktionsförhållanden.

Gör inga antaganden om dessa. Testa eller märk dem uttryckligen som blockerade av extern åtkomst.

## Visuellt underlag från auditen

Skärmbilder ligger utanför repot i Codex visualiseringsyta:

```text
C:\Users\jardi\.codex\visualizations\2026\07\13\019f5c5a-7244-7f22-a8ab-a8bdef53059d\screenshots\landing-desktop.png
C:\Users\jardi\.codex\visualizations\2026\07\13\019f5c5a-7244-7f22-a8ab-a8bdef53059d\screenshots\landing-mobile.png
C:\Users\jardi\.codex\visualizations\2026\07\13\019f5c5a-7244-7f22-a8ab-a8bdef53059d\screenshots\onboarding-live.png
```

Browserhjälpfiler från samma granskning:

```text
C:\Users\jardi\.codex\visualizations\2026\07\13\019f5c5a-7244-7f22-a8ab-a8bdef53059d\live-audit.js
C:\Users\jardi\.codex\visualizations\2026\07\13\019f5c5a-7244-7f22-a8ab-a8bdef53059d\live-copy.js
```

## Kort startprompt för Claude Code

> Läs `CHATGPT-HAND-OVER-2026-07-13.md` och den fullständiga auditen. Inspektera först hela befintliga git-diffen och bevara pågående arbete. Kör baslinjetester. Börja därefter med Fas 1 i prioriterad ordning. Gör små avgränsade fixar, kontrollera free/pro/elite server-side och verifiera varje UI-fix i browser på mobil och desktop. Pusha, deploya eller kör live-migreringar endast efter uttryckligt godkännande. Rapportera löpande vad som är fixat, vilka tester som passerar och vad som kräver extern Clerk/Vercel/Stripe/Supabase-åtkomst.

## Överlämningsstatus

**DONE_WITH_CONCERNS**

Auditen och denna exekverbara hand-over är färdiga. Själva implementationen är inte genomförd som del av överlämningen. Den största omedelbara risken är att arbetskopian redan innehåller omfattande pågående behörighets- och prisändringar som måste granskas och integreras, inte ersättas.
