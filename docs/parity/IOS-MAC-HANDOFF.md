# iOS Mac Handoff — Athopia

> **Senast uppdaterad:** 2026-07-14  
> **Mål:** Ship iOS-app med **web-paritet** (ej pixel-kopia) enligt vision.  
> **Gamification:** **EXKLUDERAD** — bygg inte, port inte, nämn inte i scope.

---

## TL;DR

1. **PC-jobb klart** — kärnparitet, backend-hårdning, PRO-ytor (transfer/forum-summary), deep links, intressen.
2. **Mac blockerar** — Xcode compile, StoreKit sandbox, push capability, visuell QA, TestFlight.
3. **Börja alltid med** regler → `pnpm test:parity` → `verify-pc-handoff.ps1` → Xcode build.

---

## 0. Startprotokoll (Claude Code / Fable — kör i ordning)

```text
STEG 1 — Läs regler (5 min, skippa aldrig)
  Athopia Build/CLAUDE.md
  athopia-web/CLAUDE.md
  athopia-web/WEB-IA-STRUKTUR.md
  docs/brand/BRAND.md
  athopia-ios/CLAUDE.md

STEG 2 — Verifiera PC-status (Windows/Linux OK)
  cd "Athopia Build/athopia-web"
  rtk pnpm typecheck
  rtk pnpm test:parity
  cd "../athopia-ios"
  rtk pwsh -File scripts/verify-pc-handoff.ps1

STEG 3 — Mac-only (kräver Xcode)
  open AthopiaApp/AthopiaApp.xcodeproj
  Product → Build (Cmd+B)
  StoreKit Configuration + sandbox-köp
  Push Notifications capability
  Simulator QA: free / PRO / Elite personas
  TestFlight → intern QA

STEG 4 — Ship
  Fixa P0 från gap-tabellen nedan
  Side-by-side mot athopia.se (5 flikar + overflow)
  Tag build → TestFlight → App Store Connect
```

**Modell:** Claude **Fable** (thinking) för Mac-sessioner med Xcode + produktbeslut.

---

## 1. Var filerna lever

| Vad | Path |
|-----|------|
| **Detta dokument** | `Athopia Build/IOS-MAC-HANDOFF.md` |
| Web-konstitution | `athopia-web/CLAUDE.md` |
| iOS-konstitution | `athopia-ios/CLAUDE.md` |
| Nav single source | `athopia-web/lib/nav.ts` |
| Access / paywall | `athopia-web/lib/access-rules.ts` |
| Parity-kontrakt (genererat) | `athopia-web/contracts/generated/*.json` |
| iOS kontrakt (genererat) | `athopia-ios/.../GeneratedProductContracts.swift` |
| Brand | `docs/brand/BRAND.md` + `tokens.json` |
| PC-verifiering | `athopia-ios/scripts/verify-pc-handoff.ps1` |
| iOS app-kod | `athopia-ios/AthopiaApp/AthopiaApp/` |
| Web API | `athopia-web/app/api/` |

**Regenerera kontrakt efter nav/access-ändring:**
```bash
cd athopia-web && rtk pnpm contracts:generate
```

---

## 2. Vad som är gjort (PC, 2026-07-14)

### Web
- Entitlement race-fix (`lib/entitlements.ts`, `lib/plan-lock.ts`)
- StoreKit webhook-livscykel (revoke/expired)
- GDPR: `delete_user_account` v2 + forum_reports
- Forum-validering (depth, team_slug, report dedupe)
- **Nya API:er:** `/api/team/[slug]/transfers`, `/api/forum/summary`
- Statistik: `/api/stats/compare`, `/api/stats/h2h`, `/api/scout`
- Delad logik: `lib/team-hub/transfers.ts`, `lib/forum/summary.ts`

