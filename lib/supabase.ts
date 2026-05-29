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

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type {
  AgentLog,
  Article,
  ContentQueueItem,
  Entity,
  Narrative,
  Podcast,
  PodcastChunk,
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
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    content: row.content ?? null,
    sourceUrl: row.source_url ?? row.sourceUrl ?? null,
    sourceName: String(row.source_name ?? row.sourceName ?? "Okänd källa"),
    sourceType: row.source_type ?? row.sourceType ?? null,
    imageUrl: row.image_url ?? row.imageUrl ?? null,
    publishedAt: String(row.published_at ?? row.publishedAt ?? new Date().toISOString()),
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
    importanceScore: row.importance_score ?? row.importanceScore ?? null,
    sentimentScore: row.sentiment_score ?? row.sentimentScore ?? null,
    entities: Array.isArray(row.entities) ? row.entities.map(mapEntity) : [],
  };
}

function mapNarrative(row: any): Narrative {
  return {
    id: String(row.id),
    topic: String(row.topic ?? ""),
    score: typeof row.score === "number" ? row.score : 0,
    sourceCount: Number(row.source_count ?? row.sourceCount ?? 0),
    trend: (row.trend ?? "stable") as Narrative["trend"],
    sentimentScore: row.sentiment_score ?? row.sentimentScore ?? null,
    entities: Array.isArray(row.entities) ? row.entities.map(mapEntity) : [],
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.updatedAt ?? new Date().toISOString()),
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
      .from("articles")
      .select("*", { count: "exact" })
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.visa === "ai") {
      q = q.eq("is_processed", true).not("summary", "is", null);
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
      const orClauses = filters.teams.map(t => `title.ilike.%${t}%`).join(",");
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

export async function getNarratives(limit = 12): Promise<Narrative[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("narratives")
      .select("*")
      .order("score", { ascending: false })
      .limit(limit);
    return (data ?? []).map(mapNarrative);
  } catch {
    return [];
  }
}

export async function getEntities(type?: Entity["type"]): Promise<Entity[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    let q = supabase.from("entities").select("*").order("name", { ascending: true }).limit(500);
    if (type) q = q.eq("type", type);
    const { data } = await q;
    return (data ?? []).map(mapEntity);
  } catch {
    return [];
  }
}

export async function getPodcasts(limit = 24): Promise<Podcast[]> {
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
}

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
