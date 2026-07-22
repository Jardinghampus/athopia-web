# Athopia Masterbuild: Web ↔ iOS Parity

> Datum: 2026-07-14  
> Status: besluts- och exekveringsplan  
> Omfattning: `athopia-web`, `athopia-ios` samt nödvändiga API-/pushkontrakt  
> Mål: användaren ska känna igen samma Athopia-produkt, konto, rättigheter,
> innehåll och navigationslogik på webb och iOS. Presentationen ska vara
> pixelnära inom respektive plattform och följa plattformens egna idiom.

## 1. Beslut

### 1.1 Paritet betyder tre saker

1. **Beteendeparitet, obligatorisk:** samma destinationer, funktioner, data,
   paywalls, planutfall, copy, fel-/tom-/loadingtillstånd och analytics.
2. **Visuell paritet, obligatorisk:** samma brandtokens, hierarki, komponentroller,
   densitet och referensbilder. Pixelperfektion mäts inom varje plattform.
3. **Interaktionsparitet, plattformsanpassad:** samma avsikt, men native kontroll.
   Webben använder semantisk HTML, tangentbord och responsiva layouter. iOS använder
   `TabView`, `NavigationStack`, sheets, haptik, Dynamic Type och systemets Liquid Glass.

En bokstavlig pixel-diff mellan webbläsare och SwiftUI är inte ett kvalitetsmått:
font rendering, safe areas och native kontroller skiljer sig. Cross-platform-gaten
är lika tokens, innehåll, ordning och tillstånd. Varje plattform får egna golden images.

### 1.2 Rekommenderad kanonisk toppnavigation

Utgå från faktisk produktkod i `athopia-web/lib/nav.ts`:

1. Mitt lag
2. Flöde
3. Allsvenskan
4. Matcher
5. AI

Skäl: detta är den enda definition som både körs i produktion och täcks av webbe2e.
Forum, Statistik, Daily, Analys, Poddar och Konto ligger under en gemensam
**Mer/Profil-yta** som nås från toppverktygsfält och overflow. iOS ska inte lägga en
sjätte tab; profilikonen hör hemma i toolbaren.

**FOUNDERBESLUT 2026-07-14 — D1 = A (godkänt).** Kanonisk topp-IA enligt ovan.
Om navigationen ändras ska endast det gemensamma IA-kontraktet ändras, aldrig
enskilda navkomponenter.

### 1.3 Brand

Workspace-filerna är enda källa:

- `docs/brand/BRAND.md`
- `docs/brand/tokens.json`

Racing Green är `#2D5349`; mörk text-/hovervalör är `#5FA98C`. iOS-färgen
`#1D9E75` är gammal och ska bort. Success-färger får inte användas som brand.

### 1.4 Liquid Glass

- **iOS 26+:** använd systemets `TabView`, toolbars, sheets och scroll-edge-effekter.
  Ta bort custom bar-bakgrunder som blockerar systemglas. Använd `glassEffect`
  endast för egna toppnivåkontroller och gruppera med `GlassEffectContainer`.
- **iOS 17–25:** behåll en materialbaserad fallback med samma geometri och hierarchy.
- **Webb:** `GlassNav` efterliknar materialets roll, inte dess shader. Den måste
  hantera safe area, reduced motion, kontrast, tangentbord och scroll-under.
- Innehållskort ska normalt inte vara glas. Glas reserveras för navigation,
  toolbars, sheets och flytande kontroller.

### 1.5 Abonnemang och köp

Funktionsrättigheter ska vara identiska, men betaltransporten är plattformsspecifik.

- Webb: Stripe Checkout + Clerk webhook (alltid, oberoende av iOS-path).
- **FOUNDERBESLUT 2026-07-14 — D3 = C:** ingen iOS-commerce skeppas förrän
  Apple svarat på reader-app / External Link Account. Mål: undvik Apple-skatt
  (15–30 %) om Athopia kvalificerar som reader.
- Fram till svar: iOS kan vara **login + läs redan köpt plan** (konto skapas på web),
  men **ingen StoreKit-köpknapp och ingen Stripe-länk i appen**.
- Om Apple **godkänner** reader: Stripe via External Link Account API
  (systemmodal → Safari, aldrig `SFSafariViewController`). StoreKit lämnas av.
- Om Apple **nekar**: fall back till StoreKit 2 + server sync till Clerk.
  Kodbasen för StoreKit som redan finns behålls som beredskap, aktiveras inte
  i App Store-build förrän fallback behövs.
