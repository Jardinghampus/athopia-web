# Athopia — Executive Launch & World-Class Build Plan

> **Daglig körning:** börja i [`LAUNCH-PLAN.md`](./LAUNCH-PLAN.md) (kort checklista + startprompt för ny chatt).  
> Beslutad plan 2026-07-13. Tvärrepo: `athopia-web`, `athopia-os`, `athopia-admin`.  
> Detta dokument är full spec. Gamla A–H-/native-feel-planer är bakgrund.  
> Bocka bara `[x]` med commit + verifieringsbevis.

## 1. Executive call

Athopia ska lanseras som:

> **Allsvenskans dagliga intelligenslager för mitt lag — snabbt att överblicka,
> trovärdigt nog att dela och djupt nog att betala för.**

Vi ska inte vänta på att alla A–H-polishpunkter är perfekta. Launch 1.0 kräver:

1. juridiskt säker innehållsprovenance;
2. fungerande production-auth, checkout och planåtkomst;
3. färsk och mätbar lag-/matchdata;
4. kärnloopen Mitt lag → Flöde → Forum;
5. gröna persona-, mobil- och driftkontroller.

Publisher, podcastnuggets och AI-lägen byggs som kontrollerade betor efter att
grundens säkerhet och mätbarhet är på plats.

## 2. Produktbeslut

- [x] Bottennav: **Mitt lag · Flöde · Forum · Mer** (`8c02e40`).
- [x] Athletic-inspirerat flöde: hero + dividerlista + För dig/Senaste/Viktigt.
- [x] Gratis bygger vana; PRO säljer destillat; Elite säljer edge.
- [x] Öppen produkt med riktig auth — ingen klientbaserad beta-accesskod.
- [x] Prisstory: Gratis 0 / PRO 89 / Elite 169, founder PRO 69 när aktiv,
  sju dagars trial.
- [x] Betalt innehåll ska aldrig skickas i free DOM och bara döljas med CSS.
- [ ] “The Athletic DNA” översätts till **Athopia Editorial Standard**:
  evidensdriven, lugn, analytisk, svensk och original — aldrig imitation av
  formuleringar eller named-style prompting.
- [ ] Redaktionell publisher byggs i `athopia-admin`, inte i `athopia-web`.
- [ ] `/skriv` blir contributor/krönikörsflöde tills admin har full paritet;
  därefter redirect/deprecation. Direkt publiceringsrätt ska inte dupliceras.
- [ ] Externa källartiklar delar en source-first Athopia-sida; originalkällan
  är primär CTA utan login, timer eller medlemskapstvång.
- [ ] AI-namn är produktlägen, inte påstått egenutvecklade grundmodeller.

## 3. Sanningsbild A–H

### Fas A — Navigering `[~]`

- [x] En navkälla i `lib/nav.ts`; fyra etiketterade mobilflikar.
- [x] Sekundärt i hamburger: Allsvenskan, Matcher, Statistik, AI, poddar, konto.
- [ ] Lägg global `FixturesTicker` endast där den hjälper, inte mekaniskt överallt.
- [ ] Konsolidera `/feed` med `/nyheter`; behåll bara uttryckligt delbara lagfeeds.
- [ ] Uppdatera stale navigation-E2E från `.glassnav` till `TabBar`.
- [ ] Match-/spelarsnabbläge som Sheet från relevanta listor.
- [ ] Rollstyrd extern länk “Redaktion” när admin-auth bridge finns.

### Fas B — Flöde `[~]`

- [x] Athletic-feed, sortering, visa-filter och kommentarantal.
- [ ] Kommentarantal ska öppna rätt artikeltråd/compose-ingång.
- [ ] Verifiera att “Viktigt” är signalranking och “För dig” faktiskt använder
  personliga defaults utan att skapa en filterbubbla.
- [ ] p75 TTFB < 800 ms på varm cache; inga seriella DB-anrop i render path.
- [ ] Loading, empty, error och offline-liknande tillstånd.

### Fas C — Mitt lag `[~]` — launch-kritiskt

- [x] Brief-first hem, tabellposition, matchdag och lagupplösning via entity slug.
- [ ] En tät widgetstack: nästa match, form, tabellutdrag, nyheter och trådar.
- [ ] Pull-to-refresh på mobil med bibehållen serverauktoritet.
- [ ] Match-/spelarsheets från widgetar.
- [ ] Guest kan välja lokalt lag och se ärlig preview före registrering.
- [ ] Ett enda favoritlagskontrakt mellan Clerk, profil och `user_feed_config`.
- [ ] Mät `time_to_first_value`, brief-open och återbesök — inte bara pageview.

