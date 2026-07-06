# Podcast — rättigheter & produktpolicy

Uppdaterad: 2026-07-06

## Princip

Poddar är **referens och kontext** i Athopia — inte innehåll vi återpublicerar. Samma logik som RSS-signaler i `AGENTS.md`.

## Tillåtet i publik produkt (web/iOS)

| ✅ | Exempel |
|----|---------|
| Episodtitel + show-namn | "Fotbollspodden — Avsnitt 412" |
| Spotify Embed (official iframe) | `open.spotify.com/embed/episode/...` |
| Outbound-länk till avsnitt | Spotify, Apple Podcasts, poddarens webb |
| Athopia topic-taggar | "Transfer · Hammarby" (från os metadata, ej citat) |
| PRO: kuraterad lista | "Relevant för ditt lag denna vecka" |

## Förbjudet i publik produkt

| ❌ | Varför |
|----|--------|
| `<audio src={enclosure}>` | Hotlink/republishing av ljudfil; bryter oftast podd-TOS |
| Transkript (även trunkerat PRO) | Upphovsrätt + AGENTS.md: "Podcasttranskript återgivet i detalj" |
| `podcast_chunks.text` i API/UI | Samma — chunks är **intern RAG** i athopia-os |
| RSS show notes ordagrant | Parafras/citat-risk |

## Intern användning (athopia-os)

- Deepgram-transkription → `podcast_chunks` + embeddings
- Entity extraction → `entity_ids`, `mentioned_teams`
- **Transkript lämnar aldrig Supabase till anon/authenticated clients**

## Teknisk implementation

| Lager | Ansvar |
|-------|--------|
| `podcast-ingest` | `metadata.listen_url`, Spotify IDs från RSS `<link>` |
| `podcast-processor` | Topics/teams; behåller listen metadata |
| `getPodcastSignalsForEntities` | Metadata only — ingen chunk-text |
| `PodcastSignalsPanel` | Spotify embed → outbound link → aldrig enclosure |
| `/api/podcast-search` | Returnerar episoder, **inte** chunk-text |

## Spotify vs RSS enclosure

**Spotify embed** = licensierad spelare från Spotify (rekommenderat).

**RSS enclosure URL** = CDN-länk för intern transkription i os. Exponeras inte i UI.

**Acast** (majoriteten av våra feeds): `listen_url` härleds till `shows.acast.com/{show}/episodes/{id}` — outbound-länk till poddarens sida, inte hotlink av MP3.

Om show saknar Spotify: outbound `listen_url` från RSS `<link>` eller Acast.

## Checklista vid nya podd-features

1. Exponeras text från transkript? → Stopp.
2. Spelas ljud utan Spotify/official embed? → Stopp.
3. Finns attribution (show + länk)? → Krävs.
4. iOS-paritet? → Uppdatera `ATHOPIA_IOS_STATS_HANDOFF.md` om kontrakt ändras.
