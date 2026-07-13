import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NyheterRealtimeBanner } from "@/components/NyheterRealtimeBanner";
import { ProductEventTracker } from "@/components/analytics/ProductEventTracker";
import { FeedMatchHero } from "@/components/feed/FeedMatchHero";
import { FixturesTicker } from "@/components/ui/FixturesTicker";
import { TeamPushPopups } from "@/components/news/TeamPushPopups";
import { AthleticFeedHero, AthleticFeedRow } from "@/components/news/AthleticFeed";
import { FeedSortBar, type FeedSort } from "@/components/news/FeedSortBar";
import {
  getFilteredArticles,
  getDiscussionCounts,
  type ArticleSort,
} from "@/lib/supabase";
import { filterStateToParams } from "@/lib/filters";
import { getUserFeedPreferences } from "@/lib/feed/getUserFeedPreferences";
import { absoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Flöde — Allsvenskan-nyheter 2026",
  description:
    "Dagens Allsvenskan-flöde — signalscorerat, AI-kurerat och kopplat till diskussion.",
  alternates: { canonical: absoluteUrl("/nyheter") },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: absoluteUrl("/nyheter"),
    title: "Flöde — Allsvenskan-nyheter 2026",
    description:
      "Dagens Allsvenskan-flöde — signalscorerat, AI-kurerat och kopplat till diskussion.",
  },
};

const LIMIT = 24;

function parseSort(raw: string | undefined): FeedSort {
  if (raw === "latest" || raw === "important" || raw === "for-you") return raw;
  return "for-you";
}

function Pagination({ page, total, urlBase }: { page: number; total: number; urlBase: string }) {
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  if (totalPages <= 1) return null;
  const prev = page > 1 ? `${urlBase}&page=${page - 1}` : null;
  const next = page < totalPages ? `${urlBase}&page=${page + 1}` : null;
  return (
    <div className="mt-8 flex items-center justify-between text-sm">
      {prev ? (
        <Link href={prev} className="text-pitch hover:underline">
          Föregående
        </Link>
      ) : (
        <span className="opacity-40">Föregående</span>
      )}
      <span className="text-muted-foreground tabular-nums">
        {page} / {totalPages}
      </span>
      {next ? (
        <Link href={next} className="text-pitch hover:underline">
          Nästa
        </Link>
      ) : (
        <span className="opacity-40">Nästa</span>
      )}
    </div>
  );
}

export default async function NyheterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const visa = (sp.visa as "all" | "ai" | "source") ?? "all";
  const sort = parseSort(sp.sort);
  const urlHasTeamFilter = Boolean(sp.lag);
  const urlHasEventFilter = Boolean(sp.event);
  const teams = sp.lag ? sp.lag.split(",").filter(Boolean) : [];
  const sources = sp.kalla ? sp.kalla.split(",").filter(Boolean) : [];
  const events = sp.event ? sp.event.split(",").filter(Boolean) : [];

  const prefs = await getUserFeedPreferences();

  // För dig = personliga defaults. Viktigt/Senaste = hela ligan (ingen lag-forcera).
  const usingPersonalDefaults =
    sort === "for-you" &&
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
    events.length > 0
      ? undefined
      : usingPersonalDefaults
        ? prefs.newsTags ?? undefined
        : undefined;

  const { articles, total } = await getFilteredArticles({
    visa,
    teams: effectiveTeams,
    sources,
    events,
    newsTags: effectiveNewsTags,
    sort: sort as ArticleSort,
    page,
    limit: LIMIT,
  });

  const commentCounts = await getDiscussionCounts(articles.map((a) => a.id));

  const filterParams = filterStateToParams({
    visa,
    teams: effectiveTeams,
    sources,
    events,
  });
  if (sort !== "for-you") filterParams.set("sort", sort);
  const urlBase = `/nyheter?${filterParams.toString()}`;

  // Hero: första sidan — föredra bild + summary, annars första med bild, annars topprendrad
  let heroIndex = -1;
  if (page === 1 && articles.length > 0) {
    heroIndex = articles.findIndex((a) => !!a.imageUrl && !!a.summary);
    if (heroIndex < 0) heroIndex = articles.findIndex((a) => !!a.imageUrl);
    if (heroIndex < 0) heroIndex = 0;
  }
  const hero = heroIndex >= 0 ? articles[heroIndex] : null;
  const list = hero ? articles.filter((_, i) => i !== heroIndex) : articles;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-6 pb-24 md:pb-10">
      <ProductEventTracker event="nyheter_open" />
      <div className="-mx-4 sm:-mx-6 -mt-6 mb-4">
        <Suspense fallback={null}>
          <FixturesTicker />
        </Suspense>
      </div>
      <NyheterRealtimeBanner />
      <FeedMatchHero />

      <header className="mb-5">
        <h1
          className="text-3xl font-bold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          FLÖDE
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total > 0 ? `${total} signaler` : "Inga artiklar"}
          {usingPersonalDefaults && prefs.favoriteTeamName ? (
            <>
              {" "}
              · fokusat för{" "}
              <span className="font-medium text-foreground">{prefs.favoriteTeamName}</span>
            </>
          ) : null}
        </p>
      </header>

      <Suspense fallback={null}>
        <TeamPushPopups />
      </Suspense>

      <Suspense fallback={null}>
        <FeedSortBar sort={sort} visa={visa} />
      </Suspense>

      {articles.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          <p>Inga artiklar matchade filtret.</p>
          <Link href="/nyheter" className="mt-2 inline-block text-pitch hover:underline">
            Visa allt
          </Link>
        </div>
      ) : (
        <div>
          {hero ? (
            <AthleticFeedHero article={hero} commentCount={commentCounts[hero.id]} />
          ) : null}
          <div className={hero ? "mt-0" : ""}>
            {list.map((a) => (
              <AthleticFeedRow
                key={a.id}
                article={a}
                commentCount={commentCounts[a.id]}
              />
            ))}
          </div>
        </div>
      )}

      <Pagination page={page} total={total} urlBase={urlBase} />
    </div>
  );
}
