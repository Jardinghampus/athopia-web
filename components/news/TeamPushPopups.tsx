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
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.url ?? "/nyheter"}
          className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4 transition-colors hover:border-red-500/40 hover:bg-red-500/[0.09]"
        >
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-red-200/80">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <BellRing className="h-3.5 w-3.5" />
              Viktig lagnotis
            </span>
            <span>{formatScore(item.feedScore ?? item.importanceScore)}</span>
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{item.title}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
        </Link>
      ))}
    </section>
  );
}
