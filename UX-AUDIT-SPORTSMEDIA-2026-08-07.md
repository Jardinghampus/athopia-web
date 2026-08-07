# UX-audit athopia-web — sportmedia-perspektiv, 2026-08-07

Genomgång i Chrome som **inloggad Elite-användare** (så inget är paywall-dolt),
plus ett mätande mobilsvep (390×844) över 14 ytor. Bedömd mot hur en supporter
faktiskt använder en fotbollsprodukt: matchdag, tabell, laget, flödet.

Referensram: FotMob och The Athletic för matchdag och datadensitet, Sportbladet
som anti-referens. Måttstocken är PRODUCT.md:s eget löfte — *"matchstatistik
utöver tabellen, xG och taktikanalys"* för användare som *"kan skillnaden på
4-3-3 och 4-2-3-1"*.

**Helhetsomdöme:** hantverket i typografi, färg och komponenter är starkt — det
här ser ut som en premiumprodukt. Men produkten levererar inte sitt kärnlöfte på
sin kärnyta: matchsidan har varken laguppställning, xG eller fungerande
matchstatistik, och just nu påstår hela sajten att två matcher pågår live sedan
fem dagar. Det underminerar allt annat. Fixa P0 innan någon annan polish.

---

## P0 — Undergräver trovärdigheten just nu

### 1. Två matcher har visats som LIVE i 127 timmar

`/match` toppar med "Live nu": Brommapojkarna 1–2 Malmö FF och IFK Göteborg 2–0
Degerfors. Samma "LIVE" syns i `/nyheter`-railen, på landningssidan och på
matchsidan.

Verifierat i databasen:

| sportmonks_id | match | status | avspark | uppdaterad |
|---|---|---|---|---|
| 19635929 | Brommapojkarna–Malmö FF | `LIVE` | 2026-08-02 12:00Z | 2026-08-02 14:06Z |
| 19635933 | IFK Göteborg–Degerfors | `LIVE` | 2026-08-02 12:00Z | 2026-08-02 14:07Z |

Sync:en slutade skriva till dem två timmar efter avspark och markerade dem
aldrig som spelade. Rotorsaken ligger i `athopia-os`, men **web bör inte lita
blint på fältet**: en matchdagsprodukt som säger "pågår nu" om en match från
förra söndagen har förlorat läsaren. Lägg en visningsvakt — rendera aldrig
LIVE när avsparken är mer än ~3 timmar gammal, oavsett status.

Sidoeffekt att kontrollera: enligt `athopia-os/CLAUDE.md` pollas live-data bara
när det finns LIVE-fixtures. Två permanent låsta LIVE-rader kan alltså hålla
live-pollaren igång i onödan.

### 2. Matchsidan saknar det produkten säljer

På en pågående match visar `MATCHSTATISTIK` **"Ej synkad" tio gånger** —
bollinnehav, skott, skott på mål, hörnor, passningar, båda lagen — med tomma
staplar under. Det bryter mot repots egen regel i CLAUDE.md: *"visa aldrig
placeholder-nollor; saknad data = dölj fältet"*. Ett kort med tio "Ej synkad"
är precis det regeln finns för att förhindra.

Dessutom saknas **laguppställning** och **xG** helt på matchsidan. Det är de två
saker en taktikintresserad supporter öppnar en matchsida för, och de två saker
PRODUCT.md lovar. Sidan innehåller i stället: tom statistik, händelselista,
relaterade nyheter, podd, AI-fråga, diskussion.

Minsta rätta åtgärd nu: dölj statistikkortet när inget är synkat. Rätt åtgärd:
prioritera laguppställning + xG före fler AI-ytor.

---

## P1 — Fel som kostar pengar eller förtroende

### 3. Prenumerationssidan tror att en Elite-kund är gratisanvändare

