/**
 * lib/supabase.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase-helpers för Athopia.
 *
 * Beslut: Vi exporterar två klienter:
 *  - `createServerClient` – används i Server Components och Route Handlers med
 *    service-role key (läser/skriver utan RLS-begränsning).
 *  - `createBrowserClient` – används i Client Components med anon key +
 *    Supabase RLS-regler.
 *
 * Typerna genereras av `pnpm supabase gen types` och importeras från
 * @/types/supabase (skapas manuellt/via Supabase CLI).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type {
  AgentLog,
  Article,
  ContentQueueItem,
  Entity,
  EntityInsight,
  Narrative,
  Podcast,
  PodcastChunk,
  TeamDailyPulse,
  TeamPushPopup,
} from "@/lib/types";

// ─── Miljövariabler ────────────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** Returnerar true om Supabase är korrekt konfigurerat (inte placeholder) */
export function isSupabaseConfigured(): boolean {
  return (
    supabaseUrl.startsWith("https://") &&
    !supabaseUrl.includes("placeholder") &&
    supabaseServiceRoleKey.length > 20 &&
    !supabaseServiceRoleKey.includes("placeholder")
  );
}

// ─── Server-klient (Server Components / API routes) ────────────────────────────
// Använder service role key – kör aldrig i klienten.
export function createServerClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY måste sättas."
    );
  }
  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
    global: {
      fetch: (url: RequestInfo | URL, init?: RequestInit) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 25000);
        return fetch(url, { ...init, signal: controller.signal }).finally(() =>
          clearTimeout(timer)
        );
      },
    },
  });
}

// ─── Service-klient (admin-operationer) ───────────────────────────────────────
// Alias för tydlighet när vi gör writes/admin.
export function createServiceClient() {
  return createServerClient();
}

// ─── Browser-klient (Client Components) ───────────────────────────────────────
// Singleton-mönster för att undvika duplicerade instanser.
let browserClient: ReturnType<typeof createSupabaseClient> | null = null;
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL och NEXT_PUBLIC_SUPABASE_ANON_KEY måste sättas."
    );
  }
  if (!browserClient) {
    browserClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return browserClient;
}

// ─── Typade queries ───────────────────────────────────────────────────────────

function mapEntity(row: any): Entity {
  return {
    id: String(row.id ?? row.entity_id ?? row.slug ?? row.name),
    name: String(row.name ?? ""),
    type: (row.type ?? "team") as Entity["type"],
    slug: String(row.slug ?? ""),
    imageUrl: row.image_url ?? row.imageUrl ?? null,
  };
}

function mapArticle(row: any): Article {
  const slug = row.slug ? String(row.slug) : "";
  const sourceUrl = row.source_url ?? row.sourceUrl ?? row.url ?? null;
  return {
    id: String(row.id),
    slug,
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    content: row.content ?? null,
    sourceUrl,
    url: row.url ?? sourceUrl,
    sourceName: String(row.source_name ?? row.sourceName ?? "Okänd källa"),
    sourceType: row.source_type ?? row.sourceType ?? null,
    imageUrl: row.image_url ?? row.imageUrl ?? null,
    publishedAt: String(row.published_at ?? row.publishedAt ?? new Date().toISOString()),
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
    importanceScore: row.importance_score ?? row.importanceScore ?? null,
    feedScore: row.feed_score ?? row.feedScore ?? null,
    pushPriority: row.push_priority ?? row.pushPriority ?? null,
    newsTag: row.news_tag ?? row.newsTag ?? null,
    eventType: row.event_type ?? row.eventType ?? null,
    sentimentScore: row.sentiment_score ?? row.sentimentScore ?? null,
    entities: Array.isArray(row.entities) ? row.entities.map(mapEntity) : [],
  };
}

function mapNarrative(row: any): Narrative {
  const score = Number(row.score ?? row.importance_score ?? 0);
  return {
    id: String(row.id),
    topic: String(row.topic ?? row.title ?? ""),
    score: Number.isFinite(score) ? score : 0,
    description: row.description ?? null,
    body: row.generated_text ?? row.body ?? null,
    sourceCount: Number(row.source_count ?? row.sourceCount ?? 0),
    trend: (row.trend ?? "stable") as Narrative["trend"],
    sentimentScore: row.sentiment_score ?? row.sentimentScore ?? null,
    entities: Array.isArray(row.entities) ? row.entities.map(mapEntity) : [],
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.updatedAt ?? new Date().toISOString()),
  };
}

