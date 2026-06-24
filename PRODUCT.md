# PRODUCT.md — Athopia

> Läses automatiskt av alla `/impeccable`-kommandon. Strategi: vem, vad, varför.
> Uppdaterad 2026-06-24. Justera fritt.

## Register

hybrid

- **Product surface (huvuddelen):** app-chromet — `/mitt-lag`, `/statistik/*`,
  `/spelare`, `/match`, `/forum`, `/onboarding`, `/konto`, `/nyheter`, `/feed`.
  Designen ska hjälpa en supporter att *slutföra en uppgift*: förstå en match,
  jämföra spelare, följa sitt lag. Täthet, läsbarhet, snabbhet.
- **Brand surface:** landningssidan (`/`). Intrycket *är* produkten där —
  editorial display-typografi (Instrument Serif), rörelse, känsla.

Designnorm för product surface: **iOS-grade fysik och hierarki på en web-native
yta.** Vi lånar Apples *kvalitetsribba* (spring-rörelse, material/blur, stora
titlar, grupplistor, tap-feedback) men bygger för webben — mus, tangentbord,
hover, breda skärmar är förstklassiga. **Det här är inte en iOS-klon.** En
native-app kommer separat.

## Users

Allsvenskan-supportrar, 18–45, som följer sitt lag i mobilen flera gånger om
dagen och vill *förstå* matcherna — taktik, xG, form — på en högre nivå än
tabloid-rubriker. De kan skillnaden på 4-3-3 och 4-2-3-1. De vill bli tagna på
allvar, inte skrivna ned till. Många är bortafans som följer på distans.

**Kontext vid användning:** ofta mobil, ofta stående, ofta direkt efter match
(hög puls, vill snabbt förstå vad som hände). Ibland desktop, lugnare läge,
djupare analys.

## Product Purpose

Personaliserad Allsvenskan-intelligens: nyheter rankade efter relevans för ditt
lag, matchstatistik utöver tabellen, xG och taktikanalys — utan tabloidbrus.
Freemium med PRO-gate på premiumfunktioner.

Framgång = supportern lär sig något om sitt lag som hen inte visste förut.

## Brand Personality

**Insatt. Respektfull. Vass.**

Inte "modern och clean". Vi skriver och designar som någon som kan ligan utantill
och respekterar att läsaren också gör det — men fattar sig kort. Ingen hype,
inget klikhets. Premiumlugn.

## Visual References

- **Revolut** — täthet utan stress, mjuk fysik, animerade siffror, premiumlugn.
- **Apple iOS (Inställningar/Fitness/Stocks)** — grupplistor, stora titlar som
  kollapsar, material, segmented controls, spring-sheets.
- **Linear** — disciplin i spacing/typografi, en accent, inget brus.
- **The Athletic** — *innehållsdjup*-referens, inte visuell: lång text tagen på allvar.

## Anti-references

- **Tabloid-sportsajter** (Sportbladet/Expressen Sport) — rubrikbrus,
  annonsväggar, neon, clickbait-layout.
- **Generiska SaaS-dashboards** (Bootstrap-admin) — gråa kort, ingen själ,
  datatabeller utan hierarki.
- **Betting-/odds-sajter** — neongrönt på svart, blinkande CTA, casino-energi.
  (OBS: vår accent är pitch-grön men *lugn*, inte betting-neon.)

## Design Principles

1. **Data förklarar, designen berättar.** Visa inte bara siffran — visa vad den
   *betyder* (percentil, trend, jämförelse). Kontexten är produkten.
2. **Täthet med luft.** App-chrome ska vara tätt och informationsrikt, men aldrig
   stressigt. Generös internt spacing inom en komponent, tight mellanrum mellan
   komponenter.
3. **Физик framför animation.** Rörelse ska kännas som vikt och massa, inte
   dekor. Spring-kurvor, tap-feedback, drag-to-dismiss — allt med en känsla av
   fysisk substans.
4. **Gatekeeper av premium.** Paywall-gates måste *se värda ut*. En suddig
   gratis-preview med skarp PRO-CTA är bättre än en röd varningsruta.
5. **Dual-mode utan kompromiss.** Ljust och mörkt läge är båda förstklassiga —
   inga "glömt" i dark mode, inga kontrastproblem i light mode.

## Accessibility & Inclusion

- WCAG AA minimum (4.5:1 text, 3:1 stora element/kontroller).
- `prefers-reduced-motion` respekteras överallt — skeleton istället för animation.
- Semantisk HTML på alla listkomponenter och knappar.
- Touch-targets ≥ 44×44px på alla interaktiva element.

## Affärskontext

Freemium: Gratis / PRO 89 kr/mån (801 kr/år) / Elite 169 kr/mån (1 521 kr/år).
Konvertering sker i product surface (paywall-gates), så de skärmarna måste kännas
värda att betala för. Break-even ~10 PRO-användare (~850 kr/mån serverkostnad).
