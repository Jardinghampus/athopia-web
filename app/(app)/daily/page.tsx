/**
 * app/daily/page.tsx — Delbar Athopia Daily-landning (social / SEO)
 * ─────────────────────────────────────────────────────────────────────────────
 * Publik route: /daily och /daily?lag={slug}. PRO krävs för uppspelning (briefAudio).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Headphones, Sparkles } from "lucide-react";
import { DailyPodcastPlayer } from "@/components/team-hub/DailyPodcastPlayer";
import { getDailyEpisodeForShareCached } from "@/lib/team-hub/queries";
import { getUserPlan } from "@/lib/user-plan";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const revalidate = 60;

const SITE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://athopia.se";

function episodeDescription(title: string, episodeDate: string) {
  const when = episodeDate
    ? new Date(`${episodeDate}T12:00:00`).toLocaleDateString("sv-SE", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "idag";
  return `${title} — 7 minuters morgonbrief om Allsvenskan (${when}). Lyssna på Athopia Daily.`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lag?: string }>;
}): Promise<Metadata> {
  const { lag } = await searchParams;
  const episode = await getDailyEpisodeForShareCached(lag);
  const title = episode?.title ?? "Athopia Daily — Allsvenskan idag";
  const description = episode
    ? episodeDescription(episode.title, episode.episode_date)
    : "Daglig 7-minuters brief om Allsvenskan — transfers, xG och det som betyder något. Original från Athopia.";
  const url = lag ? `${SITE}/daily?lag=${encodeURIComponent(lag)}` : `${SITE}/daily`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "sv_SE",
      url,
      title,
      description,
      siteName: "Athopia",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function DailyEpisodeJsonLd({
  episode,
  pageUrl,
}: {
  episode: NonNullable<Awaited<ReturnType<typeof getDailyEpisodeForShareCached>>>;
  pageUrl: string;
}) {
  const payload = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: episode.title,
    datePublished: episode.episode_date,
    url: pageUrl,
    partOfSeries: {
      "@type": "PodcastSeries",
      name: "Athopia Daily",
      url: `${SITE}/daily`,
    },
    ...(episode.has_audio
      ? {
          associatedMedia: {
            "@type": "MediaObject",
            contentUrl: `${pageUrl}?listen=1`,
            ...(episode.duration_sec ? { duration: `PT${episode.duration_sec}S` } : {}),
          },
        }
      : {}),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }} />
  );
}

export default async function DailyPage({
  searchParams,
}: {
  searchParams: Promise<{ lag?: string }>;
}) {
  const { lag } = await searchParams;
  const [episode, plan, { userId }] = await Promise.all([
    getDailyEpisodeForShareCached(lag),
    getUserPlan(),
    auth(),
  ]);

  const pageUrl = lag ? `${SITE}/daily?lag=${encodeURIComponent(lag)}` : `${SITE}/daily`;
  const teamLabel = lag ? lag.replace(/-/g, " ").toUpperCase() : null;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12 pb-24">
      {episode && <DailyEpisodeJsonLd episode={episode} pageUrl={pageUrl} />}

      <header className="mb-8 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-pitch/30 bg-pitch/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-pitch">
          <Headphones className="h-3.5 w-3.5" aria-hidden />
          Athopia Daily
        </p>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          {teamLabel ? `Ditt lag · ${teamLabel}` : "Allsvenskan på 7 minuter"}
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Morgonbrief med det viktigaste från natten och gårdagen — transfers, xG och matchläge.
          100&nbsp;% Athopia-original, inte podd-citat.
        </p>
      </header>

      {episode ? (
        <DailyPodcastPlayer episode={episode} plan={plan} />
      ) : (
        <section className="rounded-xl border border-border bg-card px-5 py-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-pitch mb-3" aria-hidden />
          <h2 className="text-lg font-semibold text-foreground">Första avsnittet kommer snart</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Athopia Daily publiceras varje morgon efter granskning. Skapa konto så får du briefen direkt i appen.
          </p>
        </section>
      )}

      <section className="mt-8 grid gap-3 sm:grid-cols-3 text-center text-sm text-muted-foreground">
        <div className="rounded-lg border border-border bg-card/50 px-3 py-4">
          <p className="font-semibold text-foreground">07:30</p>
          <p className="mt-1 text-xs">Nytt avsnitt varje morgon</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 px-3 py-4">
          <p className="font-semibold text-foreground">~7 min</p>
          <p className="mt-1 text-xs">Perfekt till pendlingen</p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 px-3 py-4">
          <p className="font-semibold text-foreground">PRO</p>
          <p className="mt-1 text-xs">Lyssna obegränsat</p>
        </div>
      </section>

      <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
        {!userId ? (
          <Link
            href="/prenumerera"
            className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto justify-center")}
          >
            Lyssna med PRO
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        ) : (
          <Link
            href="/mitt-lag"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full sm:w-auto justify-center")}
          >
            Gå till mitt lag
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        )}
        <Link
          href="/prenumerera"
          className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "w-full sm:w-auto justify-center")}
        >
          Uppgradera till PRO
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Dela länken:{" "}
        <Link href="/daily" className="text-pitch hover:underline">
          {SITE.replace(/^https?:\/\//, "")}/daily
        </Link>
        {lag ? (
          <>
            {" "}
            ·{" "}
            <Link href={`/daily?lag=${encodeURIComponent(lag)}`} className="text-pitch hover:underline">
              lagvariant
            </Link>
          </>
        ) : null}
      </p>
    </div>
  );
}
