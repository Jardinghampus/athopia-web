import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { NewsFilterPanel } from "@/components/ui/NewsFilterPanel";
import { NyheterRealtimeBanner } from "@/components/NyheterRealtimeBanner";
import { NewsStream } from "@/components/news/NewsStream";
import { getFilteredArticles, getActiveSources } from "@/lib/supabase";
import { filterStateToParams } from "@/lib/filters";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Nyheter | Athopia",
  description: "Senaste fotbollsnyheterna — AI-kurerat för Allsvenskan på Athopia.",
};

const LIMIT = 24;

// ── Sidnumrering ──────────────────────────────────────────────────────────────
function Pagination({
  page,
  total,
  urlBase,
}: {
  page: number;
  total: number;
  urlBase: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  if (totalPages <= 1) return null;

  const prev = page > 1 ? `${urlBase}&page=${page - 1}` : null;
  const next = page < totalPages ? `${urlBase}&page=${page + 1}` : null;

  return (
    <div className="mt-10 flex items-center justify-between text-sm">
      {prev ? (
        <Link href={prev} className="px-4 py-2 rounded-xl border border-border hover:border-pitch/40 transition-colors">
          Föregående
        </Link>
      ) : (
        <span className="px-4 py-2 opacity-40 cursor-not-allowed">Föregående</span>
      )}
      <span className="text-muted-foreground">
        Sida {page} av {totalPages}
      </span>
      {next ? (
        <Link href={next} className="px-4 py-2 rounded-xl border border-border hover:border-pitch/40 transition-colors">
          Nästa
        </Link>
      ) : (
        <span className="px-4 py-2 opacity-40 cursor-not-allowed">Nästa</span>
      )}
    </div>
  );
}

// ── Artikelgrid ───────────────────────────────────────────────────────────────
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
      {articles.map((a, i) => (
        <ArticleCard key={a.id} article={a} size="md" priority={i === 0} />
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function NyheterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const visa = (sp.visa as "all" | "ai" | "source") ?? "all";
  const teams = sp.lag ? sp.lag.split(",").filter(Boolean) : [];
  const sources = sp.kalla ? sp.kalla.split(",").filter(Boolean) : [];
  const events = sp.event ? sp.event.split(",").filter(Boolean) : [];

  const [{ articles, total }, allSources] = await Promise.all([
    getFilteredArticles({ visa, teams, sources, events, page, limit: LIMIT }),
    getActiveSources(),
  ]);

  // URL base för sidnumrering (bevarar alla filter-params utom page)
  const filterParams = filterStateToParams({ visa, teams, sources, events });
  const urlBase = `/nyheter?${filterParams.toString()}`;

  return (
    <div className="w-full px-6 sm:px-8 py-10">
      <NyheterRealtimeBanner />

      <div className="mb-8">
        <h1 className="font-heading text-5xl text-foreground">NYHETER</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {total > 0 ? `${total} artiklar` : "Inga artiklar"} — filtrera per lag, källa eller eventtyp.
        </p>
      </div>

      {/* NewsStream — RSS-signaler från content_queue (revalidate 30s) */}
      <div className="mb-10">
        <h2 className="text-xs font-semibold text-muted-foreground mb-3">Senaste signaler</h2>
        <Suspense fallback={<div className="h-40 rounded-xl bg-card skeleton-wave" />}>
          <NewsStream sport="football" />
        </Suspense>
      </div>

      {/* Horisontell sticky filterbar */}
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
