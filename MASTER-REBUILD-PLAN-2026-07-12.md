# MASTER REBUILD PLAN — "Apple Approved" mobile-first (2026-07-12)

> Bygger PÅ `NATIVE-FEEL-PLAN.md` (faserna gäller fortfarande) och `WEB-IA-STRUKTUR.md`
> (4 flikar kvar). Detta dokument styr VAD vi förändrar; native-feel-planen styr HUR
> (Tactile-komponenter, critique→polish→audit-loopen).
> **Färger/brand ändras INTE** — Racing Green + tokens.json är låsta.
> Referens-screens: Refero — The Athletic iOS (app 38), Revolut iOS (app 74),
> Threads (app 42) / Posts (app 142) för forum.

## Designprinciper (Jobs-doktrinen, tillämpad)

1. **Varje skärm svarar på EN supporterfråga.** Hem = "vad har hänt?", Mitt lag =
   "hur ligger mitt lag till?", Statistik = "vad säger siffrorna?", Forum = "vad
   säger de andra?". Allt på skärmen som inte hjälper svaret tas bort.
2. **Ta bort innan du lägger till.** Varje fas börjar med en delete-lista, inte en
   add-lista. Simplicity is the ultimate sophistication.
3. **Inga inställningar där en bra default räcker.** Primärt lag väljs en gång i
   onboarding — sen ska appen aldrig fråga igen.
4. **Max 3 tap till allt.** Tab → lista → detalj. Ingen yta får ligga djupare.
5. **Direkt manipulation:** allt tappbart ger tryck-feedback (Pressable), detaljer
   öppnas som Sheet över kontexten i stället för att navigera bort.
6. **Apple HIG som lag:** 44pt touch targets, safe-area-insets, systemgester krockar
   aldrig med egna, reduced-motion respekteras, Dynamic-Type-tålig typografi.

## Vad Refero-djupdyket gav (det vi härmar)

### The Athletic iOS — feeden (screens 40907610, 73b90b92, c37e266a)
- **Redaktionell lista, inte kort-grid:** hero-bild överst, sedan rader med rubrik
  vänster + liten tumnagel höger, tunna dividers. Ingen box-i-box.
- **Meta = författare + kommentarantal.** Inget mer. Kommentarantalet är kroken in
  i forumet — det gör varje artikel till en social yta.
- **Lagsida med lag-färgad header** och sektionstabbar under — hela sidan känns
  "ditt lag" utan att någon annan yta byter tema.
- **5-fliks tabbar med Account som egen flik** — vi behåller 4 (Mer täcker Account).

### Revolut iOS — hemskärm & hierarki (screens b099d9db, 686954e5)
- **En stor siffra äger skärmen** (Total wealth) — sedan list-rader ikon + titel +
  subtitel + chevron. Vår motsvarighet: "Mitt lag"-toppen = tabellposition/form som
  StatNumber-hero, sedan ListGroup.