- JWT-planen är bara UI-hint. Serverns 403 är auktoritativ.
- Efter köp ska entitlement uppdateras utan ut-/inloggning.

## 2. Verifierad nulägesbild

### 2.0 Exekveringsstatus 2026-07-14

Genomförd PC-slice:

- Gemensamma genererade kontrakt för navigation, access och brandtokens.
- Native system-`TabView` med fem destinationer, sidebar-anpassning och
  `tabBarMinimizeBehavior(.onScrollDown)` på iOS 26. Custom tab bar och
  navigationens materialöverskrivningar är borttagna.
- Native Athopia AI och native artikelreader. `/api/articles/[slug]` levererar
  rättighetsrensad, plan-gatead artikeldata; externa källor lämnar aldrig
  tredjepartsbrödtext till appen.
- Native Allsvenskan-hub, Athopia Daily med PRO-gateat signerat ljud,
  matchanalyser, poddindex/episodmetadata och djupa forumtrådar. Nya BFF-kontrakt
  är rättighets- och planrensade på servern.
- APNs device-token API, datamodell och iOS-sync efter login samt cleanup vid
  logout. Själva APNs-sändaren hör hemma i `athopia-os` och återstår.
- Officiella ClerkKit/ClerkKitUI ersätter det tidigare ofullständiga
  webcallback-flödet. Session-token förnyas inför autentiserade API-anrop och
  profil/plan läses serververifierat.
- Permanent kontoradering från web och iOS med atomisk dataradering och
  irreversibel anonymisering av delat foruminnehåll.
- Privacy manifests för app och widget.
- StoreKit 2-manager, köp/restore/transaction listener, serververifiering via
  App Store Server API, App Store Server Notifications V2 och källseparerad
  Clerk-entitlement-synk. Stripe-checkout är borttagen från iOS.
- Universal Links/AASA, exact-route dispatch för artikel, lag, match, forum,
  analys och podd samt widget snapshot-skrivning via App Group.
- Native global sök för publicerade fotbollsartiklar, Allsvenskan-lag, spelare
  och poddar. Sök-API:t använder verifierade kolumner och sportfilter.
- PC-verifiering: kontraktdrift, access-/entitlement-test, konfliktmarkörer,
  Xcode-target-medlemskap, privacy XML, web TypeScript och produktionsbuild.

### 2.0.1 Wave 1-exekvering 2026-07-14 (branch `wave1-contracts`)

Klart och verifierat på Windows (typecheck, build, `pnpm test:parity` 38/38):

- **W1-B Access:** `globalAiChat` = PRO per D2. `/api/elite/chat` härleder
  `requiredPlan` ur kontraktet; `/ai` renderar paywall på 403-status i stället
  för att strängmatcha "Elite" i felmeddelandet; iOS läser planetiketten ur
  `ProductAccess`. Paywall-copy följer nu kontraktet automatiskt.
- **W1-D Design tokens:** ingen kodändring krävdes — iOS läser redan genererade
  tokens och token-diffen mot `docs/brand/tokens.json` är 0. Endast docs som
  utpekade `#1D9E75` som brand rättades.
- **W1-C Deep links:** `lib/deep-links.ts` är enda källan; AASA genereras ur den.
  Gate failar om iOS saknar dispatch för ett prefix. AASA-payloaden oförändrad.
- **W1-A Kontrakt (delvis):** `lib/api-schemas.ts` (zod) = källa för de svar iOS
  avkodar; routes svarar via `jsonContract()`; `contracts/generated/openapi.json`
  genereras ur zod. Gate: handskrivna Swift-modeller får inte avkoda fält servern
  inte skickar, eller avkoda nullable-fält som non-optional. Mutation-testad.
- **Live-bugg fixad:** `/api/team/{slug}/hub` saknade `radar`/`topScorers`/
  `topAssists`/`squad`/`recent`/`upcoming` som iOS avkodar non-optional — Mitt
  lag kunde aldrig avkoda hubben. Routen returnerar nu en superset (noll extra
  DB-anrop); webbens preview-konsumenter är oförändrade.

Medvetna avsteg och kvarvarande luckor (se `IOS-MAC-HANDOFF.md` §12):

- Swift-modeller genereras **inte** ur OpenAPI (plan §3.2). Codegen går inte att
  kompilera på Windows; gaten mot de handskrivna modellerna ger samma skydd utan
  risken. Byt på macOS om ni vill — kontraktet är redan källan.