### Fas D — Forum `[~]`

- [x] Teamforum, compose drawer, trådroute och fast composer.
- [x] Artikel ↔ forum-kontrakt finns.
- [ ] Optimistic post/reply med rollback och tydligt fel.
- [ ] Threads-lik connector och förenklad listlayout utan överflödig chrome.
- [ ] Lagfilter som snabb pills-yta.
- [ ] Forumsummary gated server-side; free får aldrig full summary i HTML/RSC/API.
- [ ] E2E: skapa, svara, gilla, rapportera, rate limit, låst tråd.

### Fas E — Statistik `[~]`

- [x] Statistikytor, form, filter-sheets och Scout API entitlement.
- [ ] Zondots + legend och konsekventa tabular-nums.
- [ ] Auditera varje query för `.eq('sport', SPORT)` och verkliga kolumner.
- [ ] Inga mockfallbacks eller placeholder-xG; incidentstate när data saknas.
- [ ] Mobil QA på 320/390 px och synlig statistik-`/qa`.

### Fas F — Match & spelare `[~]`

- [x] Pre-match intelligenshub, relaterat, forum och conditional xG.
- [ ] Match-/PlayerQuickSheet från listor; full route kvar för deep-link/SEO.
- [ ] Besluta om `LiveMatchClient`: integrera med säker polling eller radera.
- [ ] Auditera alla xG/pressure-fält: `null` = dölj, aldrig `0.00`.
- [ ] Testa pre-match, live, FT, uppskjuten och saknad line-up.

### Fas G — Onboarding & konto `[~]` — launch-kritiskt

- [x] Konto som ListGroup och gemensam prisfil.
- [ ] Komprimera onboarding till tre beslut:
  **Välj lag → se riktig värdepreview → notiser (valfritt)**.
- [ ] Flytta upgrade efter demonstrerat värde, inte före.
- [ ] Free/PRO/Elite checkout success/cancel/webhook/portal E2E.
- [ ] Auth redirect utan loop på mobil och desktop.

### Fas H — QA & polish `[ ]` — launch gate

- [x] `pnpm typecheck` och `pnpm build` gröna efter nav/feed.
- [ ] `test:links` flyttas från `ts-node` till fungerande `tsx`.
- [ ] Cookiebanner blockerar aldrig CTA/bottennav.
- [ ] Touchmål ≥44×44, WCAG AA, reduced motion, VoiceOver/tabbordning.
- [ ] Lighthouse mobil: LCP/TTFB/CLS budget per kärnroute; mål ≥90 initialt,
  ≥95 efter mätbar optimering (inte score-gaming).
- [ ] Browser-QA: `/`, `/mitt-lag`, `/nyheter`, `/forum`, `/match/[id]`,
  `/statistik`, `/prenumerera`, auth och onboarding.
- [ ] Sentry/runtime-loggar rena under smoke.
- [ ] `PROGRESS.md`, `NEXT.md` och workspace `BUILD.md` synkas med verkligheten.

## 4. Wave 0 — launch blockers (gör först)

### W0.1 Innehållsrättigheter och provenance — `athopia-os` + `athopia-web`

**Varför:** systemet sparar scrapad tredjepartstext i `articles.content`, medan
webben kan rendera `article.content` för PRO. Slug är inte bevis på ägarskap.

- [ ] Migration i `athopia-os/supabase/migrations`:
  - `articles.content_origin`: `athopia_original | third_party_signal | licensed`;
  - `articles.rights_status`: `owned | link_only | licensed`;
  - `article_sources(article_id, source_name, original_url, domain, is_primary, published_at)`.
- [ ] Konservativ backfill; okända poster blir `link_only`.
- [ ] Scrapad fulltext flyttas/avskiljs till service-role research-lager.
- [ ] Public feed/view exponerar aldrig scrapad body eller RSS-teaser.
- [ ] `/artikel/[slug]` renderar bara owned/licensed.
- [ ] Ny `/nyhet/[slug]` för link-only: titel, källa, domän, källänk och tydligt
  Athopia-skriven kontext. `robots: noindex, follow`.
