import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { FeedItem } from "@/lib/types";

const FREE_DAILY_LIMIT = 20;
const PAGE_SIZE = 20;

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/** Returnerar hur många items denna free-användare sett idag (läser user_feed_usage). */
async function getItemsSeenToday(db: ReturnType<typeof getDb>, userId: string): Promise<number> {
  if (!db) return 0;
  const today = new Date().toISOString().split("T")[0];
  const { data } = await db
    .from("user_feed_usage")
    .select("items_seen")
    .eq("clerk_user_id", userId)
    .eq("date", today)
    .maybeSingle();
  return (data?.items_seen as number | null) ?? 0;
}

/** Ökar items_seen för free-användaren med det antal items som skickas. */
async function incrementItemsSeen(
  db: ReturnType<typeof getDb>,
  userId: string,
  count: number
): Promise<void> {
  if (!db || count === 0) return;
  const today = new Date().toISOString().split("T")[0];
  const { error: rpcErr } = await db.rpc("increment_feed_usage", {
    p_clerk_user_id: userId,
    p_date: today,
    p_delta: count,
  });
  if (rpcErr) {
    // Fallback: upsert manuellt om RPC saknas ännu
    await db!
      .from("user_feed_usage")
      .upsert(
        { clerk_user_id: userId, date: today, items_seen: count },
        { onConflict: "clerk_user_id,date" }
      );
  }
}

export async function GET(req: Request) {
  const { userId } = await auth();
  const { searchParams } = new URL(req.url);
  const teamSlug = searchParams.get("team");
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));

  const db = getDb();
  if (!db) {
    return NextResponse.json({ items: [], hasMore: false, gated: false });
  }

  // Plan-check via Clerk publicMetadata (sätts av Stripe-webhook)
  let isPro = false;
  if (userId) {
    try {
      const user = await currentUser();
      const plan = (user?.publicMetadata?.plan as string | undefined) ?? "free";
      isPro = plan === "pro" || plan === "elite";
    } catch (err) {
      console.warn("[feed] Kunde inte hämta plan från Clerk:", err);
    }
  }

  // Free-dagsgräns: läs faktiskt antal sett artiklar idag från DB
  let itemsSeenToday = 0;
  if (!isPro && userId) {
    itemsSeenToday = await getItemsSeenToday(db, userId);
  }

  const remaining = isPro ? PAGE_SIZE : Math.max(0, FREE_DAILY_LIMIT - itemsSeenToday);
  if (remaining === 0) {
    return NextResponse.json({ items: [], hasMore: false, gated: true });
  }
  const effectiveLimit = Math.min(PAGE_SIZE, remaining);

  // PRO: hämta followed_team_ids från user_feed_config
  let followedTeamNames: string[] = [];
  if (isPro && userId && !teamSlug) {
    const { data: feedConfig } = await db
      .from("user_feed_config")
      .select("followed_team_ids")
      .eq("clerk_user_id", userId)
      .maybeSingle();
    const teamIds: string[] = feedConfig?.followed_team_ids ?? [];
    if (teamIds.length > 0) {
      const { data: entities } = await db
        .from("entities")
        .select("name")
        .in("id", teamIds)
        .eq("type", "team");
      followedTeamNames = (entities ?? []).map((e: { name: string }) => e.name);
    }
  }

  let items: FeedItem[] = [];

  try {
    let aq = db
      .from("news_feed")
      .select("id, title, source_name, url, published_at, summary, importance_score, feed_score")
      .eq("sport", "football")
      .order(isPro ? "feed_score" : "published_at", { ascending: false, nullsFirst: false })
      .range(offset, offset + effectiveLimit - 1);

    if (teamSlug) {
      aq = aq.ilike("title", `%${teamSlug.replace(/-/g, " ")}%`);
    } else if (followedTeamNames.length > 0) {
      // PRO med följda lag: filtrera på lagnamn i titeln (OR-logik via Supabase or())
      const orFilter = followedTeamNames
        .map((name) => `title.ilike.%${name}%`)
        .join(",");
      aq = aq.or(orFilter);
    }

    const { data: articleData } = await aq;
    items = (articleData ?? []).map((a) => ({
      id: a.id,
      type: "news" as const,
      title: a.title,
      source: a.source_name ?? null,
      time: a.published_at,
      href: a.url ?? "#",
      subtitle: a.summary ?? null,
    }));
  } catch (err) {
    console.error("[feed] DB-fel:", err);
  }

  // Öka daglig räknare för free-användare
  if (!isPro && userId && items.length > 0) {
    void incrementItemsSeen(db, userId, items.length);
  }

  const totalSeenAfter = itemsSeenToday + items.length;
  const gated = !isPro && totalSeenAfter >= FREE_DAILY_LIMIT;
  const hasMore = items.length === effectiveLimit && !gated;

  return NextResponse.json({ items, hasMore, gated });
}
