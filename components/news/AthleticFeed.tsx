/**
 * Athletic-style feed primitives — hero + divider list rows (no card grid).
 * MASTER-REBUILD Fas B.
 */

import Image from "next/image";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import type { Article } from "@/lib/types";
import { formatDateRelative, truncate } from "@/lib/utils";
import { OutboundLink } from "@/components/news/OutboundLink";
import { articlePublicPath, canPublishBody, resolveRightsStatus } from "@/lib/provenance";

function articleHref(article: Article): { href: string; external: boolean } {
  const path = articlePublicPath(article);
  if (path.startsWith("/")) return { href: path, external: false };
  const externalUrl = article.sourceUrl ?? article.url;
  if (externalUrl) return { href: externalUrl, external: true };
  return { href: "#", external: false };
}

export function AthleticFeedHero({
  article,
  commentCount,
}: {
  article: Article;
  commentCount?: number;
}) {
  const { href, external } = articleHref(article);
  const meta = (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="font-medium text-foreground/80">{article.sourceName}</span>
      <span>{formatDateRelative(article.publishedAt)}</span>
      {typeof commentCount === "number" && commentCount > 0 && (
        <span className="inline-flex items-center gap-1 tabular-nums">
          <MessageSquare className="h-3.5 w-3.5" aria-hidden />
          {commentCount}
        </span>
      )}
    </div>
  );

  const body = (
    <>
      {article.imageUrl ? (
        <div className="relative mb-4 aspect-[16/9] w-full overflow-hidden bg-muted">
          <Image
            src={article.imageUrl}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 720px"
          />
        </div>
      ) : null}
      <p className="text-[11px] font-semibold uppercase tracking-wide text-pitch">
        Högst signal
      </p>
      <h2 className="mt-1 font-heading text-2xl sm:text-3xl leading-tight text-foreground group-hover:text-pitch transition-colors">
        {article.title}
      </h2>
      {article.summary && canPublishBody(resolveRightsStatus(article)) ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {truncate(article.summary, 220)}
        </p>
      ) : null}
      {meta}
    </>
  );

  const className = "group block pb-6 border-b border-border/60";

  if (external) {
    return (
      <OutboundLink href={href} source={article.sourceName} className={className}>
        {body}
      </OutboundLink>
    );
  }
  return (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}

export function AthleticFeedRow({
  article,
  commentCount,
}: {
  article: Article;
  commentCount?: number;
}) {
  const { href, external } = articleHref(article);
  const thumb = article.imageUrl;

  const body = (
    <div className="flex items-start gap-3 py-4">
      <div className="min-w-0 flex-1">
        <h3 className="font-heading text-[17px] leading-snug text-foreground group-hover:text-pitch transition-colors line-clamp-3">
          {article.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">{article.sourceName}</span>
          <span aria-hidden>·</span>
          <span>{formatDateRelative(article.publishedAt)}</span>
          {typeof commentCount === "number" && commentCount > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                {commentCount}
              </span>
            </>
          )}
        </div>
      </div>
      {thumb ? (
        <div className="relative h-[68px] w-[92px] shrink-0 overflow-hidden rounded-md bg-muted">
          <Image
            src={thumb}
            alt=""
            fill
            className="object-cover"
            sizes="92px"
          />
        </div>
      ) : null}
    </div>
  );

  const className =
    "group block border-b border-border/50 last:border-0 active:bg-muted/40 touch-manipulation";

  if (external) {
    return (
      <OutboundLink href={href} source={article.sourceName} className={className}>
        {body}
      </OutboundLink>
    );
  }
  return (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}
