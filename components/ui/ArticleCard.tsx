/**
 * ArticleCard
 * Server Component – renderas statiskt med ISR.
 * Visar: bild, rubrik, summary, entity-chips, datum, källnamn.
 */

import Image from "next/image";
import Link from "next/link";
import { EntityChip } from "./EntityChip";
import type { Article } from "@/lib/supabase";

interface ArticleCardProps {
  article: Article;
  /** Om true visas en kompakt horisontell layout */
  compact?: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ArticleCard({ article, compact = false }: ArticleCardProps) {
  if (compact) {
    return (
      <Link
        href={`/artikel/${article.slug}`}
        className="group flex gap-3 p-3 rounded-xl border border-border hover:border-pitch/40 hover:bg-card transition-all duration-200"
      >
        {article.image_url && (
          <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="80px"
            />
          </div>
        )}
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-pitch-light transition-colors">
            {article.title}
          </p>
          <p className="text-xs text-muted-foreground">{article.source_name} · {formatDate(article.published_at)}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/artikel/${article.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-pitch/40 transition-all duration-200 hover:shadow-[0_0_24px_rgba(29,158,117,0.12)]"
    >
      {/* Bild */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {article.image_url ? (
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          /* Fallback-gradient med Athopia-grönt */
          <div className="absolute inset-0 pitch-gradient opacity-30" />
        )}
      </div>

      {/* Innehåll */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Entiteter */}
        {article.entities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.entities.slice(0, 3).map((entity) => (
              <EntityChip key={entity.id} entity={entity} static />
            ))}
          </div>
        )}

        {/* Rubrik */}
        <h3 className="font-heading text-xl text-foreground line-clamp-2 group-hover:text-pitch-light transition-colors leading-tight">
          {article.title}
        </h3>

        {/* Summary */}
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {article.summary}
        </p>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
          <span className="font-medium">{article.source_name}</span>
          <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
        </div>
      </div>
    </Link>
  );
}
