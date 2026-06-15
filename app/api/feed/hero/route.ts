import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import type { FeedItem } from "@/lib/types";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toItem(a: any, type: "summary" | "news"): FeedItem {
  return {
    id: `article-${a.id as string}`,
    type,
    title: a.title as string,
    subtitle: a.summary as string | undefined,
    source: a.source_name as string | undefined,
    time: a.published_at as string,
    href: `/artikel/${(a.slug as string | null) ?? (a.url_hash as string | null) ?? (a.id as string)}`,
  };
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ summary: null, topNews: [] });

  // AI-summaries är en PRO+-feature — free-användare får null
  let isPro = false;
  try {
    const user = await currentUser();
    const plan = (user?.publicMetadata?.plan as string | undefined) ?? "free";
    isPro = plan === "pro" || plan === "elite";
  } catch { /* ignorera */ }

  const { searchParams } = new URL(req.url);
  const team = searchParams.get("team");
  const db = createServiceClient();

  const BASE_SELECT = "id, title, summary, source_name, published_at, slug, url_hash";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let summaryQ: any = db
    .from("articles")
    .select(BASE_SELECT)
    .eq("status", "published")
    .eq("sport", "football")
    .eq("is_athopia_generated", true)
    .order("published_at", { ascending: false })
    .limit(1);
  if (team) summaryQ = summaryQ.contains("team_tags", [team]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let newsQ: any = db
    .from("articles")
    .select(BASE_SELECT)
    .eq("status", "published")
    .eq("sport", "football")
    .eq("is_athopia_generated", false)
    .order("published_at", { ascending: false })
    .limit(5);
  if (team) newsQ = newsQ.contains("team_tags", [team]);

  const [{ data: sumData }, { data: newsData }] = await Promise.all([
    isPro ? summaryQ : Promise.resolve({ data: [] }),
    newsQ,
  ]);

  return NextResponse.json({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    summary: isPro && (sumData as any[])?.[0] ? toItem((sumData as any[])[0], "summary") : null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    topNews: ((newsData as any[]) ?? []).map((a) => toItem(a, "news")),
  });
}