Kontot har `publicMetadata.plan = "elite"`. `/prenumerera` markerar ändå
**GRATIS** som "Nuvarande plan" och erbjuder "Välj Elite". En betalande kund får
veta att hen inte betalar. Planläsningen på den sidan matchar inte `getUserPlan()`.

### 4. Daily talar till fel användare — och har aldrig publicerat

`/daily` säger "**Skapa konto** så får du briefen direkt i appen" och har
knappen "**Uppgradera till PRO**" — till en inloggad Elite-användare. Samtidigt:
"Första avsnittet kommer snart". Daily ligger som toppnivå i sidomenyn men har
noll innehåll. Antingen publicera, eller flytta ned den tills den lever.

### 5. Två konkurrerande ligatabeller som inte är överens

`/statistik` och `/allsvenskan/tabell` visar båda hela tabellen, i olika design:

| | `/statistik` | `/allsvenskan/tabell` |
|---|---|---|
| Spelade matcher | **S** | **M** |
| Mål | `40–17` i en kolumn | `Gjorda` / `Insläppta` |
| Form | **W D L** (engelska) | **V O F** (svenska) |
| Lagnamn | "Djurgårdens IF" | "Djurgården" |
| Placeringsändring | saknas | ▲▼ + färgprick |

Engelska formbokstäver i en svensk produkt är fel oavsett, men att samma data
har två utseenden och två språk på två URL:er är ett IA-problem: vilken är
tabellen? Välj en, låt den andra länka dit.

`/lag/[slug]` använder också W/D/L — tredje varianten av samma sak.

### 6. Forumet visar rå slug som klubbnamn

`/forum/djurgarden` har rubriken "**DJURGARDEN**" — slugen, versaliserad, utan
å. Samma sak i högerkolumnen: "Senaste nytt · DJURGARDEN". Klubbnamnet finns i
`entities.name`. Där ligger dessutom två tomma modulskal ("Senaste nytt",
"Senaste matcher") med rubrik men utan innehåll — de ska döljas när de är tomma.

### 7. Händelselistan går inte att läsa

Målen och korten växlar mellan två helt olika radformat: vissa har minuten till
höger, andra till vänster med indrag. Avsikten är hemma/borta-uppdelning, men
utan klubbmärken, kolumnrubriker eller mittlinje läser det som slumpmässigt
trasig formatering — man kan inte se vilket lag en händelse tillhör.

Ikonerna är dessutom inkonsekventa, och **mål illustreras med en jordglob (🌐)**.
Samma jordglob används som ikon för Skytteliga på `/allsvenskan`. Någonstans är
"goal" mappat till "globe".

### 8. Lagvalsmodalen blockerar matchytan — och känner inte igen klubbarna

Modalen (som tidigare kraschade och nu fungerar) lägger sig över hela `/match`
och `/match/[id]` för en gäst på mobil: man kommer inte åt en enda matchrad
förrän man valt lag eller hoppat över. Ett modalt avbrott mitt i en browsing-
uppgift.

Värre är igenkänningen. Initialerna genereras ur ordens första bokstäver:

- Degerfors IF → **DI** · Djurgårdens IF → **DI** — *identiska*
- IF Elfsborg → IE · IFK Göteborg → IG · IFK Norrköping → IN · IK Sirius → IS
- AIK → **A**

Ingen svensk supporter kallar Djurgården "DI". De riktiga förkortningarna är
DIF, BP, MFF, GAIS, IFK. Och modalen visar varken klubbmärken eller klubbfärger
— trots att appen har båda (`getTeamAccent`, crests på matchraderna). Det här
är produktens viktigaste identitetsögonblick och det är monokrom text.

Knapphierarkin är också omvänd: "Hoppa över" har vit ram och ser mer klickbar ut
än primärknappen bredvid.

---

## P2 — Kvalitet och densitet

### 9. Bottendocken dubblerar sidomenyn på desktop och lägger sig över innehåll