### iOS
- 5-fliks IA + overflow (Sök, Statistik, Scout, Forum, Poddar, Daily, Analyser, Konto)
- Paywalls: Scout, AI, MatchChat, artikel/analys (server `access`)
- Statistik 10 segment inkl. H2H + Jämför
- **Transfer radar** på Mitt lag (PRO-gated via API)
- **Forum AI-sammanfattning** (PRO-gated via API)
- **Deep links:** `/statistik`, `/statistik/scout` → pushar rätt vy
- **Forum copy fix:** inloggning räcker (inte PRO) för att skriva
- **Profil → Mina intressen** (`/api/feed/config`)
- StoreKit 2 + entitlement sync + APNs + widget snapshot

### Medvetet **inte** gjort
- Gamification (användaren vill inte ha det)
- Mac compile / TestFlight / push entitlement i Xcode
- Pixel-perfect visuell parity (kräver Mac QA)
- Kronika, narrativ, `/om-oss`, podcast clips UI

---

## 3. Paritet — gap-tabell

| Område | Web | iOS | Prio | Mac? |
|--------|-----|-----|------|------|
| 5 bottenflikar | ✅ | ✅ | — | QA |
| Overflow nav | ✅ | ✅ (+Sök, Scout) | — | QA |
| Nyhetsflöde + filter | ✅ | ✅ | — | QA |
| Mitt lag / lag-hub | ✅ | ✅ | — | QA |
| Transfer radar (PRO) | ✅ | ✅ | — | QA |
| Forum summary (PRO) | ✅ | ✅ | — | QA |
| Matcher + live | ✅ | ✅ | — | QA |
| Statistik kärna | ✅ | ✅ | — | QA |
| Statistik → Press-flik | ✅ | ❌ | P2 | PC eller skip |
| Scout (PRO) | ✅ | ✅ | — | QA |
| AI Elite / Match PRO | ✅ | ✅ | — | QA |
| Daily + ljud | ✅ | ✅ | — | QA |
| StoreKit / Stripe | Stripe | StoreKit | — | **Mac** |
| Push | Web | APNs | P0 | **Mac** |
| Deep link `/statistik` | ✅ | ✅ | — | QA device |
| Profil intressen | ✅ | ✅ | — | QA |
| Gamification | web finns | ❌ skip | — | **Nej** |
| Kronika / narrativ | ✅ | ❌ | P3 | PC valfritt |
| Podcast clips (PRO) | ✅ | ❌ | P3 | PC valfritt |
| Elite kluster-badge | ✅ | ❌ | P3 | PC valfritt |

**Paritetsnivå kärnprodukt: ~92 %** (funktionellt). Visuell sign-off: **0 %** tills Mac QA.

---

## 4. Vision & mission — följer vi?

| Princip (CLAUDE.md + BRAND.md) | Status |
|--------------------------------|--------|
| Premium svensk fotboll, Allsvenskan-fokus | ✅ |
| Supporterfrågor först (match, form, tabell, transfer) | ✅ (transfer radar iOS fixad) |
| Ingen mock-data på publika ytor | ✅ |
| Mobil-först, native feel på iOS | ✅ (ej QA:d) |
| Racing Green, calm UI, 95 % neutralt | ✅ tokens synkade |
| En nav-config + access-kontrakt | ✅ |
| Server-side paywall | ✅ |
| Web läser, OS producerar | ✅ |
| Generic dashboard / gaming UI | ✅ undviks |

**Athopia ska vara:** lugnt, datadrivet hem för Allsvenskan-supportern — **inte** FotMob. iOS-appen matchar det för kärnflöden.

---

## 5. Sub-agents — när och vilka

| Agent | Använd när | Prompt-kärna |
|-------|------------|--------------|
| **explore** | "Finns X i codebase?" | Snabb readonly-sökning |
| **shell** | git, pnpm, verify scripts | Kör kommandon |
| **ci-investigator** | TestFlight/CI fail | En failing check → root cause |
| **bugbot** | Före merge, större diff | `Diff: branch changes` |
| **security-review** | Auth/webhook/paywall-ändringar | Efter backend-ändring |
| **gstack-ios-qa** | Efter Mac build | Simulator smoke free/PRO/Elite |
| **gstack-ios-fix** | Compile errors på Mac | Xcode build log |

