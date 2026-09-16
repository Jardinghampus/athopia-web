import "server-only";

import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";
import { excerptAround } from "@/lib/podcast/rights";
import {
  asMetadataRecord,
  parseAthopiaSummary,
  parseModelSummaryJson,
  sampleChunkTexts,
  sampleTranscript,
  type AthopiaPodcastSummary,
} from "@/lib/podcast/summary";

const inflight = new Map<string, Promise<GenerateResult>>();

type GenerateResult = {
  summary: AthopiaPodcastSummary | null;
  tokensIn: number;
  tokensOut: number;
};

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export type PodcastEpisodeRecord = {
  id: string;
  title: string;
  showName: string | null;
  publishedAt: string | null;
  mentionedTeams: string[];
  topics: string[];
  isTranscribed: boolean;
  summary: AthopiaPodcastSummary | null;
  hasSource: boolean;
};

type PodcastRow = {
  id: string;
  title: string;
  show_name: string | null;
  published_at: string | null;
  mentioned_teams: string[] | null;
  metadata: unknown;
  is_transcribed: boolean;
  transcript: string | null;
};

const SUMMARY_SYSTEM = `Du skriver originalsammanfattningar för Athopia, på svenska.
Regler:
- Svara ENDAST med JSON: {"headline":"...","bullets":["..."]}
- headline: en mening, max 160 tecken.
- bullets: 5–8 punkter, max 180 tecken var, egen formulering.
- Ingen verbatim-återgivning av transkriptet. Inga citat längre än 12 ord.
- Hitta inte på namn, siffror eller händelser som inte syns i underlaget.
- Om underlaget är för tunt: färre bullets, aldrig påhitt.`;

export async function loadPodcastEpisode(episodeId: string): Promise<PodcastEpisodeRecord | null> {
  const db = getDb();
  const { data } = await db
    .from("podcasts")
    .select("id, title, show_name, published_at, mentioned_teams, metadata, is_transcribed")
    .eq("id", episodeId)
    .maybeSingle();
  if (!data) return null;
  const row = data as PodcastRow;
  const meta = asMetadataRecord(row.metadata);
  const topics = Array.isArray(meta.topics)
    ? meta.topics.filter((t): t is string => typeof t === "string")
    : [];

  const { count } = await db
    .from("podcast_chunks")
    .select("id", { count: "exact", head: true })
    .eq("podcast_id", episodeId);

  return {
    id: row.id,
    title: row.title,
    showName: row.show_name,
    publishedAt: row.published_at,
    mentionedTeams: row.mentioned_teams ?? [],
    topics,
    isTranscribed: row.is_transcribed,
    summary: parseAthopiaSummary(row.metadata),
    hasSource: (count ?? 0) > 0 || row.is_transcribed,
  };
}

async function loadSourceText(episodeId: string): Promise<string> {
  const db = getDb();
  const { data: chunks } = await db
    .from("podcast_chunks")
    .select("text, chunk_index")
    .eq("podcast_id", episodeId)
    .order("chunk_index", { ascending: true })
    .limit(200);

  const sampled = sampleChunkTexts(
    (chunks ?? []).map((c) => ({
      text: typeof c.text === "string" ? c.text : "",
      chunkIndex: typeof c.chunk_index === "number" ? c.chunk_index : 0,
    })),
  );
  if (sampled) return sampled;

  const { data } = await db
    .from("podcasts")
    .select("transcript")
    .eq("id", episodeId)
    .maybeSingle();
  return sampleTranscript(typeof data?.transcript === "string" ? data.transcript : "");
}

export async function searchEpisodeChunks(
  episodeId: string,
  query: string,
): Promise<{ quote: string; startSeconds: number | null }[]> {
  const q = query.trim().slice(0, 80);
  if (q.length < 2) return [];
  const db = getDb();
  const { data } = await db
    .from("podcast_chunks")
    .select("text, start_seconds")
    .eq("podcast_id", episodeId)
    // Modellstyrd sökterm: % _ \ är ilike-jokrar och ska matchas bokstavligt.
    .ilike("text", `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`)
    .limit(6);

  return ((data ?? []) as { text: string; start_seconds: number | null }[]).map((row) => ({
    quote: excerptAround(row.text, q),
    startSeconds: row.start_seconds,
  }));
}

export async function generateEpisodeSummaryWithUsage(episodeId: string): Promise<GenerateResult> {
  const pending = inflight.get(episodeId);
  // Den som väntar på någon annans generering betalar inga tokens.
  if (pending) return pending.then((r) => ({ ...r, tokensIn: 0, tokensOut: 0 }));

  const job = runGenerate(episodeId).catch((err): GenerateResult => {
    // Bara meddelandet: AI SDK-fel bär request-bodyn, dvs. transkriptutdragen.
    console.error("[podcast-summary]", err instanceof Error ? err.message : "okänt fel");
    return { summary: null, tokensIn: 0, tokensOut: 0 };
  });
  inflight.set(episodeId, job);
  try {
    return await job;
  } finally {
    inflight.delete(episodeId);
  }
}

async function runGenerate(episodeId: string): Promise<GenerateResult> {
  const existing = await loadPodcastEpisode(episodeId);
  if (!existing) return { summary: null, tokensIn: 0, tokensOut: 0 };
  if (existing.summary) return { summary: existing.summary, tokensIn: 0, tokensOut: 0 };
  if (!existing.hasSource) return { summary: null, tokensIn: 0, tokensOut: 0 };

  const source = await loadSourceText(episodeId);
  if (!source.trim()) return { summary: null, tokensIn: 0, tokensOut: 0 };

  const model = anthropic(process.env.CHAT_MODEL ?? "claude-haiku-4-5-20251001");
  const { text, usage } = await generateText({
    model,
    maxOutputTokens: 500,
    system: SUMMARY_SYSTEM,
    prompt: `Podd: ${existing.showName ?? "okänd"}
Avsnitt: ${existing.title}
Lag som nämns: ${existing.mentionedTeams.join(", ") || "okänt"}
Ämnen: ${existing.topics.join(", ") || "okänt"}

Underlag (utdrag ur transkriptet, internt):
${source}`,
  });

  const tokensIn = usage?.inputTokens ?? 0;
  const tokensOut = usage?.outputTokens ?? 0;
  const parsed = parseModelSummaryJson(text);
  if (!parsed) return { summary: null, tokensIn, tokensOut };

  const db = getDb();
  const { data: current } = await db
    .from("podcasts")
    .select("metadata")
    .eq("id", episodeId)
    .maybeSingle();
  const meta = asMetadataRecord(current?.metadata);
  await db
    .from("podcasts")
    .update({
      metadata: { ...meta, athopia_summary: parsed },
      updated_at: new Date().toISOString(),
    })
    .eq("id", episodeId);

  return { summary: parsed, tokensIn, tokensOut };
}
