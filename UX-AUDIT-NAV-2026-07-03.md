# UX-audit + nav-omdesign — athopia-web (2026-07-03)

> Audit av samtliga routes i `app/` med förslag på ny IA enligt prioritet:
> **1. Mitt lag (primär) · 2. Allsvenskan (sekundär) · 3. Andra lag (tertiär, 1–2 klick).**
> Inga kodändringar gjorda — detta är beslutsunderlag. Ersätter nav-delen av WEB-IA-STRUKTUR.md vid godkännande.

---

## 1. Nuläge — alla routes och deras syfte

### Publikt / landing
| Route | Syfte idag | Bedömning |
|---|---|---|
| `/` | SEO-landing (ISR 120s). Inloggad → redirect `/mitt-lag` ✅ | Behåll. Redirecten gör redan Mitt lag till default landing — kravet uppfyllt här. |
| `/sign-in`, `/sign-up` | Clerk | Behåll. |
| `/(onboarding)/onboarding` | 4-stegs wizard | Behåll; steg 1 (välj lag) sätter `favoriteTeam` — kritisk för hela IA:n. |
| `/om-oss`, `/integritetspolicy`, `/priser`, `/prenumerera` | Statiskt/betalning | Behåll under Mer. |

### Mitt lag-klustret (PRIMÄR)
| Route | Syfte idag | Bedömning |
|---|---|---|
| `/mitt-lag` | Client-dashboard (`MittLagDashboard`, 688 rader): lagväljare + 5 flikar (översikt/statistik/trupp/matcher/forum) i `?tab=` | **Detta ÄR redan hubben.** Problem: (a) den är en client-first monolit medan `/lag/[slug]` är en parallell server-hubb med nästan samma innehåll — två sanningar; (b) "Demo IF" injiceras i laglistan; (c) lagbyte finns men är gömt i en dropdown, inte en snabb switcher. |
| `/lag/[slug]` + `/nyheter` `/statistik` `/sammanfattning` `/podcasts` | Server-renderad lagsida (440 rader) med undersidor | **Duplicerar Mitt lag-fliken.** Ska bli den ENDA lag-hubben (se förslag). |
| `/dashboard` | `redirect("/mitt-lag")` | Behåll som alias. |
| `/feed`, `/feed/[teamSlug]` | Personaliserad feed (user_feed_config, signal_score) | Överlappar Mitt lag→Översikt-flikens nyheter. Kandidat för sammanslagning (se §5). |

### Allsvenskan-klustret (SEKUNDÄR)
| Route | Syfte idag | Bedömning |
|---|---|---|
| `/hem` | Blandad översikt: topp-narrativ, 6 nyheter, mini-tabell, 5 matcher | Är i praktiken "Allsvenskan-vyn" men heter "Hem" — otydligt när Mitt lag är default landing. Döps om/ersätts. |
| `/allsvenskan` | SEO-nav-sida | Behåll som SEO-landning, länka in i appen. |
| `/allsvenskan/tabell` `/resultat` `/spelschema` `/skytteliga` | SEO-sidor (ISR 60/300) | **Behåll exakt som de är** — de är SEO-tillgångar med metadata/JSON-LD. Appens Allsvenskan-flik återanvänder deras datalager, inte tvärtom. |
| `/nyheter`, `/nyheter/transferer` | Fullt nyhetsflöde + transfervy | Flyttas in under Allsvenskan-fliken (filterchips finns redan). |
| `/match/[id]`, `/match` | Matchcenter | Behåll; nås från både Mitt lag och Allsvenskan. |
| `/artikel/[slug]`, `/narrativ/[id]` | Artikelvyer | Behåll (delningsbara destinationer). |

### Statistik-klustret
| Route | Syfte idag | Bedömning |
|---|---|---|
| `/statistik` (+ `/spelare`, `/jamfor`, `/scout`, `/[teamSlug]`) | Statistikverktyg | Behåll men degradera från egen huvudflik → sektion under Allsvenskan + flik i lag-hubben (lagspecifik statistik finns redan där). Scout förblir Elite-gated. |
| `/spelare/[slug]` | Spelarsida | Behåll (destination, inte nav-punkt). |

### Övrigt (→ Mer)
| Route | Syfte idag |
|---|---|
| `/forum`, `/forum/[teamSlug]`, `/forum/[teamSlug]/[postId]` | Forum (även flik i Mitt lag) |
| `/ai`, `/elite/chat` | AI-chatt (Elite) |
| `/podcast`, `/podcast/[id]` | Poddar |
| `/analys`, `/sammanfattning` | AI-analys/sammanfattningsvyer — överlappar narrativ; kandidater för konsolidering senare |
| `/konto`, `/profil`, `/profil/gamification` | Konto/profil |
| `/mer` | Redan en bra ListRow-meny ✅ |
| `/sentry-example-page` | Dev-artefakt — **ta bort ur prod-bygget** |

