/**
 * app/artikel/[slug]/page.tsx — Artikeldetaljsida (owned/licensed only)
 * Link-only redirects to /nyhet/[slug] (LAUNCH-01 provenance).
 */

import type { Metadata } from "next";
import { ShareButton } from "@/components/ui/ShareButton";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink, MessageSquare, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { EntityChip } from "@/components/ui/EntityChip";
import { createServerClient } from "@/lib/supabase";
import type { Article } from "@/lib/types";
import { ArticleScrollTracker } from "@/components/gamification/ArticleScrollTracker";
import { getUserPlan } from "@/lib/user-plan";
import { canAccess } from "@/lib/access-rules";
import { BlurPaywall } from "@/components/BlurPaywall";
import {
  canPublishBody,
  resolveRightsStatus,
  sanitizeArticleForPublic,
} from "@/lib/provenance";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .single();
    if (!data) return null;
    const row = data as Record<string, unknown>;
    const mapped: Article = {
      id: String(row.id),
      slug: String(row.slug ?? ""),
      title: String(row.title ?? ""),
      summary: String(row.summary ?? ""),
      content: (row.content as string | null) ?? null,
      sourceUrl: (row.url as string | null) ?? null,
      url: (row.url as string | null) ?? null,
      sourceName: String(row.source_name ?? "Okänd källa"),
      imageUrl: null,
      publishedAt: String(row.published_at ?? new Date().toISOString()),
      updatedAt: (row.updated_at as string | null) ?? null,
      entities: [],
      contentOrigin: (row.content_origin as Article["contentOrigin"]) ?? null,
      rightsStatus: resolveRightsStatus(row as Parameters<typeof resolveRightsStatus>[0]),
      isAthopiaGenerated: (row.is_athopia_generated as boolean | null) ?? null,
    };
    return sanitizeArticleForPublic(mapped);
  } catch {
    return null;
  }
}

