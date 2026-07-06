import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ teams: [] });
  try {
    const db = createServerClient();
    const { data } = await db.from("entities").select("id,name,slug,metadata").eq("type", "team").order("name");
    const teams = (data ?? [])
      .filter((t) => t.slug)
      .map((t) => {
        const meta = (t.metadata ?? {}) as Record<string, unknown>;
        return {
          id: String(t.id),
          name: String(t.name),
          slug: String(t.slug),
          logo_url: (meta.logo_url as string | null) ?? null,
        };
      });
    return NextResponse.json({ teams }, { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=1200" } });
  } catch (e) {
    Sentry.captureException(e);
    return NextResponse.json({ teams: [] }, { status: 500 });
  }
}
