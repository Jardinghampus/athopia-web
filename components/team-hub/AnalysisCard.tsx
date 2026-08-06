import Link from "next/link";
import { Clock, Layers } from "lucide-react";
import type { EntityInsight } from "@/lib/types";

/**
 * Ett analyskort. Rubriken är insiktens EGEN rubrik — aldrig "AI-analys".
 * Generiska rubriker gör att varje kort ser likadant ut och analysen läses som
 * metadata i stället för innehåll (produktbrief, problem 4).
 */

export interface ArticleRef {
  id: string;
  title: string;
  slug: string | null;
  sourceName: string | null;
}

const SEVERITY: Record<EntityInsight["severity"], { label: string; cls: string }> = {
  strong: { label: "Stark signal", cls: "bg-pitch/12 text-pitch-ink border-pitch/30" },
  watch: { label: "Bevaka", cls: "bg-muted text-muted-foreground border-border" },
  info: { label: "Notering", cls: "bg-muted text-muted-foreground border-border" },
};

const TYPE_LABEL: Record<EntityInsight["insightType"], string> = {
  stat_news_fusion: "Statistik + nyhetsläge",
  form_context: "Formkontext",
  news_pressure: "Nyhetstryck",
  pre_match: "Inför match",
};

export function relativeTime(iso: string): string {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(diffMin)) return "";
  if (diffMin < 1) return "nyss";
  if (diffMin < 60) return `för ${diffMin} min sedan`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `för ${h} tim sedan`;
  const d = Math.round(h / 24);
  return d === 1 ? "igår" : `för ${d} dagar sedan`;
}

export function AnalysisCard({
  insight,
  sources = [],
  lead = false,
}: {
  insight: EntityInsight;
  sources?: ArticleRef[];
  lead?: boolean;
}) {
  const sev = SEVERITY[insight.severity] ?? SEVERITY.info;

  return (
    <article
      className={`rounded-2xl border border-border bg-card ${lead ? "p-6" : "p-5"}`}
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${sev.cls}`}
        >
          {sev.label}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {TYPE_LABEL[insight.insightType] ?? "Analys"}
        </span>
        <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden />
          <time dateTime={insight.generatedAt}>{relativeTime(insight.generatedAt)}</time>
        </span>
      </div>

      <h3
        className={`font-semibold text-foreground tracking-tight ${lead ? "text-2xl" : "text-lg"}`}
        style={{ textWrap: "balance" }}
      >
        {insight.title}
      </h3>

      <p className={`text-muted-foreground mt-2 ${lead ? "text-base" : "text-sm"}`}>
        {insight.summary}
      </p>

      {lead && insight.body && (
        <p className="text-sm text-foreground/90 mt-3 whitespace-pre-line">{insight.body}</p>
      )}

      {sources.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 inline-flex items-center gap-1.5">
            <Layers className="h-3 w-3" aria-hidden />
            Underlag · {sources.length} {sources.length === 1 ? "källa" : "källor"}
          </p>
          <ul className="flex flex-col gap-1 list-none m-0 p-0">
            {sources.slice(0, 4).map((s) => (
              <li key={s.id}>
                {s.slug ? (
                  <Link
                    href={`/artikel/${s.slug}`}
                    className="text-xs text-muted-foreground hover:text-pitch-ink transition-colors"
                  >
                    {s.title}
                    {s.sourceName ? ` · ${s.sourceName}` : ""}
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground">{s.title}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
