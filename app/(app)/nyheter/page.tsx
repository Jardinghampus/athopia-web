import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { NewsFilterPanel } from "@/components/ui/NewsFilterPanel";
import { NyheterRealtimeBanner } from "@/components/NyheterRealtimeBanner";
import { TeamPushPopups } from "@/components/news/TeamPushPopups";
import { getFilteredArticles, getActiveSources, getHotArticles } from "@/lib/supabase";
import { filterStateToParams } from "@/lib/filters";
import { getUserFeedPreferences } from "@/lib/feed/getUserFeedPreferences";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Allsvenskan-nyheter 2026 – Senaste signaler",
  description: "Senaste fotbollsnyheterna från Allsvenskan — signalscorerade och AI-kurerade i realtid.",
  alternates: { canonical: "https://athopia.se/nyheter" },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: "https://athopia.se/nyheter",
    title: "Allsvenskan-nyheter 2026 – Senaste signaler",
    description: "Senaste fotbollsnyheterna från Allsvenskan — signalscorerade och AI-kurerade i realtid.",
  },
};

const LIMIT = 24;

function Pagination({ page, total, urlBase }: { page: number; total: number; urlBase: string }) {
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  if (totalPages <= 1) return null;
  const prev = page > 1 ? `${urlBase}&page=${page - 1}` : null;
  const next = page < totalPages ? `${urlBase}&page=${page + 1}` : null;
  return (
    <div className="mt-10 flex items-center justify-between text-sm">
      {prev ? (
        <Link href={prev} className="px-4 py-2 rounded-xl border border-border hover:border-pitch/40 transition-colors">Föregående</Link>
      ) : (
        <span className="px-4 py-2 opacity-40 cursor-not-allowed">Föregående</span>
      )}
      <span className="text-muted-foreground">Sida {page} av {totalPages}</span>
      {next ? (
        <Link href={next} className="px-4 py-2 rounded-xl border border-border hover:border-pitch/40 transition-colors">Nästa</Link>
      ) : (
        <span className="px-4 py-2 opacity-40 cursor-not-allowed">Nästa</span>
      )}
    </div>
  );
}

function ArticleGrid({ articles }: { articles: Awaited<ReturnType<typeof getFilteredArticles>>["articles"] }) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-sm">Inga artiklar matchade filtret.</p>
        <p className="text-xs mt-1 opacity-60">Prova att ändra eller återställa filtret.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {articles.map((a, i) => <ArticleCard key={a.id} article={a} size="md" priority={i === 0} />)}
    </div>
  );
}

export default async function NyheterPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const visa = (sp.visa as "all" | "ai" | "source") ?? "all";
  const urlHasTeamFilter = Boolean(sp.lag);
  const urlHasEventFilter = Boolean(sp.event);
  const teams = sp.lag ? sp.lag.split(",").filter(Boolean) : [];
  const sources = sp.kalla ? sp.kalla.split(",").filter(Boolean) : [];
  const events = sp.event ? sp.event.split(",").filter(Boolean) : [];

  const prefs = await getUserFeedPreferences();
  const usingPersonalDefaults =
    !urlHasTeamFilter &&
    !urlHasEventFilter &&
    visa === "all" &&
    sources.length === 0 &&
    (prefs.favoriteTeamName != null || (prefs.newsTags?.length ?? 0) > 0);

  const effectiveTeams =
    teams.length > 0
      ? teams
      : usingPersonalDefaults && prefs.favoriteTeamName
        ? [prefs.favoriteTeamName]
        : [];

  const effectiveNewsTags =
    events.length > 0 ? undefined : usingPersonalDefaults ? prefs.newsTags ?? undefined : undefined;

  const noFilter =
    visa === "all" &&
    effectiveTeams.length === 0 &&
    sources.length === 0 &&
    events.length === 0 &&
    !effectiveNewsTags?.length &&
    page === 1;

  const [{ articles, total }, allSources, hot] = await Promise.all([
    getFilteredArticles({
      visa,
      teams: effectiveTeams,
      sources,
      events,
      newsTags: effectiveNewsTags,
      page,
      limit: LIMIT,
    }),
    getActiveSources(),
    noFilter ? getHotArticles(5) : Promise.resolve([]),
  ]);

  const filterParams = filterStateToParams({ visa, teams: effectiveTeams, sources, events });
  const urlBase = `/nyheter?${filterParams.toString()}`;

  return (
    <div className="w-full px-6 sm:px-8 py-10">
      <NyheterRealtimeBanner />
      <div className="mb-8">
        <h1 className="font-bold text-3xl text-foreground">Nyheter</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {total > 0 ? `${total} artiklar` : "Inga artiklar"} — filtrera per lag, källa eller eventtyp.
        </p>
        {usingPersonalDefaults && (
          <p className="mt-2 text-xs text-muted-foreground">
            Visar{" "}
            {prefs.favoriteTeamName ? (
              <>
                nyheter för <span className="font-medium text-foreground">{prefs.favoriteTeamName}</span>
              </>
            ) : (
              "ditt flöde"
            )}
            {prefs.newsTags?.length ? (
              <> · intressen: {prefs.contentTypes.join(", ")}</>
            ) : null}
            .{" "}
            <Link href="/nyheter" className="text-pitch hover:underline">
              Visa allt
            </Link>
          </p>
        )}
      </div>
      <div className="mb-4">
        <Suspense fallback={null}><TeamPushPopups /></Suspense>
      </div>
      {hot.length > 0 && (
        <section className="mb-8" aria-label="Hetast just nu">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🔥</span>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">Hetast just nu</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hot.map((a, i) => <ArticleCard key={a.id} article={a} size={i === 0 ? "lg" : "sm"} />)}
          </div>
        </section>
      )}
      <Suspense fallback={null}>
        <NewsFilterPanel
          allSources={allSources}
          initialParams={Object.fromEntries(
            Object.entries(sp).filter(([k]) => ["visa", "lag", "kalla", "event"].includes(k))
          )}
          totalCount={total}
        />
      </Suspense>
      <ArticleGrid articles={articles} />
      <Pagination page={page} total={total} urlBase={urlBase} />
    </div>
  );
}