function mapEntityInsight(row: any): EntityInsight {
  return {
    id: String(row.id),
    entityId: String(row.entity_id),
    entityName: String(row.entity_name ?? ""),
    entitySlug: row.entity_slug ? String(row.entity_slug) : null,
    insightType: (row.insight_type ?? "stat_news_fusion") as EntityInsight["insightType"],
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    body: row.body ?? null,
    confidence: Number(row.confidence ?? 0),
    severity: (row.severity ?? "info") as EntityInsight["severity"],
    sourceArticleIds: Array.isArray(row.source_article_ids) ? row.source_article_ids.map(String) : [],
    metricSnapshot: (row.metric_snapshot ?? {}) as Record<string, unknown>,
    evidence: (row.evidence ?? {}) as Record<string, unknown>,
    generatedAt: String(row.generated_at ?? row.created_at ?? new Date().toISOString()),
  };
}

function mapTeamDailyPulse(row: any): TeamDailyPulse {
  return {
    id: String(row.id),
    teamEntityId: String(row.team_entity_id),
    teamName: String(row.team_name ?? ""),
    teamSlug: row.team_slug ? String(row.team_slug) : null,
    pulseDate: String(row.pulse_date ?? ""),
    headline: String(row.headline ?? ""),
    dek: String(row.dek ?? ""),
    body: String(row.body ?? ""),
    editorialNote: row.editorial_note ?? null,
    matchContextLabel: (row.match_context_label ?? "normal") as TeamDailyPulse["matchContextLabel"],
    tone: (row.tone ?? "measured") as TeamDailyPulse["tone"],
    sourceArticleIds: Array.isArray(row.source_article_ids) ? row.source_article_ids.map(String) : [],
    sourceFixtureIds: Array.isArray(row.source_fixture_ids) ? row.source_fixture_ids.map(Number) : [],
    metricSnapshot: (row.metric_snapshot ?? {}) as Record<string, unknown>,
    evidence: (row.evidence ?? {}) as Record<string, unknown>,
    generatedAt: String(row.generated_at ?? row.created_at ?? new Date().toISOString()),
  };
}

function mapPodcast(row: any): Podcast {
  return {
    id: String(row.id),
    showName: String(row.show_name ?? row.showName ?? "Podcast"),
    title: String(row.title ?? ""),
    audioUrl: String(row.audio_url ?? row.audioUrl ?? ""),
    durationSeconds: Number(row.duration_seconds ?? row.durationSeconds ?? 0),
    publishedAt: String(row.published_at ?? row.publishedAt ?? new Date().toISOString()),
    imageUrl: row.image_url ?? row.imageUrl ?? null,
    hasTranscript: !!(row.transcript_html ?? row.has_transcript ?? row.hasTranscript),
    entities: Array.isArray(row.entities) ? row.entities.map(mapEntity) : [],
  };
}

function mapPodcastChunk(row: any): PodcastChunk {
  return {
    id: String(row.id),
    podcastId: String(row.podcast_id ?? row.podcastId ?? ""),
    startSeconds: Number(row.start_seconds ?? row.startSeconds ?? 0),
    endSeconds: Number(row.end_seconds ?? row.endSeconds ?? 0),
    text: String(row.text ?? ""),
    entities: Array.isArray(row.entities) ? row.entities.map(mapEntity) : [],
  };
}

export async function getArticles(
  limit = 12,
  offset = 0,
  teamSlug?: string
): Promise<Article[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    let q = supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (teamSlug) q = q.ilike("title", `%${teamSlug}%`);
    const { data } = await q;
    return (data ?? []).map(mapArticle);
  } catch {
    return [];
  }
}

export interface ArticleFilters {
  visa?: "all" | "ai" | "source";
  teams?: string[];
  sources?: string[];
  events?: string[];
  page?: number;
  limit?: number;
}