- [ ] Regressionstest: tredjepartsbody/teaser finns inte i HTML, RSC, metadata,
  JSON-LD eller klientprops.
- [ ] Legal review: rubriker, bildlicenser, AI-summering, takedown och podcast.

**Definition of done:** varje publik post har explicit provenance; originalet
nås i ett klick utan auth/fördröjning; inga tredjepartsbrödtexter publiceras.

### W0.2 Production truth — founder + web

- [ ] Clerk production keys, domän/origins och redirects verifierade live.
- [ ] Stripe live Price IDs matchar `lib/pricing.ts`; 7-dagars trial syns före köp.
- [ ] Checkout, webhook, portal och downgrade testas med riktiga testpersonas.
- [ ] `NEXT_PUBLIC_SITE_URL` och canonical host verifieras mot DNS.
- [ ] Anthropic credits/keys och Vercel env valideras utan att logga värden.
- [ ] Adminens faktiska skydd verifieras innan Publisher byggs:
  Vercel SSO/shared secret räcker inte för aktörsbaserad editorial audit.

### W0.3 Data freshness & team coverage — `athopia-os` + admin

- [ ] Verifiera `syncStatic`, fixtures, teams/players freshness och Milo 400-fix i drift.
- [ ] `team_coverage_dashboard`/view: alla 16 lag, senaste signal/pulse/artikel,
  källantal och stale-timmar.
- [ ] Slack-alert endast när lag är tyst >36h på relevant match-/nyhetsdag.
- [ ] Athopia Daily producerar dagens episode eller visar mätbart fel/skipped reason.
- [ ] Coverage SLO:
  - 16/16 lag har färsk datastatus;
  - matchdag <15 min signal freshness;
  - normaldag <24h pulse när underlag finns;
  - inga texter genereras för att fylla en kvot när underlag saknas.

### W0.4 AI-budget och route-säkerhet — web + OS

- [ ] En global auktoritativ modell-/pris-/budgetkonfiguration.
- [ ] Workspace hard cap `$20/mån` vinner tills founder ändrar policyn.
- [ ] Ta bort route-default `$50/mån` och motstridiga prisberäkningar.
- [ ] Atomisk budgetreservation före anrop; per-request input/output/steps/timeout.
- [ ] Elite-routes använder `getUserPlan()` + `canAccess()`.
- [ ] Matchkontext laddas server-side från `fixtureId`; lita inte på klientscore/lag.
- [ ] Alla verktygsqueries sportfiltreras och returnerar `missingFields`.

## 5. Wave 1 — Launch 1.0-produkt

Kör små PR/commits i denna ordning:

1. [ ] **A/B stabilisering:** feed-dedup, nav-E2E, kommentarlänk, feed performance.
2. [ ] **C Mitt lag:** widgetstack, guest preview, favoritlag-SSOT.
3. [ ] **G onboarding:** tre steg + verklig brief före upgrade.
4. [ ] **D forum kärnflöde:** optimistic post/reply + server-gating.
5. [ ] **E/F data trust:** xG/null-audit, orphanbeslut, mobilstatistik.
6. [ ] **H launch QA:** persona- och browsermatris.

### Launch 1.0 release gate

- [ ] Anonymous: landing → lagpreview → signup fungerar.
- [ ] Free: Mitt lag, Flöde, live/tabell och forum ger verkligt värde.
- [ ] PRO: AI-artikel, forumsummary, transfer, matchanalys och Pitchview är
  servergated och fungerar.
- [ ] Elite: Grassroot (om aktiverad) och edge-funktioner fungerar; annars är de
  tydligt “kommer snart”, inte trasiga länkar.
- [ ] Mobil 320/390/430 px och desktop utan overflow/överlapp.
- [ ] Light/dark, keyboard, screenreader och reduced motion.
- [ ] Typecheck, build, links, relevanta unit/API/E2E och runtime smoke gröna.
- [ ] Ingen paid payload till free; ingen tredjepartstext till någon persona.

När samtliga är gröna: **lansera**. Publisher/AI Djup ska inte blockera första
betalande användaren om de ligger bakom korrekt feature flag.

## 6. Wave 2 — Publisher newsroom (`athopia-admin`)

### Arkitektur