På 1536px finns både en vänsterrail med samma fem destinationer *och* den
flytande docken mitt på skärmen. Docken är ett mobilmönster; på desktop är den
ren dubblering som dessutom skymmer innehåll — bevisat på `/prenumerera` (döljer
PRO-kortets funktionslista) och `/allsvenskan/tabell` (en tabellrad hamnar under
den i mobil). Överväg att dölja docken från `lg` och uppåt.

### 10. `/mitt-lag` är en mobilvy uppsträckt till desktop

Innehållet ligger i en ~735px smal kolumn mitt i 1564px, med ~390px tomt på
varje sida. Varje kort bär nästan ingenting: "Tabellplacering 4 av 16" tar ett
helbrett kort, "Nästa match" en rad, "Form" fem prickar. **Formprickarna visas
dessutom två gånger** — i tabellkortet och i ett eget FORM-kort strax under.

Det här är appens hemskärm för en inloggad supporter. På desktop borde den vara
två-tre kolumner: laget till vänster, matchdag i mitten, flöde till höger.

### 11. `/lag/[slug]` leder med poddar och sex sifferkort

Översikten öppnar med sex stora kort för sex tal (Poäng, Spelade, Gjorda,
Insläppta, Målskillnad, Vinster) — samma information som en tabellrad, på 200px
höjd. Direkt därefter kommer "Podcast om Djurgårdens IF" med utgående länkar
till Spotify. Ett laghubb bör leda med nästa match, form och nyheter; poddar är
en stödmodul, och de har redan en egen flik.

### 12. `/analys` upprepar sig och är osorterad

Två analyser i rad har **identisk rubrik** med olika lag:
"Örgryte-Häcken: matchen som vände på små marginaler" och
"Mjällby-AIK: matchen som vände på små marginaler". För en produkt vars
säljargument är analyskvalitet är två identiska rubriker bredvid varandra
skadligt — mallen syns.

Listan är dessutom osorterad (11 juli, 11 juli, 4 juli, 6 juli, 5 juli, 4 juli)
och senaste innehållet är ~4 veckor gammalt trots att ytan ligger i huvudnavet.

### 13. Träffytor under 44px, systematiskt

Mätt över 14 ytor i 390px-bredd:

- **"Logga in" 53×20 px** och **"PRO" 60×32 px** i headern — på *varje* sida.
- Fixture-tickerns kort **219×30 px** — 24 st på `/nyheter`, 36 på `/allsvenskan`.
- Sektionshuvudena "Live nu / Kommande" på `/match`: **342×28 px**.
- "Läs mer", "Uppdatera", "Byt lag": 16–32 px höga.

Ingen horisontell overflow någonstans, och inga tabeller som kräver sidled-
scroll — den delen är ren.

### 14. Skräpinnehåll och stilbrott i produktion

- `/nyheter` högerkolumn: modulen "**SNACKIS JUST NU**" innehåller texten
  "**Hej!**". Testdata i produktion.
- `/allsvenskan` navigerar med emoji (🌎 Skytteliga, 📅 Spelschema, 🏁 Resultat,
  📊 xP-tabell, 🌟 Talanger) medan resten av appen använder lucide-ikoner.
  "Premiumlugn" enligt brandboken tål inte emoji i navigationen.
- `/allsvenskan/tabell` har **dubblerad breadcrumb** — "Allsvenskan › Tabell"
  två gånger under varandra.
- `/analys` har en orange eyebrow ("ATHOPIA AI") i en annars grön palett.
- `xG-tabell` (på `/statistik`) och `xP-tabell` (på `/allsvenskan`) — två namn
  som ser ut som stavfel av varandra. Om de är olika saker behöver de förklaras;
  om de är samma sak behöver de heta samma.
- `/daily` visar "Dela länken: athopia-web.vercel.app /daily" — vercel-domänen
  som delningslänk.

---

## Det som är bra och bör bevaras

- **Typografi och färg är genomarbetade.** Geist + Geist Mono med tabular-nums
  på all data ger siffrorna en trovärdighet många sportsajter saknar.
