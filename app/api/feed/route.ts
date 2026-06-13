import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { FeedItem } from "@/lib/types";

const FREE_DAILY_LIMIT = 20;
const PAGE_SIZE = 20;

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
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

  // Plan-check (gratis = 20 items/dag)
  let isPro = false;
  if (userId) {
    try {
      const { data: config } = await db
        .from("user_feed_config")
        .select("clerk_user_id")
        .eq("clerk_user_id", userId)
        .single();
      // Plan hanteras via Clerk metadata — här kollar vi bara om config finns
      // TODO: getUserPlan() när Stripe-integration är klar
      isPro = !!config;
    } catch { /* ignorera */ }
  }

  const effectiveLimit = isPro ? PAGE_SIZE : Math.max(0, FREE_DAILY_LIMIT - offset);
  if (effectiveLimit === 0) {
    return NextResponse.json({ items: [], hasMore: false, gated: true });
  }

  // Hämta artiklar från content_queue (rss_signal + classified) ELLER articles
  // Prioritet: content_queue med signal_score, fallback till articles
  let items: FeedItem[] = [];

  try {
    // Försök content_queue först (om migration 17 är körd)
    let q = db
      .from("content_queue")
      .select("id, content, created_at, source_name, source_url, signal_score")
      .eq("sport", "football")
      .in("status", ["classified", "pending_classification", "approved"])
      .order("signal_score", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + effectiveLimit - 1);

    if (teamSlug) {
      // Filtrera på team-slug via entity_ids (enkel text-search på content jsonb)
      // Begränsning: kräver att content innehåller laget — förbättras med entity_ids
      q = q.ilike("content->>title", `%${teamSlug.replace(/-/g, " ")}%`);
    }

    const { data: queueData } = await q;

    if (queueData && queueData.length > 0) {
      items = queueData.map((row) => {
        const content = (row.content as Record<string, unknown>) ?? {};
        return {
          id: row.id,
          type: "news" as const,
          title: (content["title"] as string | undefined) ?? "Nyhet",
          source: row.source_name ?? (content["source_name"] as string | undefined) ?? null,
          time: row.created_at as string,
          href: (content["source_url"] as string | undefined) ?? row.source_url ?? "#",
        };
      });
    } else {
      // Fallback till articles-tabellen
      let aq = db
        .from("articles")
        .select("id, title, source_name, source_url, published_at, summary")
        .eq("sport", "football")
        .order("published_at", { ascending: false })
        .range(offset, offset + effectiveLimit - 1);

      if (teamSlug) {
        aq = aq.ilike("title", `%${teamSlug.replace(/-/g, " ")}%`);
      }

      const { data: articleData } = await aq;
      items = (articleData ?? []).map((a) => ({
        id: a.id,
        type: "news" as const,
        title: a.title,
        source: a.source_name ?? null,
        time: a.published_at,
        href: a.source_url ?? "#",
        subtitle: a.summary ?? null,
      }));
    }
  } catch {
    // DB-fel — returnera tomt
  }

  const gated = !isPro && offset + items.length >= FREE_DAILY_LIMIT;
  const hasMore = items.length === effectiveLimit && !gated;

  return NextResponse.json({ items, hasMore, gated });
}
