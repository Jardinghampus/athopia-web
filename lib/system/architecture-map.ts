/**
 * Data för /system — interaktiv arkitekturkarta.
 * Synkad med docs/ i workspace-roten (Athopia Build/docs).
 */

export type SystemLayer = "ingest" | "os" | "db" | "web";

export interface SystemNode {
  id: string;
  label: string;
  short: string;
  layer: SystemLayer;
  /** 0–1 position i canvas */
  x: number;
  y: number;
  repo: "athopia-os" | "supabase" | "athopia-web" | "athopia-admin";
  docSlug?: string;
  files: string[];
  aiEntry?: string;
  description: string;
}

export interface SystemEdge {
  from: string;
  to: string;
  label?: string;
  /** particle color */
  hue?: number;
}

export const LAYER_LABELS: Record<SystemLayer, string> = {
  ingest: "Ingest",
  os: "athopia-os",
  db: "Supabase",
  web: "athopia-web",
};

export const LAYER_COLORS: Record<SystemLayer, string> = {
  ingest: "#378ADD",
  os: "#BA7517",
  db: "#1D9E75",
  web: "#7F77DD",
};

export const SYSTEM_NODES: SystemNode[] = [
  {
    id: "rss",
    label: "RSS / Nyheter",
    short: "RSS",
    layer: "ingest",
    x: 0.08,
    y: 0.22,
    repo: "athopia-os",
    docSlug: "01-news-feed",
    files: ["packages/rss/src/worker.ts", "pollFeedsDirectly"],
    description: "Hämtar Allsvenskan-headlines var 30:e min. Ingen LLM — bara signal till content_queue.",
  },
  {
    id: "sportmonks",
    label: "Sportmonks",
    short: "SM",
    layer: "ingest",
    x: 0.08,
    y: 0.5,
    repo: "athopia-os",
    docSlug: "04-sportmonks-stats",
    files: ["packages/sportmonks/", "nightlySync", "liveSync"],
    description: "Matcher, tabell, spelarstats, xG. Raw-first i fixtures.raw.",
  },
  {
    id: "podcast-ingest",
    label: "Podcast RSS",
    short: "POD",
    layer: "ingest",
    x: 0.08,
    y: 0.78,
    repo: "athopia-os",
    docSlug: "07-podcast",
    files: ["packages/rss/src/podcast-ingest.ts"],
    description: "Metadata in — titel, Acast/Spotify-länkar. Transkript stannar internt.",
  },
  {
    id: "echo",
    label: "Echo",
    short: "Echo",
    layer: "os",
    x: 0.28,
    y: 0.18,
    repo: "athopia-os",
    docSlug: "02-echo-classification",
    files: ["packages/ai-core/src/agents/echo.ts"],
    aiEntry: "Klassificering, signal_score, articles upsert — börja här vid nyhetsfel.",
    description: "AI klassificerar RSS-signaler. Skriver articles + embeddings.",
  },
  {
    id: "cluster",
    label: "Kluster",
    short: "Klust",
    layer: "os",
    x: 0.28,
    y: 0.38,
    repo: "athopia-os",
    docSlug: "03-story-clusters",
    files: ["packages/ai-core/src/lib/clustering.ts"],
    aiEntry: "assignStoryCluster + source_count — feed-dedup.",
    description: "Grupperar samma story. Sätter X källor.",
  },
  {
    id: "milo",
    label: "Milo / Stats",
    short: "Milo",
    layer: "os",
    x: 0.28,
    y: 0.58,
    repo: "athopia-os",
    docSlug: "04-sportmonks-stats",
    files: ["normalize worker", "runMiloAnalysis"],
    description: "Normaliserar matchdata. Nattlig stats-cron.",
  },
  {
    id: "pulse",
    label: "Team Pulse",
    short: "Pulse",
    layer: "os",
    x: 0.28,
    y: 0.78,
    repo: "athopia-os",
    docSlug: "05-team-daily-pulse",
    files: ["packages/ai-core/src/agents/team-daily-pulse.ts"],
    aiEntry: "Dagens brief — Sonnet, withBudget.",
    description: "AI-brief per lag. Skriver team_daily_pulses.",
  },
  {
    id: "matchday",
    label: "Matchdag",
    short: "MD",
    layer: "os",
    x: 0.28,
    y: 0.92,
    repo: "athopia-os",
    docSlug: "06-match-context",
    files: ["apps/agents/src/triggers/matchday-loop.ts"],
    description: "Kickoff/FT push, forum seed, ratings nudge var 5 min.",
  },
  {
    id: "supabase",
    label: "Supabase",
    short: "DB",
    layer: "db",
    x: 0.52,
    y: 0.5,
    repo: "supabase",
    docSlug: undefined,
    files: ["articles", "fixtures", "news_feed_clustered", "team_daily_pulses"],
    description: "Sanningslager. os skriver, web läser. Sport-separation: football.",
  },
  {
    id: "feed",
    label: "Mitt feed",
    short: "Feed",
    layer: "web",
    x: 0.78,
    y: 0.2,
    repo: "athopia-web",
    docSlug: "01-news-feed",
    files: ["app/api/feed/route.ts", "FeedClient.tsx"],
    description: "Kluster-dedupad feed. PRO: feed_score ranking.",
  },
  {
    id: "brief",
    label: "Lag-hub brief",
    short: "Brief",
    layer: "web",
    x: 0.78,
    y: 0.42,
    repo: "athopia-web",
    docSlug: "05-team-daily-pulse",
    files: ["TeamHubBriefRitual.tsx", "lib/team-hub/queries.ts"],
    description: "Visar pulse från DB. PRO: full text + TTS.",
  },
  {
    id: "match-ui",
    label: "Matchsida",
    short: "Match",
    layer: "web",
    x: 0.78,
    y: 0.62,
    repo: "athopia-web",
    docSlug: "06-match-context",
    files: ["app/(app)/match/[id]/page.tsx", "MatchAskPanel.tsx"],
    aiEntry: "Match-chat: app/api/match/chat (PRO+).",
    description: "Live/FT, xG, betyg, forum, match-AI.",
  },
  {
    id: "chat",
    label: "AI-chat",
    short: "Chat",
    layer: "web",
    x: 0.78,
    y: 0.82,
    repo: "athopia-web",
    docSlug: "08-ai-chat",
    files: ["app/api/elite/chat", "lib/ai/tools.ts", "lib/ai/chat-limits.ts"],
    aiEntry: "User-facing LLM — tools.ts för data, chat-limits för budget.",
    description: "Elite + match-chat. Läser Supabase via tools.",
  },
  {
    id: "podcast-ui",
    label: "Podcast",
    short: "Podd",
    layer: "web",
    x: 0.92,
    y: 0.78,
    repo: "athopia-web",
    docSlug: "07-podcast",
    files: ["PodcastSignalsPanel.tsx", "PODCAST_RIGHTS.md"],
    description: "Spotify/Acast only — ingen republished audio.",
  },
];

