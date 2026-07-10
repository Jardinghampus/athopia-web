import { cn } from "@/lib/utils";

export function SentimentBar({ score }: { score: number }) {
  const s = Number.isFinite(score) ? Math.max(-1, Math.min(1, score)) : 0;
  const pct = ((s + 1) / 2) * 100;

  const label =
    s <= -0.6
      ? "Mycket negativ"
      : s <= -0.2
      ? "Negativ"
      : s < 0.2
      ? "Neutral"
      : s < 0.6
      ? "Positiv"
      : "Mycket positiv";

  return (
    <div className="space-y-2">
      <div className="h-2 rounded-full overflow-hidden bg-secondary relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-muted-foreground to-success" />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-background border border-white/15 shadow"
          style={{ left: `calc(${pct}% - 6px)` }}
          aria-hidden
        />
      </div>
      <p className={cn("text-xs text-muted-foreground", s > 0.2 ? "text-success" : s < -0.2 ? "text-red-300" : "")}>
        {label}
      </p>
    </div>
  );
}