- Kontraktstäckning: samtliga API-endpoints iOS avkodar (feed, feed/hero, scores,
  articles, team/list, team hub, standings, match, stats/*, scout, daily,
  daily/audio, analyses, podcasts, search, forum/posts, profile). Gate: 118 tester.
- Kvar oskyddat: StoreKit/APNs-endpoints, feed-config, transfer radar, samt de
  iOS-ytor som queryar Supabase direkt (spelar-/lagstatistik) — de avkodar DB-rader,
  inte API-svar, och behöver ett eget kontrakt (inkl. det saknade sportfiltret).
- Andra fixade decode-buggen: `FixtureDetail.kickoffAt` var non-optional i Swift
  men `fixtures.kickoff_at` är nullable i DB.
- AI-brief (pulse/dailyEpisode) exponeras inte via hub-routen — PRO-gatead, kräver
  egen endpoint. iOS Mitt lag saknar därför brief-kortet.
- W1-E (copy/analytics) inte påbörjad. Ingen Xcode-kompilering körd.

Kvarvarande releasegates:

- Xcode-kompilering och `.storekit`-konfiguration.
- App Store Connect-produkter/nycklar, Apple root certificates och notification URL.
- Universal Links/AASA-route, associated domains och native route-dispatch är
  implementerade; `APPLE_TEAM_ID` och Apple-capabilities återstår i deployment.
- Slutlig feature/API-audit för sekundära statistik- och gamificationflöden.
- `athopia-os` APNs-sändare och fysisk device-test.
- Snapshot/XCUITest, StoreKit sandbox/TestFlight och slutlig visuell pixeljustering.

### 2.1 Web — baseline före exekveringen

Punkterna i 2.1–2.2 är den verifierade gapbild som planen startade från. Aktuell
implementation och kvarvarande gates står i 2.0 ovan.

- 5 produktionsflikar enligt `lib/nav.ts`.
- 55 app-/djupvägar; starkast täckning för nyheter, lag, matcher, statistik,
  forum, konto och AI.
- Två feedmönster konkurrerar: `/nyheter` och `/feed/[teamSlug]`.
- `lib/access-rules.ts` och API-gates motsäger varandra för global AI.
- Grundfeed är uttryckligen gratis och obegränsad i `app/api/feed/route.ts`.
- `GlassNav` är aktivt; `TabBar` är inte produktionsnavigation.
- Design/systemdokument har drift mot workspace-brandtokens.
- Universal links/AASA saknas.
- Loading/empty/error-state-mönster är ojämna.

### 2.2 iOS — baseline före exekveringen

- Aktiv target är `AthopiaApp/AthopiaApp.xcodeproj`.
- Faktiska tabbar: Hem, Matcher, Statistik, Lag, Profil.
- Forum är byggt men inte nåbart.
- Onboarding, native artikelreader, Allsvenskan-hub och global AI saknas.
- Statistik, team hub, profil och match är partiella jämfört med webben.
- Endast auth-callback är deep-linkad.
- APNs-token registreras lokalt men skickas inte till backend.
- Widget läser App Group-data som huvudappen aldrig skriver.
- StoreKit, riktiga target-tester, snapshots och systematisk accessibility saknas.
- Custom materialbar används i stället för iOS 26 system-Liquid-Glass.

### 2.3 Akuta kontraktdrifter

- Fem olika IA-definitioner i kod och dokument.
- Web `#2D5349`; iOS `#1D9E75`.
- Web feed är obegränsad; iOS visar fortfarande 20/dag-paywall.
- `aiChat` är PRO i access-map men `/api/elite/chat` kräver Elite.
- Handbyggda Swiftmodeller riskerar tyst decode-drift.
- iOS saknar sportfilter i direkta Supabase statsqueries.

## 3. Gemensamt produktkontrakt

Skapa `contracts/` på workspace-nivå eller i `athopia-web` med publicerade,
versionsmärkta artefakter. Webben äger serverkontrakten; båda klienterna konsumerar.

### 3.1 Artefakter

- `navigation.json`: destination, label, symbolroll, plan, deep-link, nav-nivå.
- `access.json`: full sanningstabell `feature × free/pro/elite`.
- `design-tokens.json`: genererad/kopierad från workspace `docs/brand/tokens.json`.
- `copy.sv.json`: gemensam produktcopy, paywalls och tillståndstexter.
- `events.json`: analytics-event och obligatoriska properties.
- `openapi.json`: publika klient-API:er och responses.
- `flows/*.yaml`: kritiska flöden som båda testsuiterna ska uppfylla.

### 3.2 Genererade klienter

- TypeScript-validering för routes och klienter.
- Swift `Codable`-modeller från OpenAPI/JSON Schema.
- Swift `Access.swift`, `NavigationContract.swift`, `DesignTokens.generated.swift`.
- Generated files redigeras aldrig manuellt.

### 3.3 Servern är auktoritativ

- Plan och feature access bestäms server-side.
- API returnerar strukturerad 403:
  `code`, `requiredPlan`, `feature`, `upgradePath`.
- Klienterna renderar samma paywall-state från svaret.
- Stats som tabellposition, percentiler och gatebeslut ska inte härledas separat
  i två klienter när de kan levereras av samma API.

## 4. Målstruktur per yta

### Mitt lag

- Samma favoritlag från Clerk/feed config på båda plattformarna.
- Samma ordning: brief, nästa match, tabellposition/form, nyheter, ledare,
  statistik, trupp, matcher, forum.
- Radar och xG visas endast vid verifierade värden.
- Pull-to-refresh och cached last-known-state på iOS; motsvarande refresh/revalidate på web.

### Flöde

- `/nyheter` blir kanonisk feed. `/feed/[teamSlug]` migreras eller görs intern alias.
- Samma filter, ranking, provenance, article/link-only-beteende och gratis obegränsad feed.
- Athopia-artiklar öppnas native på iOS; externa källor öppnas i systembrowser.
- PRO-gate gäller unika värden, inte grundfeeden.

### Allsvenskan

- Hub med tabell, spelschema/resultat, skytteliga, xP, talanger, omgångar och H2H.
- iOS använder en NavigationStack-hub, inte sju toppflikar.
- Samma sortering, säsong och tom-state.

### Matcher

- Samma live/upcoming/resultat-segment, matchdetalj, events, lineups och stats.
- xG/pressure döljs vid saknad data.
- iOS fullskärmspush för djup detalj; quickview kan vara sheet.
- Live polling/realtime följer app lifecycle och batteribudget.

### AI

- **FOUNDERBESLUT 2026-07-14 — D2 = B (provisoriskt):** global AI-chat är **PRO**
  (liksom matchkontext + briefs). Elite behåller sin differentiering via övriga
  Elite-ytor (djupare data/API/etc.), inte via AI-låset.
- Notering: kan skärpas till Elite senare om PRO-marginalen eller budgeten kräver det —
  då uppdateras endast `access.json` + API-gates, inte varje klient.
- Samma rate limits, budget cap, historik, felkoder och upgrade-copy.
- iOS får native chatyta med keyboard-safe composer och streamad respons.

### Mer / Konto

- Forum, Statistik, Daily, Analys, Poddar, Profil, Prenumeration och Om Athopia.
- Samma profilfält, notispreferenser och entitlementstatus.
- Forum read/write-regler måste följa access-kontraktet, inte lokal hårdkodning.

### Onboarding

- Samma tre steg: lag → värdepreview → valfria notiser.
- Uppgradering får inte vara ett obligatoriskt onboardingsteg.
- Slutförtillstånd och favoritlag lagras server-side och synkar mellan enheter.

## 5. Masterbuild waves

Varje task är en separat PR. En agent får en tydlig filägare och får inte göra
sidostädning. Wave-gates måste vara gröna innan nästa wave startas.

### Wave 0: beslut och mätbas

**W0-A Product Architect**
- Fastställ topp-IA och AI-plan.
- Publicera route/screen/parity-matris.
- Markera gamla IA-/SPEC-tabeller som historiska.
- DoD: ett signerat beslut; inga motstridiga “source of truth”-påståenden.

**W0-B Visual Baseline Agent**
- Ta referensbilder för alla P0-ytor, båda webteman och iOS.
- Definiera device/browser-matris.
- DoD: versionsmärkta golden baselines, utan mockdata.

**W0-C Commerce/Compliance Agent**
- Specificera StoreKit 2 som default och ansök parallellt om reader-bedömning.
- Specificera entitlement-sync och restore purchases.
- DoD: App Review-säker purchase architecture.

### Wave 1: kontraktsfundament

**W1-A Contract Agent**
- Skapa OpenAPI/schema för klient-API.
- Lägg runtime validation på kritiska responses.
- DoD: live/staging payloads validerar.

**W1-B Access Agent**
- Normalisera `lib/access-rules.ts`, API-gates och copy.
- Generera `access.json` och Swift accesskod.
- DoD: alla plan×feature-fall testade på båda plattformar.

**W1-C IA/Deep-Link Agent**
- Skapa `navigation.json`.
- Implementera AASA, associated domains och route registry.
- DoD: varje delbar web-URL öppnar rätt iOS-yta och har webbfallback.

**W1-D Design-System Agent**
- Generera web/iOS tokens från workspace `tokens.json`.
- Synka färg, spacing, radius, typography, motion och numerics.
- DoD: token-diff = 0; iOS använder Racing Green.

**W1-E Copy/Analytics Agent**
- Extrahera gemensam svensk copy och event registry.
- DoD: inga olika paywall-/planpåståenden; samma funnel events.

### Wave 2: iOS shell och plattformstjänster

**W2-A iOS Navigation Agent**
- Byt till kanoniska fem destinationer.
- iOS 26 system-TabView/Liquid Glass + iOS 17 fallback.
- Toolbar-profil/overflow; scroll-minimering och scroll-edge.
- DoD: VoiceOver-labels, 44pt targets, Reduce Motion.

**W2-B Auth/Onboarding Agent**
- Trestegsonboarding, server-sync av favoritlag, token refresh.
- DoD: ny/återvändande/utloggad användare testad.

**W2-C Commerce Agent**
- Implementera beslutad StoreKit/reader-lösning.
- Restore, pending, cancelled, refunded, offline och familjefall.
- DoD: plan syns korrekt utan relogin.

**W2-D Push/Widget Agent**
- APNs subscribe endpoint, datamodell, preference sync och deep-link payload.
- Huvudappen skriver widget snapshot till App Group.
- DoD: device-token rotation, logout cleanup och widget refresh testade.

### Wave 3: ytagenter, parallellt

Varje agent äger både paritytest och sina iOS-filer. Webbfiler ändras endast för
verifierade luckor.

**W3-A Mitt lag Agent**  
**W3-B Flöde/Artikel Agent**  
**W3-C Allsvenskan Agent**  
**W3-D Match Agent**  
**W3-E Statistik/Spelare Agent**  
**W3-F Forum Agent**  
**W3-G AI/Daily/Analys Agent**  
**W3-H Profil/Konto Agent**

Gemensam DoD per yta:

- Samma data, ordning, copy, access och destinationslänkar.
- Loading, cached, empty, partial, offline, error, 401, 403 och retry.
- Light/dark, Dynamic Type XXL, VoiceOver, Reduce Motion.
- Web mobil/desktop + iPhone small/standard/Max + iPad där relevant.
- Snapshot + interaction flow gröna.

### Wave 4: web native-feel closure

**W4-A Feed Consolidation Agent**
- Gör `/nyheter` kanonisk; avveckla dubbelt feedbeteende.

**W4-B Web Interaction Agent**
- Pull-to-refresh där det hjälper, scroll restoration, safe areas,
  keyboard navigation och reduced motion.

**W4-C State Consistency Agent**
- Gemensamma loading/empty/error/paywall-primitiver på P0/P1-routes.

**W4-D Responsive Shell Agent**
- Säkerställ att GlassNav, sidebar och overflow följer samma IA-kontrakt.

### Wave 5: hardening och release

**W5-A Contract QA Agent**
- Decode-test mot staging för Swift och TypeScript.
- Schema-/access-/IA-drift blockerar merge.

**W5-B Visual QA Agent**
- Playwright goldens per webtema/breakpoint.
- iOS snapshot goldens per device/theme/Dynamic Type.
- Manuell pixel review på P0-ytor.

**W5-C Interaction QA Agent**
- Samma flow specs körs i Playwright och XCUITest.
- Auth, onboarding, paywall, purchase restore, forum write, deep links,
  notifications och offline testas.

**W5-D Performance/A11y Agent**
- Web Core Web Vitals och bundle budgets.
- iOS launch, scroll hitch, memory, energy och accessibility audit.

**W5-E Release Agent**
- TestFlight → intern dogfood → extern beta → staged App Store rollout.
- Web deploy med kompatibla kontrakt före iOS release.
- Rollback/runbook och observability dashboards.

## 6. Agentkontrakt

Varje mindre agent får:

1. En feature, ett repo/file-set och en branch.
2. Exakta inputkontrakt och förbjudna filer.
3. Acceptance tests före implementation.
4. Krav att fråga en senior modell vid:
   - auth/payment/security,
   - oklar API-shape,
   - ändring av IA/access/design tokens,
   - konflikt mellan kod och source of truth.
5. Rapport: ändrade filer, testbevis, screenshots, kvarvarande risker.

Ingen feature-agent får ändra generatorer, gemensamma tokens eller accessregler.
Sådana ändringar går tillbaka till respektive fundamentagent.

## 7. CI-gates

### Merge-blockerande

- `contracts:check`: genererade artefakter är aktuella.
- `access:parity`: plan×feature truth table lika.
- `navigation:parity`: alla top-level destinations mappade.
- `swift:decode-contracts`: staging fixtures avkodas.
- Web typecheck/build + iOS build/unit tests.
- Sportfilter- och xG-placeholder-regression.

### Release-blockerande

- P0 flow specs gröna i Playwright och XCUITest.
- P0 snapshots godkända.
- VoiceOver/Dynamic Type/Reduce Motion.
- StoreKit/reader compliance och restore purchase.
- Universal links, APNs och widget på fysisk enhet.
- Sentry/crash-free och prestandabudget.

## 8. Referensmatris

Minsta P0-matris:

- Guest, Free, PRO, Elite.
- Ny användare, återvändande, expired token.
- Inga data, partiella data, full data, offline, serverfel.
- Light/dark på web; system light/dark på iOS.
- Web 390, 768, 1440 px.
- iPhone small, standard, Max; iPad split view för informationsrika ytor.
- iOS 17 fallback och senaste iOS med system-Liquid-Glass.

## 9. Risker och stoppregler

1. **App Store-betalning:** ingen iOS commerce-kod skeppas före strategi och entitlement.
2. **IA-drift:** inga ytagenter startar före kanoniskt navbeslut.
3. **Handskrivna kontrakt:** navigation/access/StoreKit/tokens får aldrig
   dupliceras manuellt. Endpoint-DTO:er versionsmärks tills OpenAPI-codegen är
   införd och ersätts därefter av genererade typer.
4. **Server/client gate-drift:** lokal paywall får aldrig ge access utan serverbeslut.
5. **Pixeljakt som skadar native UX:** cross-platform pixel-diff förbjuds som ensam gate.
6. **Windows-begränsning:** repoarbete kan göras här, men `xcodebuild`, simulator,
   snapshots, fysisk APNs och App Store archive måste köras på macOS/Xcode.
7. **Gamla specs:** dokument som motsäger genererade kontrakt ska märkas historiska
   eller genereras om; de får inte fortsätta styra agenter.

## 10. Definition of Done

- En användare möter samma fem primära destinationer och samma innehållshierarki.
- Samma konto/favoritlag/plan och rättigheter fungerar direkt på båda plattformar.
- Alla webbdjuplänkar öppnar rätt iOS-yta och faller tillbaka till webben.
- Brandtokens och copy har noll drift.
- Alla P0/P1-ytor har samma funktioner och samma tillstånd.
- iOS använder native Liquid Glass där OS stöder det och en värdig fallback annars.
- Grundfeed är gratis/obegränsad på båda; premiumvärden gateas likadant.
- Global AI, match-AI och briefs följer fastställd planmatris.
- Köp, restore, refund och planrefresh fungerar utan relogin.
- APNs, widget, analytics och crash reporting fungerar i produktion.
- Kontrakt-, parity-, visual- och interaction-gates blockerar framtida drift.

## 11. Founderbeslut (låsta 2026-07-14)

| ID | Beslut | Status |
|----|--------|--------|
| D1 | Topp-IA: Mitt lag / Flöde / Allsvenskan / Matcher / AI | **Låst A** |
| D2 | Global AI-chat = PRO (kan skärpas till Elite senare) | **Låst B (provisoriskt)** |
| D3 | Ingen iOS-commerce tills Apple reader-svar; undvik skatt om möjligt | **Låst C** |

## 12. Första exekveringsordning

1. ~~Founder godkänner topp-IA och global AI-plan.~~ ✅ D1+D2
2. **Founder-åtgärd (D3):** skicka External Link Account / reader-ansökan till Apple
   (Account Holder, per bundle ID). Parallellt: W1 utan commerce-ship.
3. W1-B Access (PRO för `aiChat`) och W1-D Design Tokens kan starta direkt.
4. W1-A Contracts och W1-C IA/Deep Links startar parallellt.
5. Wave 2 commerce (W2-C) = **håll** tills Apple-svar; övriga Wave 2/3 får köra
   login + entitlement-läsning från webbköp.
6. Först när Wave 1 är grön startar de åtta ytagenterna.

