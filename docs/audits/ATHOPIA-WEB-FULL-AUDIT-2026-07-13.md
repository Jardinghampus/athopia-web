# Athopia Web — full produkt-, UX-, teknik- och affärsaudit

Datum: 13 juli 2026  
Produktionsmål: https://athopia-web.vercel.app  
Kodbas: `athopia-web`  
Status: rapport-only — inga produktions- eller kodändringar gjordes i denna audit

## Sammanfattning

Athopia har en bra och försvarbar produktidé: **den bästa dagliga intelligensen om mitt allsvenska lag**, inte ännu en generell livescore-app. Kombinationen av klubbanpassat flöde, källsammanvägning, matchdata, forum, poddintelligens och en kort daglig brief är en tydlig svensk nisch som Forza Football, FotMob, Bolldata och Google News inte löser tillsammans.

Produkten är däremot inte redo att konkurrera brett i nuvarande skick. Den tekniska omfattningen är hög — över 150 komponenter, 55 API-routes och 223 genererade sidor — men de viktigaste förtroende- och konverteringsdelarna är inte lika stabila som funktionsbredden. Liveversionen visar privat beta, Clerks `Development mode`, tre olika PRO-priser på olika ytor och en cookie-banner som täcker primära flöden på mobil. Dessutom pekar cirka 70 SEO-/checkout-referenser mot `athopia.se`, som inte är den verifierade produktionsdomänen.

Min helhetsbedömning är **56/100**. Konceptet är starkare än utförandets nuvarande lanseringsmognad.

### Rekommenderad position

> Athopia är den dagliga kontrollcentralen för allsvenska supportrar: vad som hände, vad det betyder och vad som är värt att följa — för just ditt lag.

Försök inte vinna på flest ligor, snabbast målnotiser eller mest rådata. Vinn på **svensk kontext, källtillit, förklaring och vana**.

## Metod och täckning

- Inventerade hela kodbasen: cirka 250 TSX-filer, 135 TS-filer och 151 komponentfiler.
- Granskade landning, global navigation, team-hubbar, match, nyheter, statistik, forum, podd, AI, pris, profil, konto och femstegs-onboarding.
- Granskade 55 API-routes, Clerk/Stripe-planflöde, Supabase-klienter, RLS-migrationer, rate limiting och LLM-gränser.
- Crawlade 140 interna live-URL:er. 139 gav normal sida efter navigation; skyddade routes har avvikande HTTP-beteende för rå fetch men dirigerar till inloggning i riktig webbläsare.
- Testade mobilvy 390×844 och desktop 1440×900 med riktig Chromium.
- Mätte ett urval live-sidor, konsolfel, h1-struktur, touchytor, overflow och navigation.
- Verifierade `pnpm typecheck` och ett fullständigt `next build`: båda passerar. Bygget genererade 223 sidor.
- `pnpm test:links` går inte att köra eftersom skriptet kräver `ts-node`, som saknas i projektets körmiljö.
- Jämförde nuvarande erbjudande med Forza Football, FotMob, Bolldata och Google News.

Begränsning: autentiserad onboarding, betalning och betalande användares vyer har source-auditats men inte genomförts med ett riktigt testkonto/kort. Live Supabase-policyer har inte verifierats direkt mot databasen; slutsatser om RLS avser migrationerna i denna repo.

## Poängkort

| Område | Poäng | Bedömning |
|---|---:|---|
| Produktidé och differentiering | 76 | Stark svensk wedge och tydligt supporterproblem |
| Landning och budskap | 62 | Visuellt stark, men beta/pris/CTA säger olika saker |
| Onboarding och konvertering | 42 | Bra femstegsdesign i kod, svagt liveförtroende och för många tillstånd |
| Navigation och informationsarkitektur | 68 | Bra fem huvudmål, men flera överlappande navsystem och för stor featureyta |
| UI och visuell kvalitet | 67 | Ambitiös premiumkänsla, men kontrast, versaler, overflow och overlays drar ned |
| Mobil UX och tillgänglighet | 50 | Många touchytor under 44 px och cookie-banner blockerar uppgifter |
| Innehåll och redaktionellt förtroende | 53 | Rätt idé, men landing visar gammalt/smalare källunderlag än löftet |
| SEO och discoverability | 43 | Stor programmatisk yta, men fel domän, dubbla titlar och rubrikhierarki |
| Prestanda | 48 | Fungerar, men flera dynamiska sidor har 1,7–3,0 s TTFB i stickprov |
| Backend, data och säkerhet | 61 | Bra auth/rate limits på många routes, men flera trust-boundary- och valideringsluckor |
| Monetisering | 44 | Bra planidé, men live-copy, gating och publik premiumdata är inte samordnade |
| Testbarhet och drift | 64 | Build/typecheck gröna; user-journey- och link-testning behöver skärpas |