- **Mjuk bakgrund + vita rundade kort** ger djup utan skuggor/brus. Vi har redan
  ytskala (#151516–#222224 dark / papper light) — samma grepp, våra färger.
- **Widget-tänk:** små självständiga moduler (nästa match, form, tabell-utdrag)
  som återanvänds på Hem OCH Mitt lag — bygg en gång.

### Threads / Posts iOS — forumet (screens fadc5850, 4371a615, 2c4b0e9c)
- **Trådvy = vertikal connector-linje** från rot-inlägg till svar, avatar vänster,
  namn + tid, actions-rad under varje inlägg (svara/gilla/bokmärk).
- **Fast composer i botten** ("Lämna ett svar…") — alltid ett tap till att delta,
  aldrig en separat sida för att svara.
- **Renhet:** ingen ram runt inlägg; whitespace + linjer gör strukturen.

## FASPLAN (delta mot NATIVE-FEEL-PLAN — samma numrering)

### Fas A — Navigering & flöden (nytt, före Phase 2)
*Delete-lista:* dubbla vägar till samma innehåll (feed vs nyheter-överlapp),
navigationsval som kräver att man vet var något bor.
- TabBar (mobil, fast botten): Hem · Mitt lag · Statistik · Mer — ikoner + label,
  aktiv = accent, 49pt + safe-area. Desktop: samma nav-config som topbar (finns i `lib/nav.ts`).
- **FixturesTicker** (från web-djupdyket): tunn matchremsa under headern på alla
  fotbollsytor. En komponent, ISR 30s.
- Detalj-navigering: spelare/match öppnas som **Sheet** från listor (tillbaka =
  svep ner), full route finns kvar för deep-links/SEO.
- Sök: ett sökfält på Hem (Athletic-mönstret), söker artiklar + lag + spelare.

### Fas B — Hem/feeden (ersätter Phase 7-scope, görs tidigare)
- Athletic-mönstret: dagens hero (högsta importance_score AI-artikel med bild),
  därefter redaktionell lista (rubrik + källa/författare + kommentarantal + ev.
  tumnagel höger). Dividers, inte kort.
- Kommentarantal på varje artikelrad → länkar till artikelns forum-tråd.
- Visa-pills (Alla/AI/Källartiklar) behålls — de är redan rätt mönster.

### Fas C — Mitt lag (= Phase 2, med Revolut-hierarkin)
- Toppen: lag-header (Athletic-stil, neutral yta + lagmärke) och EN hero-stat
  (tabellposition + trend) som StatNumber.
- Under: widget-moduler som ListGroup — Nästa match · Form (5 senaste) ·
  Tabellutdrag (raderna runt laget) · Senaste lagnyheter · Trådar om laget.
- PullToRefresh. Allt tappbart → Sheet.

### Fas D — Forum (= Phase 5, med Threads/Posts-mönstren) **[störst flow-ändring]**
*Delete-lista:* separat svarssida, onödiga rubriknivåer i trådlistan.
- Trådlista: avatar + titel + första raden + meta (svar · senaste aktivitet),
  ListGroup-rader. Lagfilter som pills överst.
- Trådvy: connector-linje, inläggsrader utan ramar, actions-rad (svara/gilla)
  under varje inlägg, **fast composer i botten** med optimistic post.
- Ny tråd: Sheet, inte sida. Titel + text, klart.
- Artikel ↔ forum: varje AI-artikel har en trådyta; kommentarantalet i feeden
  är ingången (Athletic-kroken).

### Fas E — Statistik (= Phase 3)
- Tabell: zonprickar + legend (Athletic standings) + FORM-kolumn (5 senaste).
- Snabblänks-pills (finns) behålls. Filter → Sheet. Geist Mono tabular-nums överallt.

### Fas F — Match & spelare (= Phase 4, med Athletic match-hub)
- Matchsida före avspark = intelligens-hub: form båda lagen, tabellutdrag,
  relaterade artiklar/trådar. Efter: händelser + stats (aldrig placeholder-xG).

### Fas G — Onboarding & konto (= Phase 6)
- Athletic-modellen: Välkommen → Välj lag → (Notiser) — tre steg, stor typografi,
  ett beslut per skärm. Lagval = grid med klubbmärken, ett tap.
- Konto = Revolut-lista: rader med ikon + titel + chevron, grupperade.

### Fas H — Global polish & QA (= Phase 8)
- `/impeccable audit` per yta · Lighthouse mobil ≥ 95 · CLS 0 · skeletons överallt
  · empty/error-states · VoiceOver-pass · reduced-motion-pass.

## Ordning & omfång
A → B → C → D → E → F → G → H. Fas D är den enda riktiga flow-ombyggnaden;
A–C och E–G är komposition + polish av det som redan finns. Inget rivs som
fungerar; inga färg-/brandändringar; guardrails i NATIVE-FEEL-PLAN §Guardrails
och CLAUDE.md gäller oavkortat.

## Mätbart mål (besatthet ≠ tycke)
- Time-to-content < 1s på 4G (LCP), 60fps scroll.
- D1-retention och forum-svar/DAU som KPI:er för "väljer Athopia först".
- Varje fas shippas separat till prod — ingen big-bang.