- [ ] Per-user auth för Publisher-routes; behåll ops-auth separat tills migrerad.
- [ ] Roller:
  - `editor`: skapa/redigera, skicka till review;
  - `columnist`: eget contributorflöde enligt policy;
  - `publisher`: publicera alla godkända drafts;
  - `admin`: wildcard.
- [ ] `Välkommen tillbaka, {firstName}` + draft/queue-snapshot.
- [ ] `/admin/publisher` dashboard och `/admin/publisher/[id]` editor.
- [ ] Portera Tiptap-idéer från web `/skriv`; service-role stannar server-side.
- [ ] Mobil: editor/preview som tabs; desktop: split view; sticky publishbar.
- [ ] Autosave ≤2s, `aria-live`, offline buffer och 409 conflict UI.
- [ ] Publicering är explicit och auditloggad med verklig actor-id.

### Draft retention

- [ ] Draft `updated_at`, `version`, `deleted_at`; index på draft + updated_at.
- [ ] Dag 23: “raderas om 7 dagar”; dag 29: sista varning.
- [ ] Dag 30: flytta endast `status=draft` till trash.
- [ ] Dag 37: hard-delete trash (sju dagars recovery). Aldrig pending/published.
- [ ] Cron ägs av `athopia-os`; admin har loggad manuell founder-action.
- [ ] Cursorpagination, bodylimit och cap på aktiva drafts per författare.

### Web entry

- [ ] Server-resolved editorial role i app-layout.
- [ ] Hamburger visar extern “Redaktion” → `os.athopia.se/admin/publisher`.
- [ ] Icke-behörig ser ingen länk och får 403 på målet.
- [ ] När admin når paritet: `/skriv` redirectas eller begränsas till submission.

## 7. Wave 3 — Newsroom intelligence (`athopia-os`)

### Athopia Editorial Standard

- [ ] Ta bort “skriv som The Athletic” ur prompts. Behåll egenskaper:
  kontext först, konkret tes, källstödda fakta, data som förklaras, premiumlugn.
- [ ] Gemensam style rubric + promptversion.
- [ ] N-gram/embedding-similarity gate mot källunderlag före publish.
- [ ] Attribution completeness gate och source rights registry.
- [ ] Golden set: minst 20 märkta artiklar initialt, sedan 100.

### Vinklar och godtyckliga redaktionella uppdrag

- [ ] `editorial_commissions`: brief, lag, deadline, angle, required sources/stats,
  assignee/agent, status, reviewer.
- [ ] Publisher kan beställa:
  - “Vad har förändrats sedan förra omgången?”;
  - taktisk datapunkt;
  - transferläge;
  - supporterfråga;
  - tabell-/formanomali.
- [ ] Researcher producerar underlag/angles; writer skapar draft; människa godkänner.
- [ ] Max två Sonnet-longform/dag initialt; aldrig “daglig artikel” utan ny tes.
- [ ] Novelty-dedup 72h så samma take inte återkommer.

### Delad facts pack

- [ ] `buildFootballFactsPack()` används av Prospector, Daily och commissions.
- [ ] Snapshot hash + provenance på varje draft.
- [ ] Statsblock obligatoriskt för taktisk/tabellvinkel; multi-source ≥3 för
  tvärsäker nyhetssyntes.

## 8. Wave 4 — Podcast intelligence

### Vad som redan finns

- [x] RSS metadata, opt-in Deepgram-transkribering, chunks/embeddings,
  team/entity mapping, semantisk sök och metadata/Spotify-webb.
- [x] Transcript/chunks är internt RAG-underlag, inte publik text.

### Vad som byggs

- [ ] `podcast_highlights`: episode, team entities, timestamp, topic,
  Athopia-parafras, confidence, source attribution, rights status.
- [ ] Highlight visas per lag med “Lyssna från {timestamp}” när länk stöder det.
- [ ] Ingen lång quote, detaljerat transcript eller återpublicerad poddtext.
- [ ] Podcastnugget ensam blir **inte** artikel.
- [ ] Nugget→artikel kräver:
  - confidence ≥0.72;
  - novelty ≥0.55;
  - minst två icke-podcastkällor;
  - stats snapshot när vinkeln är data/taktik;
  - mänsklig approval.
- [ ] Endast podcastkälla → highlight/daily input, inte longform.
- [ ] Kostnad: batch ≤10 episoder, transcribe per allowlisted källa,
  max två nugget-longforms/dag inom global budget.