**Regel:** Max 1–2 agenter parallellt. Parent agent synthesiserar — dela inte handoff till användaren utan sammanfattning.

---

## 6. Skills — när och vilka

| Skill | När |
|-------|-----|
| `gstack/gstack-health` | Session start — miljö OK? |
| `gstack/gstack-ios-qa` | Efter Xcode build — smoke flows |
| `gstack/gstack-ios-fix` | Röd build på Mac |
| `gstack/gstack-design-review` | Visuell diff web vs iOS |
| `gstack/gstack-ship` | Pre-TestFlight checklist |
| `contrast-checker` | Om accent/success färger ändras |
| **INTE** gamification / predict flows | Exkluderat |

---

## 7. Mac-checklista (P0 — blockerar ship)

- [ ] **Xcode build** grön (AthopiaApp + Widget target)
- [ ] **Push Notifications** capability + entitlement
- [ ] **StoreKit** `.storekit` config + sandbox PRO/Elite köp
- [ ] **Entitlement sync** — köp → `/api/storekit/entitlements` → plan i app
- [ ] **Universal Links** på device: `/lag/`, `/match/`, `/artikel/`, `/statistik`
- [ ] **Personas:** free (paywalls), PRO (scout, daily, artikel), Elite (AI-flik)
- [ ] **Widget** — snapshot efter Mitt lag load
- [ ] **TestFlight** intern build

---

## 8. PC kan fortfarande göras (ingen Mac)

1. Statistik **Press**-segment (om data finns — speglar web `PressTab`)
2. Podcast clips panel (PRO) — om API finns
3. `/prenumerera` deep link → öppna pricing sheet
4. Kronika/narrativ — **endast om produkt vill** (P3)

---

## 9. Kommandon (copy-paste)

```powershell
# Web
cd "C:\Users\jardi\Athopia Build\athopia-web"
rtk pnpm typecheck
rtk pnpm test:parity
rtk pnpm contracts:check

# iOS PC gate
cd "C:\Users\jardi\Athopia Build\athopia-ios"
rtk pwsh -File scripts/verify-pc-handoff.ps1

# Mac (efter clone)
cd athopia-ios/AthopiaApp
xcodebuild -scheme AthopiaApp -destination 'platform=iOS Simulator,name=iPhone 16' build
```

---

## 10. DO NOT

- ❌ Bygg gamification / predict / reveal
- ❌ Anropa Sportmonks från web/iOS
- ❌ Client-side paywall-beslut (använd `getUserPlan` / API `access`)
- ❌ Mock/demo-data
- ❌ `middleware.ts` (Next 16 = `proxy.ts`)
- ❌ Commit `.env` / secrets
- ❌ Force-push main

---

## 11. Nästa session (Fable på Mac)

```
1. Läs §0 Startprotokoll
2. Xcode build → fix compile
3. StoreKit sandbox: köp PRO → verifiera Scout + Daily unlock
4. Push: device token → breaking notis → deep link
5. gstack-ios-qa: 5 flikar + overflow + paywall states
6. TestFlight upload
7. Uppdatera denna fil §2 med Mac-resultat
```

---

## 12. Wave 1-kontrakt (2026-07-14) — vad Mac måste verifiera

Branch `wave1-contracts` i både athopia-web och athopia-ios. Allt nedan är
verifierat på Windows (typecheck, build, `pnpm test:parity`) men **aldrig
kompilerat i Xcode**.

