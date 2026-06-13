import { NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

// Ersätter Supabase Realtime: klienter pollar denna istället för att hålla
// en WebSocket öppen + tvinga WAL-decode. Svaret cachas 60s (CDN + ISR), så
// oavsett antal besökare blir det max ~1 Supabase-query per minut.
export const revalidate = 60;

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ latest: null, count: 0 });
  }
  try {
    const db = createServerClient();
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data, count } = await db
      .from("articles")
      .select("published_at", { count: "exact" })
      .eq("status", "published")
      .gte("published_at", since)
      .order("published_at", { ascending: false })
      .limit(1);

    const latest = (data?.[0]?.published_at as string | undefined) ?? null;
    return NextResponse.json(
      { latest, count: count ?? 0 },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch {
    return NextResponse.json({ latest: null, count: 0 });
  }
}
