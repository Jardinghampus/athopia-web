import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { jsonContract } from "@/lib/api-contract";
import { FeedResponseSchema } from "@/lib/api-schemas";
import type { FeedItem } from "@/lib/types";
import { interestsToNewsTags } from "@/lib/feed/content-preferences";
import { mapNewsFeedRow } from "@/lib/feed/map-feed-row";
import { resolveFeedUserId } from "@/lib/feed/feed-usage";

const PAGE_SIZE = 20;
function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/** Ökar items_seen för free-användaren med det antal items som skickas (analys, ej gating). */
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
  const typeFilter = searchParams.get("type"); // "transfer" | "injury" | "match" | null
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));

  const db = getDb();
  if (!db) {
    return jsonContract(FeedResponseSchema, {
      items: [],
      hasMore: false,
      gated: false,
      remainingToday: null,
    });
  }

  // Plan-check via Clerk publicMetadata (sätts av Stripe-webhook)
  let isPro = false;
  let isElite = false;
  if (userId) {
    try {
      const user = await currentUser();
      const plan = (user?.publicMetadata?.plan as string | undefined) ?? "free";
      isPro = plan === "pro" || plan === "elite";
      isElite = plan === "elite";
    } catch (err) {
      console.warn("[feed] Kunde inte hämta plan från Clerk:", err);
    }
  }

  const feedUserId = resolveFeedUserId(userId, req);

  // Dagsgränsen borttagen 2026-07-10 (Allsvenskans hemmaplan): grundfeeden är
  // gratis och obegränsad — vanan byggs gratis, paywallen ligger på det unika
  // (brief, poddintelligens, signaler). items_seen räknas kvar för analys.
  const effectiveLimit = PAGE_SIZE;

  let filterTeamIds: string[] = [];
  if (teamSlug) {
    const { data: team } = await db
      .from("entities")
      .select("id")
      .eq("type", "team")
      .eq("slug", teamSlug)
      .maybeSingle();
    if (team?.id) filterTeamIds = [String(team.id)];
  }

  // user_feed_config: lag (PRO) + intressen (alla inloggade)
  let contentTypeTags: string[] | null = null;
  if (userId) {
    const { data: feedConfig } = await db
      .from("user_feed_config")
      .select("followed_team_ids, content_types")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (isPro && !teamSlug) {
      filterTeamIds = feedConfig?.followed_team_ids ?? [];
    } else if (!teamSlug && (feedConfig?.followed_team_ids?.length ?? 0) > 0) {
      // Free: basic filter per AGENTS.md — valt lag från onboarding
      filterTeamIds = feedConfig!.followed_team_ids!;
    }

    if (!typeFilter) {
      contentTypeTags = interestsToNewsTags(feedConfig?.content_types ?? null);
    }
  }

  let items: FeedItem[] = [];

  try {
    let aq = db
      .from("news_feed_clustered")
      .select("id, title, source_name, url, published_at, summary, importance_score, feed_score, entity_ids, news_tag, source_count, story_cluster_id, push_priority")
      .eq("sport", "football")
      .order(isPro ? "feed_score" : "published_at", { ascending: false, nullsFirst: false })
      .range(offset, offset + effectiveLimit - 1);

    if (filterTeamIds.length === 1) {
      aq = aq.contains("entity_ids", [filterTeamIds[0]]);
    } else if (filterTeamIds.length > 1) {
      aq = aq.overlaps("entity_ids", filterTeamIds);
    }

    if (typeFilter) {
      aq = aq.eq("news_tag", typeFilter);
    } else if (contentTypeTags?.length) {
      aq = aq.in("news_tag", contentTypeTags);
    }

    const { data: articleData } = await aq;
    items = (articleData ?? []).map((a) => mapNewsFeedRow(a));
  } catch (err) {
    console.error("[feed] DB-fel:", err);
  }

  // Öka daglig räknare för free (inloggad + anon)
  if (!isPro && items.length > 0) {
    void incrementItemsSeen(db, feedUserId, items.length);
  }

  const hasMore = items.length === effectiveLimit;

  return jsonContract(FeedResponseSchema, {
    items,
    hasMore,
    gated: false,
    remainingToday: null,
    isPro,
    isElite,
  });
}