**Fixad live-bugg:** `/api/team/{slug}/hub` returnerade en gäst-preview utan
`radar`, `topScorers`, `topAssists`, `squad`, `recent`, `upcoming` — fält som
iOS `TeamHubPayload` avkodar som non-optional. Mitt lag-fliken kunde därför
aldrig avkoda hubben. Routen returnerar nu en superset med explicit camelCase.
**Verifiera på device att Mitt lag faktiskt fyller alla flikar** (översikt,
statistik, trupp, matcher, forum).

Notera stavningen: DB har både `sportmonks_id` (fixtures) och `sportsmonks_id`
(entities). Routen skickar `sportsmonksId` för båda — förlita dig inte på
`.convertFromSnakeCase` för hub-payloaden.

**Medvetet inte gjort (och varför):**

- **Swift-modeller genereras INTE ur OpenAPI**, trots plan §3.2. Codegen kan
  inte kompileras på Windows; att skeppa ogenererade-men-overifierade modeller
  var större risk än nyttan. I stället gate:ar `lib/swift-decode.test.ts` de
  handskrivna modellerna mot `lib/api-schemas.ts`. **På Mac:** byt till
  genererade modeller om ni vill — kontraktet är redan källan.
- **Pulse/dailyEpisode (AI-brief) ingår inte i hub-routen** — de är PRO-gatede
  och får inte läcka via en publik preview. iOS Mitt lag saknar därför fortfarande
  brief-kortet; det kräver en egen plan-gatead endpoint.
- **Alla API-endpoints iOS avkodar har nu schema + gate** (118 tester). Andra
  funna decode-buggen: `FixtureDetail.kickoffAt` var non-optional i Swift medan
  `fixtures.kickoff_at` är nullable i DB — nu `String?`.
- **Kvar oskyddat:** StoreKit/APNs-endpoints, feed-config, transfer radar, samt
  iOS-ytor som queryar Supabase direkt (spelar-/lagstatistik). De avkodar DB-rader,
  inte API-svar, och saknar dessutom sportfilter (se plan §2.3).
- **W1-E (copy/analytics-registry)** är inte påbörjad.

---

*Genererad som handoff efter web/iOS parity-pass. Gamification exkluderad per produktbeslut.*

---

## 13. Widget + live (2026-07-14) — exakt vad Mac ska köra

### 13.1 Vad som redan är byggt (Windows, ocommittat push)

- `athopia-web/app/api/widget/route.ts` — publikt, ett anrop, ingen auth.
  Live-match → annars nästa match inom 24h → annars viktigaste nyheterna
  (rankade på `importance_score` + `push_priority`, samma signal som pushen).
- `athopia-ios/AthopiaWidget/WidgetSnapshot.swift` — modell + egen fetch.
- `athopia-ios/AthopiaWidget/AthopiaWidget.swift` — hemskärm (small/medium) +
  **låsskärm** (`accessoryRectangular`, `accessoryInline`, `accessoryCircular`),
  genvägar till forum/matcher/nyheter och en "Fråga AI"-teaser.

### 13.2 Mac-steg i ordning

```
1. ~~Lägg nya filer i target~~ — GJORT: `WidgetSnapshot.swift` är inlagd i
   project.pbxproj (AthopiaWidget-target) och bevakas nu av
   verify-pc-handoff.ps1, så en fil som glöms bort failar gaten i stället för
   att tyst inte kompileras.
2. Signing & Capabilities:
     - App Group `group.se.athopia.app` på BÅDA targets
     - Associated Domains: applinks:athopia.se (krävs för widget-genvägarna)
     - Push Notifications (för live, se 13.4)
3. Sätt APPLE_TEAM_ID i Vercel → AASA-routen svarar tomt utan den.
4. Product → Build (Cmd+B). Fixa ev. compile-fel.
5. Simulator: lägg till widget på hemskärm OCH låsskärm.
6. Device: verifiera att widgeten visar match/nyhet UTAN att appen öppnats,
   och att varje genväg öppnar rätt yta (universal links).
```

### 13.3 Fonten — kräver ett binärt asset