---

## 2. Föreslagen nav-struktur

Mobile-first: **bottom nav 4 flikar** (GlassNav) + desktop sidebar (AppSidebar). Båda läser redan `lib/nav.ts` — hela omläggningen är EN array-ändring plus routing.

```
┌─────────────────────────────────────────────┐
│  MITT LAG   │ ALLSVENSKAN │  MATCHER │ MER  │   ← bottom nav / sidebar
└─────────────────────────────────────────────┘

MITT LAG  (default landing, ersätter dagens /hem-position)
  └─ /mitt-lag → lag-hubb för favoriteTeam
       flikar: Översikt · Matcher · Trupp · Statistik · Forum   (finns redan)
       header: [Laglogga + namn ▾]  ← TeamSwitcher (nytt, se §3)
         └─ öppnar bottom-sheet: följda lag först (user_follows),
            sen alla 16 — 1 klick att kika, "⭐ Gör till mitt lag" för att byta default

ALLSVENSKAN
  └─ /allsvenskan (app-vy, i praktiken dagens /hem):
       Tabell (full) · Nyhetsflöde (chips: Allt|Transfers|Skador|Matcher)
       · Skytteliga · länk till Statistik-verktygen
       (SEO-sidorna /allsvenskan/* ligger kvar orörda som djuplänkar)

MATCHER
  └─ /match: live nu → annars kommande omgång → senaste resultat
     (under uppehållet: "Allsvenskan återupptas [datum]" + senaste omgången)

MER
  └─ /mer (befintlig ListRow-meny): Forum · AI-chatt · Poddar · Statistik-verktyg
     · Konto · Prenumeration · Om
```

**Varför "Matcher" som egen flik i stället för "Statistik":** matcher är det högfrekventa användarbehovet på matchdagar (live-score-poll finns redan i `/api/scores`); statistik är ett verktyg man söker upp, inte en daglig vana. Statistik nås via Allsvenskan-fliken, lag-hubbens flik och Mer.

**Utloggad användare:** ser `/` (SEO-landing). Bottom nav visar samma flikar men Mitt lag → lagväljar-empty-state ("Välj ditt lag") i stället för hub — konverteringsyta till sign-up.

---

## 3. Komponenter — återanvänds vs byggs

### Återanvänds rakt av (finns, funkar)
| Komponent | Var | Roll i nya strukturen |
|---|---|---|
| `lib/nav.ts` + `AppSidebar` + `GlassNav` | layout | Enda ändringen är NAV_ITEMS-arrayen. |
| `MittLagDashboard` (5 flikar, ?tab=-routing) | mitt-lag | Basen för lag-hubben. |
| `lib/team-hub/queries.ts` | team-hub | Datalagret för hubben — redan slug-baserat, funkar för ALLA lag, inte bara favoriten. |
| `getPrimaryTeam()` (Clerk favoriteTeam → entity) | lib/team | Avgör default-lag serverside. |
| `getFollowedTeams()/followTeam()/unfollowTeam()` | lib/dashboard/queries.ts | Driver switcherns "snabbval"-sektion. |
| `TeamSelectionModal` + `useFavoriteTeam` | components/ui, hooks | Onboarding + byt-favorit-flödet; återanvänds inuti TeamSwitcher. |
| `StandingsTable`-logik, `ScoreWidget`, `ArticleCard`, filterchips i `/nyheter` | diverse | Allsvenskan-fliken monteras av dessa. |
| `/api/team/list` | api | Switcherns laglista (mock-laget är redan borttaget i commit `e71964d`). |

### Byggs nytt (litet)
| Komponent | Vad | Est. |
|---|---|---|
| **`TeamSwitcher`** | Client-komponent i lag-hubbens header: knapp (logga+namn+▾) → bottom-sheet/dropdown. Sektion 1: följda lag (`user_follows`), sektion 2: alla 16. Klick = byt visat lag (URL-param eller state, INTE ny deep-nav). Stjärn-ikon = `setFavoriteTeam` (byter default). | ~1 komponent, återanvänder team/list + useFavoriteTeam |
| **`AllsvenskanTab`**-sida | Ny `/allsvenskan`-appvy (eller omdöpt `/hem`) som komponerar befintlig tabell + nyhetsflöde + skytteliga-utdrag. Server component, ISR. | mest omflytt av befintliga sektioner från /hem |
| **`MatchdayView`** | `/match`-index med live→kommande→senaste-logik + uppehålls-empty-state. `/api/scores`-fallbacken (fixad i `e71964d`) ger redan rätt data. | liten |

