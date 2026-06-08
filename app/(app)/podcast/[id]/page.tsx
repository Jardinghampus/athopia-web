/**
 * app/podcast/[id]/page.tsx — Podcast-episodsida
 * ─────────────────────────────────────────────────────────────────────────────
 * - HTML5 audio-player
 * - Transkript med timestamps + entity highlights
 * - PRO-gate på fullt transkript (trunkeras till 500 tecken för free-tier)
 * - JSON-LD: PodcastEpisode
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Lock, Mic } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { EntityChip } from "@/components/ui/EntityChip";
import { createServerClient } from "@/lib/supabase";
import type { Podcast } from "@/lib/types";

export const dynamic = 'force-dynamic';

// ─── Data-hämtning ─────────────────────────────────────────────────────────────
async function getEpisode(id: string): Promise<Podcast | null> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("podcast_episodes")
      .select("*")
      .eq("id", id)
      .single();
    return data as any as Podcast | null;
  } catch {
    return null;
  }
}

// ─── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const episode = await getEpisode(id);
  if (!episode) return { title: "Avsnitt hittades inte" };

  return {
    title: episode.title,
    description: `${episode.showName}: ${episode.title}`,
  };
}

// ─── JSON-LD: PodcastEpisode ──────────────────────────────────────────────────
function EpisodeJsonLd({ ep }: { ep: Podcast }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: ep.title,
    partOfSeries: { "@type": "PodcastSeries", name: ep.showName },
    audio: { "@type": "AudioObject", contentUrl: ep.audioUrl },
    datePublished: ep.publishedAt,
    url: `https://athopia.se/podcast/${ep.id}`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─── Transkript-sektion ────────────────────────────────────────────────────────
function TranscriptSection({
  html,
  isPro,
  userIsPro,
}: {
  html: string | null;
  isPro: boolean;
  userIsPro: boolean;
}) {
  if (!html) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Inget transkript tillgängligt för detta avsnitt.
      </p>
    );
  }

  // Free-tier: trunkera till 500 tecken
  const shouldTruncate = isPro && !userIsPro;
  const displayHtml = shouldTruncate ? html.slice(0, 500) + "..." : html;

  return (
    <div className="relative">
      <div
        className="prose prose-invert prose-sm max-w-none text-foreground/80 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: displayHtml }}
      />

      {/* PRO-gate overlay */}
      {shouldTruncate && (
        <div className="absolute inset-x-0 bottom-0 h-32 flex flex-col items-center justify-end pb-4 bg-gradient-to-t from-background to-transparent">
          <div className="flex flex-col items-center gap-3 p-4 rounded-xl glass-card">
            <Lock className="w-5 h-5 text-pitch" />
            <p className="text-sm text-center text-foreground">
              Fullt transkript kräver PRO-plan
            </p>
            <Link
              href="/prenumerera"
              className="px-4 py-2 rounded-full pitch-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Prova PRO — 39 kr/mån
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function PodcastEpisodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const episode = await getEpisode(id);

  if (!episode) notFound();

  // Kolla PRO-status via Clerk session
  const { sessionClaims } = await auth();
  const tier = (sessionClaims?.publicMetadata as { subscriptionTier?: string })
    ?.subscriptionTier;
  const userIsPro = tier === "pro";
  const hasTranscript = !!episode.hasTranscript;

  function formatDuration(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <>
      <EpisodeJsonLd ep={episode} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Mic className="w-4 h-4 text-pitch" />
          <span className="text-sm text-pitch font-medium">{episode.showName}</span>
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl text-foreground mb-4 leading-tight">
          {episode.title.toUpperCase()}
        </h1>

        {/* Entiteter */}
        {episode.entities?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {episode.entities.map((e: any) => (
              <EntityChip key={e.id} entity={e} />
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-8">
          {new Date(episode.publishedAt).toLocaleDateString("sv-SE", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {" · "}
          {formatDuration(episode.durationSeconds)}
        </p>

        {/* HTML5 Audio Player */}
        <div className="mb-10 rounded-xl border border-border bg-card p-4">
          <audio
            controls
            className="w-full"
            src={episode.audioUrl}
            aria-label={`Lyssna på ${episode.title}`}
          >
            Din webbläsare stödjer inte audio-elementet.
          </audio>
        </div>

        {/* Transkript */}
        {hasTranscript && (
          <section>
            <h2 className="font-heading text-2xl text-foreground mb-4">TRANSKRIPT</h2>
            <TranscriptSection
              html={null}
              isPro={true}
              userIsPro={userIsPro}
            />
          </section>
        )}

        {/* Bakåtknapp */}
        <div className="mt-12">
          <Link
            href="/podcast"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Tillbaka till alla avsnitt
          </Link>
        </div>
      </div>
    </>
  );
}
