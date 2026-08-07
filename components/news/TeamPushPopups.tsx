import Link from "next/link";
import { BellRing } from "lucide-react";
import { getTeamPushPopups } from "@/lib/supabase";

function formatScore(score: number | null): string {
  if (score === null) return "";
  return `${Math.round(score * 100)}%`;
}

export async function TeamPushPopups() {
  const items = await getTeamPushPopups([], 4);
  if (items.length === 0) return null;

  return (
    // Temaneutrala tokens genomgående: kortet var hårdkodat mörkt (zinc-900/80)
    // men ärvde ljusa temats red-300 (#D61F1F) och gav 1.85:1.
    // auto-fit i stället för fasta kolumner: med en enda notis låg kortet kvar
    // i halva bredden med ett tomrum bredvid sig, vilket såg trasigt ut.
    <section className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.url ?? "/nyheter"}
          className="rounded-2xl border border-destructive/30 bg-card p-4 transition-colors hover:border-destructive/50 hover:bg-muted"
        >
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-destructive">
            <span className="inline-flex items-center gap-1.5 font-semibold tracking-wide uppercase">
              <BellRing className="h-3.5 w-3.5" />
              Viktig lagnotis
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">
              {formatScore(item.feedScore ?? item.importanceScore)}
            </span>
          </div>
          <h2
            className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground text-balance"
            style={{ fontFamily: "system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}
          >
            {item.title}
          </h2>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {item.body}
          </p>
        </Link>
      ))}
    </section>
  );
}
