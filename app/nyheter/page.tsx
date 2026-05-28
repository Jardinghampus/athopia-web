import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { getArticles } from "@/lib/supabase";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Nyheter",
  description: "Senaste fotbollsnyheterna — AI-kurerat för Allsvenskan på Athopia.",
};

type SearchParams = {
  page?: string;
  team?: string;
  sort?: "latest" | "important";
};

export default async function NyheterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { page, team, sort } = await searchParams;
  const currentPage = Math.max(1, Number(page ?? 1) || 1);
  const limit = 12;
  const offset = (currentPage - 1) * limit;

  const articles = await getArticles(limit, offset, team);
  const nextHref = `/nyheter?page=${currentPage + 1}${team ? `&team=${encodeURIComponent(team)}` : ""}${
    sort ? `&sort=${sort}` : ""
  }`;
  const prevHref = `/nyheter?page=${Math.max(1, currentPage - 1)}${team ? `&team=${encodeURIComponent(team)}` : ""}${
    sort ? `&sort=${sort}` : ""
  }`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="font-heading text-5xl text-foreground">NYHETER</h1>
          <p className="text-muted-foreground mt-2">
            Senaste artiklarna — filtrera per lag eller sortera efter viktigast.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((a, i) => (
          <ArticleCard key={a.id} article={a} size="md" priority={i === 0} />
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between text-sm">
        <Link
          href={prevHref}
          aria-disabled={currentPage === 1}
          className={`px-4 py-2 rounded-xl border border-border ${
            currentPage === 1 ? "opacity-40 pointer-events-none" : "hover:border-pitch/40"
          }`}
        >
          Föregående
        </Link>
        <span className="text-muted-foreground">Sida {currentPage}</span>
        <Link href={nextHref} className="px-4 py-2 rounded-xl border border-border hover:border-pitch/40">
          Nästa
        </Link>
      </div>
    </div>
  );
}