## 9. Wave 5 — AI-produkten

### Namn

Rekommendation:

- **Pitchview** — Snabb: korta faktasvar från aktuell Athopia-data.
- **Grassroot** — Djup: jämför statistik och verifierade källor.

Versionerna `2.5`/`3.5` får vara interna promptversioner, inte UI-copy. De antyder
annars att Athopia tränat egna grundmodeller. Full transparens:

> “Athopia-lägen använder externa språkmodeller tillsammans med verifierad
> Athopia-data. AI kan göra fel — kontrollera källorna.”

### Förmågor

- [ ] Free: ingen chat.
- [ ] PRO: Pitchview — Haiku, max 3 steg, ca 400 tokens, 2–4 meningar.
- [ ] Elite: Pitchview + Grassroot — Sonnet, max 5 steg, ca 900 tokens.
- [ ] Mode allowlistas server-side; klienten skickar aldrig provider/model-id.
- [ ] Pitchview avstår vid saknad data; ingen transferspekulation.
- [ ] Grassroot kräver grounding + två källor för färsk nyhet/transfer.
- [ ] Strukturerade tool-resultat:
  `{ data, sources, dataUpdatedAt, missingFields }`.
- [ ] Klickbara citationer vars id verifieras mot aktuella tool calls.
- [ ] Prompt injection-suite för user/article/forum/tool text.
- [ ] `ai_chat_runs` utan rå prompt som default: mode, provider, model,
  prompt/tool version, tokens, cost, TTFT, latency, citations, grounding, status.
- [ ] Admin kill switches per mode och budgetpool.

### Rollout

1. [ ] Budget/security/grounding först.
2. [ ] Golden set ≥100 svenska frågor; siffror måste matcha tool payload 100%.
3. [ ] Pitchview internt → 10% PRO → 100%.
4. [ ] Grassroot internt → Elite först efter eval + sju stabila dagar.
5. [ ] A/B-testa namn/beskrivning, aldrig sanningshalten i transparenscopy.

## 10. Delning och growth

- [x] `ShareButton` använder native share + clipboard fallback.
- [ ] Byt hårdkodad host mot `absoluteUrl()`.
- [ ] States: idle/sharing/copied/error; endast `AbortError` är avbruten share.
- [ ] Clipboard fallback även efter tekniskt share-fel; manual copy om API saknas.
- [ ] 44px touchmål, focus och `aria-live`.
- [ ] Internal original share → `/artikel/[slug]`.
- [ ] Link-only share → `/nyhet/[slug]`, source-first enligt W0.1.
- [ ] Copy:
  “Delad via Athopia” är okej.
  “Läs originalet hos {källa}” är primär handling.
  “Samla nyheter om ditt lag — se Free och PRO” är sekundär handling.
- [ ] Ingen forced signup, countdown, fördröjd redirect eller dold destination.
- [ ] Canonical/OG strippar UTM; eventtracking lagrar inte mottagare/rå query.
- [ ] Rate limit + URL-normalisering för outbound/UTM endpoints.
- [ ] Consent- och retentionbeslut för attribution/referral.

## 11. Token-effektivt exekveringsprotokoll

### Vald modell

**Byt huvudmodell till Composer 2.5.**

Den är billigare än GPT-5.6 Sol och tillräckligt stark för implementation när
arkitektur, filägarskap, acceptans och ordning redan är låsta här.

- Composer 2.5: kod, migrations, multi-file task cards och verifiering.
- Composer 2.5 Fast: smala read-only-audits, mekaniska tester, dokumentstatus.
- GPT-5.6 Sol: endast vid ny arkitekturkonflikt, säkerhets-/rättighetsbeslut eller
  om två implementeringsförsök misslyckas.

### Agentregler

Varje huvudagent/subagent måste:

1. läsa repoets `CLAUDE.md` + `AGENTS.md`;
2. läsa endast sin task card i detta dokument och nämnda filer;
3. inspektera callers innan edit;
4. aldrig ändra samma filer parallellt som annan agent;
5. uppdatera checklistan `[ ] → [~] → [x]`;
6. vid `[x]` skriva commit-hash, tester och manuell/visuell kontroll;
7. uppdatera repoets `PROGRESS.md`/`NEXT.md`;
8. rapportera ändrade filer, testresultat, kostnad, deploybehov och blockerare;
9. inte committa/pusha/deploya utan aktuell användarinstruktion;
10. inte “fixa angränsande saker” utanför task card.