### Konsolideras (ta bort dubbelarbete)
- **`/lag/[slug]` och `/mitt-lag` blir EN implementation.** Förslag: gör `/lag/[slug]` till den kanoniska server-renderade hubben (SEO + delningsbar), och låt `/mitt-lag` bli en tunn server-redirect → `/lag/{favoriteTeam}` (behåller `?tab=`). `MittLagDashboard`s flikar flyttas in i `/lag/[slug]`-layouten. Ingen användare förlorar något; en kodbas att underhålla i stället för två.
- `/feed` överlappar hubbens nyheter — rör inte nu, men markera som kandidat att slås ihop med Mitt lag→Översikt i nästa steg (feed-API:t med signal_score kan mata hubbens nyhetssektion direkt).

---

## 4. Var user_follows avgör vad som visas

| Beslut | Källa | Var |
|---|---|---|
| **Default-lag** (vilken hub som visas efter login) | `Clerk unsafeMetadata.favoriteTeam` via `getPrimaryTeam()` — INTE user_follows | `/` redirect, `/mitt-lag` |
| **Switcherns snabbvalslista** ("dina lag" överst) | `user_follows` via `getFollowedTeams(userId)` | TeamSwitcher sektion 1 |
| **Följ/avfölj-knapp** på annat lags hub | `followTeam()/unfollowTeam()` (upsert/delete, `sport='football'`) | lag-hubbens header |
| **Feed-personalisering** | `user_feed_config.followed_team_ids` (separat tabell!) | `/api/feed` |

⚠️ **Dokumenterad skevhet att vara medveten om (åtgärdas ej nu):** tre lagringsplatser för "mina lag" — Clerk favoriteTeam (1 st, default), `user_follows` (N st, snabbval), `user_feed_config.followed_team_ids` (N st, feed). Nya strukturen använder de två första enligt tabellen ovan. En framtida städning bör låta `user_follows` vara enda N-listan och feed-config läsa därifrån.

---

## 5. Kodregler som gäller vid bygget

- `proxy.ts` (inte middleware.ts) för ev. routing-skydd av `/mitt-lag`-redirecten.
- All Supabase-access via `createServerClient()` + `isSupabaseConfigured()`-guard, lazy init — mönstret i `lib/dashboard/queries.ts` är facit.
- `.eq('sport', 'football')` på alla queries (user_follows-queryn gör redan detta ✅).
- `getPrimaryTeam()`/`getUserPlan()` körs ALLTID server-side.
- ISR: `revalidate: 60` på lagdata/matcher, 30 på nyhetsström; user-specifikt (follows, favoriteTeam) förblir per-request (`force-dynamic` bara där det behövs — hubben kan vara ISR-cachad per slug med user-delarna som separata dynamiska öar).
- SEO-sidorna under `/allsvenskan/*` rörs inte.

---

## 6. Byggordning — STATUS 2026-07-03 (commit på main, ej pushad)

1. ✅ **`lib/nav.ts`**: nya NAV_ITEMS (Mitt lag / Allsvenskan / Matcher / Mer).
2. ✅ **`TeamSwitcher`** byggd (`components/team-hub/TeamSwitcher.tsx`) och inkopplad i Mitt lag-headern (ersatte native `<select>`). Följda lag från `user_follows` (serverhämtade i `mitt-lag/page.tsx` via `getFollowedTeams`), stjärna = `setFavoriteTeam`. OBS: inkopplad i `/mitt-lag`, inte `/lag/[slug]` — se punkt 3.
3. ⏸ **Konsolidera hubben** — MEDVETET UPPSKJUTEN. 1100-raders merge som inte gick att verifiera medan DB-incidenten pågick; alla tre UX-kraven uppfylls utan den (hubben = /mitt-lag med switcher). Gör som egen uppgift när DB är frisk: flytta MittLagDashboard-flikarna till `/lag/[slug]`, gör `/mitt-lag` till redirect, flytta TeamSwitcher-inkopplingen dit.
4. ✅ **`/allsvenskan` app-vy** (fd /hem-innehållet + SEO-metadata/JSON-LD, ISR 60, riktiga slug-länkar); `/hem` → redirect.
5. ✅ **`/match`-index** med live → kommande → senaste + uppehålls-empty-state.
6. ✅ Städning: `/sentry-example-page` borttagen, Statistik-länk i `/mer`.

Build grön (`next build` efter `.next`-rensning). Ej pushad — väntar på frisk DB för verifiering, samma gate som övriga commits (se HANDOVER-2026-07-03.md).