Webben laddar **Geist via Google Fonts**; det finns inga fontfiler i repot, och
iOS kan inte hämta en webbfont. För att widgeten ska ha "vår font" måste Geist
(OFL, gratis) laddas ner som `.ttf` och läggas i app- **och** widget-target,
registreras i båda `Info.plist` (`UIAppFonts`), och sedan byts `family` i
`WidgetFont` (en enda plats — inga andra call sites).

Tills dess kör widgeten SF (systemfonten) med tabular-nums på siffror. Det är
också vad Apple rekommenderar för widgets, så det är ett fullt rimligt slutläge.

### 13.4 "Uppdatering varannan minut" — så funkar det på riktigt

En **widget-timeline kan inte garantera 2 minuter.** WidgetKit ger varje app en
daglig refresh-budget (i praktiken ~40–70 uppdateringar/dygn) och stryper
begäranden oavsett vad vi ber om. Widgeten ber nu om 2 min under live, 15 min
inför avspark och 30 min annars — men iOS bestämmer.

Vill du ha en verklig live-känsla finns två vägar, och de utesluter inte varandra:

1. **Live Activity (ActivityKit)** — rätt verktyg för en pågående match. Den
   ligger på låsskärmen och i Dynamic Island och uppdateras via **APNs
   push-to-Activity**, inte via timeline-budget. Kräver:
   - `NSSupportsLiveActivities` i Info.plist,
   - ett Widget-extension-mål med `ActivityConfiguration`,
   - att `athopia-os` skickar en push per målhändelse/minutuppdatering.
2. **Push-driven widget-reload** — APNs background push → appen skriver ny
   snapshot → `WidgetCenter.reloadAllTimelines()`. Billigare, men fortfarande
   inte sekundsnabbt.

Rekommendation: bygg Live Activity för live-matcher (det är den upplevelsen du
beskriver), och låt widget-timelinen sköta nyheter/nästa match. **Blockerare för
båda: APNs-sändaren i `athopia-os` är fortfarande inte byggd.**

### 13.5 Kvar efter detta

- ~~APNs-sändare i `athopia-os`~~ **BYGGD 2026-07-14** (`packages/notifications/src/apns.ts`).
  Kräver env i produktion, annars loggas och hoppas iOS-push:
  `APNS_KEY_P8` (.p8-nyckelns PEM eller base64), `APNS_KEY_ID`, `APPLE_TEAM_ID`,
  `APNS_BUNDLE_ID` (se.athopia.app), `APNS_ENV` (sandbox i TestFlight).
  Hämta .p8 i App Store Connect → Keys → Apple Push Notification service.
  **Deploy till Hetzner krävs** (founder-action).
- Supabase-direkta statistikqueries i iOS saknar `sport`-filter (plan §2.3) och
  har inget kontrakt — de avkodar DB-rader, inte API-svar.
- `jsonContract()` är inte inkopplad på transfers/storekit/apns/feed-config —
  de har schema + decode-gate, men servern självvaliderar inte ännu.
- Snapshot/XCUITest, StoreKit sandbox (håll: D3), TestFlight.
- Live Activity (ActivityKit) för minut-för-minut-matcher — se 13.4. Sändaren
  finns nu; Live Activity kräver eget widget-mål + push-to-Activity.

### 13.6 Databas — tre migrationer var ALDRIG applicerade (åtgärdat 2026-07-14)

`apns_subscriptions`, `app_store_accounts` och `app_store_entitlements` fanns som
migrationsfiler i repot men existerade inte i produktions-Supabase. iOS kunde
alltså varken registrera en push-token eller synka ett köp — endpointsen skrev mot
tabeller som inte fanns.

Applicerade 2026-07-14 efter founder-godkännande. Rent additivt, ingen befintlig
data rörd. Lärdom: en migrationsfil i repot betyder inte att den är körd —
verifiera mot DB innan en yta räknas som klar.
