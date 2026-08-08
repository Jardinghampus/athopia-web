import Link from "next/link";
import { Brain, Newspaper, ShieldCheck, TrendingUp } from "lucide-react";
import type { EntityInsight } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formLetter } from "@/lib/form-letter";

function formatMetric(value: unknown, suffix = "") {
  if (typeof value === "number") return `${value > 0 && suffix === "p" ? "+" : ""}${value}${suffix}`;
  if (typeof value === "string" && value.trim()) return value;
  return "n/a";
}

/** Formsträngen kommer engelsk från datalagret ("LWWDW"). Produkten är svensk. */
function formatForm(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "n/a";
  return value
    .trim()
    .split("")
    .map((c) => formLetter(c.toUpperCase()))
    .join("");
}

function confidenceLabel(value: number) {
  if (value >= 0.78) return "Stark";
  if (value >= 0.66) return "Bevaka";
  return "Indikation";
}

function severityClass(severity: EntityInsight["severity"]) {
  if (severity === "strong") return "text-pitch-ink border-pitch/30 bg-pitch/10";
  if (severity === "watch") return "text-amber-500 border-amber-500/30 bg-amber-500/10";
  return "text-muted-foreground border-border bg-muted/30";
}

export function EntityInsightsPanel({
  insights,
  teamSlug,
}: {
  insights: EntityInsight[];
  /** Sätts på laghubben → panelen blir en ingång till hela analysytan. */
  teamSlug?: string;
}) {
  if (insights.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-3">
        <Brain className="h-4 w-4 text-pitch-ink" />
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base">Athopia Brain</CardTitle>
          <p className="text-xs text-muted-foreground">Precomputad fusion av statistik och nyhetsläge</p>
        </div>
        {teamSlug && (
          <Link
            href={`/lag/${teamSlug}/analys`}
            className="shrink-0 text-xs font-medium text-pitch-ink hover:underline whitespace-nowrap"
          >
            All analys →
          </Link>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => {
          const metrics = insight.metricSnapshot;
          const evidence = insight.evidence;
          const articleCount = typeof evidence.article_count === "number" ? evidence.article_count : insight.sourceArticleIds.length;
          return (
            <div key={insight.id} className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground text-balance">{insight.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{insight.summary}</p>
                </div>
                <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${severityClass(insight.severity)}`}>
                  {confidenceLabel(insight.confidence)} {Math.round(insight.confidence * 100)}%
                </span>
              </div>

              {insight.body && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{insight.body}</p>}

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-md border border-border/60 bg-background/50 p-2">
                  <div className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                    <TrendingUp className="h-3 w-3" /> Poäng
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">{formatMetric(metrics.points)}</p>
                </div>
                <div className="rounded-md border border-border/60 bg-background/50 p-2">
                  <div className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                    <ShieldCheck className="h-3 w-3" /> Målskillnad
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">{formatMetric(metrics.goal_diff, "p")}</p>
                </div>
                <div className="rounded-md border border-border/60 bg-background/50 p-2">
                  <div className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                    <TrendingUp className="h-3 w-3" /> Form
                  </div>
                  <p className="mt-1 font-mono text-sm font-semibold tracking-wider text-foreground">{formatForm(metrics.form)}</p>
                </div>
                <div className="rounded-md border border-border/60 bg-background/50 p-2">
                  <div className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
                    <Newspaper className="h-3 w-3" /> Nyheter
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">{articleCount}</p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
