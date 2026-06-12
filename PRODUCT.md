# PRODUCT.md — Athopia

> Läses automatiskt av alla `/impeccable`-kommandon. Strategi: vem, vad, varför.
> Skapad från projektkontext (motsvarar `/impeccable init`). Justera fritt.

## Register

**Hybrid — primärt product surface, med en brand surface.**

- **Product surface (huvuddelen):** app-chromet — `/mitt-lag`, `/statistik/*`,
  `/spelare`, `/match`, `/forum`, `/onboarding`, `/konto`, `/nyheter`, `/feed`.
  Designen ska hjälpa en supporter att *slutföra en uppgift*: förstå en match,
  jämföra spelare, följa sitt lag. Täthet, läsbarhet, snabbhet.
- **Brand surface:** landningssidan (`/`). Intrycket *är* produkten där —
  djärv display-typografi (Bebas Neue), rörelse, känsla.

Designnorm för product surface: **iOS-grade fysik och hierarki på en web-native
yta.** Vi lånar Apples *kvalitetsribba* (spring-rörelse, material/blur, stora
titlar, grupplistor, tap-feedback) men bygger för webben — mus, tangentbord,
hover, breda skärmar är förstklassiga. **Det här är inte en iOS-klon.** En
native-app kommer separat senare.

## Vem är detta för?

Allsvenskan-supportrar, 18–45, som följer sitt lag i mobilen flera gånger om
dagen och vill *förstå* matcherna — taktik, xG, form — på en högre nivå än
tabloid-rubriker. De kan skillnaden på 4-3-3 och 4-2-3-1. De vill bli tagna på
allvar, inte bli nedskrivna till. Många är bortafans som följer på distans.

## Brand voice (tre ord)

**Insatt. Respektfull. Vass.**

(Inte "modern och clean". Vi skriver som någon som kan ligan utantill och
respekterar att läsaren också gör det — men fattar sig kort.)

## Visuella referenser (namngivna)

- **Revolut** — täthet utan stress, mjuk fysik, animerade siffror, premiumlugn.
- **Apple iOS (Inställningar/Fitness/Stocks)** — grupplistor, stora titlar som
  kollapsar, material, segmented controls, spring-sheets.
- **Linear** — disciplin i spacing/typografi, mörkt-först, en accent.
- **The Athletic** (endast som *innehållsdjup*-referens, ej visuell brand).

## Anti-referenser (namngivna — ska INTE se ut så här)

- **Tabloid-sportsajter** (Sportbladet/Expressen Sport) — rubrikbrus,
  annonsväggar, neon, clickbait-layout.
- **Generiska SaaS-dashboards** (Bootstrap-admin) — gråa kort, ingen själ.
- **Betting-/odds-sajter** — neongrönt på svart, blinkande CTA, casino-energi.
  (OBS: vår accent är pitch-grön men *lugn*, inte betting-neon.)

## Affärskontext

Freemium: Gratis / PRO 89 kr / Elite 169 kr (25 % årsrabatt). Konvertering sker
i product surface (paywall-gates), så de skärmarna måste kännas värda att betala
för. Break-even ~10 PRO-användare.