export async function getFilteredArticles(filters: ArticleFilters = {}): Promise<{ articles: Article[]; total: number }> {
  if (!isSupabaseConfigured()) return { articles: [], total: 0 };
  try {
    const supabase = createServerClient();
    const limit = filters.limit ?? 12;
    const offset = ((filters.page ?? 1) - 1) * limit;

    let q = supabase
      .from("news_feed")
      .select("*", { count: "exact" })
      .eq("sport", "football")
      .order("feed_score", { ascending: false, nullsFirst: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (filters.visa === "ai") {
      q = q.not("summary", "is", null);
    } else if (filters.visa === "source") {
      q = q.not("source_name", "is", null);
    }

    if (filters.events && filters.events.length > 0) {
      q = q.in("event_type", filters.events);
    }

    if (filters.sources && filters.sources.length > 0) {
      q = q.in("source_name", filters.sources);
    }

    if (filters.teams && filters.teams.length > 0) {
      const orClauses = filters.teams.map(t => `title.ilike.%${t.replace(/[,()]/g, " ")}%`).join(",");
      q = (q as any).or(orClauses);
    }

    const { data, count } = await q;
    return { articles: (data ?? []).map(mapArticle), total: count ?? 0 };
  } catch {
    return { articles: [], total: 0 };
  }
}

export async function getActiveSources(): Promise<{ name: string; id: string }[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("rss_sources")
      .select("id, name")
      .eq("active", true)
      .eq("sport", "football")
      .in("category", ["news"])
      .order("name", { ascending: true })
      .limit(100);
    return (data as { id: string; name: string }[]) ?? [];
  } catch {
    return [];
  }
}

export async function getArticle(slug: string): Promise<Article | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createServerClient();
    const { data } = await supabase.from("articles").select("*").eq("slug", slug).maybeSingle();
    return data ? mapArticle(data) : null;
  } catch {
    return null;
  }
}

export const getNarratives = unstable_cache(
  async (limit = 12): Promise<Narrative[]> => {
    if (!isSupabaseConfigured()) return [];
    try {
      const supabase = createServerClient();
      const { data } = await supabase
        .from("narratives")
        .select("*")
        .order("importance_score", { ascending: false, nullsFirst: false })
        .limit(limit);
      return (data ?? []).map(mapNarrative);
    } catch {
      return [];
    }
  },
  ["narratives"],
  { revalidate: 300, tags: ["narratives"] }
);

export async function getEntities(type?: Entity["type"]): Promise<Entity[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    let q = supabase.from("entities").select("*").order("name", { ascending: true }).limit(100);
    if (type) q = q.eq("type", type);
    // Visa bara Allsvenskan-lag (ej landslag, Camp Sweden, etc.)
    if (type === "team") q = (q as any).eq("metadata->>league", "Allsvenskan");
    const { data } = await q;
    return (data ?? []).map(mapEntity);
  } catch {
    return [];
  }
}

export const getPodcasts = unstable_cache(
  async (limit = 24): Promise<Podcast[]> => {
    if (!isSupabaseConfigured()) return [];
    try {
      const supabase = createServerClient();
      const { data } = await supabase
        .from("podcasts")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(limit);
      return (data ?? []).map(mapPodcast);
    } catch {
      return [];
    }
  },
  ["podcasts"],
  { revalidate: 600, tags: ["podcasts"] }
);

export async function getPodcast(id: string): Promise<Podcast | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createServerClient();
    const { data } = await supabase.from("podcasts").select("*").eq("id", id).maybeSingle();
    return data ? mapPodcast(data) : null;
  } catch {
    return null;
  }
}

export async function getPodcastChunks(podcastId: string): Promise<PodcastChunk[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("podcast_chunks")
      .select("*")
      .eq("podcast_id", podcastId)
      .order("start_seconds", { ascending: true })
      .limit(500);
    return (data ?? []).map(mapPodcastChunk);
  } catch {
    return [];
  }
}

export async function searchEmbeddings(query: string, sourceType?: string): Promise<Article[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    // Placeholder: textsökning tills embedding-pipeline är klar.
    let q = supabase
      .from("articles")
      .select("*")
      .ilike("title", `%${query}%`)
      .order("published_at", { ascending: false })
      .limit(20);
    if (sourceType) q = q.eq("source_type", sourceType);
    const { data } = await q;
    return (data ?? []).map(mapArticle);
  } catch {
    return [];
  }
}

export async function getContentQueue(status?: string): Promise<ContentQueueItem[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    let q = supabase.from("content_queue").select("*").order("created_at", { ascending: false }).limit(200);
    if (status) q = q.eq("status", status);
    const { data } = await q;
    return (data ?? []) as ContentQueueItem[];
  } catch {
    return [];
  }
}

