import { getUserPlan } from "@/lib/user-plan";
import { getNewsStream } from "@/lib/supabase";
import { NewsItem } from "./NewsItem";

// OBS: revalidate-export har ingen effekt i en komponentfil — caching styrs av
// unstable_cache() i lib/supabase.ts → getNewsStream (tag: "news", 60s).

export async function NewsStream({
  sport = "football",
}: {
  sport?: string;
}) {
  const plan = await getUserPlan();
  const isPro = plan !== "free";

  const items = await getNewsStream({
    sport,
    limit: 100,
    orderBy: isPro ? "signal_score" : "published_at",
  });

  if (items.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-zinc-500">
        Inga nyheter just nu — RSS-pipeline fyller på inom kort.
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800 rounded-xl bg-zinc-900 px-4">
      {items.map((item) => (
        <NewsItem key={item.id} item={item} />
      ))}
      {!isPro && (
        <div className="py-3 text-center text-xs text-zinc-600">
          Flödet är gratis ·{" "}
          <a href="/prenumerera" className="text-pitch hover:opacity-80">
            PRO ger dig brief, podd &amp; transfer-signaler
          </a>
        </div>
      )}
    </div>
  );
}