## P0 — åtgärda före publik lansering eller betald trafik

### 1. Produktionen kör Clerk i utvecklingsläge

Live-inloggningen visar tydligt `Development mode`. Det skadar förtroendet och indikerar att produktionen använder Clerk testkonfiguration eller fel domän/instance.

Åtgärd:

1. Använd Clerk production instance och `pk_live_...`/motsvarande servernyckel i Vercel Production.
2. Lägg in verifierade produktionsdomäner och redirect-URL:er.
3. Smoke-testa sign-up, OAuth, e-postverifiering, sign-out och redirect tillbaka till `/onboarding`.

### 2. Liveversionen visar tre olika PRO-priser

- Landningens prisruta: PRO 89 kr/mån, Elite 169 kr/mån.
- FAQ på samma landning: PRO 99 kr/mån, Elite 199 kr/mån.
- `/prenumerera`: founder-PRO 69 kr/mån.

Detta är ett direkt konverterings- och förtroendefel. Den lokala worktreen innehåller redan ej committade förbättringar som samlar pris/trial-copy via `lib/pricing.ts`, men liveversionen är fortfarande inkonsekvent.

Åtgärd: deploya en enda sanningskälla för pris, trial, founder-tak och planförmåner. Lägg ett automatiskt test som jämför landing, FAQ, onboarding, konto, paywalls och Stripe-belopp.

### 3. Primär domän och canonical-strategi är inte samordnade

29 filer innehåller sammanlagt cirka 70 hårdkodade `https://athopia.se`-referenser för canonical, sitemap, JSON-LD, delning, Stripe-returer och billing portal. Den verifierade produktionen är `athopia-web.vercel.app`.

Risker:

- Google kan konsolidera indexering mot en domän som inte visar produkten.
- Stripe kan skicka användaren till fel host om `NEXT_PUBLIC_BASE_URL` saknas/felkonfigureras.
- Checkout-success går till `/konto`; ett domän- eller authfel här upplevs som att betalningen misslyckats.

Åtgärd: välj en officiell produktiondomän. Antingen kopplas `athopia.se` korrekt och blir enda canonical, eller så används Vercel-domänen tills dess. Introducera `SITE_URL` på serversidan och ta bort hårdkodade domäner.

### 4. Lanseringsläget är motsägelsefullt

Hero-CTA öppnar `Privat beta` och frågar efter väntelista/kod. Toppnavigeringens `Börja gratis` går däremot direkt till inloggning. Samma sida säger samtidigt “Gratis att börja”, “Snart live” och säljer betalda planer.

Åtkomstkoden `Hampus2026` ligger i klientkoden och är därför ingen säker beta-gate.

Åtgärd: välj ett av två lägen:

- **Öppen produkt:** alla “Börja gratis” → sign-up → onboarding. Ta bort väntelista och kod.
- **Stängd beta:** alla CTA:er → samma servervaliderade invite-flöde. Visa inte publik checkout innan användaren är insläppt.

### 5. Plan- och paywalllogiken har mer än en modell

Den aktiva servermodellen använder `publicMetadata.plan`, `getUserPlan()` och `canAccess()`. Samtidigt finns äldre `ProGate` och `hooks/useUser.ts` som läser `subscriptionTier` och bara räknar exakt `pro`, inte `elite`. De verkar inte vara aktiva nu, men de är en tydlig regressionsrisk.

`ProGate` suddar dessutom bara innehåll visuellt; barninnehållet finns kvar i DOM och får aldrig användas som säker datagate.

Åtgärd:

- Radera eller migrera all `subscriptionTier`-kod.
- Ha en server-side `getUserPlan()` som enda källa.
- Gatea data i query/API innan render, inte med blur.
- Lägg kontraktstest: free, pro och elite mot varje betalfunktion.

### 6. Bestäm vad som faktiskt är gratis respektive premium

