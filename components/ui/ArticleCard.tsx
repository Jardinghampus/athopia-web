/**
 * ArticleCard
 * Server Component.
 * Visar: bild (valfritt), rubrik, summary, entity chips, datum (relativ), källa, lästid.
 */

import Image from "next/image";
import Link from "next/link";
import { EntityChip } from "./EntityChip";
import type { Article } from "@/lib/types";
import { calculateReadTime, cn, formatDateRelative, truncate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ArticleCardProps {
  article: Article;
  size?: "sm" | "md" | "lg" | "featured";
  priority?: boolean;
}

function SourceBadge({ sourceName }: { sourceName: string }) {
  return (
    <Badge variant="secondary" className="text-[11px] px-2 py-0.5 bg-white/5 text-foreground/80 border border-white/10">
      {sourceName}
    </Badge>
  );
}

export function ArticleCard({ article, size = "md", priority = false }: ArticleCardProps) {
  const href = `/artikel/${article.slug}`;
  const hasImage = !!article.imageUrl;
  const relativeDate = formatDateRelative(article.publishedAt);
  const readTime = calculateReadTime(article.content ?? article.summary);

  const base =
    "group rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200 " +
    "hover:scale-[1.01] hover:border-pitch/40 hover:shadow-[0_0_24px_rgba(29,158,117,0.12)]";

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

  const summaryLines = size === "lg" ? "line-clamp-2" : size === "md" ? "line-clamp-1" : "hidden";

  if (size === "sm") {
    return (
      <Link href={href} className={cn(base, "p-4")}>
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
      </Link>
    );
  }

  return (
    <Link href={href} className={cn(base, "flex flex-col")}>
      {/* Bild */}
      {hasImage ? (
        <div className={cn("relative w-full overflow-hidden bg-muted", imageAspect)}>
          <Image
            src={article.imageUrl!}
            alt={article.title}
            fill
            priority={priority}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
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
        </div>

        {/* Entiteter */}
        {article.entities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.entities.slice(0, 4).map((entity) => (
              <EntityChip key={entity.id} entity={entity} size="sm" linked={false} />
            ))}
          </div>
        )}

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
    </Link>
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