export const SYSTEM_EDGES: SystemEdge[] = [
  { from: "rss", to: "echo", label: "signal", hue: 210 },
  { from: "echo", to: "cluster", hue: 35 },
  { from: "echo", to: "supabase", label: "articles", hue: 35 },
  { from: "cluster", to: "supabase", label: "clusters", hue: 35 },
  { from: "sportmonks", to: "milo", hue: 210 },
  { from: "milo", to: "supabase", label: "stats", hue: 145 },
  { from: "pulse", to: "supabase", label: "brief", hue: 35 },
  { from: "matchday", to: "supabase", hue: 35 },
  { from: "podcast-ingest", to: "supabase", label: "meta", hue: 210 },
  { from: "supabase", to: "feed", hue: 265 },
  { from: "supabase", to: "brief", hue: 265 },
  { from: "supabase", to: "match-ui", hue: 265 },
  { from: "supabase", to: "chat", hue: 265 },
  { from: "supabase", to: "podcast-ui", hue: 265 },
];

export const ACTIVE_EDGES = SYSTEM_EDGES;

export function getNode(id: string): SystemNode | undefined {
  return SYSTEM_NODES.find((n) => n.id === id);
}

export const DOC_BASE = "https://github.com/jardinghampus/athopia-web/blob/main/../docs/features";

export function docPath(slug: string | undefined): string | null {
  if (!slug) return null;
  return `/system/docs/${slug}`;
}

/** Feature doc slugs for static detail pages */
export const FEATURE_DOCS: Record<string, { title: string; slug: string }> = {
  "01-news-feed": { title: "Nyhetsflöde", slug: "01-news-feed" },
  "02-echo-classification": { title: "Echo", slug: "02-echo-classification" },
  "03-story-clusters": { title: "Story-kluster", slug: "03-story-clusters" },
  "04-sportmonks-stats": { title: "Sportmonks", slug: "04-sportmonks-stats" },
  "05-team-daily-pulse": { title: "Team Pulse", slug: "05-team-daily-pulse" },
  "06-match-context": { title: "Match", slug: "06-match-context" },
  "07-podcast": { title: "Podcast", slug: "07-podcast" },
  "08-ai-chat": { title: "AI-chat", slug: "08-ai-chat" },
  "09-forum": { title: "Forum", slug: "09-forum" },
  "10-push-notifications": { title: "Push", slug: "10-push-notifications" },
  "11-monetization": { title: "Prenumeration", slug: "11-monetization" },
  "12-admin-ops": { title: "Admin & ops", slug: "12-admin-ops" },
};