`/statistik/scout` och `/api/scout` är publika och exponerar en stor spelarbas. Även projection, schedule form, finishing index och player twins är publika. Samtidigt säljer PRO “xG och avancerade filter”.

Detta kan vara rätt som acquisition-strategi, men då måste priset sälja något annat och copy vara exakt. Om Scout är premium räcker en visuell paywall inte; endpointen måste kräva plan.

Åtgärd: skapa en feature-entitlement-tabell med kolumnerna `feature`, `free`, `pro`, `elite`, `API gate`, `UI gate` och `value proof`. Använd den som release-checklist.

## P1 — hög påverkan på tillväxt och retention

### Landning och konvertering

1. **Cookie-bannern täcker CTA och inloggning.** På mobil ligger den ovanpå hero-actions och teamchips. På sign-in täcker den nedre delen av Clerk-kortet. Gör bannern lägre, respektfull mot safe areas och aldrig över primär CTA/form.
2. **Hero-accenten har för låg kontrast.** `#2D5349` mot svart ger cirka 2,45:1, under WCAG AA även för stor text (3:1).
3. **Hero-rubriken är överdimensionerad.** `clamp(3.75rem, 11vw, 8.5rem)` fungerar visuellt men tar nästan hela första mobilen. Minska mobilminimum till cirka 3,0–3,25 rem och låt värdebevis/CTA komma högre.
4. **Löftet visas inte i datan.** Hero säger “hundratals svenska källor varje dygn”; landningens senaste sex nyheter är daterade 6–7 juli och kommer från samma källa. Visa källdiversitet, senaste uppdatering och verkligt antal sammanvägda källor.
5. **Telefonmockupen visar en starkare produkt än den som omedelbart möter användaren.** Säkerställ att “Viktigast just nu”, signal score, tre källor och daglig brief faktiskt finns efter onboarding.
6. **Below-fold marketing är client-only.** Pricing, FAQ och centrala produktförklaringar laddas med `ssr:false`. Det försämrar indexerbarhet, no-JS-upplevelse och kan skapa långa tomma ytor innan interaktionsobservern aktiveras. Server-rendera innehållet; hydrera bara animationerna.
7. **Gratisplanen på `/prenumerera` säger “Nuvarande plan” även för en anonym besökare.** Det bör vara “Börja gratis” eller “Välj lag”.

### Onboarding och första värde

8. **Fem steg är för mycket innan första värde.** Välkommen → lag → intressen → profil → betalplan innebär hög friktion. Gör lagval obligatoriskt, resten progressivt efter första briefen.
9. **Betalsteget kommer innan användaren bevisats värde.** Visa en riktig preview av användarens brief och tre relevanta signaler innan PRO-valet.
10. **“Hoppa över” är otydligt.** Samma knapp kan spara halvfärdig profil och avsluta onboarding. Skriv “Fortsätt utan profilbild” eller “Gör senare”.
11. **Checkout fortsätter även om profilsparning misslyckas.** Det är ett medvetet kodval, men kan lämna en betalande användare utan favoritlag. Spara kärnvalet atomärt före Stripe; profilbild kan vara best effort.
12. **Favoritlag finns i flera lager.** Clerk `unsafeMetadata.favoriteTeam`, localStorage, `user_feed_config.followed_team_ids`, `profiles.favourite_team_id` och separat `user_follows` kan divergera. Välj en auktoritativ serverkälla och behandla resten som cache/read models.
13. **Feed-config saknar schemastrikt validering.** PATCH allowlistar fältnamn men validerar inte elementtyper, UUID-format eller arraystorlek.

### Navigation och informationsarkitektur

14. **Bra bas, för många parallella navigationsytor.** Desktop-sidebar, header, mobil hamburger/drawer, flytande GlassNav, “Mer”, command palette och teammodal överlappar. På mobil räcker bottennav + tydlig sök/meny.
15. **GlassNav har sju ikonplatser utan synliga etiketter.** Fem länkar plus välj lag och sök är för tätt och kräver inlärning. Visa etiketter för de fyra viktigaste och flytta teamval/sök till headern.
16. **“Mitt lag” är rätt startsida men för svag för gäster.** Gästvyn är mest ett tomt state. Låt gästen välja ett lokalt favoritlag direkt och visa ett provflöde innan konto krävs.
17. **“Mer” innehåller nio olika produktområden.** Det är en signal om för bred yta. Prioritera Daily, Podd, Forum och Statistik; dölj/flagga experiment som AI-chat tills de har en stark användningsfrekvens.
18. **Nyheter och Allsvenskan överlappar.** Behåll båda bara om de har tydliga jobb: Nyheter = personligt/redaktionellt, Allsvenskan = liga/matcher/tabell.

