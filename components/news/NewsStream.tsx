import { getUserPlan } from "@/lib/access";
import { getNewsStream } from "@/lib/supabase";
import { NewsItem } from "./NewsItem";

export const revalidate = 30;

export async function NewsStream({
  sport = "football",
}: {
  sport?: string;
}) {
  const plan = await getUserPlan();
  const isPro = plan !== "free";

  const items = await getNewsStream({
    sport,
    limit: isPro ? 100 : 20,
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
          Gratis: 20 nyheter/dag ·{" "}
          <a href="/priser" className="text-blue-500 hover:text-blue-400">
            Uppgradera för obegränsat flöde
          </a>
        </div>
      )}
    </div>
  );
}
