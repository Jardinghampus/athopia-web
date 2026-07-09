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
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.url ?? "/nyheter"}
          className="rounded-2xl border border-red-400/25 bg-zinc-900/80 p-4 transition-colors hover:border-red-400/45 hover:bg-zinc-900"
        >
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-red-300">
            <span className="inline-flex items-center gap-1.5 font-semibold tracking-wide uppercase">
              <BellRing className="h-3.5 w-3.5" />
              Viktig lagnotis
            </span>
            <span className="tabular-nums text-zinc-400">
              {formatScore(item.feedScore ?? item.importanceScore)}
            </span>
          </div>
          <h3
            className="line-clamp-2 text-[15px] font-semibold leading-snug text-zinc-50"
            style={{ fontFamily: "system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}
          >
            {item.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-300">
            {item.body}
          </p>
        </Link>
      ))}
    </section>
  );
}