### Task-card-format

```text
ID:
Repo/branch:
Mål (en mening):
Läs först (max 8 filer):
Ändra (förväntade filer):
Rör inte:
Datakontrakt:
Acceptance:
Verifiera:
Dokumentera:
Blocker/escalation:
```

### Checkpoint-regel

- En task card = en feature/fix = en commit.
- Efter varje task: status/diff/typecheck + relevant test.
- Efter varje wave: full build, E2E/persona där relevant, visuell QA.
- Om tasken kräver mer än åtta nya filer att förstå: stoppa och dela tasken.
- Om dokument och kod motsäger varandra: kod + liveevidens vinner; uppdatera doc.

## 12. Task queue för nästa modell

### LAUNCH-01 — Provenance stop-the-line

- [ ] Repo: OS + web (sekventiellt, inte parallell schemaändring).
- [ ] Implementera W0.1 migration + public contract + regressionstest.
- [ ] Blockerar all extern source-interstitial/sharing.

### LAUNCH-02 — Production E2E

- [ ] Repo: web + founder dashboards.
- [ ] Clerk/Stripe/site URL/personas. Dokumentera externa steg exakt.

### LAUNCH-03 — Team freshness

- [ ] Repo: OS → admin.
- [ ] Coverage view, adminmatris och alert; verifiera Daily.

### LAUNCH-04 — AI budget/security

- [ ] Repo: OS policy → web routes → admin config.
- [ ] En hard cap, atomisk reservation, serverkontext och entitlements.

### LAUNCH-05 — Mitt lag + onboarding

- [ ] Repo: web.
- [ ] Fas C/G launch slice med E2E.

### LAUNCH-06 — Forum + feed hooks

- [ ] Repo: web.
- [ ] Kommentarlänk, optimistic reply och summary security.

### LAUNCH-07 — H release candidate

- [ ] Repo: web.
- [ ] Links, cookie, touch, a11y, performance, persona/browser matrix.

### BETA-01 — Publisher

- [ ] Admin auth bridge → editor → retention cron → rolelink → `/skriv` parity.

### BETA-02 — Editorial commissions + evals

- [ ] OS commissions, facts pack, quality/similarity/attribution gates.

### BETA-03 — Podcast highlights

- [ ] OS contract → admin review → web team surface.

### BETA-04 — Pitchview/Grassroot

- [ ] AI modes efter budget, grounding och evals.

## 13. Stop/go-matris

### GO för Launch 1.0 när

- [ ] W0.1–W0.4 är gröna.
- [ ] LAUNCH-05–07 är gröna.
- [ ] Free/PRO/Elite testkonton passerar.
- [ ] Data coverage och Daily har mätbar status.
- [ ] Runtime och betalningsflöde är verifierade live.

### STOP när

- [ ] tredje parts body/teaser når public HTML/RSC;
- [ ] paid payload kan hämtas som free;
- [ ] Clerk visar Development mode i production;
- [ ] visat pris/trial avviker från checkout;
- [ ] statistik/AI visar påhittat nollvärde eller saknar källa;
- [ ] global LLM-hard-cap kan överskridas;
- [ ] admin Publisher saknar verklig aktörsidentitet;
- [ ] kärnroute blockerar/overflowar på 390 px.

## 14. Externa founder-actions

- [ ] Clerk production keys/domän/redirects.
- [ ] Stripe live Price IDs + webhook-test.
- [ ] DNS + Vercel production domain.
- [ ] Anthropic credits och beslutat globalt månadstak.
- [ ] Admin authmodell för namngivna redaktörer.
- [ ] Legal/privacy-beslut för source interstitial, bildrättigheter och analytics.
- [ ] Real free/PRO/Elite/editor/publisher testaccounts.

## 15. Dokumentationsdisciplin

Efter varje slutförd task:

- [ ] denna plan uppdaterad med status + commit + test;
- [ ] repoets `PROGRESS.md` och `NEXT.md` uppdaterade;
- [ ] workspace `BUILD.md` uppdaterad endast för verifierad systemstatus;
- [ ] schema-/API-kontrakt dokumenterade i ägande repo;
- [ ] blockerare lämnas öppna — aldrig markeras klara på antagande.