### Mobil, text och layout

19. **Många touchytor är under 44 px.** Hamburgare 32×32, tema 44×24, matchticker-rader cirka 30 px, vissa accordions 28–36 px, auth-input/knappar 32 px och cookie-knappar 42 px.
20. **Prissidan har horisontell overflow på 390 px.** Den långa H1:an `ALLSVENSKANS HEMMAPLAN` i 60 px är huvudmisstänkt. Använd responsiv clamp och tillåt naturlig radbrytning.
21. **All-caps används för mycket.** `ALLSVENSKAN`, `SCOUT MODE`, `ALLSVENSKANS HEMMAPLAN`, `MER` och flera statussidor ger tabloid/verktygskänsla, i konflikt med “Insatt. Respektfull. Vass.”
22. **Typografin har dokumentdrift.** Aktuell app använder Geist, medan äldre designspecifikationer refererar andra displaytypsnitt. Uppdatera `DESIGN.md` till verkligheten eller implementera beslutad typografi.
23. **Textstorleken är i huvudsak läsbar**, men sekundärcopy på 10–12 px och låg opacitet används för produktkritisk information. Sätt 14 px som lägsta nivå för viktig copy och höj kontrasten.

### SEO och innehållsstruktur

24. **Dubbla titelsuffix.** Flera sidor deklarerar redan `| Athopia` samtidigt som root-layouten använder template `%s | Athopia`, vilket skapar `| Athopia | Athopia`.
25. **Team-hubbar saknar riktig H1 när `titleContent` används.** Teamnamnet renderas visuellt i `LargeTitleHeader`, men inte semantiskt som H1. Underflikar använder ibland H2 som sidrubrik.
26. **Sitemap/canonical måste följa vald domän.** Generera från samma `SITE_URL`, inte hårdkodat på 29 ställen.
27. **Schema.org-data är ambitiös men riskerar att signalera fel host.** Validera Organization, SportsEvent, Breadcrumb och Product efter domänfix.
28. **Landningens FAQ är värdefull SEO-text men client-only.** Server-rendera den och lägg `FAQPage`-schema endast när svaren är synliga och aktuella.

### Prestanda

29. **Stickprov visar hög serverlatens på dynamiska sidor.** Mobil TTFB: root cirka 1,0 s, nyheter cirka 3,0 s, statistik cirka 2,2 s, prissida cirka 1,7 s och Mitt lag cirka 1,9 s. Mätningen är ett stickprov, inte ett fullständigt CWV-labb.
30. **Root gjorde cirka 101 requests och överförde cirka 964 KB i ett kallt mobiltest.** Sätt budget: <700 KB initialt, <60 initiala requests och <800 ms p75 TTFB.
31. **Server components använder service-role för många publika läsningar.** Det förenklar, men varje dynamisk request går via privilegierad dataaccess. Flytta stabil offentlig data till cacheade/select-specifika queries eller säkra publika views.
32. **`select('*')` används i privata profil/feed-config-routes.** Returnera bara fält klienten behöver.

## Backend- och säkerhetsaudit

### Styrkor

- Stripe-webhook verifierar signatur och sparar plan server-side.
- Checkout kräver Clerk-auth, validerar plan/intervall och har rate limit.
- Forumets write-routes har i huvudsak auth, Zod-schema och rate limiting.
- Elite-chat har plancheck, daglig gräns och månatlig budget.
- Cron/push/forum-summary-routes har hemlig token.
- Service-role exponeras inte via `NEXT_PUBLIC_`.
- RLS aktiveras explicit för flera exponerade tabeller och publika sporttabeller får read-only policies.
- TypeScript och production build passerar.

### Brister och rekommendationer

