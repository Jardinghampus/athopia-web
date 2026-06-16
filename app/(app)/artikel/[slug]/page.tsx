/**
 * app/artikel/[slug]/page.tsx — Artikeldetaljsida
 * ─────────────────────────────────────────────────────────────────────────────
 * - AI-summary box med #1D9E75 bakgrund
 * - Fulltext eller källlänk
 * - EntityChip-array
 * - Relaterade artiklar via /api/related (pgvector)
 * - generateMetadata() med OG-tags + JSON-LD NewsArticle
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { EntityChip } from "@/components/ui/EntityChip";
import { createServerClient } from "@/lib/supabase";
import type { Article } from "@/lib/types";
import { ArticleScrollTracker } from "@/components/gamification/ArticleScrollTracker";

export const revalidate = 3600;

// ─── Hjälpfunktioner ───────────────────────────────────────────────────────────
async function getArticle(slug: string): Promise<Article | null> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .single();
    return (data as Article) ?? null;
  } catch {
    return null;
  }
}

async function getRelatedArticles(articleId: string): Promise<Article[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://athopia.se"}/api/related?id=${articleId}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ─── Metadata + OG ────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) return { title: "Artikel hittades inte" };

  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      url: `https://athopia.se/artikel/${slug}`,
      publishedTime: article.publishedAt,
      images: article.imageUrl
        ? [{ url: article.imageUrl, width: 1200, height: 630 }]
        : [],
    },
    twitter: { card: "summary_large_image", title: article.title },
  };
}

// ─── JSON-LD: NewsArticle ──────────────────────────────────────────────────────
function ArticleJsonLd({ article }: { article: Article }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    datePublished: article.publishedAt,
    publisher: {
      "@type": "Organization",
      name: article.sourceName,
      url: article.sourceUrl,
    },
    image: article.imageUrl ?? undefined,
    url: `https://athopia.se/artikel/${article.slug}`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ArtikelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const relatedArticles = await getRelatedArticles(article.id);

  return (
    <>
      <ArticleJsonLd article={article} />
      <ArticleScrollTracker articleType="match_report" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero-bild */}
        {article.imageUrl && (
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden mb-8">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
            />
          </div>
        )}

        {/* Entiteter */}
        {article.entities?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {article.entities.map((e: any) => (
              <EntityChip key={e.id} entity={e} />
            ))}
          </div>
        )}

        {/* Rubrik */}
        <h1 className="font-bold text-4xl sm:text-5xl text-foreground mb-3 leading-tight">
          {article.title}
        </h1>

        {/* Meta */}
        <p className="text-sm text-muted-foreground mb-8">
          <span className="font-medium text-foreground">{article.sourceName}</span>
          {" · "}
          <time dateTime={article.publishedAt}>
            {new Date(article.publishedAt).toLocaleDateString("sv-SE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        </p>

        {/* AI-Summary box */}
        <div
          className="rounded-xl p-5 mb-8 border border-pitch/30"
          style={{ backgroundColor: "rgba(29, 158, 117, 0.12)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-pitch" />
            <span className="text-sm font-medium text-pitch uppercase tracking-wider">
              AI-sammanfattning
            </span>
          </div>
          <p className="text-foreground/90 leading-relaxed">{article.summary}</p>
        </div>

        <Separator className="mb-8" />

        {/* Fulltext eller källlänk */}
        {article.content ? (
          <div
            className="prose-athopia max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-muted-foreground">
              Läs hela artikeln på källsidan.
            </p>
            <a
              href={article.sourceUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full pitch-gradient text-white font-medium hover:opacity-90 transition-opacity"
            >
              Läs på {article.sourceName}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Relaterade artiklar */}
        {relatedArticles.length > 0 && (
          <section className="mt-16">
            <Separator className="mb-8" />
            <h2 className="font-bold text-3xl text-foreground mb-6">
              RELATERADE ARTIKLAR
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedArticles.slice(0, 3).map((ra) => (
                <ArticleCard key={ra.id} article={ra} />
              ))}
            </div>
          </section>
        )}

        {/* Breadcrumb bakåt */}
        <div className="mt-12">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Tillbaka till startsidan
          </Link>
        </div>
      </div>
    </>
  );
}
