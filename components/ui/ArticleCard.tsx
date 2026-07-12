/**
 * ArticleCard
 * Server Component.
 * Visar: bild (valfritt), rubrik, summary, entity chips, datum (relativ), källa, lästid.
 */

import Image from "next/image";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { EntityChip } from "./EntityChip";
import type { Article } from "@/lib/types";
import { calculateReadTime, cn, formatDateRelative, truncate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OutboundLink } from "@/components/news/OutboundLink";

interface ArticleCardProps {
  article: Article;
  size?: "sm" | "md" | "lg" | "featured";
  priority?: boolean;
  /** Antal forumsvar (Athletic-kroken) — visas i metan när > 0. */
  commentCount?: number;
}

function SourceBadge({ sourceName }: { sourceName: string }) {
  return (
    <Badge variant="secondary" className="text-[11px] px-2 py-0.5 bg-foreground/5 text-foreground/70 border border-border">
      {sourceName}
    </Badge>
  );
}

export function ArticleCard({ article, size = "md", priority = false, commentCount }: ArticleCardProps) {
  const externalUrl = article.sourceUrl ?? article.url;
  const isExternal = !article.slug && !!externalUrl;
  const href = article.slug
    ? `/artikel/${article.slug}`
    : (externalUrl ?? "#");
  const hasImage = !!article.imageUrl;
  const relativeDate = formatDateRelative(article.publishedAt);
  const readTime = calculateReadTime(article.content ?? article.summary);

  const base =
    "group rounded-2xl border border-border bg-card overflow-hidden " +
    "transition-[transform,box-shadow,border-color] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] " +
    "hover:-translate-y-0.5 hover:border-border/80 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]";

  const imageAspect =
    size === "featured" || size === "lg" ? "aspect-video" : size === "md" ? "aspect-[4/3]" : "aspect-video";

  const titleClass =
    size === "featured"
      ? "text-3xl sm:text-4xl"
      : size === "lg"
      ? "text-2xl"
      : size === "md"
      ? "text-lg"
      : "text-base";

  // md fick line-clamp-1 → taglinen var i praktiken osynlig; 2 rader ger kortet en riktig undertext
  const summaryLines = size === "lg" ? "line-clamp-2" : size === "md" ? "line-clamp-2" : "hidden";

  // Extern länk → spåra utgående klick (trafik-per-källa); intern → vanlig Link
  const CardLink = ({ className, children }: { className: string; children: React.ReactNode }) =>
    isExternal ? (
      <OutboundLink href={href} source={article.sourceName} className={className}>{children}</OutboundLink>
    ) : (
      <Link href={href} className={className}>{children}</Link>
    );

  if (size === "sm") {
    return (
      <CardLink className={cn(base, "p-4")}>
        <div className="flex items-start justify-between gap-3">
          <h3 className={cn("font-heading leading-tight text-foreground group-hover:text-pitch-light transition-colors", titleClass)}>
            {truncate(article.title, 90)}
          </h3>
          <SourceBadge sourceName={article.sourceName} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          <span>{relativeDate}</span>
          <span>{readTime}</span>
        </div>
      </CardLink>
    );
  }

  return (
    <CardLink className={cn(base, "flex flex-col")}>
      {/* Bild */}
      {hasImage ? (
        <div className={cn("relative w-full overflow-hidden bg-muted", imageAspect)}>
          <Image
            src={article.imageUrl!}
            alt={article.title}
            fill
            priority={priority}
            className="object-cover transition-transform duration-500 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      ) : size === "featured" ? (
        <div className={cn("relative w-full overflow-hidden", imageAspect)}>
          <div className="absolute inset-0 pitch-gradient opacity-25" />
        </div>
      ) : null}

      {/* Innehåll */}
      <div className={cn("flex flex-col gap-3 p-4", size === "featured" && "p-6 sm:p-8")}>
        {/* Meta row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <SourceBadge sourceName={article.sourceName} />
            <span className="text-xs text-muted-foreground">{relativeDate}</span>
            <span className="text-xs text-muted-foreground">{readTime}</span>
          </div>
          {typeof commentCount === "number" && commentCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums shrink-0">
              <MessageSquare className="w-3.5 h-3.5" />
              {commentCount}
            </span>
          )}
        </div>

        {/* Lag-chips, eller Allsvenskan som ärlig fallback */}
        <div className="flex flex-wrap gap-1.5">
          {article.entities?.length > 0 ? (
            article.entities.slice(0, 3).map((entity) => (
              <EntityChip key={entity.id} entity={entity} size="sm" linked={false} />
            ))
          ) : (
            <span className="inline-flex items-center rounded-full border border-pitch/30 bg-pitch/10 px-2 py-0.5 text-xs font-medium text-pitch">
              Allsvenskan
            </span>
          )}
        </div>

        {/* Rubrik */}
        <h3 className={cn("font-heading leading-tight text-foreground group-hover:text-pitch-light transition-colors", titleClass)}>
          {article.title}
        </h3>

        {/* Summary */}
        {size !== "featured" && (
          <p className={cn("text-sm text-muted-foreground leading-relaxed", summaryLines)}>
            {article.summary}
          </p>
        )}
        {size === "featured" && article.summary && (
          <p className="text-base text-muted-foreground leading-relaxed line-clamp-3">{article.summary}</p>
        )}
      </div>
    </CardLink>
  );
}

export function ArticleCardSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" | "featured" }) {
  if (size === "sm") return <Skeleton className="h-24 rounded-2xl" />;
  const aspect = size === "md" ? "aspect-[4/3]" : "aspect-video";
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <Skeleton className={cn("w-full", aspect)} />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