33. **Checkout läcker leverantörsdetalj.** Vid Stripe-fel returneras `detail: msg` till klienten. Logga detaljen server-side/Sentry och returnera en stabil felkod.
34. **Checkout bas-URL har farlig fallback.** Om env saknas används `https://athopia.se`. Fail fast i production i stället för fallback.
35. **Match- och Elite-chat accepterar ovalidierade message-arrays.** Lägg Zod-schema, max antal meddelanden, max tecken och tillåtna roller.
36. **Match-chat interpolerar klientstyrda fixture/lagfält i systemprompt.** Hämta matchkontext server-side från fixture-id och behandla all extern text som data, inte instruktion.
37. **Forum-summarizer interpolerar användarinnehåll i prompt och publicerar resultat.** Lägg tydlig prompt boundary, output-schema, moderation och “AI-sammanfattning”-etikett.
38. **AI-usage kan race:a.** Limit läses före stream och usage skrivs i `onFinish`; parallella requests kan passera samma gräns. Använd atomisk reservation/RPC.
39. **Månadsbudget summeras genom att läsa alla månadens rader.** Aggregat/RPC eller daglig counter skalar bättre.
40. **Waitlist saknar rate limit/honeypot.** Unika adresser kan fylla tabellen och öka kostnad.
41. **UTM/outbound tracking är öppna write-endpoints.** Lägg strikt rate limit, origin-kontroll, URL-policy och botfiltrering så analytics inte blir lättförgiftad.
42. **Push-route har personlig e-post hårdkodad i VAPID-subject.** Flytta till env och använd företagsadress.
43. **RPC-privilegier bör låsas.** Migrationen skapar `toggle_like`, `toggle_repost`, `increment_reply_count` och `update_league_ranks` i publikt schema utan explicit `REVOKE EXECUTE FROM PUBLIC`. De är inte `SECURITY DEFINER`, så exploaterbarhet beror på underliggande grants/RLS, men principen ska ändå vara explicit: revoke från public/anon/authenticated och grant endast till avsedd serverroll.
44. **Views behöver separat RLS-audit.** Exempelvis `published_*`-views läses från webben; verifiera `security_invoker=true` eller explicita grants. Repo-migrationerna täcker inte hela live-schemat.
45. **Mock fallback kan läcka in i produkten.** Scout faller tillbaka på mockspelare om DB är tom/onåbar. Produktion ska hellre visa “data tillfälligt otillgänglig” och logga incident än presentera demo som verklig statistik.
46. **Fel fångas ibland och omvandlas till tom data.** Det ger fungerande UI men kan dölja pipelineproblem. Separera “inga data” från “data kunde inte hämtas”.

## Sida för sida

### `/` — landning

Behåll:

- “Din klubb. Varje dag.”
- Live-puls, tabell och senaste nytt ovanför ren marketing.
- Teamchips och tydligt klubbval.
- Svart/racing-green identitet.

Ändra:

- Bestäm öppen produkt eller privat beta.
- En enda pris- och trialmodell.
- Flytta CTA över cookie-overlay och minska hero på mobil.
- Visa tre verkliga värdebevis: antal källor, senaste uppdatering, exempel på “vad det betyder”.
- Server-rendera pricing/FAQ.

Ta bort eller pausa:

- Klientlagrad beta-kod.
- Claims som inte kan visas i produkten direkt.
- Dubbla CTA-beteenden.

### `/onboarding`

Rekommenderat flöde:

1. Skapa konto eller fortsätt som gäst.
2. Välj favoritlag.
3. Visa omedelbart en riktig personlig brief.
4. Fråga efter notiser/intressen i kontext.
5. Visa PRO först efter värdebevis.
6. Profilbild/nickname efteråt, inte som blockering.

### `/mitt-lag`

Detta bör vara den primära retentionytan. Överst varje dag:

- 60-sekunders brief.
- Nästa/senaste match.
- Tre viktigaste signaler med källkonfidens.
- “Vad har ändrats sedan igår?”.
- En tydlig nästa handling: läs, lyssna, diskutera eller följ live.

### `/allsvenskan` och `/match`

Bra gratis utility och SEO. Behåll dem snabba och pålitliga. Försök inte överträffa Forza på global bredd; överträffa på allsvensk kontext, historik och förklaring. Säkerställ 44 px matchrader och liveuppdateringens robusthet.

### `/nyheter`

Gör skillnaden mot Google News tydlig:

- Klustra samma händelse.
- Visa “3 källor”, källa, tid och varför storyn är relevant för mitt lag.
- Ge användaren “mer/mindre av detta”, dölj källa och följ ämne.
- Sortera inte bara på AI-score; ge en transparent förklaring.

### `/statistik`, jämförelse och Scout