async function getDiscussionCount(articleId: string): Promise<number> {
  try {
    const supabase = createServerClient();
    const { count, error } = await supabase
      .from("forum_posts")
      .select("id", { count: "exact", head: true })
      .eq("article_id", articleId)
      .eq("status", "published");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function getRelatedArticles(articleId: string): Promise<Article[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? getSiteUrl()}/api/related?id=${articleId}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as Article[];
    return rows.map((a) => sanitizeArticleForPublic(a));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) return { title: "Artikel hittades inte" };

  const rights = article.rightsStatus ?? resolveRightsStatus(article);
  if (!canPublishBody(rights)) {
    return {
      title: article.title,
      robots: { index: false, follow: true },
      alternates: { canonical: `${getSiteUrl()}/nyhet/${slug}` },
    };
  }

  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: `${getSiteUrl()}/artikel/${slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      url: `${getSiteUrl()}/artikel/${slug}`,
      publishedTime: article.publishedAt,
      images: article.imageUrl
        ? [{ url: article.imageUrl, width: 1200, height: 630 }]
        : [],
    },
    twitter: { card: "summary_large_image", title: article.title },
  };
}

function ArticleJsonLd({ article }: { article: Article }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    datePublished: article.publishedAt,
    ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
    author: {
      "@type": "Organization",
      name: "Athopia",
    },
    publisher: {
      "@type": "Organization",
      name: "Athopia",
      url: getSiteUrl(),
    },
    image: article.imageUrl ?? undefined,
    url: `${getSiteUrl()}/artikel/${article.slug}`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function ArtikelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const rights = article.rightsStatus ?? resolveRightsStatus(article);
  if (!canPublishBody(rights)) {
    redirect(`/nyhet/${slug}`);
  }

  const [relatedArticles, discussionCount, plan] = await Promise.all([
    getRelatedArticles(article.id),
    getDiscussionCount(article.id),
    getUserPlan(),
  ]);

  const teamEntity = article.entities?.find((e) => e.type === "team" && e.slug);
  const forumHref = teamEntity
    ? `/forum/${teamEntity.slug}?artikel=${article.id}`
    : "/forum";
  const unlockedAi = canAccess("aiSummaries", plan);
  const teamName = teamEntity?.name;

  return (
    <>
      <ArticleJsonLd article={article} />
      <ArticleScrollTracker articleType="match_report" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
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

        {article.entities?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {article.entities.map((e) => (
              <EntityChip key={e.id} entity={e} />
            ))}
          </div>
        )}

        <h1 className="font-bold text-4xl sm:text-5xl text-foreground mb-3 leading-tight">
          {article.title}
        </h1>

        <div className="flex items-center justify-between gap-3 mb-8">
          <p className="text-sm text-muted-foreground">
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
          <ShareButton
            title={article.title}
            url={`${getSiteUrl()}/artikel/${article.slug}`}
          />
        </div>

        {article.summary && (
          <BlurPaywall
            feature="aiSummaries"
            plan={plan}
            teamName={teamName}
            className="mb-8"
            maxHeight="5.5rem"
            tease="AI-sammanfattning — så du slipper läsa hela källan."
            preview={
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-pitch" />
                  <span className="text-sm font-medium uppercase tracking-wider text-pitch">
                    AI-sammanfattning
                  </span>
                </div>
                <p className="leading-relaxed text-foreground/90 line-clamp-3">
                  {article.summary.slice(0, 160)}
                  {article.summary.length > 160 ? "…" : ""}
                </p>
              </div>
            }
          >
            <div
              className="rounded-xl border border-pitch/30 p-5"
              style={{ backgroundColor: "rgba(45, 83, 73, 0.10)" }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-pitch" />
                <span className="text-sm font-medium uppercase tracking-wider text-pitch">
                  AI-sammanfattning
                </span>
              </div>
              <p className="leading-relaxed text-foreground/90">{article.summary}</p>
            </div>
          </BlurPaywall>
        )}

        <Separator className="mb-8" />

        {article.content && unlockedAi ? (
          <div
            className="prose-athopia max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        ) : article.content && !unlockedAi ? (
          <BlurPaywall
            feature="aiSummaries"
            plan={plan}
            teamName={teamName}
            className="mb-8"
            maxHeight="6rem"
            tease="Full Athopia-analys bakom PRO."
            preview={
              <p className="text-sm leading-relaxed text-foreground/80">
                {(article.summary ?? article.title).slice(0, 140)}…
              </p>
            }
          >
            {null}
          </BlurPaywall>
        ) : (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-muted-foreground">
              Läs hela artikeln på källsidan.
            </p>
            <a
              href={article.sourceUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full pitch-gradient px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
            >
              Läs på {article.sourceName}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}

        {article.content && !unlockedAi && article.sourceUrl && (
          <p className="mb-8 text-center text-xs text-muted-foreground">
            Eller läs originalet på{" "}
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pitch hover:underline"
            >
              {article.sourceName}
            </a>
          </p>
        )}

        <section className="mt-12">
          <Separator className="mb-8" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-pitch" />
              <h2 className="font-bold text-xl text-foreground">
                Diskussion
                {discussionCount > 0 && (
                  <span className="ml-2 text-muted-foreground font-normal tabular-nums">
                    {discussionCount} inlägg
                  </span>
                )}
              </h2>
            </div>
            <Link
              href={forumHref}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full pitch-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
            >
              {discussionCount > 0 ? "Gå med i diskussionen" : "Starta diskussionen"}
            </Link>
          </div>
          {discussionCount === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Vad tycker du{teamEntity ? ` — diskutera med andra ${teamEntity.name}-supportrar` : ""}?
            </p>
          )}
        </section>

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

        <div className="mt-12">
          <Link
            href="/nyheter"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Tillbaka till nyheterna
          </Link>
        </div>
      </div>
    </>
  );
}