export async function getAgentLogs(limit = 100): Promise<AgentLog[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase.from("agent_logs").select("*").order("created_at", { ascending: false }).limit(limit);
    return (data ?? []) as AgentLog[];
  } catch {
    return [];
  }
}

// ── NewsStream (läser från articles — Echo skriver dit, ej content_queue) ────────
import type { NewsSignal } from "@/lib/types";

function mapImportanceTier(score: number | null): NewsSignal["importance_tier"] {
  if (score === null) return null;
  if (score >= 0.85) return "breaking";
  if (score >= 0.70) return "major";
  if (score >= 0.50) return "normal";
  return "noise";
}

export const getNewsStream = unstable_cache(
  async (opts: {
    sport?: string;
    limit?: number;
    orderBy?: "signal_score" | "published_at";
  }): Promise<NewsSignal[]> => {
    if (!isSupabaseConfigured()) return [];
    const { sport = "football", limit = 20, orderBy = "published_at" } = opts;
    try {
      const supabase = createServerClient();
      let q = supabase
        .from("news_feed")
        .select("id, source_name, url, importance_score, feed_score, push_priority, title, summary, published_at")
        .eq("sport", sport)
        .not("importance_score", "is", null)
        .limit(limit);

      q = orderBy === "signal_score"
        ? q.order("feed_score", { ascending: false, nullsFirst: false })
        : q.order("published_at", { ascending: false });

      const { data } = await q;
      return (data ?? []).map((row) => ({
        id: String(row.id),
        source_name: row.source_name ?? null,
        source_url: row.url ?? null,
        signal_score: row.feed_score ?? row.importance_score ?? null,
        importance_tier: row.push_priority === "breaking"
          ? "breaking"
          : mapImportanceTier(row.importance_score ?? null),
        content: {
          title: row.title ?? "",
          link: row.url ?? "",
          published_at: row.published_at ?? null,
          snippet: row.summary ?? null,
        },
        created_at: row.published_at ?? "",
      }));
    } catch {
      return [];
    }
  },
  ["news-stream"],
  { revalidate: 60, tags: ["news"] }
);

export async function getTeamPushPopups(teamEntityIds: string[], limit = 5): Promise<TeamPushPopup[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    let q = supabase
      .from("team_push_popups")
      .select("*")
      .order("feed_score", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    if (teamEntityIds.length > 0) q = q.in("team_entity_id", teamEntityIds);

    const { data } = await q;

    return (data ?? []).map((row: any) => ({
      id: String(row.id),
      articleId: row.article_id ?? null,
      storyKey: String(row.story_key ?? ""),
      sport: String(row.sport ?? "football"),
      teamEntityId: row.team_entity_id ?? null,
      title: String(row.title ?? ""),
      body: String(row.body ?? ""),
      url: row.url ?? null,
      importanceScore: row.importance_score ?? null,
      feedScore: row.feed_score ?? null,
      eventType: row.event_type ?? null,
      newsTag: row.news_tag ?? null,
      sourceName: row.source_name ?? null,
      createdAt: String(row.created_at ?? new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}

export const getTeamEntityInsights = unstable_cache(
  async (teamEntityId: string, limit = 3): Promise<EntityInsight[]> => {
    if (!isSupabaseConfigured()) return [];
    try {
      const supabase = createServerClient();
      const { data } = await supabase
        .from("published_entity_insights")
        .select("*")
        .eq("entity_id", teamEntityId)
        .eq("sport", "football")
        .order("confidence", { ascending: false, nullsFirst: false })
        .order("generated_at", { ascending: false })
        .limit(limit);

      return (data ?? []).map(mapEntityInsight);
    } catch {
      return [];
    }
  },
  ["team-entity-insights"],
  { revalidate: 120, tags: ["entity-insights"] }
);

export const getTeamDailyPulse = unstable_cache(
  async (teamEntityId: string): Promise<TeamDailyPulse | null> => {
    if (!isSupabaseConfigured()) return null;
    try {
      const supabase = createServerClient();
      const { data } = await supabase
        .from("published_team_daily_pulses")
        .select("*")
        .eq("team_entity_id", teamEntityId)
        .eq("sport", "football")
        .order("pulse_date", { ascending: false })
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return data ? mapTeamDailyPulse(data) : null;
    } catch {
      return null;
    }
  },
  ["team-daily-pulse"],
  { revalidate: 120, tags: ["team-daily-pulse"] }
);
