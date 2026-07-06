const SPOTIFY_EPISODE_RE = /open\.spotify\.com\/episode\/([a-zA-Z0-9]+)/;
const SPOTIFY_SHOW_RE = /open\.spotify\.com\/show\/([a-zA-Z0-9]+)/;
const ACAST_AUDIO_RE = /acast\.com\/p\/acast\/s\/([^/]+)\/e\/([^/?#]+)/;

export function parseAcastListenUrl(audioUrl: string | null | undefined): string | null {
  if (!audioUrl) return null;
  const m = audioUrl.match(ACAST_AUDIO_RE);
  if (!m) return null;
  return `https://shows.acast.com/${m[1]}/episodes/${m[2]}`;
}

export function parseSpotifyEpisodeId(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.match(SPOTIFY_EPISODE_RE)?.[1] ?? null;
}

export function parseSpotifyShowId(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.match(SPOTIFY_SHOW_RE)?.[1] ?? null;
}

export function spotifyEpisodeEmbedUrl(episodeId: string): string {
  return `https://open.spotify.com/embed/episode/${episodeId}?utm_source=generator`;
}

export function spotifyShowEmbedUrl(showId: string): string {
  return `https://open.spotify.com/embed/show/${showId}?utm_source=generator`;
}

/** Known Allsvenskan-related show embeds (fallback when episode lacks Spotify ID). */
export const TEAM_SPOTIFY_SHOW_IDS: Record<string, string> = {
  'djurgardens-if': '2HgojaL9cFu9YCp1wDGO43',
  aik: '5vqApRVsoU1Vd6Xv0N9hJq',
  'hammarby-if': '72s9wzktHshAjENe3kWAwE',
  'malmoe-ff': '7aZRCjNwwCsbUjBLIlrhK7',
};

export function teamSpotifyShowId(teamSlug: string | null | undefined): string | null {
  if (!teamSlug) return null;
  return TEAM_SPOTIFY_SHOW_IDS[teamSlug] ?? null;
}

export type PodcastListenMeta = {
  listenUrl: string | null;
  spotifyEpisodeId: string | null;
  spotifyShowId: string | null;
};

export function listenMetaFromRow(
  metadata: unknown,
  listenUrlFallback?: string | null,
  audioUrlFallback?: string | null,
): PodcastListenMeta {
  const meta = (metadata ?? {}) as Record<string, unknown>;
  const listenUrl =
    (typeof meta.listen_url === 'string' ? meta.listen_url : null) ??
    listenUrlFallback ??
    parseAcastListenUrl(audioUrlFallback) ??
    null;
  const spotifyEpisodeId =
    (typeof meta.spotify_episode_id === 'string' ? meta.spotify_episode_id : null) ??
    parseSpotifyEpisodeId(listenUrl);
  const spotifyShowId =
    (typeof meta.spotify_show_id === 'string' ? meta.spotify_show_id : null) ??
    parseSpotifyShowId(listenUrl);
  return { listenUrl, spotifyEpisodeId, spotifyShowId };
}