Denna yta kan konkurrera med Bolldata om den är pålitlig, snabb och begriplig. Lägg tooltips, datakälla, senaste uppdatering och minsta speltid. Välj om Scout är gratis acquisition eller premiumverktyg. Blanda aldrig mock och live utan tydlig märkning.

### Forum, podd, Daily och AI

De är bra differentierare men bör inte alla vara top-level-produktlöften samtidigt.

- Forum: fokusera på klubbtrådar och matchdag; kvalitet/moderation före volym.
- Podd: metadata, sök och tidskodade insikter är en stark PRO-funktion.
- Daily: potentiellt bästa retentionfunktionen; den bör få mer prioritet än generell AI-chat.
- AI-chat: gör den kontextuell på match/lag, inte en separat generisk destination i första hand.

## Vad som saknas

1. Tydlig källa- och metodsida: hur Athopia väljer, sammanfattar och rättar.
2. “Senast uppdaterad” på statistik och nyhetssignaler.
3. Feedback: mer/mindre av detta, dölj källa, rapportera felaktighet.
4. Redaktionspolicy, AI-policy och rättelseflöde.
5. Status/incidentkommunikation när data är försenad.
6. En riktig first-session demo utan konto.
7. Planmatris som exakt matchar teknisk entitlement.
8. Retentionloop: daglig notis → brief → handling → återkomst.
9. Referral efter värde: “Dela dagens brief med en supporter”.
10. Testkonto/testplan för live QA av free/pro/elite.
11. Starka tom-/fel-/offline-states som skiljer saknad data från systemfel.
12. Mätplan med activation, D1/D7, brief completion och paywall conversion.

## Vad som bör tas bort eller skjutas upp

- Klientlagrad privat beta-kod.
- Äldre `subscriptionTier`-helpers och blur-baserad `ProGate`.
- “Export/API kommande” tills den är nära leverans.
- Generisk AI-chat som huvudfunktion innan Daily/brief fungerar perfekt.
- Mock fallback i produktionsstatistik.
- Duplicerad navigation som inte används i data.
- All-caps som standardrubrik.
- Claims om “hundratals källor varje dygn” utan synligt bevis.

## Kan Athopia konkurrera?

### Forza Football

