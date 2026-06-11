/**
 * app/api/feed/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-enforced feed. Plan + dagskvot valideras HÄR (aldrig client-side).
 *
 * - free:        max 20 items/dag (FREE_DAILY_LIMIT). Därefter gated=true.
 * - pro/elite:   obegränsat (unlimitedFeed).
 *
 * Klienten (FeedClient) hämtar enbart via denna route — den frågar inte längre
 * Supabase direkt med anon-nyckeln, så kvoten går inte att kringgå via UI:t.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { getUserPlan } from "@/lib/access";
import type { FeedItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const FREE_DAILY_LIMIT = 20;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchFeedPage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  teamSlug: string | null,
  offset: number,
  limit: number
): Promise<FeedItem[]> {
  const items: FeedItem[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let articlesQ: any = db
    .from("articles")
    .select("id, title, summary, source_name, published_at, slug, url_hash, is_athopia_generated")
    .eq("status", "published")
    .eq("sport", "football")
    .order("published_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (teamSlug) {
    articlesQ = articlesQ.contains("team_tags", [teamSlug]);
  }

  const threadsQ = db
    .from("forum_threads")
    .select("id, title, content, author_name, created_at, team_id")
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const podcastsQ = db
    .from("podcasts")
    .select("id, title, show_name, published_at")
    .order("published_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const [artRes, thrRes, podRes] = await Promise.all([articlesQ, threadsQ, podcastsQ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const a of (artRes.data ?? []) as any[]) {
    const articleSlug = (a.slug as string | null) ?? (a.url_hash as string | null) ?? (a.id as string);
    items.push({
      id: `article-${a.id as string}`,
      type: (a.is_athopia_generated as boolean) ? "summary" : "news",
      title: a.title as string,
      subtitle: a.summary as string | undefined,
      source: a.source_name as string | undefined,
      time: a.published_at as string,
      href: `/artikel/${articleSlug}`,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const t of (thrRes.data ?? []) as any[]) {
    items.push({
      id: `thread-${t.id}`,
      type: "forum",
      title: t.title,
      subtitle: t.content?.slice(0, 80),
      source: t.author_name,
      time: t.created_at,
      href: `/forum/${t.team_id ?? ""}`,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of (podRes.data ?? []) as any[]) {
    items.push({
      id: `podcast-${p.id}`,
      type: "podcast",
      title: p.title,
      source: p.show_name,
      time: p.published_at,
      href: `/podcast/${p.id}`,
    });
  }

  items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  return items.slice(0, limit);
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ items: [], hasMore: false, gated: false });
  }

  const { searchParams } = new URL(req.url);
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10) || 0);
  const team = searchParams.get("team");

  const plan = await getUserPlan();
  const isFree = plan === "free";
  const supabase = createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  // ─── Free: kontrollera dagskvot innan vi serverar något ───
  let seen = 0;
  if (isFree) {
    const { data } = await supabase
      .from("user_feed_usage")
      .select("items_seen")
      .eq("clerk_user_id", userId)
      .eq("date", today)
      .maybeSingle();
    seen = data?.items_seen ?? 0;

    if (seen >= FREE_DAILY_LIMIT) {
      return NextResponse.json({
        items: [],
        hasMore: false,
        gated: true,
        plan,
        seen,
        limit: FREE_DAILY_LIMIT,
      });
    }
  }

  const allowance = isFree ? Math.min(PAGE_SIZE, FREE_DAILY_LIMIT - seen) : PAGE_SIZE;
  const items = await fetchFeedPage(supabase, team, offset, allowance);

  // ─── Free: räkna upp kvoten med antalet serverade items ───
  let reachedLimit = false;
  if (isFree && items.length > 0) {
    const { data: newCount } = await supabase.rpc("increment_feed_usage", {
      p_clerk_user_id: userId,
      p_date: today,
      p_delta: items.length,
    });
    if (typeof newCount === "number" && newCount >= FREE_DAILY_LIMIT) reachedLimit = true;
  }

  const hasMore = isFree
    ? !reachedLimit && items.length === allowance
    : items.length === PAGE_SIZE;

  return NextResponse.json({
    items,
    hasMore,
    gated: false,
    plan,
    seen: isFree ? seen + items.length : null,
    limit: isFree ? FREE_DAILY_LIMIT : null,
  });
}