- **`/statistik` är produktens starkaste yta.** Tio flikar — Skytteliga,
  Assistligan, xG-tabell, Form, Spelarstats, H2H, Titel %, Tur/Otur, Clutch —
  och Scout Mode, Jämför spelare, Jämför lag. Det här *är* "intelligens utöver
  tabellen". Den ytan bör vara mycket mer synlig i produkten än den är.
- **Tabellen på `/allsvenskan/tabell`** med placeringsändringar och formprickar
  är läsbar och tät på rätt sätt.
- **Matchsidans "Relaterade nyheter" och matchtråd** knyter ihop innehåll och
  community — rätt instinkt för sportmedia.
- **Inga tabloida grepp.** Ingen clickbait, inga annonsväggar, inga
  neonfärger — anti-referenserna i PRODUCT.md är respekterade.
- **Ingen horisontell overflow, inga trasiga rutter, inga 500:or.**

---

---

## Åtgärdat samma dag (commit ad587de)

### Nyhetsflödet — svar på frågan "har vi byggt en riktig nyhetssida?"

Ja, men den var trasig på ett sätt som doldes av att den såg rätt ut.

**Lagfiltret matchade lagnamn i rubriken**, inte entitetstaggningen:
`title.ilike '%Djurgårdens IF%'`. Det gav **2 träffar av 35** — allt som skrev
"Djurgården", "DIF" eller bara nämnde klubben i brödtexten föll bort. Därav den
förvirrande räknaren "2 signaler" bredvid ett flöde som såg fullt ut. Filtrerar
nu på `entity_ids`. Verifierat mot databasen: 2 → 35.

**Nyhetstyp saknade UI helt** trots att datat funnits hela tiden: transfer 490,
match 432, analys 414, nyheter 214, skador 80. Nu ett eget filter, placerat
överst — fem val som används oftare än de 16 klubbarna under.

**Källistan var beroende av pagineringen** — den härleddes ur den aktuella
sidans artiklar, så sida 3 visade andra källor än sida 1. Läses nu ur hela
flödesvyn (32 källor).

Alla tre dimensionerna kombinerar korrekt, kontrollräknat mot databasen:
hela ligan 408, Djurgården 35, skador 20, AIK + transfer 43, två klubbar 118
(= unionen), två typer 158 (= 138 + 20).

Räknaren säger nu "408 artiklar" i stället för "2 signaler".

### Navigationsmodellen

Docken är mobilnavigation och döljs från `md`, där AppSidebar tar över med
exakt samma fem destinationer. På desktop var den ren dubblering som dessutom
skymde innehåll — bland annat PRO-kortets funktionslista på `/prenumerera`.

### Träffytor

Headerns "Logga in" (53×20) och "PRO" (60×32) fanns på *varje* sida;
fixture-tickerns kort var 30px och flödets pillerknappar 28px. Alla 44px nu.
`/nyheter` gick från 24 till 2 för små träffytor, `/allsvenskan` från 36 till 18.
Kvar är brödsmulor och "Läs mer"-länkar, som är inline-text.

### Övrigt

- "Viktig lagnotis" låg i `md:grid-cols-2` och renderade halvbrett med ett
  tomrum bredvid sig när det bara fanns en notis. `auto-fit` i stället.
- "SNACKIS JUST NU" påstod att något diskuterades och lyfte ett inlägg som löd
  "Hej!". Kräver nu både substans och att någon svarat; annars renderas den
  inte. **Notera:** hela forumet innehåller testinlägg från juni ("Hej!",
  "Futexhcu", "Ggdsgviifg") som ligger publika på `/forum/aik`. Att rensa
  användarinnehåll är ett founder-beslut, inte mitt.

**Verifierat:** 147 e2e-tester gröna, **463 interna länkar utan en enda trasig**.

---

### Andra omgången (commit följer)