Forza uppger 1 450+ tävlingar, snabba anpassningsbara pushnotiser, händelseflöde, highlights, startelvor, TV-guide och spelarstatistik. Athopia ska inte försöka matcha den globala infrastrukturen. [Forza Football på Google Play](https://play.google.com/store/apps/details?id=se.footballaddicts.livescore)

Athopias vinstyta: mycket djupare Allsvenskan, svensk källkontext, vad en händelse betyder för mitt lag och en daglig supporterbrief.

### FotMob

FotMob positionerar sig på live scores, detaljerad statistik och breaking news från 500+ ligor; appbeskrivningen lyfter även personliga alerts, xG, shot maps, highlights, livekommentar och TV-schema. [FotMob](https://www.fotmob.com/en/download)

Athopia ska använda livescore som hygienfaktor, inte huvudsakligt skäl att byta. “Jag förstår mitt lag snabbare” är bättre än “vi har också matcher”.

### Bolldata

Bolldata är redan starkt på Allsvenskan: tabell/xP över många säsonger, xG/xA/xP, spelarfiilter, diagram och lagjämförelser. [Bolldata](https://bolldata.se/)

Athopia kan vinna på begriplighet och personalisering, men inte om statistik visar tom data, mockfallback eller saknar uppdateringstid. Bolldata är riktmärket för datadjup; Athopia bör lägga ett narrativt lager ovanpå.

### Google News

Google News låter användaren följa lag/ämnen/källor, visa mer eller mindre av en typ och dölja källor. [Google News personalisering](https://support.google.com/googlenews/answer/9010862?hl=en)

Athopia kan vinna eftersom Google inte är byggt för allsvensk matchkontext, xG, supporterforum och poddintelligens i en klubbloop. Men Athopia behöver motsvarande användarkontroll och källtransparens.

### Slutsats

**Ja, Athopia kan konkurrera som den bästa Allsvenskan-produkten för daglig klubbintelligens. Nej, Athopia bör inte konkurrera head-on som global livescore- eller generell nyhetsaggregator.**

Den smalaste vinnande wedgen är:

> Välj ditt lag. På 60 sekunder varje morgon vet du vad som hänt, vad det betyder och vad som är värt att följa idag.

## Rekommenderad informationsarkitektur

### Primär mobilnavigation

1. **Mitt lag** — brief, match och signaler.
2. **Matcher** — live, kommande, resultat.
3. **Nyheter** — personligt flöde och källor.
4. **Allsvenskan** — tabell, statistik, spelare.
5. **Mer** — Daily, podd, forum, konto.

Sök i headern. Teambyte inne i Mitt lag. Undvik två separata ikonknappar i bottennavet för team och sök.

## 30/60/90-dagarsplan

### 0–14 dagar: lanseringshygien

- Clerk production mode.
- En domän och en `SITE_URL`.
- En pris-/trialkälla och deploy av den pågående lokala fixen.
- Enhetligt CTA/betaläge: öppen eller stängd beta.
- Verifiera free/pro/elite och Stripe success/cancel/portal.
- Cookie-banner, mobil overflow, kontrast och 44 px touchytor.
- Ta bort `subscriptionTier`-rester och klientkod.
- Reparera `test:links` och gör 404 till testfel.

### 15–45 dagar: kärnloop

- Förenkla onboarding till lag → värde → intressen → PRO.
- Gör Mitt lag till daglig brief-hemvist.
- Visa källkonfidens, uppdateringstid och förändring sedan igår.
- Instrumentera activation och D1/D7-retention.
- Bestäm gratis/premium per feature och gatea API server-side.
- Minska TTFB på nyheter/statistik och server-rendera marketing-copy.

### 46–90 dagar: differentiering

- Daily som återkommande text + ljud.
- Poddintelligens med sök/tidskod och rättighetsren presentation.
- Transparens/AI/redaktionspolicy.
- Personliga feedbacksignaler likt mer/mindre/dölj källa.
- Share/referral från brief och matchinsikt.
- Benchmark mot Bolldata på datadjup och Forza/FotMob på matchday-hygien.

## KPI:er att styra efter

- Landing → sign-up: mål 8–12 % från relevant trafik.
- Sign-up → valt lag: >85 %.
- Valt lag → första brief visad: >80 % inom två minuter.
- Brief completion: >60 %.
- D1 retention: >35 %; D7: >20 % som tidigt mål.
- Push opt-in efter visat värde: >40 %.
- Free → trial: 4–8 %.
- Trial → paid: >45 %.
- Andel stories med minst två källor och synligt stöd.
- Data freshness SLA för match, tabell, nyheter och brief.
- p75 TTFB, LCP, INP och CLS per kärnrutt.

## Verifieringsresultat

- `pnpm typecheck`: godkänd.
- `pnpm build`: godkänd; 223 sidor genererade.
- Konsolfel i testade kärnsidor: inga observerade.
- Horisontell overflow: observerad på `/prenumerera` vid 390 px.
- Touchmål under 44 px: observerade på samtliga testade appytor.
- Live CTA: hero öppnar privat beta; toppnav går till auth/onboarding.
- Live auth: dirigerar till Clerk men visar `Development mode`.
- Live pricing: 69/89/99 kr före lokal ej deployad konsolidering.
- Link-testscript: trasigt på grund av saknad `ts-node`.

## Skärmbilder

- [Landning desktop](/C:/Users/jardi/.codex/visualizations/2026/07/13/019f5c5a-7244-7f22-a8ab-a8bdef53059d/screenshots/landing-desktop.png)
- [Landning mobil](/C:/Users/jardi/.codex/visualizations/2026/07/13/019f5c5a-7244-7f22-a8ab-a8bdef53059d/screenshots/landing-mobile.png)
- [Onboarding/auth live](/C:/Users/jardi/.codex/visualizations/2026/07/13/019f5c5a-7244-7f22-a8ab-a8bdef53059d/screenshots/onboarding-live.png)

## Slutrekommendation

Pausa ny featureutveckling i två sprintar. Lägg allt fokus på:

1. förtroende och produktionsläge,
2. en enda pris-/planmodell,
3. lagval → första brief på under två minuter,
4. Mitt lag som daglig vana,
5. mätbar retention.

Athopia behöver inte fler sidor för att bli konkurrenskraftigt. Det behöver en kortare väg till ett ögonblick där användaren tänker: **“Nu vet jag allt viktigt om mitt lag, och jag behövde inte öppna nio andra appar.”**
