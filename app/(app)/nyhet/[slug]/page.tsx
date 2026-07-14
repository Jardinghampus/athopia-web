/**
 * /nyhet/[slug] — source-first sida för link_only (LAUNCH-01).
 * Titel + källa + domän + primär CTA till original. Ingen tredjepartsbody.
 * robots: noindex, follow.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { createServerClient } from "@/lib/supabase";
import {
  canPublishBody,
  resolveRightsStatus,
  sourceDomain,
} from "@/lib/provenance";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 60;

type NyhetRow = {
  id: string;
  slug: string | null;
  title: string;
  url: string;
  source_name: string | null;
  published_at: string | null;
  rights_status: string | null;
  content_origin: string | null;
  is_athopia_generated: boolean | null;
  status: string;
};

async function getNyhet(slug: string): Promise<NyhetRow | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("articles")
      .select(
        "id, slug, title, url, source_name, published_at, rights_status, content_origin, is_athopia_generated, status",
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return null;
    return data as NyhetRow;
  } catch {
    return null;
  }
}

async function getPrimarySource(articleId: string): Promise<{
  source_name: string;
  original_url: string;
  domain: string | null;
} | null> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("article_sources")
      .select("source_name, original_url, domain, is_primary")
      .eq("article_id", articleId)
      .order("is_primary", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    return {
      source_name: String(data.source_name),
      original_url: String(data.original_url),
      domain: data.domain ? String(data.domain) : sourceDomain(String(data.original_url)),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNyhet(slug);
  if (!article) return { title: "Nyhet hittades inte", robots: { index: false, follow: true } };

  const rights = resolveRightsStatus(article);
  if (canPublishBody(rights)) {
    return { title: article.title, alternates: { canonical: `${getSiteUrl()}/artikel/${slug}` } };
  }

  const sourceName = article.source_name ?? "källan";
  return {
    title: article.title,
    description: `Signal från ${sourceName}. Läs originalet hos källan.`,
    robots: { index: false, follow: true },
    alternates: { canonical: `${getSiteUrl()}/nyhet/${slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: `Signal från ${sourceName}. Läs originalet hos källan.`,
      url: `${getSiteUrl()}/nyhet/${slug}`,
    },
  };
}

export default async function NyhetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getNyhet(slug);
  if (!article) notFound();

  const rights = resolveRightsStatus(article);
  if (canPublishBody(rights)) {
    redirect(`/artikel/${slug}`);
  }

  const primary = await getPrimarySource(article.id);
  const sourceUrl = primary?.original_url ?? article.url;
  const sourceName = primary?.source_name ?? article.source_name ?? "Okänd källa";
  const domain = primary?.domain ?? sourceDomain(sourceUrl) ?? sourceName;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-pitch">
        Extern källa
      </p>
      <h1 className="mt-2 font-heading text-3xl sm:text-4xl leading-tight text-foreground">
        {article.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{sourceName}</span>
        {domain ? <span className="tabular-nums">{domain}</span> : null}
        {article.published_at ? (
          <time dateTime={article.published_at}>
            {new Date(article.published_at).toLocaleDateString("sv-SE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        ) : null}
      </div>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        Athopia länkar till originalet. Vi publicerar inte tredjeparts brödtext eller
        teaser — öppna källan för hela artikeln.
      </p>

      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center gap-2 rounded-full pitch-gradient px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
      >
        Läs på {sourceName}
        <ExternalLink className="h-4 w-4" aria-hidden />
      </a>

      <div className="mt-12">
        <Link
          href="/nyheter"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Tillbaka till nyheterna
        </Link>
      </div>
    </div>
  );
}