- **Forumets rubrik visade råslugen "DJURGARDEN".** Rotorsak: en handskriven
  slug-lista (`ALLSVENSKAN_SLUGS`, kommenterad "Allsvenskan 2025") låg ovanpå
  `getEntities("team")`, som redan filtrerar på Allsvenskan. Listan hade glidit
  ifrån databasen — **8 av 16 klubbar** hade fel slug eller saknades:
  `djurgardens-if` mot `djurgarden`, `hammarby-if` mot `hammarby`, `mjallby-aif`
  mot `mjallby`, och varken Brommapojkarna eller Sirius fanns med. Namnuppslaget
  misslyckades därför och föll tillbaka på slugen. Listan är borttagen.
- **Tomma modulskal i forumets högerkolumn** ("Senaste nytt", "Senaste matcher")
  renderades alltid, även med noll innehåll. Döljs nu när de är tomma.
- **Formbokstäverna** fanns i fyra kopior, två av dem oöversatta (W/D/L i en
  svensk produkt). En källa: `lib/form-letter.ts`, V/O/F överallt, med utskrivet
  resultat som `aria-label` så färgen inte bär ensam.
- **Lagvalet visar nu klubbmärken.** Initialerna genererades ur ordens första
  bokstäver och gav "DI" för *både* Degerfors IF och Djurgårdens IF, "A" för
  AIK. Nu crest från `entities.metadata.logo_url` (14 av 16 klubbar), med
  kanoniska förkortningar som reserv (`lib/team-abbr.ts`).
- **Modalen avbryter inte längre bläddring.** `/statistik`, `/spelare` och
  `/match` togs bort ur `TEAM_REQUIRED_PREFIXES` — ligaövergripande ytor
  fungerar utan lagval, och på mobil gick det inte att nå ens
  bottennavigationen. `/mitt-lag` har en egen gästvy och behöver den inte
  heller. Kvar: `/feed` och `/profil`.
- **Dubblerad brödsmula** på `/allsvenskan/tabell` och `/allsvenskan/resultat` —
  en handrullad `<nav>` utöver `AppBreadcrumbs`. Borttagen.
- **Emoji i navigationen** på `/allsvenskan` bytt mot lucide-ikoner (och
  träffytan höjd till 44px). Jordgloben som stod för Skytteliga är borta.
- **Kolumnrubriken** för spelade matcher är `M` på båda tabellerna (var `S` på
  `/statistik`).
- **`/analys` sorterades på publiceringsdatum men visade matchdatum**, så
  ordningen såg slumpmässig ut (11, 11, 4, 6, 5, 4 juli). Sorteras nu på det
  som läsaren ser.

**Kvar, medvetet inte åtgärdat:** de två identiska analysrubrikerna
("matchen som vände på små marginaler") kommer ur generatorn i `athopia-os`,
inte ur web. Densiteten på `/mitt-lag` och `/lag/[slug]` är en layoutomgörning,
inte polish — den ligger kvar på listan.

## Ordning jag skulle ta det i

1. ~~LIVE-vakten~~ och ~~tom matchstatistik~~ — **avvaktar Sportmonks-aktiveringen**
   (founder-beslut 2026-08-07). Båda är datadrivna och löser sig när kontot är
   igång. Överväg ändå visningsvakten som skydd mot framtida syncavbrott.
2. Planvisningen på `/prenumerera` och `/daily` (P1-3, P1-4) — intäktsytor.
3. Slug-namnet i forumet + tomma modulskal (P1-6).
4. Enhetliga formbokstäver V/O/F överallt, en tabell som kanon (P1-5).
5. Klubbmärken och riktiga förkortningar i lagvalet (P1-8).
6. Händelselistans hemma/borta-struktur och målikonen (P1-7).
7. Densitet och desktop-layout på /mitt-lag och /lag (P2-10, P2-11).

Laguppställning och xG på matchsidan är inte polish utan produktarbete — men
det är det som avgör om produkten håller vad PRODUCT.md lovar.
